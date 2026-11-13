// Sample data taken from the Figma "Analytics" frame. Replace `fetchAnalytics`
// with your real API call; every panel already handles loading, empty and error.
//
// Derived figures are computed here, not typed in: the Anomalies KPI comes from
// the triage list, the regression line and R² from the scatter points, and the
// 7- and 30-day averages from the daily series. Generated series use a fixed
// formula (no randomness), so every render and every build shows the same data.

import type { DemoState, Kpi } from "@/lib/dashboard-data"

export type { DemoState }

export type ForecastPoint = { day: string; predicted: number; actual: number }
export type InsightTone = "warning" | "destructive" | "info" | "success"
export type Insight = { id: string; tone: InsightTone; icon: "up" | "flag" | "trend" | "sun" | "check"; title: string; detail: string }
export type HeatLevel = 0 | 1 | 2
export type HeatCell = { day: string; hour: number; kw: number; level: HeatLevel }
export type Severity = "critical" | "warning"
export type AnomalyStatus = "new" | "investigating" | "resolved"
export type Anomaly = { id: string; location: string; when: string; kind: string; deviation: number; severity: Severity; status: AnomalyStatus }
export type Building = "block-a" | "block-b" | "production"
export type TempPoint = { building: Building; temp: number; kwh: number }
export type TrendPoint = { date: string; raw: number; ma7: number | null; ma30: number | null }

export type AnalyticsData = {
  kpis: Kpi[]
  forecast: ForecastPoint[]
  insights: Insight[]
  heatmap: HeatCell[]
  anomalies: Anomaly[]
  temperature: TempPoint[]
  trend: TrendPoint[]
}

/* ------------------------------- Forecast -------------------------------- */

// Read off the Figma chart, every 2 days from Aug 1 to Aug 23.
const predicted = [16, 24, 28, 35, 46, 53, 59, 63, 70, 82, 93, 97]
const actual = [9, 18, 24, 29, 31, 37, 43, 51, 56, 60, 69, 75]
const forecast: ForecastPoint[] = predicted.map((p, i) => ({ day: `Aug ${1 + i * 2}`, predicted: p, actual: actual[i] }))

/* ------------------------------- Insights -------------------------------- */

const insights: Insight[] = [
  { id: "peak", tone: "warning", icon: "up", title: "Peak demand shifted earlier", detail: "Peak load moved earlier by 45 mins; align the battery strategy." },
  { id: "hvac", tone: "destructive", icon: "flag", title: "HVAC efficiency alert", detail: "Zone C HVAC efficiency dropped 12% — filter replacement required." },
  { id: "weekend", tone: "info", icon: "trend", title: "Excess weekend base load", detail: "Weekend static consumption 15% higher than historical benchmark." },
  { id: "solar", tone: "info", icon: "sun", title: "Solar generation spike", detail: "Output exceeded the daily forecast by 8.5% due to clear skies." },
  { id: "savings", tone: "success", icon: "check", title: "Potential cost savings", detail: "PKR 125,000 projected savings if peak load shifting is implemented." },
]

/* -------------------------------- Heatmap -------------------------------- */

// Intensity per 2-hour slot (0 low, 1 medium, 2 high), read off the Figma grid.
export const heatDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const heatLevels: HeatLevel[][] = [
  [0, 0, 1, 1, 0, 2, 2, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 2, 1, 1, 2, 0, 1, 0, 0],
  [0, 1, 0, 2, 2, 1, 1, 2, 0, 1, 0, 0],
  [0, 0, 1, 2, 1, 1, 1, 2, 1, 1, 0, 0],
  [1, 1, 0, 2, 2, 1, 2, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
]
const levelKw = [880, 1_180, 1_480]
const heatmap: HeatCell[] = heatLevels.flatMap((row, d) =>
  row.map((level, slot) => ({
    day: heatDays[d],
    hour: slot * 2,
    level,
    // A small fixed spread inside each band so neighbouring cells differ.
    kw: levelKw[level] + ((d * 12 + slot) % 5) * 20,
  }))
)

/* ------------------------------- Anomalies ------------------------------- */

const anomalies: Anomaly[] = [
  { id: "a1", location: "Zone B Server Room", when: "10:15 AM", kind: "Voltage spike", deviation: 28, severity: "critical", status: "new" },
  { id: "a2", location: "Block A Chiller", when: "Yesterday", kind: "Over-current", deviation: 15, severity: "warning", status: "investigating" },
  { id: "a3", location: "Main Supply Line", when: "2 days ago", kind: "Phase unbalance", deviation: 6, severity: "warning", status: "resolved" },
]

/* ------------------------- Energy vs temperature ------------------------- */

export const buildings: { value: Building; label: string }[] = [
  { value: "block-a", label: "Block A" },
  { value: "block-b", label: "Block B" },
  { value: "production", label: "Production" },
]
const intercept: Record<Building, number> = { "block-a": 120, "block-b": 105, production: 135 }

const temperature: TempPoint[] = buildings.flatMap(({ value }, b) =>
  Array.from({ length: 14 }, (_, i) => {
    const temp = 18 + i * 1.6 + (b % 2) * 0.8
    const wobble = Math.sin(i * 1.7 + b * 2.3) * 20
    return { building: value, temp: Math.round(temp * 10) / 10, kwh: Math.round(intercept[value] + 8.2 * temp + wobble) }
  })
)

/** Least-squares line and R² for a set of points. */
export function regression(points: TempPoint[]) {
  const n = points.length
  if (n < 2) return null
  const mx = points.reduce((s, p) => s + p.temp, 0) / n
  const my = points.reduce((s, p) => s + p.kwh, 0) / n
  const sxx = points.reduce((s, p) => s + (p.temp - mx) ** 2, 0)
  const sxy = points.reduce((s, p) => s + (p.temp - mx) * (p.kwh - my), 0)
  const slope = sxy / sxx
  const offset = my - slope * mx
  const ssTot = points.reduce((s, p) => s + (p.kwh - my) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.kwh - (offset + slope * p.temp)) ** 2, 0)
  return { slope, offset, r2: 1 - ssRes / ssTot }
}

/* ------------------------------ 90-day trend ----------------------------- */

const trendEnd = Date.UTC(2025, 7, 23) // Aug 23, 2025: the forecast's last day
const day = 86_400_000
const rawDaily = Array.from({ length: 90 }, (_, i) => {
  const weekday = new Date(trendEnd - (89 - i) * day).getUTCDay()
  const weekend = weekday === 0 || weekday === 6 ? -22 : 0
  return Math.round(165 + 25 * Math.sin((i / 90) * Math.PI * 1.6) + weekend + Math.sin(i * 2.9) * 9)
})
const movingAverage = (i: number, window: number) =>
  i + 1 < window ? null : Math.round((rawDaily.slice(i + 1 - window, i + 1).reduce((a, b) => a + b, 0) / window) * 10) / 10

const trend: TrendPoint[] = rawDaily.map((raw, i) => ({
  date: new Date(trendEnd - (89 - i) * day).toISOString().slice(0, 10),
  raw,
  ma7: movingAverage(i, 7),
  ma30: movingAverage(i, 30),
}))

/* --------------------------------- KPIs ---------------------------------- */

const active = anomalies.filter((a) => a.status !== "resolved")
const count = (s: Severity) => active.filter((a) => a.severity === s).length

const kpis: Kpi[] = [
  { id: "efficiency", label: "Energy Efficiency Index", value: "0.89", unit: "avg", note: "Target reached", tone: "success" },
  { id: "peak", label: "Peak Demand", value: "1,245", unit: "kW", note: "Today at 14:30", tone: "neutral" },
  { id: "carbon", label: "Carbon Footprint", value: "42.8", unit: "t CO₂", note: "-8.3% vs last month", tone: "success" },
  {
    id: "anomalies",
    label: "Anomalies Detected",
    value: `${active.length} active`,
    unit: "",
    note: `${count("critical")} critical · ${count("warning")} warning`,
    tone: count("critical") > 0 ? "destructive" : "neutral",
  },
]

/* --------------------------------- Fetch --------------------------------- */

export const analyticsData: AnalyticsData = { kpis, forecast, insights, heatmap, anomalies, temperature, trend }
export const emptyAnalyticsData: AnalyticsData = {
  kpis: [],
  forecast: [],
  insights: [],
  heatmap: [],
  anomalies: [],
  temperature: [],
  trend: [],
}

export async function fetchAnalytics(state: DemoState): Promise<AnalyticsData> {
  await new Promise((r) => setTimeout(r, 600))
  if (state === "error") throw new Error("The analytics engine did not respond.")
  if (state === "loading") return new Promise(() => {})
  return state === "empty" ? emptyAnalyticsData : analyticsData
}
