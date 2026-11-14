// Builds realistic sample bills for a site: the stand-in for reading a real
// bill until bill ingestion (Milestone 2) exists. Deterministic per site and
// month, so the same upload always reads the same way.

import { computeLines, sumLines } from "./tariff"
import type { Bill, BillSource, Site } from "./types"

/** Small stable hash, so a site always gets the same reference number and quirks. */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Load relative to the yearly average: summer cooling pushes June–August up. */
const season = [0.86, 0.84, 0.92, 1.02, 1.1, 1.16, 1.18, 1.14, 1.06, 0.98, 0.9, 0.86]

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function referenceNo(site: Site) {
  const h = hash(site.id)
  const pad = (n: number, w: number) => String(n).padStart(w, "0")
  return `${pad(h % 100, 2)} ${pad((h >>> 7) % 100000, 5)} ${pad((h >>> 3) % 10000000, 7)} U`
}

export type SampleBillOptions = {
  /** Bill the fixed charge on the full sanctioned load (a common billing error). */
  fixedOnSanctioned?: boolean
  furtherTax?: boolean
  powerFactor?: number
  /** Share of units in peak hours. */
  peakShare?: number
}

/** A bill for `month` (yyyy-mm) as the DISCO would print it. */
export function sampleBill(site: Site, month: string, source: BillSource, opts: SampleBillOptions = {}): Bill {
  const h = hash(`${site.id}:${month}`)
  const monthIndex = Number(month.slice(5, 7)) - 1
  const wobble = 0.97 + (h % 60) / 1000 // ±3%, stable per month
  const mdiKw = Math.round(site.sanctionedKw * 0.62 * season[monthIndex] * wobble)
  const units = Math.round(mdiKw * 0.55 * 730 * wobble)
  const peakShare = opts.peakShare ?? 0.215
  const peakKwh = Math.round(units * peakShare)
  const offPeakKwh = units - peakKwh
  const powerFactor = opts.powerFactor ?? 0.88

  const lines = computeLines({
    tariff: site.tariff,
    peakKwh,
    offPeakKwh,
    mdiKw,
    sanctionedKw: site.sanctionedKw,
    powerFactor,
    fixedOnKw: opts.fixedOnSanctioned ? site.sanctionedKw : undefined,
    furtherTax: opts.furtherTax ?? false,
  })
  const issueDate = `${month}-19`

  return {
    id: `bill-${site.id}-${month}`,
    orgId: site.orgId,
    siteId: site.id,
    disco: site.disco,
    referenceNo: referenceNo(site),
    month,
    issueDate,
    dueDate: addDays(issueDate, 11),
    tariff: site.tariff,
    sanctionedKw: site.sanctionedKw,
    peakKwh,
    offPeakKwh,
    mdiKw,
    powerFactor,
    lines,
    amountPayable: sumLines(lines),
    status: "needs_review",
    source,
    confidence: { month: 0.99, peakKwh: 0.97, offPeakKwh: 0.96, mdiKw: 0.78, amountPayable: 0.99 },
    uploadedAt: issueDate,
  }
}
