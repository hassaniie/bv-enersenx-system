// Sample data taken from the Figma "Dashboard" frame. Replace `fetchDashboard`
// with your real API call; every panel already handles loading, empty and error.
// Chart months come from the shared TODAY (src/lib/app-date.ts): they end at the
// latest complete month.

import { completeMonths, formatMonthTick } from "@/lib/app-date"

export type Kpi = {
  id: string
  label: string
  value: string
  unit: string
  /** Several parts render with a dot between. */
  note: string | string[]
  tone: "neutral" | "info" | "warning" | "destructive" | "success"
  /** 0–100: draws a progress bar in place of the note. */
  progress?: number
  /** A shorter value (unit included) for narrow screens, e.g. "63.8 lakh". */
  short?: string
}

export type LoadPoint = { time: string; yesterday: number; today: number }
export type CostPoint = { month: string; baseline: number; actual: number }
export type BreakdownSlice = { key: string; label: string; share: number }
export type Equipment = { id: string; name: string; kwh: number; share: number }
export type Utility = {
  id: string
  name: string
  amount: string
  unit: string
  cost: string
}
export type PowerQualityRow = {
  id: string
  parameter: string
  l1: number
  l2: number
  l3: number
  avg: number
}
export type MonthValue = { month: string; value: number }

export type DashboardData = {
  kpis: Kpi[]
  loadCurve: LoadPoint[]
  peakKw: number
  costComparison: CostPoint[]
  savings: {
    percent: number
    baselineCost: number
    actualCost: number
    totalSavings: number
  }
  breakdown: { totalKwh: number; zones: number; slices: BreakdownSlice[] }
  equipment: Equipment[]
  utilities: Utility[]
  powerQuality: PowerQualityRow[]
  intensity: {
    thisMonth: number
    lastMonth: number
    improvement: number
    trend: MonthValue[]
  }
  savingTrend: { total: number; trend: MonthValue[] }
}

/** Live demand and the facility's demand limit, kW. Analytics reads these too. */
export const demand = { currentKw: 2_890, limitKw: 3_900 }

const months6 = completeMonths(6).map(formatMonthTick)
const months7 = completeMonths(7).map(formatMonthTick)

export const dashboardData: DashboardData = {
  kpis: [
    { id: "power", label: "Total Power", value: "2.54", unit: "MW", note: "Live consumption", tone: "neutral" },
    { id: "energy", label: "Daily Energy", value: "58,765", unit: "kWh", note: "Today’s consumption", tone: "info" },
    { id: "cost", label: "Daily Cost", value: "1.52M", unit: "PKR", note: "Today’s total cost", tone: "warning" },
    {
      id: "demand",
      label: "Current Demand",
      value: demand.currentKw.toLocaleString("en-US"),
      unit: "kW",
      note: `From ${demand.limitKw.toLocaleString("en-US")} kW`,
      tone: "destructive",
    },
  ],
  loadCurve: [
    { time: "12 AM", yesterday: 1100, today: 1780 },
    { time: "2 AM", yesterday: 1020, today: 1660 },
    { time: "4 AM", yesterday: 1010, today: 1660 },
    { time: "6 AM", yesterday: 1060, today: 1700 },
    { time: "8 AM", yesterday: 1080, today: 1820 },
    { time: "10 AM", yesterday: 1160, today: 2010 },
    { time: "12 PM", yesterday: 1220, today: 2154 },
    { time: "2 PM", yesterday: 1200, today: 2060 },
    { time: "4 PM", yesterday: 1170, today: 2040 },
    { time: "6 PM", yesterday: 1240, today: 2070 },
    { time: "8 PM", yesterday: 1290, today: 2090 },
    { time: "10 PM", yesterday: 1280, today: 2060 },
    { time: "12 AM ", yesterday: 1260, today: 2040 },
  ],
  peakKw: 2100,
  costComparison: [
    { month: months6[0], baseline: 79, actual: 60 },
    { month: months6[1], baseline: 85, actual: 51 },
    { month: months6[2], baseline: 62, actual: 50 },
    { month: months6[3], baseline: 88, actual: 69 },
    { month: months6[4], baseline: 69, actual: 50 },
    { month: months6[5], baseline: 62, actual: 50 },
  ],
  savings: {
    percent: 16.5,
    baselineCost: 34_520_000,
    actualCost: 29_250_000,
    totalSavings: 5_365_000,
  },
  breakdown: {
    totalKwh: 58_765,
    zones: 6,
    slices: [
      { key: "hvac", label: "HVAC", share: 26 },
      { key: "production", label: "Production", share: 25.5 },
      { key: "compressors", label: "Compressors", share: 12.5 },
      { key: "boilers", label: "Boilers", share: 10 },
      { key: "lighting", label: "Lighting", share: 12 },
      { key: "others", label: "Others", share: 14 },
    ],
  },
  equipment: [
    { id: "boiler-1", name: "Boiler #1", kwh: 12_685, share: 21.6 },
    { id: "chiller", name: "Chiller plant", kwh: 11_378, share: 19.4 },
    { id: "compressor", name: "Air compressor", kwh: 8_516, share: 14.5 },
    { id: "line-1", name: "Production line 1", kwh: 7_752, share: 13.2 },
    { id: "ahu-b", name: "AHU · Block B", kwh: 6_343, share: 10.8 },
  ],
  utilities: [
    { id: "solar", name: "Solar energy", amount: "58,765", unit: "kWh", cost: "1,52,300" },
    { id: "grid", name: "Electric grid", amount: "18,765", unit: "kWh", cost: "5,62,950" },
    { id: "generators", name: "Generators", amount: "58,765", unit: "kWh", cost: "1,52,300" },
    { id: "batteries", name: "Batteries", amount: "58,765", unit: "kWh", cost: "1,52,300" },
    { id: "gas", name: "Gas", amount: "18,652", unit: "m³", cost: "1,52,300" },
  ],
  powerQuality: [
    { id: "voltage", parameter: "Voltage (V)", l1: 231, l2: 229, l3: 232, avg: 230 },
    { id: "current", parameter: "Current (A)", l1: 312, l2: 298, l3: 305, avg: 305 },
    { id: "pf", parameter: "Power factor", l1: 0.93, l2: 0.91, l3: 0.94, avg: 0.93 },
    { id: "freq", parameter: "Frequency (Hz)", l1: 50.2, l2: 50.4, l3: 50.6, avg: 50.4 },
    { id: "thd", parameter: "THD (%)", l1: 3.2, l2: 3.5, l3: 3.1, avg: 3.3 },
  ],
  intensity: {
    thisMonth: 0.245,
    lastMonth: 0.465,
    improvement: 15.2,
    trend: [
      { month: months6[0], value: 63 },
      { month: months6[1], value: 58 },
      { month: months6[2], value: 62 },
      { month: months6[3], value: 59 },
      { month: months6[4], value: 61 },
      { month: months6[5], value: 58 },
    ],
  },
  savingTrend: {
    total: 20_865_420,
    trend: [
      { month: months7[0], value: 6.2 },
      { month: months7[1], value: 9.2 },
      { month: months7[2], value: 11.2 },
      { month: months7[3], value: 13.2 },
      { month: months7[4], value: 16.5 },
      { month: months7[5], value: 19.4 },
      { month: months7[6], value: 20.9 },
    ],
  },
}

export const emptyDashboardData: DashboardData = {
  ...dashboardData,
  kpis: [],
  loadCurve: [],
  costComparison: [],
  breakdown: { totalKwh: 0, zones: 0, slices: [] },
  equipment: [],
  utilities: [],
  powerQuality: [],
  intensity: { ...dashboardData.intensity, trend: [] },
  savings: { percent: 0, baselineCost: 0, actualCost: 0, totalSavings: 0 },
  savingTrend: { total: 0, trend: [] },
}

/** Demo states: open the page with ?state=loading | empty | error to preview them. */
export type DemoState = "ready" | "loading" | "empty" | "error"

export async function fetchDashboard(state: DemoState): Promise<DashboardData> {
  await new Promise((r) => setTimeout(r, 600))
  if (state === "error") throw new Error("The energy meters did not respond.")
  if (state === "loading") return new Promise(() => {})
  return state === "empty" ? emptyDashboardData : dashboardData
}

const pkr = new Intl.NumberFormat("en-PK")
export const formatPkr = (n: number) => pkr.format(n)
export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n)
