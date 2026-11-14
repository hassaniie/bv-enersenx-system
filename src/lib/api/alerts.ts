// Alerts (flow F4): bill anomalies, budget overruns and missing bills, derived
// from the bills on record so they always agree with them. Only what people do
// with an alert (acknowledge, cause, resolve, turn into an action) is stored.

import { completeMonth, daysBeforeToday, formatDayMonth, TODAY } from "@/lib/app-date"
import { formatBillMonthLong } from "@/lib/format"

import { actionTitles } from "./actions"
import { getMe } from "./auth"
import { listBillsNow } from "./bills"
import { ApiError, latency } from "./client"
import { newId, read, write } from "./store"
import { recalculate } from "./tariff"
import type { Alert, AlertState, Bill, SavingsAction } from "./types"

const round = Math.round
const fmt = (n: number) => n.toLocaleString("en-US")
const units = (b: Bill) => b.peakKwh + b.offPeakKwh
/** Recent bills that raise alerts; older ones are history. */
const ALERT_WINDOW = 3

export const ESCALATE_AFTER_HOURS = 48

/** A critical alert nobody acknowledged within the window has gone to the owner. */
export const isEscalated = (a: Alert) => a.status === "open" && a.severity === "critical" && daysBeforeToday(a.raisedAt) * 24 >= ESCALATE_AFTER_HOURS

function recipients() {
  const me = getMe()
  return `Email and WhatsApp to ${me?.user.name ?? "the site owner"}`
}

function derive(siteId: string): Alert[] {
  const db = read()
  const site = db.sites.find((s) => s.id === siteId)
  if (!site) return []
  const bills = listBillsNow(siteId) // newest first
  const budget = db.budgets.find((b) => b.siteId === siteId)?.monthlyPkr
  const sentTo = recipients()
  const alerts: Omit<Alert, "status">[] = []

  bills.slice(0, ALERT_WINDOW).forEach((b, i) => {
    const raisedAt = b.uploadedAt
    const errors = recalculate(b).findings.filter((f) => f.kind === "billing_error")
    if (errors.length) {
      const total = errors.reduce((s, f) => s + f.impactPkr, 0)
      alerts.push({
        id: `al-${b.id}-errors`,
        siteId,
        kind: "bill_anomaly",
        severity: "critical",
        title: `${formatBillMonthLong(b.month)} bill overcharged by PKR ${fmt(total)}`,
        detail: errors.map((f) => f.title).join("; "),
        impactPkr: total,
        month: b.month,
        raisedAt,
        nextStep: `File a billing complaint with ${b.disco} before the due date.`,
        sentTo,
        actionKind: errors.some((f) => f.id.endsWith("-fixed")) ? "fixed" : "further",
      })
    }
    const prior = bills.slice(i + 1, i + 4)
    if (prior.length === 3) {
      const avg = prior.reduce((s, x) => s + units(x), 0) / 3
      const change = (units(b) - avg) / avg
      if (Math.abs(change) > 0.15) {
        alerts.push({
          id: `al-${b.id}-units`,
          siteId,
          kind: "bill_anomaly",
          severity: "warning",
          title: `Units ${change > 0 ? "up" : "down"} ${Math.abs(round(change * 100))}% in ${formatBillMonthLong(b.month)}`,
          detail: `${fmt(units(b))} kWh against an average of ${fmt(round(avg))} kWh over the 3 bills before.`,
          impactPkr: change > 0 ? round((units(b) - avg) * (b.amountPayable / units(b))) : 0,
          month: b.month,
          raisedAt,
          nextStep: change > 0 ? "Check for longer shifts, new machines or equipment left running." : "Check the meter reading; a large drop can be an estimated bill.",
          sentTo,
          actionKind: change > 0 ? "peak" : undefined,
        })
      }
    }
    if (budget && b.amountPayable > budget) {
      const over = b.amountPayable - budget
      alerts.push({
        id: `al-${b.id}-budget`,
        siteId,
        kind: "budget_overrun",
        severity: over / budget > 0.1 ? "critical" : "warning",
        title: `${formatBillMonthLong(b.month)} bill PKR ${fmt(over)} over budget`,
        detail: `Billed PKR ${fmt(b.amountPayable)} against a budget of PKR ${fmt(budget)} (${round((over / budget) * 100)}% over).`,
        impactPkr: over,
        month: b.month,
        raisedAt,
        nextStep: "Review the bill’s findings and the peak-hour share for what to cut.",
        sentTo,
        actionKind: "peak",
      })
    }
  })

  // The latest complete month's bill is issued around the 19th; expect it by the 25th.
  const expected = completeMonth(0)
  const expectedMonth = expected.start.slice(0, 7)
  const dueBy = `${expectedMonth}-25`
  if (bills.length && !bills.some((b) => b.month === expectedMonth) && TODAY > dueBy) {
    alerts.push({
      id: `al-${siteId}-${expectedMonth}-missing`,
      siteId,
      kind: "missing_bill",
      severity: "warning",
      title: `${formatBillMonthLong(expected.start)} bill not uploaded`,
      detail: `${site.disco} issued this month’s bills around ${formatDayMonth(`${expectedMonth}-19`)}. Without it, budget and savings tracking stop.`,
      impactPkr: 0,
      month: expectedMonth,
      raisedAt: dueBy,
      nextStep: `Download it from the ${site.disco} website or photograph the paper bill.`,
      sentTo,
    })
  }
  return alerts.map((a) => ({ ...a, status: "open" as const }))
}

function merged(siteId: string): Alert[] {
  const states = new Map((read().alertStates ?? []).map((s) => [s.id, s]))
  return derive(siteId)
    .map((a) => ({ ...a, ...states.get(a.id) }))
    .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt) || (a.severity === "critical" ? -1 : 1))
}

export async function listAlerts(siteId: string): Promise<Alert[]> {
  await latency(350)
  return merged(siteId)
}

/** Open alerts of the current site, for the top bar's bell. */
export function openAlertCountNow(siteId: string | undefined) {
  return siteId ? merged(siteId).filter((a) => a.status === "open").length : 0
}

function saveState(state: AlertState) {
  write((d) => ({ ...d, alertStates: [...(d.alertStates ?? []).filter((s) => s.id !== state.id), state] }))
}

const stateOf = (a: Alert): AlertState => ({
  id: a.id,
  status: a.status,
  cause: a.cause,
  acknowledgedAt: a.acknowledgedAt,
  acknowledgedBy: a.acknowledgedBy,
  resolvedAt: a.resolvedAt,
  resolution: a.resolution,
  actionId: a.actionId,
})

export async function acknowledgeAlert(alert: Alert, cause: string) {
  await latency(350)
  if (!cause.trim()) throw new ApiError("Add a cause, even a short one.")
  saveState({ ...stateOf(alert), status: "acknowledged", cause: cause.trim(), acknowledgedAt: TODAY, acknowledgedBy: getMe()?.user.name })
}

export async function resolveAlert(alert: Alert, resolution: string) {
  await latency(350)
  saveState({
    ...stateOf(alert),
    status: "resolved",
    acknowledgedAt: alert.acknowledgedAt ?? TODAY,
    acknowledgedBy: alert.acknowledgedBy ?? getMe()?.user.name,
    resolvedAt: TODAY,
    resolution: resolution.trim() || "Resolved",
  })
}

/** Turns an alert into an accepted savings action owned by the current user, and resolves the alert. */
export async function alertToAction(alert: Alert): Promise<SavingsAction> {
  await latency(400)
  const me = getMe()
  const kind = alert.actionKind
  if (!kind) throw new ApiError("This alert has no matching savings action.")
  const existing = (read().actions ?? []).find((a) => a.siteId === alert.siteId && a.kind === kind && a.status !== "dismissed")
  const action: SavingsAction = existing ?? {
    id: newId("act"),
    orgId: read().session?.orgId ?? "",
    siteId: alert.siteId,
    kind,
    title: actionTitles[kind],
    detail: alert.nextStep,
    estMonthlyPkr: alert.impactPkr,
    status: "accepted",
    owner: me ? { name: me.user.name, initials: me.user.initials } : undefined,
    dueDate: TODAY,
    suggestedAt: alert.raisedAt,
    acceptedAt: TODAY,
    note: `From alert: ${alert.title}`,
  }
  write((d) => ({
    ...d,
    actions: existing ? d.actions : [...(d.actions ?? []), action],
    alertStates: [
      ...(d.alertStates ?? []).filter((s) => s.id !== alert.id),
      { ...stateOf(alert), status: "resolved", resolvedAt: TODAY, resolution: `Became the action “${action.title}”`, actionId: action.id, acknowledgedAt: alert.acknowledgedAt ?? TODAY, acknowledgedBy: alert.acknowledgedBy ?? me?.user.name },
    ],
  }))
  return action
}
