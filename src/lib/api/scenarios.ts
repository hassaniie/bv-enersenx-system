// Ready-made demo organisations, so each new-user state can be reviewed without
// uploading bills one by one. Loaded from the Demo banner.

import { completeMonth, daysFromToday, TODAY } from "@/lib/app-date"

import { latency } from "./client"
import { sampleBill } from "./sample-bills"
import { read, seed, write } from "./store"
import { actionTitles } from "./actions"
import type { Bill, Role, SavingsAction, Site } from "./types"

export type Scenario = "sample" | "bills-1" | "bills-3" | "bills-12" | "cycle"

export const scenarios: { value: Scenario; label: string; detail: string }[] = [
  { value: "sample", label: "Sample organisation", detail: "The original demo: full year, live meters" },
  { value: "bills-1", label: "New site, 1 bill", detail: "Rehmat Textiles right after sign-up" },
  { value: "bills-3", label: "New site, 3 bills", detail: "A few months uploaded" },
  { value: "bills-12", label: "New site, 12 bills", detail: "A full year of bills, budget set" },
  { value: "cycle", label: "Monthly cycle: January bill due", detail: "11 bills; the January bill is waiting" },
]

const ORG = "o-rehmat"
const USER = "u-sana"
const SITE = "s-rehmat-fsd"

/** Rehmat Textiles: a 500 kW weaving unit in Faisalabad on FESCO's B-2(b) tariff. */
function rehmat(bills: number) {
  const site: Site = {
    id: SITE,
    orgId: ORG,
    name: "Faisalabad weaving unit",
    city: "Faisalabad",
    disco: "FESCO",
    connectionType: "industrial",
    tariff: "B-2(b)",
    sanctionedKw: 500,
    areaSqft: 120_000,
    archived: false,
    createdAt: completeMonth(bills).start,
  }
  // Oldest first. The same billing errors repeat every month (they do, until a
  // complaint fixes them); a capacitor bank lifts the power factor in the last two months of a year.
  const list: Bill[] = Array.from({ length: bills }, (_, i) => {
    const back = bills - 1 - i
    const month = completeMonth(back).start.slice(0, 7)
    const fixedPf = bills >= 12 && back < 2
    return {
      ...sampleBill(site, month, { fileName: `FESCO ${month}.pdf`, kind: "pdf", sizeBytes: 412_000 + i * 731 }, {
        fixedOnSanctioned: true,
        furtherTax: true,
        powerFactor: fixedPf ? 0.93 : 0.87 + (i % 3) * 0.01,
        peakShare: 0.2 + ((i * 7) % 5) / 100,
      }),
      status: "confirmed",
    }
  })
  return { site, list }
}

/** A year in: a capacitor bank that worked, and a peak-shift that didn't (yet). */
function seededActions(cycle = false): SavingsAction[] {
  const base = { orgId: ORG, siteId: SITE, suggestedAt: "2025-09-19" }
  const strn: SavingsAction = {
    ...base,
    id: "act-further",
    kind: "further",
    title: actionTitles.further,
    detail: "If you hold an STRN, send it to FESCO to stop the charge.",
    estMonthlyPkr: 170_000,
    status: "done",
    owner: { name: "Sana Rehman", initials: "SR" },
    dueDate: "2025-12-15",
    acceptedAt: "2025-12-02",
    doneAt: "2025-12-10",
    note: "STRN certificate submitted at the FESCO customer centre, Faisalabad.",
  }
  return [
    ...(cycle ? [strn] : []),
    {
      ...base,
      id: "act-pf",
      kind: "pf",
      title: actionTitles.pf,
      detail: "Get a capacitor bank sized and checked; most pay back within a few months.",
      estMonthlyPkr: 268_000,
      status: "done",
      owner: { name: "Bilal Ahmed (invited)", initials: "BA" },
      dueDate: "2025-11-30",
      acceptedAt: "2025-09-22",
      doneAt: "2025-11-20",
      note: "150 kVAR bank installed on the main LT panel by the electrical contractor.",
    },
    {
      ...base,
      id: "act-peak",
      kind: "peak",
      title: actionTitles.peak,
      detail: "Schedule batch loads (compressors, pumps, pre-cooling) before 5 PM.",
      estMonthlyPkr: 38_500,
      status: "done",
      owner: { name: "Sana Rehman", initials: "SR" },
      dueDate: "2025-10-15",
      acceptedAt: "2025-09-22",
      doneAt: "2025-10-05",
      note: "Second-shift sizing moved to 3 PM.",
    },
  ]
}

export async function loadScenario(s: Scenario) {
  await latency(300)
  if (s === "sample") {
    write((d) => ({ ...seed(), users: d.users, orgs: d.orgs, memberships: d.memberships, sites: d.sites, bills: d.bills, invites: d.invites, budgets: d.budgets, session: seed().session }))
    return
  }
  const cycle = s === "cycle"
  const n = cycle ? 12 : Number(s.split("-")[1])
  const built = rehmat(n)
  const site = built.site
  // The monthly cycle starts with the latest month still to upload.
  const list = cycle ? built.list.slice(0, -1) : built.list
  write((d) => {
    const base = {
      ...d,
      users: d.users.some((u) => u.id === USER)
        ? d.users
        : [...d.users, { id: USER, name: "Sana Rehman", email: "sana@rehmattextiles.pk", initials: "SR" }],
      orgs: [
        ...d.orgs.filter((o) => o.id !== ORG),
        { id: ORG, name: "Rehmat Textiles (Pvt) Ltd", businessType: "textile" as const, data: "own" as const, createdAt: site.createdAt },
      ],
      memberships: [...d.memberships.filter((m) => m.orgId !== ORG), { userId: USER, orgId: ORG, role: "owner" as const }],
      sites: [...d.sites.filter((x) => x.orgId !== ORG), site],
      bills: [...d.bills.filter((b) => b.orgId !== ORG), ...list],
      invites: [
        ...d.invites.filter((i) => i.orgId !== ORG),
        ...(n >= 12 ? [{ id: "inv-bilal", orgId: ORG, email: "bilal.ahmed@rehmattextiles.pk", role: "manager" as const, invitedAt: TODAY }] : []),
      ],
      budgets: [...d.budgets.filter((b) => b.siteId !== SITE), ...(n >= 12 ? [{ siteId: SITE, monthlyPkr: 6_500_000 }] : [])],
      actions: [...(d.actions ?? []).filter((a) => a.orgId !== ORG), ...(n >= 12 ? seededActions(cycle) : [])],
      // A site that has been on EnerSenX for months is on a plan; a brand-new one is on its trial.
      orgSettings: [
        ...(d.orgSettings ?? []).filter((s) => s.orgId !== ORG),
        {
          orgId: ORG,
          plan: n >= 3 ? { id: "starter" as const, cycle: "monthly" as const, trialEnds: addDays(site.createdAt, 14), chosen: "starter" as const } : { id: "trial" as const, cycle: "monthly" as const, trialEnds: addDays(TODAY, 12) },
          notifications: {
            bill_anomaly: { email: true, whatsapp: true },
            budget_overrun: { email: true, whatsapp: true },
            missing_bill: { email: true, whatsapp: false },
            bill_reminder: { email: true, whatsapp: true },
            monthly_report: { email: true, whatsapp: false },
          },
          whatsapp: "03001234567",
        },
      ],
      alertStates: (d.alertStates ?? []).filter((a) => !a.id.includes(SITE)),
    }
    return { ...base, session: { userId: USER, orgId: ORG, siteId: SITE } }
  })
}

/** Which scenario the current session matches, for the banner's picker. */
export function currentScenario(): Scenario | null {
  const db = read()
  if (db.session?.orgId === "o-sample") return "sample"
  if (db.session?.orgId !== ORG) return null
  const n = db.bills.filter((b) => b.siteId === SITE && b.status === "confirmed").length
  if (n === 11 && (db.actions ?? []).some((a) => a.id === "act-further")) return "cycle"
  return n === 1 ? "bills-1" : n === 3 ? "bills-3" : n === 12 ? "bills-12" : null
}

/** Demo only: change your own role in the current organisation, to review what each role sees. */
export async function setDemoRole(role: Role) {
  await latency(250)
  write((d) => ({
    ...d,
    memberships: d.memberships.map((m) => (m.userId === d.session?.userId && m.orgId === d.session?.orgId ? { ...m, role } : m)),
  }))
}

function addDays(iso: string, n: number) {
  if (iso === TODAY) return daysFromToday(n)
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
