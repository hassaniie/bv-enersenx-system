// Sample data taken from the Figma "Cost & Savings" frame. Replace
// `fetchCostSavings` with your real API call; every panel already handles
// loading, empty and error.
//
// Derived figures (tariff cost and share, totals, the blended rate, the cost
// KPIs, the 2025 comparison line, invoice amounts, the savings potential) are computed below from their inputs, so they cannot drift apart.

import type { Kpi } from "@/lib/dashboard-data"

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

// PKR lakhs, read off the Figma bars.
const breakdown: CostBreakdownPoint[] = [
  { month: "Jan", grid: 18.6, genset: 6.6, solar: 7.2, gas: 10.8 },
  { month: "Feb", grid: 9.1, genset: 14.8, solar: 21.9, gas: 12.1 },
  { month: "Mar", grid: 10.7, genset: 22.6, solar: 19.6, gas: 13.6 },
  { month: "Apr", grid: 11.5, genset: 18.8, solar: 16.0, gas: 12.0 },
  { month: "May", grid: 20.5, genset: 5.6, solar: 9.9, gas: 15.5 },
  { month: "Jun", grid: 7.4, genset: 22.5, solar: 7.0, gas: 13.6 },
  { month: "Jul", grid: 19.1, genset: 20.5, solar: 19.4, gas: 19.1 },
  { month: "Aug", grid: 21.3, genset: 15.8, solar: 8.0, gas: 16.7 },
  { month: "Sep", grid: 21.9, genset: 22.1, solar: 13.0, gas: 6.3 },
  { month: "Oct", grid: 12.3, genset: 3.1, solar: 13.7, gas: 3.5 },
  { month: "Nov", grid: 21.4, genset: 6.8, solar: 19.4, gas: 20.0 },
  { month: "Dec", grid: 10.6, genset: 13.7, solar: 15.6, gas: 8.7 },
]

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

/** A month's total across every source, in PKR lakhs. */
const monthTotal = (m: CostBreakdownPoint) => m.grid + m.genset + m.solar + m.gas

// 2025 in PKR millions: the breakdown totals (1 lakh = 0.1 M), so both charts and
// the Total Energy Cost KPI read from the same numbers.
const current2025 = breakdown.map((m) => round2(monthTotal(m) / 10))

// 2024 keeps the shape the Figma drew, scaled by one factor so its year total sits
// against the 2025 total in the same proportion as in the Figma (old 2025 line below).
const figma2024 = [24.6, 21.9, 17.7, 15.6, 10.9, 4.3, 5.8, 8.3, 12.2, 14.2, 17.3, 21.7]
const figma2025 = [21.6, 18.3, 14.2, 11.6, 7.4, 3.7, 1.7, 5.9, 7.6, 12.7, 15.3, 18.5]
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const scale2024 = sum(current2025) / sum(figma2025)

const comparison: CostComparisonPoint[] = breakdown.map((m, i) => ({
  month: m.month,
  prev: round2(figma2024[i] * scale2024),
  current: current2025[i],
}))

/* --------------------------------- Tariffs -------------------------------- */

const tariffInputs: Omit<TariffRow, "cost" | "share">[] = [
  { id: "peak", period: "Peak (05:00 PM - 09:00 PM)", type: "peak", rate: 24.5, kwh: 45_200 },
  { id: "off-peak", period: "Off-Peak (11:00 PM - 09:00 AM)", type: "off-peak", rate: 14.2, kwh: 68_400 },
  { id: "shoulder", period: "Shoulder (09:00 AM - 05:00 PM)", type: "shoulder", rate: 18.8, kwh: 18_500 },
  { id: "weekend", period: "Weekend Peak", type: "peak", rate: 22.0, kwh: 12_000 },
  { id: "holiday", period: "Holiday Special Rate", type: "off-peak", rate: 12.5, kwh: 8_500 },
  { id: "demand", period: "Demand Charge (Fixed Cap)", type: "fixed", rate: null, kwh: null },
]
const fixedCharges: Record<string, number> = { demand: 152_300 }

const tariffCosts = tariffInputs.map((t) =>
  t.rate !== null && t.kwh !== null ? Math.round(t.rate * t.kwh) : fixedCharges[t.id] ?? 0
)
const tariffTotalCost = tariffCosts.reduce((a, b) => a + b, 0)

const tariffs: TariffRow[] = tariffInputs.map((t, i) => ({
  ...t,
  cost: tariffCosts[i],
  share: Math.round((tariffCosts[i] / tariffTotalCost) * 1000) / 10,
}))

const tariffTotal = {
  kwh: tariffInputs.reduce((a, t) => a + (t.kwh ?? 0), 0),
  cost: tariffTotalCost,
}

/* ---------------------------------- KPIs ---------------------------------- */

const latest = breakdown[breakdown.length - 1]
const previous = breakdown[breakdown.length - 2]
const latestCost = Math.round(monthTotal(latest) * 100_000) // lakhs -> PKR
const costChange = round1(((monthTotal(latest) - monthTotal(previous)) / monthTotal(previous)) * 100)

/** Total cost / total kWh across the tariff bands, PKR per kWh. */
const blendedRate = round2(tariffTotal.cost / tariffTotal.kwh)

const savingsTarget = 440_000
const monthlySavings = 385_420
const shortfall = round1(100 - (monthlySavings / savingsTarget) * 100) // 12.4

const kpis: Kpi[] = [
  {
    id: "cost",
    label: "Total Energy Cost",
    value: latestCost.toLocaleString("en-US"),
    unit: "PKR",
    note: `${costChange > 0 ? "+" : ""}${costChange}% vs ${previous.month}`,
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

// One entry per billing period: rate, then kWh per meter (A, B, C).
// Taxes come from the Figma where it lists them, else 9.5% of the base.
const periods: {
  period: string
  rate: number
  kwh: [number, number, number]
  taxes?: (number | undefined)[]
  status?: [InvoiceStatus, InvoiceStatus, InvoiceStatus]
}[] = [
  { period: "Jan 1 - Jan 31, 2026", rate: 18.45, kwh: [133_420, 88_450, 195_600], taxes: [234_120, 155_100, 342_110] },
  { period: "Dec 1 - Dec 31, 2025", rate: 18.2, kwh: [125_600, 82_400, 180_500], taxes: [220_110, 142_100, 312_000], status: ["paid", "paid", "overdue"] },
  { period: "Nov 1 - Nov 30, 2025", rate: 18.2, kwh: [110_400, 78_500, 172_300], taxes: [190_800, 135_700, undefined], status: ["paid", "pending", "paid"] },
  { period: "Oct 1 - Oct 31, 2025", rate: 17.95, kwh: [118_200, 74_100, 168_900] },
  { period: "Sep 1 - Sep 30, 2025", rate: 17.95, kwh: [121_500, 80_300, 175_400] },
  { period: "Aug 1 - Aug 31, 2025", rate: 17.6, kwh: [129_800, 86_900, 181_200] },
  { period: "Jul 1 - Jul 31, 2025", rate: 17.6, kwh: [131_200, 89_400, 183_600] },
  { period: "Jun 1 - Jun 30, 2025", rate: 17.3, kwh: [124_700, 83_100, 176_800] },
]

const invoices: Invoice[] = periods.flatMap((p, pi) =>
  meters.map((m, mi) => {
    const kwh = p.kwh[mi]
    const base = Math.round(kwh * p.rate)
    const taxes = p.taxes?.[mi] ?? Math.round(base * 0.095)
    return {
      id: `${pi}-${m.meterId}`,
      period: p.period,
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
)

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
