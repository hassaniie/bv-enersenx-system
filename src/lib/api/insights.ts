// Screen data for an organisation that brings its own bills: the same shapes
// the sample screens use (CostSavingsData, Kpi), derived from confirmed bills.
// "Enough history" rules live here so every screen agrees on them.

import { completeMonth, formatMonthTick } from "@/lib/app-date"
import type { Kpi } from "@/lib/dashboard-data"
import type { Insight } from "@/lib/analytics-data"
import type { CostSavingsData, Invoice, SavingsOpportunity, TariffRow } from "@/lib/cost-savings-data"

import { formatBillMonth } from "@/lib/format"

import { latency } from "./client"
import { listBillsNow } from "./bills"
import { read } from "./store"
import { recalculate, recoverable } from "./tariff"
import type { Bill, BillLineKey } from "./types"

/** Bills needed before a trend chart is drawn. */
export const TREND_MIN_BILLS = 3
/** Grid emission factor, tCO₂ per MWh (sample value for Pakistan's grid mix). */
export const GRID_TCO2_PER_MWH = 0.42

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
const line = (b: Bill, k: BillLineKey) => b.lines.find((l) => l.key === k)?.amount ?? 0
const units = (b: Bill) => b.peakKwh + b.offPeakKwh
const taxes = (b: Bill) => line(b, "gst") + line(b, "furtherTax") + line(b, "electricityDuty")

/** Bill components for the cost breakdown chart, PKR lakhs. */
export const billBreakdownSeries = [
  { key: "energy", label: "Energy" },
  { key: "fixed", label: "Fixed charges" },
  { key: "adjustments", label: "FPA and penalties" },
  { key: "taxes", label: "Taxes" },
] as const

export type BillBreakdownPoint = { month: string; energy: number; fixed: number; adjustments: number; taxes: number }

export type SiteCost = CostSavingsData & {
  billCount: number
  billBreakdown: BillBreakdownPoint[]
  budget?: number
  /** Latest bill month, yyyy-mm. */
  latestMonth?: string
}

const lakhs = (n: number) => round2(n / 100_000)

/** Cost & Savings for one site, built from its confirmed bills. */
export async function getSiteCost(siteId: string): Promise<SiteCost> {
  await latency(400)
  const db = read()
  const site = db.sites.find((s) => s.id === siteId)
  const bills = listBillsNow(siteId) // newest first
  const budget = db.budgets.find((b) => b.siteId === siteId)?.monthlyPkr
  const latest = bills[0]
  const previous = bills[1]
  const chrono = [...bills].reverse()

  const billBreakdown: BillBreakdownPoint[] = chrono.map((b) => ({
    month: formatMonthTick(`${b.month}-01`),
    energy: lakhs(line(b, "peakEnergy") + line(b, "offPeakEnergy")),
    fixed: lakhs(line(b, "fixed")),
    adjustments: lakhs(line(b, "fpa") + line(b, "pfPenalty")),
    taxes: lakhs(taxes(b)),
  }))

  const tariffs: TariffRow[] = latest
    ? latest.lines
        .filter((l) => l.amount > 0)
        .map((l) => {
          const energy = l.key === "peakEnergy" || l.key === "offPeakEnergy"
          const kwh = l.key === "peakEnergy" ? latest.peakKwh : l.key === "offPeakEnergy" ? latest.offPeakKwh : null
          return {
            id: l.key,
            period: l.key === "peakEnergy" ? "Peak (5 PM – 9 PM)" : l.key === "offPeakEnergy" ? "Off-peak (rest of day)" : l.label,
            type: l.key === "peakEnergy" ? "peak" : l.key === "offPeakEnergy" ? "off-peak" : "fixed",
            rate: energy && kwh ? round2(l.amount / kwh) : null,
            kwh,
            cost: l.amount,
            share: round1((l.amount / latest.amountPayable) * 100),
          } satisfies TariffRow
        })
    : []
  const tariffTotal = latest ? { kwh: units(latest), cost: latest.amountPayable } : { kwh: 0, cost: 0 }
  const blendedRate = latest ? round2(latest.amountPayable / units(latest)) : 0

  // Recoverable money per finding type, summed over every bill, as yearly savings.
  const byTitle = new Map<string, { o: SavingsOpportunity; months: number }>()
  for (const b of bills) {
    for (const f of recalculate(b).findings) {
      const effort = f.kind === "billing_error" ? "easy" : f.kind === "avoidable" ? "medium" : "medium"
      const cur = byTitle.get(f.title)
      if (cur) {
        cur.o.annualSavings += f.impactPkr
        cur.months += 1
      } else byTitle.set(f.title, { o: { id: f.id.split("-").pop()!, title: f.title, annualSavings: f.impactPkr, effort }, months: 1 })
    }
  }
  // Average per month × 12, so 1 bill and 12 bills report on the same yearly scale.
  const opportunities = [...byTitle.values()].map(({ o, months }) => ({ ...o, annualSavings: Math.round((o.annualSavings / months) * 12) }))

  const invoices: Invoice[] = bills.map((b, i) => {
    const t = taxes(b)
    return {
      id: b.id,
      period: formatBillMonth(b.month),
      periodStart: `${b.month}-01`,
      meterId: b.referenceNo,
      location: site?.name ?? "",
      kwh: units(b),
      rate: round2((line(b, "peakEnergy") + line(b, "offPeakEnergy")) / units(b)),
      base: b.amountPayable - t,
      taxes: t,
      total: b.amountPayable,
      status: i === 0 ? "pending" : "paid",
    }
  })

  const found = bills.reduce((s, b) => s + recoverable(recalculate(b).findings), 0)
  const change = latest && previous ? round1(((latest.amountPayable - previous.amountPayable) / previous.amountPayable) * 100) : null
  const kpis: Kpi[] = latest
    ? [
        {
          id: "cost",
          label: "Latest bill",
          value: latest.amountPayable.toLocaleString("en-US"),
          unit: "PKR",
          note: change === null ? "First bill on record" : `${change > 0 ? "+" : ""}${change}% vs ${formatMonthTick(`${previous!.month}-01`).slice(0, 3)}`,
          tone: "neutral",
        },
        { id: "rate", label: "Cost per kWh", value: blendedRate.toFixed(2), unit: "PKR", note: "All-in, taxes included", tone: "neutral" },
        {
          id: "savings",
          label: "Found on your bills",
          value: found.toLocaleString("en-US"),
          unit: "PKR",
          note: `Across ${bills.length} bill${bills.length === 1 ? "" : "s"}`,
          tone: found ? "destructive" : "success",
        },
        budget
          ? {
              id: "budget",
              label: "Budget used",
              value: `${round1((latest.amountPayable / budget) * 100)}%`,
              unit: "",
              note: "",
              tone: latest.amountPayable > budget ? "destructive" : "neutral",
              progress: Math.min(100, round1((latest.amountPayable / budget) * 100)),
            }
          : { id: "budget", label: "Budget used", value: "None set", unit: "", note: "Set a budget to track it", tone: "neutral" },
      ]
    : []

  return {
    kpis,
    breakdown: [],
    // Budget vs actual (the sample's prior-year comparison needs 2 years of bills).
    comparison: budget ? chrono.map((b) => ({ month: formatMonthTick(`${b.month}-01`), prev: round2(budget / 1_000_000), current: round2(b.amountPayable / 1_000_000) })) : [],
    tariffs,
    tariffTotal,
    blendedRate,
    opportunities,
    invoices,
    billCount: bills.length,
    billBreakdown,
    budget,
    latestMonth: latest?.month,
  }
}

export type BillAnalytics = {
  billCount: number
  kpis: Kpi[]
  /** Monthly kWh and peak share, oldest first. */
  monthly: { month: string; kwh: number; peakShare: number; perSqft?: number }[]
  insights: Insight[]
}

/** Analytics a bills-only site can have; live-meter analytics wait for Phase 2. */
export async function getBillAnalytics(siteId: string): Promise<BillAnalytics> {
  await latency(400)
  const site = read().sites.find((s) => s.id === siteId)
  const bills = listBillsNow(siteId)
  const chrono = [...bills].reverse()
  const latest = bills[0]
  const totalKwh = bills.reduce((s, b) => s + units(b), 0)
  const peakShare = latest ? round1((latest.peakKwh / units(latest)) * 100) : 0
  const mdiUse = latest && site ? Math.round((latest.mdiKw / site.sanctionedKw) * 100) : 0
  const kpis: Kpi[] = latest
    ? [
        {
          id: "efficiency",
          label: "Energy intensity",
          value: site?.areaSqft ? round2(units(latest) / site.areaSqft).toFixed(2) : "–",
          unit: site?.areaSqft ? "kWh / sq ft" : "",
          note: site?.areaSqft ? `${formatMonthTick(`${latest.month}-01`)}, ${site.areaSqft.toLocaleString("en-US")} sq ft` : "Add the site’s area in Settings",
          tone: "neutral",
        },
        { id: "peak", label: "Peak demand (MDI)", value: latest.mdiKw.toLocaleString("en-US"), unit: "kW", note: `${mdiUse}% of ${site?.sanctionedKw.toLocaleString("en-US")} kW sanctioned`, tone: mdiUse < 60 ? "warning" : "neutral", },
        {
          id: "carbon",
          label: "Carbon footprint",
          value: round1((totalKwh / 1000) * GRID_TCO2_PER_MWH).toLocaleString("en-US"),
          unit: "tCO₂",
          note: `${bills.length} month${bills.length === 1 ? "" : "s"} of grid electricity`,
          tone: "neutral",
        },
        { id: "anomalies", label: "Peak-hour share", value: String(peakShare), unit: "%", note: peakShare > 20 ? "Above the 20% we suggest" : "Within the 20% we suggest", tone: peakShare > 20 ? "warning" : "success" },
      ]
    : []
  const insights: Insight[] = latest
    ? recalculate(latest).findings.map((f) => ({
        id: f.id,
        tone: f.kind === "billing_error" ? "destructive" : f.kind === "avoidable" ? "warning" : "info",
        icon: f.kind === "billing_error" ? "flag" : f.kind === "avoidable" ? "up" : "trend",
        title: f.title,
        detail: f.nextStep,
      }))
    : []
  if (bills.length >= TREND_MIN_BILLS) {
    const first = chrono[0]
    const change = round1(((units(latest!) - units(first)) / units(first)) * 100)
    insights.push({
      id: "trend",
      tone: change > 5 ? "warning" : "success",
      icon: change > 0 ? "up" : "check",
      title: `Units ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% since ${formatMonthTick(`${first.month}-01`)}`,
      detail: change > 5 ? "Check whether production grew or equipment is running longer." : "Consumption is steady across the months on record.",
    })
  }
  return {
    billCount: bills.length,
    insights,
    kpis,
    monthly: chrono.map((b) => ({
      month: formatMonthTick(`${b.month}-01`),
      kwh: units(b),
      peakShare: round1((b.peakKwh / units(b)) * 100),
      perSqft: site?.areaSqft ? round2(units(b) / site.areaSqft) : undefined,
    })),
  }
}

/** Latest complete month, for copy like "January 2026". */
export const latestCompleteMonth = () => completeMonth(0).start.slice(0, 7)
