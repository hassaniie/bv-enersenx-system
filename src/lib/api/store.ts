// The demo backend: one JSON document in localStorage, seeded on first visit.
// Only files in src/lib/api/ touch it; screens call the typed functions.
// "Reset demo" clears it and the seed comes back.

import type { GeneratedReport, Schedule } from "@/lib/reports-data"

import type { AlertState, Bill, Membership, Organisation, SavingsAction, Session, Site, User } from "./types"

export const STORAGE_KEY = "enersenx-demo-v1"

export type Db = {
  version: 1
  session: Session | null
  users: User[]
  orgs: Organisation[]
  memberships: Membership[]
  sites: Site[]
  bills: Bill[]
  /** Pending invites by email. */
  invites: { id: string; orgId: string; email: string; role: Membership["role"]; invitedAt: string }[]
  budgets: { siteId: string; monthlyPkr: number }[]
  /** Reports and schedules of organisations created here (the sample org keeps its sample list). */
  reports?: (GeneratedReport & { orgId: string })[]
  schedules?: (Schedule & { orgId: string })[]
  /** Savings actions people have accepted, dismissed or completed. */
  actions?: SavingsAction[]
  /** What people did with each alert. */
  alertStates?: AlertState[]
}

const created = "2025-06-01"

/** The original demo: the organisation the Figma screens were drawn for, with sample-file data. */
export function seed(): Db {
  const user: User = { id: "u-hm", name: "Hassan Malik", email: "hassan.malik@example.com", initials: "HM" }
  const org: Organisation = { id: "o-sample", name: "Nestle Pakistan", businessType: "food", data: "sample", createdAt: created }
  const site = (id: string, name: string, city: string, disco: Site["disco"], sanctionedKw: number): Site => ({
    id,
    orgId: org.id,
    name,
    city,
    disco,
    connectionType: "industrial",
    tariff: "B-3",
    sanctionedKw,
    archived: false,
    createdAt: created,
  })
  return {
    version: 1,
    session: { userId: user.id, orgId: org.id, siteId: "s-kabirwala" },
    users: [user],
    orgs: [org],
    memberships: [{ userId: user.id, orgId: org.id, role: "owner" }],
    sites: [
      site("s-kabirwala", "Nestle Kabirwala", "Kabirwala", "MEPCO", 3_900),
      site("s-sheikhupura", "Nestle Sheikhupura", "Sheikhupura", "LESCO", 2_500),
      site("s-islamabad", "Nestle Islamabad", "Islamabad", "IESCO", 1_200),
    ],
    bills: [],
    invites: [],
    budgets: [],
  }
}

let cache: Db | null = null
let version = 0
const listeners = new Set<() => void>()

function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    return null
  }
}

export function read(): Db {
  if (cache) return cache
  const raw = storage()?.getItem(STORAGE_KEY)
  try {
    const parsed = raw ? (JSON.parse(raw) as Db) : null
    cache = parsed?.version === 1 ? parsed : seed()
  } catch {
    cache = seed()
  }
  return cache
}

export function write(update: (db: Db) => Db) {
  cache = update(read())
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Private mode or full storage: the demo keeps working for this tab.
  }
  version += 1
  listeners.forEach((l) => l())
}

export function reset() {
  try {
    storage()?.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  cache = seed()
  version += 1
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    cache = null
    version += 1
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Bumps on every write, so queries know when to reload. */
export const getVersion = () => version

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
