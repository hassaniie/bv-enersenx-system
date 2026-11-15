// Savings actions (flow F3): suggested from bill findings, accepted with an
// owner and due date, marked done, then verified or not against later bills.
// Suggestions and verification results are derived on read, so they always
// agree with the bills on record; only people's decisions are stored.

import { TODAY } from "@/lib/app-date"

import { listBillsNow } from "./bills"
import { ownSite } from "./sites"
import { ApiError, latency } from "./client"
import { newId, read, write } from "./store"
import { GST, recalculate, tariffs } from "./tariff"
import type { ActionKind, Bill, Person, SavingsAction, Verification } from "./types"
import { assertCan } from "./settings"

const round = Math.round
const line = (b: Bill, k: string) => b.lines.find((l) => l.key === k)?.amount ?? 0
const units = (b: Bill) => b.peakKwh + b.offPeakKwh
const fmt = (n: number) => n.toLocaleString("en-US")

import { actionTitles } from "./action-titles"

export { actionTitles }

const kindOf = (findingId: string) => findingId.split("-").pop() as ActionKind

/** Per-bill value each kind of action changes, in PKR with tax. */
function monthlyCost(kind: ActionKind, b: Bill) {
  if (kind === "pf") return round(line(b, "pfPenalty") * (1 + GST))
  if (kind === "further") return line(b, "furtherTax")
  if (kind === "fixed") {
    const expected = recalculate(b).expected.find((l) => l.key === "fixed")?.amount ?? 0
    return round(Math.max(0, line(b, "fixed") - expected) * (1 + GST))
  }
  return 0
}

const peakShare = (b: Bill) => (b.peakKwh / units(b)) * 100

/** Compares bills before and after the month an action was done. */
export function verify(action: SavingsAction, bills: Bill[]): Verification | undefined {
  if (!action.doneAt) return undefined
  const doneMonth = action.doneAt.slice(0, 7)
  const chrono = [...bills].sort((a, b) => a.month.localeCompare(b.month))
  const before = chrono.filter((b) => b.month <= doneMonth).slice(-3)
  const after = chrono.filter((b) => b.month > doneMonth).slice(0, 3)
  if (!after.length || !before.length) return undefined
  const months = (list: Bill[]) => list.map((b) => b.month)

  if (action.kind === "peak") {
    const avg = (list: Bill[]) => list.reduce((s, b) => s + peakShare(b), 0) / list.length
    const b = avg(before)
    const a = avg(after)
    const drop = b - a
    const rates = tariffs[after[0].tariff]
    const saved = drop >= 3 ? round((drop / 100) * (after.reduce((s, x) => s + units(x), 0) / after.length) * (rates.peak - rates.offPeak) * (1 + GST)) : 0
    return {
      before: months(before),
      after: months(after),
      measure: "Share of units in peak hours",
      beforeValue: `${b.toFixed(1)}%`,
      afterValue: `${a.toFixed(1)}%`,
      savedMonthlyPkr: saved,
      reason: saved ? `Peak share fell ${drop.toFixed(1)} points.` : `Peak share moved ${drop >= 0 ? "down" : "up"} only ${Math.abs(drop).toFixed(1)} points; 3 are needed to count.`,
    }
  }

  const avg = (list: Bill[]) => round(list.reduce((s, x) => s + monthlyCost(action.kind, x), 0) / list.length)
  const b = avg(before)
  const a = avg(after)
  const measure = { pf: "Power factor penalty per bill", further: "Further tax per bill", fixed: "Fixed-charge overbilling per bill" }[action.kind]
  return {
    before: months(before),
    after: months(after),
    measure,
    beforeValue: `PKR ${fmt(b)}`,
    afterValue: `PKR ${fmt(a)}`,
    savedMonthlyPkr: b - a > 0 && a <= b * 0.2 ? b - a : 0,
    reason: a <= b * 0.2 ? "The charge is gone from the later bills." : "The charge is still on the later bills.",
  }
}

/** Suggestions from the latest bill plus every stored action, with derived results. */
export async function listActions(siteId: string): Promise<SavingsAction[]> {
  await latency(350)
  return actionsNow(siteId)
}

/** Synchronous version for other data-layer modules (money.ts). */
export function actionsNow(siteId: string): SavingsAction[] {
  const db = read()
  const bills = listBillsNow(siteId)
  if (!ownSite(siteId)) return []
  const stored = (db.actions ?? []).filter((a) => a.siteId === siteId && a.orgId === db.session?.orgId)
  const taken = new Set(stored.map((a) => a.kind))
  const latest = bills[0]
  const suggestions: SavingsAction[] = latest
    ? recalculate(latest)
        .findings.filter((f) => !taken.has(kindOf(f.id)))
        .map((f) => ({
          id: `sug-${siteId}-${kindOf(f.id)}`,
          orgId: latest.orgId,
          siteId,
          kind: kindOf(f.id),
          title: actionTitles[kindOf(f.id)],
          detail: f.nextStep,
          estMonthlyPkr: f.impactPkr,
          status: "suggested",
          suggestedAt: latest.uploadedAt,
        }))
    : []
  const resolved = stored.map((a) => {
    if (a.status !== "done") return a
    const v = verify(a, bills)
    return v ? { ...a, verification: v, status: v.savedMonthlyPkr > 0 ? ("verified" as const) : ("not_achieved" as const) } : a
  })
  return [...suggestions, ...resolved]
}

/** People an action can be assigned to: members and invitees of the organisation. */
export async function listAssignees(): Promise<Person[]> {
  await latency(150)
  const db = read()
  const orgId = db.session?.orgId
  const members = db.memberships
    .filter((m) => m.orgId === orgId)
    .map((m) => db.users.find((u) => u.id === m.userId))
    .filter(Boolean)
    .map((u) => ({ name: u!.name, initials: u!.initials }))
  const invited = db.invites
    .filter((i) => i.orgId === orgId)
    .map((i) => {
      const name = i.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      return { name: `${name} (invited)`, initials: name.slice(0, 2).toUpperCase() }
    })
  return [...members, ...invited]
}

function save(action: SavingsAction) {
  write((d) => ({ ...d, actions: [...(d.actions ?? []).filter((a) => a.id !== action.id), action] }))
}

export async function acceptAction(suggestion: SavingsAction, input: { owner: Person; dueDate: string; note?: string }) {
  await latency(400)
  assertCan("edit")
  if (!input.dueDate) throw new ApiError("Choose a due date.")
  const action: SavingsAction = { ...suggestion, id: newId("act"), status: "accepted", owner: input.owner, dueDate: input.dueDate, note: input.note, acceptedAt: TODAY }
  save(action)
  return action
}

export async function dismissAction(suggestion: SavingsAction) {
  await latency(250)
  assertCan("edit")
  save({ ...suggestion, id: newId("act"), status: "dismissed" })
}

export async function markActionDone(action: SavingsAction, input: { doneAt: string; note?: string }) {
  await latency(400)
  assertCan("edit")
  if (input.doneAt > TODAY) throw new ApiError("The date can’t be in the future.")
  save({ ...action, status: "done", doneAt: input.doneAt, note: input.note || action.note })
}

/** Back to suggestions (undo a dismissal). */
export async function restoreAction(action: SavingsAction) {
  await latency(250)
  assertCan("edit")
  write((d) => ({ ...d, actions: (d.actions ?? []).filter((a) => a.id !== action.id) }))
}

/** Kinds whose saving later bills have verified: they no longer count as money being lost. */
export function verifiedKinds(siteId: string): Set<ActionKind> {
  return new Set(actionsNow(siteId).filter((a) => a.status === "verified").map((a) => a.kind))
}

/** Kinds whose charge a resolved action removes from future bills (used when new bills are read). */
export function resolvedKinds(siteId: string): Set<ActionKind> {
  return new Set((read().actions ?? []).filter((a) => a.siteId === siteId && a.doneAt).map((a) => a.kind))
}
