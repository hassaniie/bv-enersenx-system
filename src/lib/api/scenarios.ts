// Ready-made demo organisations, so each new-user state can be reviewed without
// uploading bills one by one. Loaded from the Demo banner.

import { latency } from "./client"
import { ORG, SITE, withRehmat } from "./demo-seed"
import { read, write } from "./store"
import type { Role } from "./types"

export type Scenario = "sample" | "bills-1" | "bills-3" | "bills-12" | "cycle"

export const scenarios: { value: Scenario; label: string; detail: string }[] = [
  { value: "sample", label: "Phase 2 preview (live meters)", detail: "The original live-meter organisation" },
  { value: "bills-12", label: "New site, 12 bills", detail: "A full year of bills, budget set (default)" },
  { value: "bills-1", label: "New site, 1 bill", detail: "Rehmat Textiles right after sign-up" },
  { value: "bills-3", label: "New site, 3 bills", detail: "A few months uploaded" },
  { value: "cycle", label: "Monthly cycle: January bill due", detail: "11 bills; the January bill is waiting" },
]

export async function loadScenario(s: Scenario) {
  await latency(300)
  if (s === "sample") {
    // The Phase 2 preview: the original live-meter organisation, signed in as its owner.
    write((d) => ({ ...d, session: { userId: "u-hm", orgId: "o-sample", siteId: "s-kabirwala" } }))
    return
  }
  write((d) => withRehmat(d, s))
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

