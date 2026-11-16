// Sample data taken from the Figma "Cost & Savings" frame. Replace
// `fetchCostSavings` with your real API call; every panel already handles
// loading, empty and error.
//
// Derived figures (tariff cost and share, totals, the blended rate, the cost
// KPIs, the 2025 comparison line, invoice amounts, the savings potential) are computed below from their inputs, so they cannot drift apart.

import type { Kpi } from "@/lib/dashboard-data"

import {
  completeMonth,
  completeMonths,
  formatDayMonth,
  formatLongMonthYear,
  formatMonthTick,
  formatMonthYear,
  formatShortMonth,
} from "@/lib/app-date"
import type { DemoState } from "@/lib/dashboard-data"

export type { DemoState }

export type CostBreakdownPoint = {
  month: string
  grid: number
  genset: number
  solar: number
  gas: number
}

export type CostComparisonPoint = { month: string; prev: number; current: number }

export type TariffType = "peak" | "off-peak" | "shoulder" | "fixed"

export type TariffRow = {
  id: string
  period: string
  type: TariffType
  /** PKR per kWh; null for fixed charges. */
  rate: number | null
  /** kWh; null for fixed charges. */
  kwh: number | null
  /** PKR */
  cost: number
  /** Share of the total cost, in percent. */
  share: number
}

export type Effort = "easy" | "medium" | "hard"

export type SavingsOpportunity = {
  id: string
  title: string
  /** Estimated annual savings, PKR. */
  annualSavings: number
  effort: Effort
}

export type InvoiceStatus = "paid" | "pending" | "overdue"

export type Invoice = {
  id: string
  period: string
  /** ISO date the billing period starts; the table sorts on it. */
  periodStart: string
  meterId: string
  location: string
  kwh: number
  rate: number
  base: number
  taxes: number
  total: number
  status: InvoiceStatus
}

export type CostSavingsData = {
  kpis: Kpi[]
  breakdown: CostBreakdownPoint[]
  comparison: CostComparisonPoint[]
  tariffs: TariffRow[]
  tariffTotal: { kwh: number; cost: number }
  /** PKR per kWh: tariff total cost / total kWh. */
  blendedRate: number
  opportunities: SavingsOpportunity[]
  invoices: Invoice[]
}

/* --------------------------------- Charts --------------------------------- */

// PKR lakhs per source, read off the Figma bars and keyed by calendar month. The
// chart shows the 12 complete months up to TODAY (src/lib/app-date.ts), so each
// month takes the Figma value for its name; the latest January is Figma's "Jan".
const figmaByMonth: Record<string, Omit<CostBreakdownPoint, "month">> = {
  Jan: { grid: 18.6, genset: 6.6, solar: 7.2, gas: 10.8 },
  Feb: { grid: 9.1, genset: 14.8, solar: 21.9, gas: 12.1 },
  Mar: { grid: 10.7, genset: 22.6, solar: 19.6, gas: 13.6 },
  Apr: { grid: 11.5, genset: 18.8, solar: 16.0, gas: 12.0 },
  May: { grid: 20.5, genset: 5.6, solar: 9.9, gas: 15.5 },
  Jun: { grid: 7.4, genset: 22.5, solar: 7.0, gas: 13.6 },
  Jul: { grid: 19.1, genset: 20.5, solar: 19.4, gas: 19.1 },
  Aug: { grid: 21.3, genset: 15.8, solar: 8.0, gas: 16.7 },
  Sep: { grid: 21.9, genset: 22.1, solar: 13.0, gas: 6.3 },
  Oct: { grid: 12.3, genset: 3.1, solar: 13.7, gas: 3.5 },
  Nov: { grid: 21.4, genset: 6.8, solar: 19.4, gas: 20.0 },
  Dec: { grid: 10.6, genset: 13.7, solar: 15.6, gas: 8.7 },
}

const monthStarts = completeMonths(12) // oldest first, ends at the latest complete month
const breakdown: CostBreakdownPoint[] = monthStarts.map((iso) => ({
  month: formatMonthTick(iso),
  ...figmaByMonth[formatShortMonth(iso)],
}))

/** "Feb 2025 – Jan 2026": the span the cost charts cover. */
export const chartSpan = `${formatMonthYear(monthStarts[0])} – ${formatMonthYear(monthStarts[11])}`

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

/** A month's total across every source, in PKR lakhs. */
const monthTotal = (m: CostBreakdownPoint) => m.grid + m.genset + m.solar + m.gas

// Last 12 months in PKR millions: the breakdown totals (1 lakh = 0.1 M), so both
// charts and the Total Energy Cost KPI read from the same numbers.
const currentYear = breakdown.map((m) => round2(monthTotal(m) / 10))

// The prior 12 months keep the shape the Figma drew for 2024 (by month name),
// scaled by one factor so their total sits against the last 12 months in the
// same proportion as the Figma's 2024 and 2025 lines.
const figmaPrev = [24.6, 21.9, 17.7, 15.6, 10.9, 4.3, 5.8, 8.3, 12.2, 14.2, 17.3, 21.7] // Jan..Dec
const figmaCurrent = [21.6, 18.3, 14.2, 11.6, 7.4, 3.7, 1.7, 5.9, 7.6, 12.7, 15.3, 18.5]
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const scalePrev = sum(currentYear) / sum(figmaCurrent)
const monthIndex = (iso: string) => Number(iso.slice(5, 7)) - 1

const comparison: CostComparisonPoint[] = breakdown.map((m, i) => ({
  month: m.month,
  prev: round2(figmaPrev[monthIndex(monthStarts[i])] * scalePrev),
  current: currentYear[i],
}))

/* ------------------------- The one monthly total ------------------------- */

// The latest complete month's cost. The Total Energy Cost KPI, the tariff
// table and that month's invoices are all derived from this one number.
const latest = breakdown[breakdown.length - 1]
const previous = breakdown[breakdown.length - 2]
const currentMonth = completeMonth(0)
export const currentMonthTotal = Math.round(monthTotal(latest) * 100_000) // lakhs -> PKR
const costChange = round1(((monthTotal(latest) - monthTotal(previous)) / monthTotal(previous)) * 100)

/** Splits a total by weights into whole rupees that add up exactly. */
function splitTotal(total: number, weights: number[]) {
  const w = sum(weights)
  const parts = weights.map((x) => Math.round((total * x) / w))
  const largest = weights.indexOf(Math.max(...weights))
  parts[largest] += total - sum(parts)
  return parts
}

/* --------------------------------- Tariffs -------------------------------- */

// Band mix by cost, from the Figma's rate x kWh per band. Each band's cost is its
// share of the month's total; its kWh is cost / rate, so rates stay realistic.
const tariffBands: (Omit<TariffRow, "cost" | "share" | "kwh"> & { weight: number })[] = [
  { id: "peak", period: "Peak (05:00 PM - 09:00 PM)", type: "peak", rate: 24.5, weight: 1_107_400 },
  { id: "off-peak", period: "Off-Peak (11:00 PM - 09:00 AM)", type: "off-peak", rate: 14.2, weight: 971_280 },
  { id: "shoulder", period: "Shoulder (09:00 AM - 05:00 PM)", type: "shoulder", rate: 18.8, weight: 347_800 },
  { id: "weekend", period: "Weekend Peak", type: "peak", rate: 22.0, weight: 264_000 },
  { id: "holiday", period: "Holiday Special Rate", type: "off-peak", rate: 12.5, weight: 106_250 },
  { id: "demand", period: "Demand Charge (Fixed Cap)", type: "fixed", rate: null, weight: 152_300 },
]

const tariffCosts = splitTotal(currentMonthTotal, tariffBands.map((b) => b.weight))

const tariffs: TariffRow[] = tariffBands.map((b, i) => ({
  id: b.id,
  period: b.period,
  type: b.type,
  rate: b.rate,
  cost: tariffCosts[i],
  kwh: b.rate === null ? null : Math.round(tariffCosts[i] / b.rate),
  share: round1((tariffCosts[i] / currentMonthTotal) * 100),
}))

const tariffTotal = {
  kwh: tariffs.reduce((a, t) => a + (t.kwh ?? 0), 0),
  cost: sum(tariffCosts),
}

/** The month the tariff table covers, e.g. "January 2026". */
export const tariffMonth = formatLongMonthYear(currentMonth.start)

/* ---------------------------------- KPIs ---------------------------------- */

/** Total cost / total kWh across the tariff bands, PKR per kWh. */
const blendedRate = round2(tariffTotal.cost / tariffTotal.kwh)

const savingsTarget = 440_000
const monthlySavings = 385_420
const shortfall = round1(100 - (monthlySavings / savingsTarget) * 100) // 12.4

const kpis: Kpi[] = [
  {
    id: "cost",
    label: "Total Energy Cost",
    value: currentMonthTotal.toLocaleString("en-US"),
    unit: "PKR",
    note: `${costChange > 0 ? "+" : ""}${costChange}% vs ${formatShortMonth(completeMonth(1).start)}`,
    tone: "neutral",
  },
  {
    id: "rate",
    label: "Cost per kWh",
    value: blendedRate.toFixed(2),
    unit: "PKR",
    note: "Blended across tariff bands",
    tone: "neutral",
  },
  {
    id: "savings",
    label: "Monthly Savings",
    value: monthlySavings.toLocaleString("en-US"),
    unit: "PKR",
    note: `${shortfall}% below PKR ${savingsTarget.toLocaleString("en-US")} target`,
    tone: "warning",
  },
  { id: "budget", label: "Budget Utilization", value: "72.3%", unit: "", note: "", tone: "neutral", progress: 72.3 },
]

/* ------------------------------ Opportunities ----------------------------- */

const opportunities: SavingsOpportunity[] = [
  { id: "ventilation", title: "Shift peak ventilation to shoulder hours", annualSavings: 450_000, effort: "easy" },
  { id: "cooling", title: "Optimize cooling setpoints in Server Room B", annualSavings: 320_000, effort: "easy" },
  { id: "sub-meters", title: "Install sub-meters on production line generators", annualSavings: 850_000, effort: "medium" },
  { id: "battery", title: "Implement battery discharge during high-tariff peak", annualSavings: 1_200_000, effort: "hard" },
]

export const potentialSavings = (list: SavingsOpportunity[]) =>
  list.reduce((sum, o) => sum + o.annualSavings, 0)

/* -------------------------------- Invoices -------------------------------- */

const meters = [
  { meterId: "MT-8849-A", location: "Block A - Main" },
  { meterId: "MT-8849-B", location: "Block B - HVAC" },
  { meterId: "MT-8902-C", location: "Production Line 1" },
] as const

const TAX = 0.095

// One entry per complete month, latest first: rate, then kWh per meter (A, B, C).
// The latest month is billed from the monthly total instead (see below), split
// across meters in the Figma's January proportions. Taxes come from the Figma
// where it lists them, else 9.5% of the base.
const history: {
  rate: number
  kwh: [number, number, number]
  taxes?: (number | undefined)[]
  status?: [InvoiceStatus, InvoiceStatus, InvoiceStatus]
}[] = [
  { rate: 18.45, kwh: [0, 0, 0] }, // latest month: derived from currentMonthTotal
  { rate: 18.2, kwh: [125_600, 82_400, 180_500], taxes: [220_110, 142_100, 312_000], status: ["paid", "paid", "overdue"] },
  { rate: 18.2, kwh: [110_400, 78_500, 172_300], taxes: [190_800, 135_700, undefined], status: ["paid", "pending", "paid"] },
  { rate: 17.95, kwh: [118_200, 74_100, 168_900] },
  { rate: 17.95, kwh: [121_500, 80_300, 175_400] },
  { rate: 17.6, kwh: [129_800, 86_900, 181_200] },
  { rate: 17.6, kwh: [131_200, 89_400, 183_600] },
  { rate: 17.3, kwh: [124_700, 83_100, 176_800] },
]

const latestTotals = splitTotal(currentMonthTotal, [2_695_719, 1_787_003, 3_950_930])

const invoices: Invoice[] = history.flatMap((p, pi) => {
  const month = completeMonth(pi)
  const period = `${formatDayMonth(month.start)} - ${formatDayMonth(month.end)}, ${month.year}`
  return meters.map((m, mi) => {
    let kwh: number, base: number, taxes: number
    if (pi === 0) {
      const total = latestTotals[mi]
      base = Math.round(total / (1 + TAX))
      taxes = total - base
      kwh = Math.round(base / p.rate)
    } else {
      kwh = p.kwh[mi]
      base = Math.round(kwh * p.rate)
      taxes = p.taxes?.[mi] ?? Math.round(base * TAX)
    }
    return {
      id: `${month.start}-${m.meterId}`,
      period,
      periodStart: month.start,
      meterId: m.meterId,
      location: m.location,
      kwh,
      rate: p.rate,
      base,
      taxes,
      total: base + taxes,
      status: p.status?.[mi] ?? "paid",
    }
  })
})

/* ---------------------------------- Fetch --------------------------------- */

export const costSavingsData: CostSavingsData = {
  kpis,
  breakdown,
  comparison,
  tariffs,
  tariffTotal,
  blendedRate,
  opportunities,
  invoices,
}

export const emptyCostSavingsData: CostSavingsData = {
  kpis: [],
  breakdown: [],
  comparison: [],
  tariffs: [],
  tariffTotal: { kwh: 0, cost: 0 },
  blendedRate: 0,
  opportunities: [],
  invoices: [],
}

export async function fetchCostSavings(state: DemoState): Promise<CostSavingsData> {
  await new Promise((r) => setTimeout(r, 600))
  if (state === "error") throw new Error("The billing service did not respond.")
  if (state === "loading") return new Promise(() => {})
  return state === "empty" ? emptyCostSavingsData : costSavingsData
}
