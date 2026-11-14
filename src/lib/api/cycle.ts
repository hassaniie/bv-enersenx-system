// The monthly bill cycle (flow F2): when the next bill is due, and what
// changed once it is in.

import { completeMonth, formatDayMonth, TODAY } from "@/lib/app-date"

import { listActions } from "./actions"
import { listAlerts } from "./alerts"
import { getBill, listBillsNow } from "./bills"
import { latency } from "./client"
import { read } from "./store"
import { recalculate } from "./tariff"
import type { Alert, Bill, BillLineKey, Finding, SavingsAction } from "./types"

export type NextBill = {
  /** yyyy-mm */
  month: string
  status: "due" | "upcoming"
  /** When the DISCO issues it, roughly. */
  issuedAround: string
  /** When the reminder went out (due bills only). */
  remindedOn?: string
  channels: string
}

const addMonth = (month: string, n: number) => {
  const d = new Date(`${month}-01T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 7)
}

/** The bill a site should upload next: the latest complete month if missing, else next month's. */
export async function getNextBill(siteId: string): Promise<NextBill | null> {
  await latency(200)
  const bills = listBillsNow(siteId)
  if (!bills.length) return null
  const expected = completeMonth(0).start.slice(0, 7)
  const missing = !bills.some((b) => b.month === expected)
  const channels = "email and WhatsApp"
  if (missing && TODAY > `${expected}-25`) {
    return { month: expected, status: "due", issuedAround: formatDayMonth(`${expected}-19`), remindedOn: formatDayMonth(`${expected}-25`), channels }
  }
  const next = addMonth(expected, 1)
  return { month: next, status: "upcoming", issuedAround: formatDayMonth(`${next}-19`), channels }
}

export type Delta = { label: string; unit: string; now: number; before: number; digits?: number }

export type LineChange = { key: BillLineKey; label: string; now: number; before: number }

export type MonthChange = {
  bill: Bill
  previous: Bill | null
  deltas: Delta[]
  lines: LineChange[]
  /** On this bill, not on the previous one. */
  newFindings: Finding[]
  /** On both. */
  stillThere: Finding[]
  /** On the previous bill, gone from this one. */
  gone: Finding[]
  /** Actions this bill verified or failed to verify, for the first time. */
  checked: SavingsAction[]
  /** Alerts this bill raised. */
  alerts: Alert[]
}

const kind = (f: Finding) => f.id.split("-").pop()!
const units = (b: Bill) => b.peakKwh + b.offPeakKwh

/** What changed between a bill and the bill for the month before it. */
export async function getMonthChange(billId: string): Promise<MonthChange> {
  const bill = await getBill(billId)
  const previous = listBillsNow(bill.siteId).find((b) => b.month < bill.month) ?? null
  const now = recalculate(bill).findings
  const before = previous ? recalculate(previous).findings : []
  const beforeKinds = new Set(before.map(kind))
  const nowKinds = new Set(now.map(kind))
  const [actions, alerts] = await Promise.all([listActions(bill.siteId), listAlerts(bill.siteId)])
  return {
    bill,
    previous,
    deltas: previous
      ? [
          { label: "Amount payable", unit: "PKR", now: bill.amountPayable, before: previous.amountPayable },
          { label: "Units", unit: "kWh", now: units(bill), before: units(previous) },
          { label: "Maximum demand", unit: "kW", now: bill.mdiKw, before: previous.mdiKw },
          { label: "Peak-hour share", unit: "%", now: (bill.peakKwh / units(bill)) * 100, before: (previous.peakKwh / units(previous)) * 100, digits: 1 },
        ]
      : [],
    lines: previous
      ? bill.lines.map((l) => ({ key: l.key, label: l.label, now: l.amount, before: previous.lines.find((p) => p.key === l.key)?.amount ?? 0 }))
      : [],
    newFindings: now.filter((f) => !beforeKinds.has(kind(f))),
    stillThere: now.filter((f) => beforeKinds.has(kind(f))),
    gone: before.filter((f) => !nowKinds.has(kind(f))),
    // Only actions this bill checks for the first time.
    checked: actions.filter((a) => (a.status === "verified" || a.status === "not_achieved") && a.verification?.after[0] === bill.month),
    alerts: alerts.filter((a) => a.month === bill.month && a.status === "open"),
  }
}

/** Whether a site already has its first bill (monthly uploads go to /bills/upload/). */
export const hasBillsNow = (siteId: string) => read().bills.some((b) => b.siteId === siteId && b.status === "confirmed")
