import { ApiError, latency } from "./client"
import { newId, read, write } from "./store"
import { assertCan, assertCanInvite } from "./settings"
import type { ChecklistItem, Role } from "./types"

export const BILLS_FOR_A_YEAR = 12

/** The site dashboard's getting-started checklist. */
export async function getChecklist(siteId: string): Promise<ChecklistItem[]> {
  await latency(250)
  const db = read()
  const orgId = db.session?.orgId
  const bills = db.bills.filter((b) => b.siteId === siteId && b.status === "confirmed").length
  const members = db.memberships.filter((m) => m.orgId === orgId).length + db.invites.filter((i) => i.orgId === orgId).length
  const budget = db.budgets.some((b) => b.siteId === siteId)
  return [
    {
      id: "bills",
      title: "Upload 12 months of bills",
      detail: "A full year shows seasonal patterns and every recurring overcharge.",
      done: bills >= BILLS_FOR_A_YEAR,
      progress: { value: Math.min(bills, BILLS_FOR_A_YEAR), max: BILLS_FOR_A_YEAR },
    },
    { id: "invite", title: "Invite a colleague", detail: "Add your facility manager or finance lead.", done: members > 1 },
    { id: "budget", title: "Set a monthly budget", detail: "We’ll alert you when a bill goes over it.", done: budget },
  ]
}

export async function inviteMember(input: { email: string; role: Role }) {
  await latency(500)
  assertCanInvite()
  const db = read()
  const orgId = db.session?.orgId
  if (!orgId) throw new ApiError("You are signed out.")
  const email = input.email.trim().toLowerCase()
  const taken =
    db.invites.some((i) => i.orgId === orgId && i.email === email) ||
    db.memberships.some((m) => m.orgId === orgId && db.users.find((u) => u.id === m.userId)?.email === email)
  if (taken) throw new ApiError(`${email} is already in this organisation or invited.`)
  write((d) => ({ ...d, invites: [...d.invites, { id: newId("inv"), orgId, email, role: input.role, invitedAt: new Date().toISOString().slice(0, 10) }] }))
}

export async function setBudget(siteId: string, monthlyPkr: number) {
  await latency(400)
  assertCan("edit")
  if (!read().sites.some((s) => s.id === siteId && s.orgId === read().session?.orgId)) throw new ApiError("That site doesn’t exist in this organisation.")
  write((d) => ({ ...d, budgets: [...d.budgets.filter((b) => b.siteId !== siteId), { siteId, monthlyPkr }] }))
}

export function getBudgetNow(siteId: string) {
  return read().budgets.find((b) => b.siteId === siteId)?.monthlyPkr
}
