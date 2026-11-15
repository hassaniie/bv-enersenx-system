import { completeMonth } from "@/lib/app-date"

import { resolvedKinds } from "./actions"
import { ApiError, latency } from "./client"
import { sampleBill } from "./sample-bills"
import { read, write } from "./store"
import { computeLines, recalculate, sumLines } from "./tariff"
import type { Bill, BillSource, KeyField, Recalculation } from "./types"
import { assertCan } from "./settings"

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
  assertCan("edit")
  const site = read().sites.find((s) => s.id === siteId && s.orgId === read().session?.orgId)
  if (!site) throw new ApiError("That site doesn’t exist or belongs to another organisation.")
  // The common findings (fixed charges on sanctioned load, further tax, low PF)
  // repeat on every bill until a savings action marked done fixes them.
  const fixed = resolvedKinds(siteId)
  const bill: Bill = {
    ...sampleBill(site, nextMonthToRead(siteId), source, {
      fixedOnSanctioned: !fixed.has("fixed"),
      furtherTax: !fixed.has("further"),
      powerFactor: fixed.has("pf") ? 0.93 : undefined,
    }),
    status: "reading",
  }
  write((d) => ({ ...d, bills: [...d.bills.filter((b) => b.id !== bill.id), bill] }))
  return bill
}

/** Reads the uploaded bill (OCR stand-in). Resolves when the 5 key fields are ready to confirm. */
/** A bill of the current organisation, or undefined. Every bill read and write goes through it. */
function ownBill(billId: string) {
  return read().bills.find((b) => b.id === billId && b.orgId === read().session?.orgId)
}

export async function readBill(billId: string): Promise<Bill> {
  await latency(3_600)
  const bill = ownBill(billId)
  if (!bill) throw new ApiError("We lost this upload. Upload the bill again.")
  const ready: Bill = { ...bill, status: "needs_review" }
  write((d) => ({ ...d, bills: d.bills.map((b) => (b.id === billId ? ready : b)) }))
  return ready
}

export type KeyFields = Pick<Bill, KeyField>

/** Saves the confirmed fields. Edited units or MDI recompute the printed lines. */
export async function confirmBill(billId: string, fields: KeyFields): Promise<Bill> {
  await latency(400)
  assertCan("edit")
  const bill = ownBill(billId)
  if (!bill) throw new ApiError("This bill doesn’t exist or belongs to another organisation.")
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
  const bill = ownBill(billId)
  if (!bill) throw new ApiError("This bill doesn’t exist or belongs to another organisation.")
  return bill
}

/** Confirmed bills of a site, newest first. */
export async function listBills(siteId: string): Promise<Bill[]> {
  await latency(300)
  return listBillsNow(siteId)
}

export function listBillsNow(siteId: string): Bill[] {
  const orgId = read().session?.orgId
  return read()
    .bills.filter((b) => b.siteId === siteId && b.orgId === orgId && b.status === "confirmed")
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
  /** Amount payable per month, oldest first. */
  history: { month: string; amount: number }[]
  budget?: number
}

/** The latest confirmed bill of a site and what its check found. */
export async function getSiteSummary(siteId: string): Promise<SiteSummary> {
  await latency(300)
  const bills = listBillsNow(siteId)
  const latest = bills[0] ?? null
  const budget = read().budgets.find((b) => b.siteId === siteId)?.monthlyPkr
  const history = [...bills].reverse().map((b) => ({ month: b.month, amount: b.amountPayable }))
  return { latest, check: latest ? recalculate(latest) : null, billCount: bills.length, history, budget }
}

export type BillCheckStatus = "overcharged" | "avoidable" | "ok"

export type BillRow = {
  id: string
  month: string
  referenceNo: string
  kwh: number
  mdiKw: number
  powerFactor: number
  billed: number
  /** Our recalculation (tariff, no billing errors). */
  expected: number
  /** Possible overcharges on this bill: one-time, PKR. */
  overcharged: number
  status: BillCheckStatus
}

function checkStatus(r: Recalculation): BillCheckStatus {
  if (r.findings.some((f) => f.kind === "overcharge")) return "overcharged"
  if (r.findings.some((f) => f.kind === "avoidable")) return "avoidable"
  return "ok"
}

/** Every confirmed bill of a site with its check result, newest first. */
export async function listBillRows(siteId: string): Promise<BillRow[]> {
  await latency(350)
  return listBillsNow(siteId).map((b) => {
    const r = recalculate(b)
    return {
      id: b.id,
      month: b.month,
      referenceNo: b.referenceNo,
      kwh: b.peakKwh + b.offPeakKwh,
      mdiKw: b.mdiKw,
      powerFactor: b.powerFactor,
      billed: b.amountPayable,
      expected: r.expectedTotal,
      overcharged: r.findings.filter((f) => f.kind === "overcharge").reduce((s, f) => s + f.impactPkr, 0),
      status: checkStatus(r),
    }
  })
}

export type BillDetail = {
  bill: Bill
  check: Recalculation
  status: BillCheckStatus
  siteName: string
  /** Neighbouring months of the same site, for previous / next. */
  previousId?: string
  nextId?: string
}

export async function getBillDetail(billId: string): Promise<BillDetail> {
  const bill = await getBill(billId)
  const siblings = listBillsNow(bill.siteId) // newest first
  const i = siblings.findIndex((b) => b.id === bill.id)
  const check = recalculate(bill)
  return {
    bill,
    check,
    status: checkStatus(check),
    siteName: read().sites.find((s) => s.id === bill.siteId)?.name ?? "",
    previousId: siblings[i + 1]?.id,
    nextId: i > 0 ? siblings[i - 1]?.id : undefined,
  }
}
