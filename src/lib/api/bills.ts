import { completeMonth } from "@/lib/app-date"

import { ApiError, latency } from "./client"
import { sampleBill } from "./sample-bills"
import { read, write } from "./store"
import { computeLines, recalculate, sumLines } from "./tariff"
import type { Bill, BillSource, KeyField, Recalculation } from "./types"

/** The month a new bill is for: the latest complete month without a bill. */
function nextMonthToRead(siteId: string) {
  const have = new Set(read().bills.filter((b) => b.siteId === siteId).map((b) => b.month))
  for (let back = 0; back < 36; back++) {
    const m = completeMonth(back).start.slice(0, 7)
    if (!have.has(m)) return m
  }
  throw new ApiError("This site already has 3 years of bills.")
}

/** Stores the file and starts reading it. Returns the bill in "reading" status. */
export async function uploadBill(siteId: string, source: BillSource): Promise<Bill> {
  await latency(500)
  const site = read().sites.find((s) => s.id === siteId)
  if (!site) throw new ApiError("That site no longer exists.")
  // A first bill shows the common findings: fixed charges on sanctioned load, further tax, low PF.
  const first = !read().bills.some((b) => b.siteId === siteId)
  const bill: Bill = {
    ...sampleBill(site, nextMonthToRead(siteId), source, { fixedOnSanctioned: first, furtherTax: first }),
    status: "reading",
  }
  write((d) => ({ ...d, bills: [...d.bills.filter((b) => b.id !== bill.id), bill] }))
  return bill
}

/** Reads the uploaded bill (OCR stand-in). Resolves when the 5 key fields are ready to confirm. */
export async function readBill(billId: string): Promise<Bill> {
  await latency(3_600)
  const bill = read().bills.find((b) => b.id === billId)
  if (!bill) throw new ApiError("We lost this upload. Upload the bill again.")
  const ready: Bill = { ...bill, status: "needs_review" }
  write((d) => ({ ...d, bills: d.bills.map((b) => (b.id === billId ? ready : b)) }))
  return ready
}

export type KeyFields = Pick<Bill, KeyField>

/** Saves the confirmed fields. Edited units or MDI recompute the printed lines. */
export async function confirmBill(billId: string, fields: KeyFields): Promise<Bill> {
  await latency(400)
  const bill = read().bills.find((b) => b.id === billId)
  if (!bill) throw new ApiError("We lost this upload. Upload the bill again.")
  const unitsChanged = fields.peakKwh !== bill.peakKwh || fields.offPeakKwh !== bill.offPeakKwh || fields.mdiKw !== bill.mdiKw
  const fixedOnKw = bill.lines.find((l) => l.key === "fixed")?.basis.match(/^([\d,]+) kW/)?.[1]
  const lines = unitsChanged
    ? computeLines({
        tariff: bill.tariff,
        peakKwh: fields.peakKwh,
        offPeakKwh: fields.offPeakKwh,
        mdiKw: fields.mdiKw,
        sanctionedKw: bill.sanctionedKw,
        powerFactor: bill.powerFactor,
        fixedOnKw: fixedOnKw ? Number(fixedOnKw.replace(/,/g, "")) : undefined,
        furtherTax: bill.lines.some((l) => l.key === "furtherTax" && l.amount > 0),
      })
    : bill.lines
  const confirmed: Bill = {
    ...bill,
    ...fields,
    lines,
    amountPayable: unitsChanged && fields.amountPayable === bill.amountPayable ? sumLines(lines) : fields.amountPayable,
    status: "confirmed",
  }
  write((d) => ({ ...d, bills: d.bills.map((b) => (b.id === billId ? confirmed : b)) }))
  return confirmed
}

export async function getBill(billId: string): Promise<Bill> {
  await latency(250)
  const bill = read().bills.find((b) => b.id === billId && b.orgId === read().session?.orgId)
  if (!bill) throw new ApiError("This bill doesn’t exist or belongs to another organisation.")
  return bill
}

/** Confirmed bills of a site, newest first. */
export async function listBills(siteId: string): Promise<Bill[]> {
  await latency(300)
  return listBillsNow(siteId)
}

export function listBillsNow(siteId: string): Bill[] {
  return read()
    .bills.filter((b) => b.siteId === siteId && b.status === "confirmed")
    .sort((a, b) => b.month.localeCompare(a.month))
}

/** Our recalculation of a bill and what it found. */
export async function getFindings(billId: string): Promise<Recalculation> {
  const bill = await getBill(billId)
  return recalculate(bill)
}

/** Uploads of the current organisation that are still being read or confirmed. */
export function billsInProgress(): Bill[] {
  const db = read()
  return db.bills.filter((b) => b.orgId === db.session?.orgId && (b.status === "reading" || b.status === "needs_review"))
}

export type SiteSummary = {
  latest: Bill | null
  check: Recalculation | null
  billCount: number
}

/** The latest confirmed bill of a site and what its check found. */
export async function getSiteSummary(siteId: string): Promise<SiteSummary> {
  await latency(300)
  const bills = listBillsNow(siteId)
  const latest = bills[0] ?? null
  return { latest, check: latest ? recalculate(latest) : null, billCount: bills.length }
}
