import { completeMonth } from "@/lib/app-date"

import { latency, ApiError } from "./client"
import { newId, read, write } from "./store"
import type { ConnectionType, Disco, Site, TariffCode } from "./types"

/** Cities offered at sign-up, with the DISCO that serves them. */
export const cities: { city: string; disco: Disco }[] = [
  { city: "Faisalabad", disco: "FESCO" },
  { city: "Lahore", disco: "LESCO" },
  { city: "Karachi", disco: "K-Electric" },
  { city: "Islamabad", disco: "IESCO" },
  { city: "Rawalpindi", disco: "IESCO" },
  { city: "Gujranwala", disco: "GEPCO" },
  { city: "Sialkot", disco: "GEPCO" },
  { city: "Multan", disco: "MEPCO" },
  { city: "Peshawar", disco: "PESCO" },
  { city: "Hyderabad", disco: "HESCO" },
  { city: "Sukkur", disco: "SEPCO" },
  { city: "Quetta", disco: "QESCO" },
  { city: "Sheikhupura", disco: "LESCO" },
  { city: "Kasur", disco: "LESCO" },
]

export const discos: Disco[] = ["FESCO", "LESCO", "K-Electric", "IESCO", "GEPCO", "MEPCO", "PESCO", "HESCO", "SEPCO", "QESCO", "TESCO"]

/** The tariff a new site gets from its connection type and sanctioned load. */
export function tariffFor(connectionType: ConnectionType, sanctionedKw: number): TariffCode {
  if (connectionType === "commercial") return "A-2(c)"
  if (sanctionedKw <= 25) return "B-1(b)"
  if (sanctionedKw <= 500) return "B-2(b)"
  return "B-3"
}

/** Sites of the current organisation, archived ones last. */
export async function getSites(opts: { includeArchived?: boolean } = {}): Promise<Site[]> {
  await latency(250)
  return listSitesNow(opts)
}

/** Synchronous read for chrome that renders on every page (the facility picker). */
export function listSitesNow(opts: { includeArchived?: boolean } = {}): Site[] {
  const db = read()
  const orgId = db.session?.orgId
  return db.sites.filter((s) => s.orgId === orgId && (opts.includeArchived || !s.archived))
}

export type NewSite = {
  name: string
  city: string
  disco: Disco
  connectionType: ConnectionType
  sanctionedKw: number
  areaSqft?: number
}

export async function createSite(input: NewSite): Promise<Site> {
  await latency(500)
  const orgId = read().session?.orgId
  if (!orgId) throw new ApiError("You are signed out. Log in to add a site.")
  const site: Site = {
    id: newId("s"),
    orgId,
    name: input.name.trim(),
    city: input.city,
    disco: input.disco,
    connectionType: input.connectionType,
    tariff: tariffFor(input.connectionType, input.sanctionedKw),
    sanctionedKw: input.sanctionedKw,
    areaSqft: input.areaSqft,
    archived: false,
    createdAt: completeMonth(-1).start,
  }
  write((d) => ({ ...d, sites: [...d.sites, site], session: d.session && { ...d.session, siteId: site.id } }))
  return site
}

export function selectSite(siteId: string) {
  write((d) => ({ ...d, session: d.session && { ...d.session, siteId } }))
}

/** The site the user is looking at: the selected one, else the first. */
export function currentSiteNow(): Site | null {
  const sites = listSitesNow()
  const id = read().session?.siteId
  return sites.find((s) => s.id === id) ?? sites[0] ?? null
}
