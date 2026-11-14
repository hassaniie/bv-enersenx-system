// Settings: organisation details, sites, members and roles, budgets,
// notifications and the plan. Every write checks the caller's role here, so
// the API refuses what the UI hides (Viewer: read only; Manager: no users or billing).

import { daysFromToday, TODAY } from "@/lib/app-date"

import { getMe } from "./auth"
import { ApiError, latency } from "./client"
import { tariffFor, type NewSite } from "./sites"
import { newId, read, write } from "./store"
import type { BillingCycle, Membership, NotificationChannel, NotificationTopic, OrgSettings, Organisation, PlanId, Role, Site } from "./types"

/* --------------------------------- Roles --------------------------------- */

export type Permission = "edit" | "manage_users" | "manage_billing"

const allowed: Record<Role, Permission[]> = {
  owner: ["edit", "manage_users", "manage_billing"],
  manager: ["edit"],
  viewer: [],
}

export const can = (role: Role | undefined, p: Permission) => !!role && allowed[role].includes(p)

/** Refuses the call unless the signed-in user's role allows it. */
function require(p: Permission) {
  const me = getMe()
  if (!me) throw new ApiError("You are signed out. Log in again.")
  if (!can(me.role, p)) {
    const need = p === "edit" ? "a Manager or Owner" : "an Owner"
    throw new ApiError(`Only ${need} can do this. You are a ${me.role[0].toUpperCase()}${me.role.slice(1)}.`)
  }
  return me
}

export const rolePermissions: { label: string; owner: boolean; manager: boolean; viewer: boolean }[] = [
  { label: "See dashboards, bills, actions and alerts", owner: true, manager: true, viewer: true },
  { label: "Upload bills, manage actions and alerts", owner: true, manager: true, viewer: false },
  { label: "Add, edit and archive sites; set budgets", owner: true, manager: true, viewer: false },
  { label: "Invite people and change roles", owner: true, manager: false, viewer: false },
  { label: "Choose a plan and see invoices", owner: true, manager: false, viewer: false },
]

/* ------------------------------ Organisation ------------------------------ */

const defaults = (orgId: string, createdAt: string): OrgSettings => {
  const on = { email: true, whatsapp: true }
  return {
    orgId,
    plan: { id: "trial", cycle: "monthly", trialEnds: addDays(createdAt, 14) },
    notifications: {
      bill_anomaly: on,
      budget_overrun: on,
      missing_bill: { email: true, whatsapp: false },
      bill_reminder: { email: true, whatsapp: true },
      monthly_report: { email: true, whatsapp: false },
    },
  }
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function settingsNow(): OrgSettings {
  const db = read()
  const org = db.orgs.find((o) => o.id === db.session?.orgId)
  if (!org) throw new ApiError("No organisation selected.")
  return db.orgSettings?.find((s) => s.orgId === org.id) ?? defaults(org.id, org.createdAt > TODAY ? TODAY : org.createdAt)
}

function saveSettings(next: OrgSettings) {
  write((d) => ({ ...d, orgSettings: [...(d.orgSettings ?? []).filter((s) => s.orgId !== next.orgId), next] }))
}

export async function getOrganisationSettings(): Promise<{ org: Organisation; settings: OrgSettings; orgs: (Organisation & { role: Role })[] }> {
  await latency(300)
  const db = read()
  const me = getMe()
  if (!me) throw new ApiError("You are signed out.")
  const orgs = db.memberships
    .filter((m) => m.userId === me.user.id)
    .map((m) => ({ ...db.orgs.find((o) => o.id === m.orgId)!, role: m.role }))
    .filter((o) => o.id)
  return { org: me.org, settings: settingsNow(), orgs }
}

export async function updateOrganisation(input: { name: string; businessType: Organisation["businessType"]; ntn?: string; strn?: string }) {
  await latency(400)
  const me = require("edit")
  if (!input.name.trim()) throw new ApiError("Enter the organisation’s name.")
  if (input.strn && !/^\d{2}-?\d{2}-?\d{4}-?\d{3}-?\d{2}$|^\d{13}$/.test(input.strn.replace(/\s/g, ""))) {
    throw new ApiError("An STRN has 13 digits, e.g. 32-77-8761-234-56.")
  }
  write((d) => ({ ...d, orgs: d.orgs.map((o) => (o.id === me.org.id ? { ...o, name: input.name.trim(), businessType: input.businessType } : o)) }))
  saveSettings({ ...settingsNow(), ntn: input.ntn?.trim() || undefined, strn: input.strn?.trim() || undefined })
}

export async function switchOrganisation(orgId: string) {
  await latency(300)
  const db = read()
  const me = getMe()
  if (!me || !db.memberships.some((m) => m.userId === me.user.id && m.orgId === orgId)) throw new ApiError("You aren’t a member of that organisation.")
  const siteId = db.sites.find((s) => s.orgId === orgId && !s.archived)?.id ?? null
  write((d) => ({ ...d, session: { userId: me.user.id, orgId, siteId } }))
}

/* ---------------------------------- Sites --------------------------------- */

export async function updateSite(siteId: string, input: NewSite) {
  await latency(400)
  const me = require("edit")
  const site = read().sites.find((s) => s.id === siteId && s.orgId === me.org.id)
  if (!site) throw new ApiError("That site doesn’t exist in this organisation.")
  write((d) => ({
    ...d,
    sites: d.sites.map((s) =>
      s.id === siteId
        ? { ...s, ...input, name: input.name.trim(), tariff: tariffFor(input.connectionType, input.sanctionedKw) }
        : s
    ),
  }))
}

export async function setSiteArchived(siteId: string, archived: boolean) {
  await latency(400)
  const me = require("edit")
  const db = read()
  if (!db.sites.some((s) => s.id === siteId && s.orgId === me.org.id)) throw new ApiError("That site doesn’t exist in this organisation.")
  const active = db.sites.filter((s) => s.orgId === me.org.id && !s.archived)
  if (archived && active.length === 1 && active[0].id === siteId) throw new ApiError("This is your only active site. Add another before archiving it.")
  write((d) => {
    const sites = d.sites.map((s) => (s.id === siteId && s.orgId === me.org.id ? { ...s, archived } : s))
    const current = d.session?.siteId === siteId && archived ? sites.find((s) => s.orgId === me.org.id && !s.archived)?.id ?? null : d.session?.siteId ?? null
    return { ...d, sites, session: d.session && { ...d.session, siteId: current } }
  })
}

/* ---------------------------------- People -------------------------------- */

export type MemberRow = { id: string; name: string; email: string; role: Role; status: "active" | "invited"; since: string; isYou: boolean }

export async function listMembers(): Promise<MemberRow[]> {
  await latency(300)
  const db = read()
  const me = getMe()
  if (!me) throw new ApiError("You are signed out.")
  const members: MemberRow[] = db.memberships
    .filter((m) => m.orgId === me.org.id)
    .map((m) => {
      const u = db.users.find((x) => x.id === m.userId)!
      return { id: `m:${u.id}`, name: u.name, email: u.email, role: m.role, status: "active", since: me.org.createdAt, isYou: u.id === me.user.id }
    })
  const invites: MemberRow[] = db.invites
    .filter((i) => i.orgId === me.org.id)
    .map((i) => ({ id: `i:${i.id}`, name: i.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), email: i.email, role: i.role, status: "invited", since: i.invitedAt, isYou: false }))
  return [...members, ...invites]
}

const owners = (orgId: string) => read().memberships.filter((m) => m.orgId === orgId && m.role === "owner")

export async function changeRole(rowId: string, role: Role) {
  await latency(350)
  const me = require("manage_users")
  const [kind, id] = rowId.split(":")
  if (kind === "i") {
    write((d) => ({ ...d, invites: d.invites.map((i) => (i.id === id ? { ...i, role } : i)) }))
    return
  }
  const own = owners(me.org.id)
  if (role !== "owner" && own.length === 1 && own[0].userId === id) throw new ApiError("Every organisation needs an Owner. Make someone else Owner first.")
  write((d) => ({ ...d, memberships: d.memberships.map((m: Membership) => (m.orgId === me.org.id && m.userId === id ? { ...m, role } : m)) }))
}

export async function removeMember(rowId: string) {
  await latency(350)
  const me = require("manage_users")
  const [kind, id] = rowId.split(":")
  if (kind === "i") {
    write((d) => ({ ...d, invites: d.invites.filter((i) => i.id !== id) }))
    return
  }
  if (id === me.user.id) throw new ApiError("You can’t remove yourself. Ask another Owner.")
  const own = owners(me.org.id)
  if (own.length === 1 && own[0].userId === id) throw new ApiError("You can’t remove the only Owner.")
  write((d) => ({ ...d, memberships: d.memberships.filter((m) => !(m.orgId === me.org.id && m.userId === id)) }))
}

/** For other modules: refuse unless the current role has a permission. */
export function assertCan(p: Permission) {
  require(p)
}

/** Invites check the role too (the dashboard's invite dialog calls this). */
export function assertCanInvite() {
  require("manage_users")
}

/* --------------------------------- Budgets -------------------------------- */

export async function listBudgets(): Promise<{ site: Site; monthlyPkr?: number; latestBill?: number; latestMonth?: string }[]> {
  await latency(300)
  const db = read()
  const orgId = db.session?.orgId
  return db.sites
    .filter((s) => s.orgId === orgId && !s.archived)
    .map((s) => {
      const latest = db.bills.filter((b) => b.siteId === s.id && b.status === "confirmed").sort((a, b) => b.month.localeCompare(a.month))[0]
      return { site: s, monthlyPkr: db.budgets.find((b) => b.siteId === s.id)?.monthlyPkr, latestBill: latest?.amountPayable, latestMonth: latest?.month }
    })
}

export async function saveBudget(siteId: string, monthlyPkr: number | null) {
  await latency(350)
  const me = require("edit")
  if (!read().sites.some((s) => s.id === siteId && s.orgId === me.org.id)) throw new ApiError("That site doesn’t exist in this organisation.")
  if (monthlyPkr !== null && !(monthlyPkr > 0)) throw new ApiError("Enter an amount above 0, or clear it.")
  write((d) => ({ ...d, budgets: [...d.budgets.filter((b) => b.siteId !== siteId), ...(monthlyPkr ? [{ siteId, monthlyPkr }] : [])] }))
}

/* ------------------------------ Notifications ----------------------------- */

export async function saveNotifications(input: { notifications: OrgSettings["notifications"]; whatsapp?: string }) {
  await latency(350)
  require("edit")
  const wa = input.whatsapp?.replace(/[\s-]/g, "")
  const anyWa = Object.values(input.notifications).some((c) => c.whatsapp)
  if (anyWa && !/^(\+92|0)3\d{9}$/.test(wa ?? "")) throw new ApiError("Enter a Pakistani mobile number like 0300 1234567 for WhatsApp, or turn WhatsApp off.")
  saveSettings({ ...settingsNow(), notifications: input.notifications, whatsapp: wa })
}

export type { NotificationChannel, NotificationTopic }

/* ---------------------------------- Plan ---------------------------------- */

export type Plan = { id: PlanId; name: string; pricePerSite: number | null; perMeter?: number; for: string; includes: string[]; users: string }

/** Prices from the Product Scope (PKR per site per month; proposals to test). */
export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    pricePerSite: 4_500,
    for: "Single site, bills only",
    users: "3 users",
    includes: ["Bill reading and audit", "Tariff engine", "Cost dashboard", "Generator and solar logs", "Savings actions", "Monthly report"],
  },
  {
    id: "pro",
    name: "Pro",
    pricePerSite: 12_000,
    perMeter: 1_500,
    for: "Sites with metering",
    users: "10 users",
    includes: ["Everything in Starter", "Live dashboards (meters, later phase)", "Demand and after-hours alerts", "WhatsApp alerts", "Verified savings on metered data"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    pricePerSite: null,
    for: "5+ sites or groups, annual",
    users: "Unlimited users",
    includes: ["Everything in Pro", "Multi-site roll-up and benchmarking", "Budgets per site", "SSO", "Priority support and onboarding"],
  },
]

/** Annual plans: 2 months free. */
export const annualPrice = (monthly: number) => monthly * 10

export async function choosePlan(id: PlanId, cycle: BillingCycle) {
  await latency(500)
  require("manage_billing")
  const s = settingsNow()
  saveSettings({ ...s, plan: { ...s.plan, chosen: id, cycle } })
}

export const trialDaysLeft = (trialEnds: string) => Math.max(0, Math.round((Date.parse(`${trialEnds}T00:00:00Z`) - Date.parse(`${TODAY}T00:00:00Z`)) / 86_400_000))

export { daysFromToday }

/** Members can be invited by id; new ids for invites. */
export const newInviteId = () => newId("inv")
