// Sample data taken from the Figma "Reports" frame. Replace `fetchReports` with
// your real API call; every panel already handles loading, empty and error.
//
// A template's "Last generated" date is derived from the reports list, so the
// cards and the table cannot disagree. Every date counts from the shared TODAY
// (src/lib/app-date.ts): reports fall before it, scheduled runs just after it.

import {
  completeMonth,
  daysBeforeToday,
  daysFromToday,
  formatDate as formatIsoDate,
  formatLongMonthYear,
  formatWeekdayDayMonth,
  TODAY,
} from "@/lib/app-date"
import type { DemoState } from "@/lib/dashboard-data"

export type { DemoState }

export type ReportType = "energy" | "equipment" | "cost" | "sustainability" | "compliance" | "custom"
export type ReportStatus = "completed" | "processing" | "failed"
export type Frequency = "daily" | "weekly" | "monthly" | "quarterly"
export type ReportFormat = "pdf" | "csv" | "xlsx"

export type Person = { initials: string; name: string }

export type ReportTemplate = {
  id: ReportType
  title: string
  description: string
  /** Why this template can't run yet (e.g. it needs live meters); undefined when it can. */
  unavailable?: string
}

export type GeneratedReport = {
  id: string
  name: string
  type: ReportType
  /** ISO date (yyyy-mm-dd). */
  date: string
  by: Person
  /** MB */
  sizeMb: number
  status: ReportStatus
}

export type Schedule = {
  id: string
  name: string
  frequency: Frequency
  next: string
  enabled: boolean
  recipients: Person[]
}

export type ReportsData = {
  templates: ReportTemplate[]
  reports: GeneratedReport[]
  schedules: Schedule[]
}

export const people = {
  hm: { initials: "HM", name: "Hassan Malik" },
  sa: { initials: "SA", name: "Saeed Ahmad" },
  ar: { initials: "AR", name: "Amna Riaz" },
  zk: { initials: "ZK", name: "Zain Khan" },
} satisfies Record<string, Person>

export const typeLabels: Record<ReportType, string> = {
  energy: "Energy",
  equipment: "Equipment",
  cost: "Cost",
  sustainability: "Sustainability",
  compliance: "Compliance",
  custom: "Custom",
}

export const formatLabels: Record<ReportFormat, string> = { pdf: "PDF", csv: "CSV", xlsx: "Excel" }

/** Date ranges and new reports count from the shared TODAY. */
export const referenceDate = TODAY

/** "Jan 2026": the latest complete month, used to name new reports. */
export const reportMonth = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
  Date.parse(`${completeMonth(0).start}T00:00:00Z`)
)

export const templates: ReportTemplate[] = [
  {
    id: "energy",
    title: "Monthly Energy Summary",
    description: "Comprehensive monthly overview of energy consumption, costs, and savings with baseline comparison.",
  },
  {
    id: "equipment",
    title: "Equipment Performance",
    description: "Detailed analysis of equipment efficiency, uptime metrics, peak loading, and proactive maintenance needs.",
  },
  {
    id: "cost",
    title: "Cost Analysis",
    description: "In-depth breakdown of energy billing, peak-load tariff tracking, power factors, and departmental budget metrics.",
  },
  {
    id: "sustainability",
    title: "Sustainability Report",
    description: "Carbon footprint tracking, renewable energy offset allocations, and green certifications audit.",
  },
  {
    id: "compliance",
    title: "Compliance Report",
    description: "Regulatory energy audit status, building certification benchmarks, and carbon reduction legal audits.",
  },
  {
    id: "custom",
    title: "Custom Report",
    description: "Build a custom ad-hoc layout with user-selected energy indicators, active periods, and visual segments.",
  },
]

// Generated on the days before TODAY (days back in `ago`).
const lastMonthName = formatLongMonthYear(completeMonth(1).start).split(" ")[0] // "December"
const quarter = Math.floor(completeMonth(0).month / 3) || 4 // the last complete quarter
const reports: GeneratedReport[] = [
  { id: "r1", name: `${lastMonthName} Consolidated Summary`, type: "energy", ago: 2, by: people.hm, sizeMb: 4.2, status: "completed" },
  { id: "r2", name: "Chiller Plant Performance", type: "equipment", ago: 5, by: people.sa, sizeMb: 8.5, status: "completed" },
  { id: "r3", name: "Tariff Optimization Audit", type: "cost", ago: 7, by: people.hm, sizeMb: 2.1, status: "completed" },
  { id: "r4", name: `Q${quarter} Sustainability Output`, type: "sustainability", ago: 9, by: people.ar, sizeMb: 12.4, status: "processing" },
  { id: "r5", name: "NEPRA Regulatory Compliance", type: "compliance", ago: 18, by: people.zk, sizeMb: 1.8, status: "completed" },
  { id: "r6", name: "Substation Load Profile", type: "energy", ago: 20, by: people.sa, sizeMb: 15.2, status: "failed" },
  { id: "r7", name: "Main Boiler Exhaust Emission", type: "sustainability", ago: 23, by: people.ar, sizeMb: 5.6, status: "completed" },
  { id: "r8", name: "HVAC Peak Load Analysis", type: "equipment", ago: 28, by: people.hm, sizeMb: 6.9, status: "completed" },
].map(({ ago, ...r }) => ({ ...r, type: r.type as ReportType, status: r.status as ReportStatus, date: daysFromToday(-ago) }))

/* ------------------------------ Next runs ------------------------------ */

const todayDow = new Date(`${TODAY}T00:00:00Z`).getUTCDay()
const at = (iso: string, time: string) => `${formatWeekdayDayMonth(iso)}, ${time}`

/** The next run strictly after TODAY for a frequency and time of day. */
export function nextRun(frequency: Frequency, time = "08:00 AM") {
  const now = new Date(`${TODAY}T00:00:00Z`)
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  switch (frequency) {
    case "daily":
      return at(daysFromToday(1), time)
    case "weekly":
      return at(daysFromToday((1 - todayDow + 7) % 7 || 7), time) // the next Monday
    case "monthly":
      return at(iso(Date.UTC(y, m + 1, 1)), time) // the 1st of next month
    case "quarterly":
      return at(iso(Date.UTC(y, (Math.floor(m / 3) + 1) * 3, 1)), time) // the next quarter's 1st
  }
}

const schedules: Schedule[] = [
  { id: "s1", name: "Daily Peak Demand Alert", frequency: "daily", next: nextRun("daily", "05:00 PM"), enabled: true, recipients: [people.hm, people.zk] },
  { id: "s2", name: "Weekly Consumption Log", frequency: "weekly", next: nextRun("weekly", "08:00 AM"), enabled: true, recipients: [people.hm, people.sa, people.ar] },
  { id: "s3", name: "Monthly Cost Allocation", frequency: "monthly", next: nextRun("monthly", "12:00 AM"), enabled: true, recipients: [people.hm] },
  { id: "s4", name: "Generator Fuel Efficiency", frequency: "weekly", next: nextRun("weekly", "09:00 AM"), enabled: false, recipients: [people.sa, people.zk] },
  { id: "s5", name: "Quarterly Carbon Benchmark", frequency: "quarterly", next: nextRun("quarterly", "09:00 AM"), enabled: true, recipients: [people.ar, people.zk, people.hm] },
]

/** Newest completed or processing report per template, or undefined if none yet. */
export function lastGenerated(list: GeneratedReport[], type: ReportType) {
  return list
    .filter((r) => r.type === type && r.status !== "failed")
    .map((r) => r.date)
    .sort()
    .at(-1)
}

export const formatDate = formatIsoDate

/** Whole days between an ISO date and TODAY. */
export const daysAgo = daysBeforeToday

export const reportsData: ReportsData = { templates, reports, schedules }
export const emptyReportsData: ReportsData = { templates, reports: [], schedules: [] }

export async function fetchReports(state: DemoState): Promise<ReportsData> {
  await new Promise((r) => setTimeout(r, 600))
  if (state === "error") throw new Error("The reporting service did not respond.")
  if (state === "loading") return new Promise(() => {})
  return state === "empty" ? emptyReportsData : reportsData
}
