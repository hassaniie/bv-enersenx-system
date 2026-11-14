import { TODAY } from "@/lib/app-date"

import { latency, ApiError } from "./client"
import { newId, read, write } from "./store"
import type { BusinessType, Membership, Organisation, Role, Session, User } from "./types"

export type Me = { user: User; org: Organisation; role: Role } | null

/** The signed-in user, their current organisation and their role in it (synchronous: local session). */
export function getMe(): Me {
  const db = read()
  const s = db.session
  if (!s) return null
  const user = db.users.find((u) => u.id === s.userId)
  const org = db.orgs.find((o) => o.id === s.orgId)
  const role = db.memberships.find((m) => m.userId === s.userId && m.orgId === s.orgId)?.role
  return user && org && role ? { user, org, role } : null
}

export function getSession(): Session | null {
  return read().session
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")

export type SignUpInput = { method: "email"; name: string; email: string; password: string } | { method: "google" }

/** Creates the user. The organisation comes next, with createOrganisation. */
export async function signUp(input: SignUpInput): Promise<User> {
  await latency(600)
  const db = read()
  const name = input.method === "google" ? "Sana Rehman" : input.name.trim()
  const email = input.method === "google" ? "sana.rehman@example.com" : input.email.trim().toLowerCase()
  if (input.method === "email" && db.users.some((u) => u.email === email)) {
    throw new ApiError("An account with this email already exists. Log in instead.")
  }
  const user: User = { id: newId("u"), name, email, initials: initialsOf(name) || "U", signedUpAt: new Date().toISOString() }
  write((d) => ({ ...d, users: [...d.users, user], session: null }))
  pendingUserId = user.id
  return user
}

// Between sign-up and naming the organisation, the user has no session yet.
let pendingUserId: string | null = null

export function getPendingUser(): User | null {
  return read().users.find((u) => u.id === pendingUserId) ?? null
}

export async function createOrganisation(input: { name: string; businessType: BusinessType }): Promise<Organisation> {
  await latency(500)
  const userId = pendingUserId ?? read().session?.userId
  if (!userId) throw new ApiError("Your sign-up expired. Start again.")
  const org: Organisation = {
    id: newId("o"),
    name: input.name.trim(),
    businessType: input.businessType,
    data: "own",
    createdAt: TODAY,
  }
  const membership: Membership = { userId, orgId: org.id, role: "owner" }
  write((d) => ({
    ...d,
    orgs: [...d.orgs, org],
    memberships: [...d.memberships, membership],
    session: { userId, orgId: org.id, siteId: null },
  }))
  pendingUserId = null
  return org
}

/** Demo log in: back to the sample organisation's owner. */
export async function logInAsDemo() {
  await latency(400)
  write((d) => ({ ...d, session: { userId: "u-hm", orgId: "o-sample", siteId: "s-kabirwala" } }))
}

export async function signOut() {
  await latency(200)
  write((d) => ({ ...d, session: null }))
}

/** Demo log in by email: any account created in this browser (passwords aren't checked in the demo). */
export async function logIn(email: string) {
  await latency(500)
  const db = read()
  const user = db.users.find((u) => u.email === email.trim().toLowerCase())
  const membership = user && db.memberships.find((m) => m.userId === user.id)
  if (!user || !membership) throw new ApiError("No account uses this email. Check it, or create an account.")
  const siteId = db.sites.find((s) => s.orgId === membership.orgId && !s.archived)?.id ?? null
  write((d) => ({ ...d, session: { userId: user.id, orgId: membership.orgId, siteId } }))
}

/** Minutes and seconds since the current user signed up, e.g. "3 min 12 s"; undefined for the demo owner. */
export function timeSinceSignUp(): string | undefined {
  const me = getMe()
  if (!me?.user.signedUpAt) return undefined
  const secs = Math.max(1, Math.round((new Date().getTime() - new Date(me.user.signedUpAt).getTime()) / 1000))
  const m = Math.floor(secs / 60)
  return m ? `${m} min ${secs % 60} s` : `${secs} s`
}
