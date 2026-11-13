// Sample data taken from the Figma "Reports" frame. Replace `fetchReports` with
// your real API call; every panel already handles loading, empty and error.
//
// A template's "Last generated" date is derived from the reports list, so the
// cards and the table cannot disagree.

import type { DemoState } from "@/lib/dashboard-data"

export type { DemoState }

export type ReportType = "energy" | "equipment" | "cost" | "sustainability" | "compliance" | "custom"
export type ReportStatus = "completed" | "processing" | "failed"
export type Frequency = "daily" | "weekly" | "monthly"
export type ReportFormat = "pdf" | "csv" | "xlsx"

export type Person = { initials: string; name: string }

export type ReportTemplate = {
  id: ReportType
  title: string
  description: string
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

/** The newest report in the sample data; date ranges count back from it. */
export const referenceDate = "2025-08-15"

const templates: ReportTemplate[] = [
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

const reports: GeneratedReport[] = [
  { id: "r1", name: "July Consolidated Summary", type: "energy", date: "2025-08-15", by: people.hm, sizeMb: 4.2, status: "completed" },
  { id: "r2", name: "Chiller Plant Performance", type: "equipment", date: "2025-08-12", by: people.sa, sizeMb: 8.5, status: "completed" },
  { id: "r3", name: "Tariff Optimization Audit", type: "cost", date: "2025-08-10", by: people.hm, sizeMb: 2.1, status: "completed" },
  { id: "r4", name: "Q2 Sustainability Output", type: "sustainability", date: "2025-08-08", by: people.ar, sizeMb: 12.4, status: "processing" },
  { id: "r5", name: "NEPRA Regulatory Compliance", type: "compliance", date: "2025-07-30", by: people.zk, sizeMb: 1.8, status: "completed" },
  { id: "r6", name: "Substation Load Profile", type: "energy", date: "2025-07-28", by: people.sa, sizeMb: 15.2, status: "failed" },
  { id: "r7", name: "Main Boiler Exhaust Emission", type: "sustainability", date: "2025-07-25", by: people.ar, sizeMb: 5.6, status: "completed" },
  { id: "r8", name: "HVAC Peak Load Analysis", type: "equipment", date: "2025-07-20", by: people.hm, sizeMb: 6.9, status: "completed" },
]

const schedules: Schedule[] = [
  { id: "s1", name: "Daily Peak Demand Alert", frequency: "daily", next: "Tomorrow, 05:00 PM", enabled: true, recipients: [people.hm, people.zk] },
  { id: "s2", name: "Weekly Consumption Log", frequency: "weekly", next: "Monday, 08:00 AM", enabled: true, recipients: [people.hm, people.sa, people.ar] },
  { id: "s3", name: "Monthly Cost Allocation", frequency: "monthly", next: "Sep 01, 12:00 AM", enabled: true, recipients: [people.hm] },
  { id: "s4", name: "Generator Fuel Efficiency", frequency: "weekly", next: "Monday, 09:00 AM", enabled: false, recipients: [people.sa, people.zk] },
  { id: "s5", name: "Quarterly Carbon Benchmark", frequency: "monthly", next: "Oct 01, 09:00 AM", enabled: true, recipients: [people.ar, people.zk, people.hm] },
]

/** Newest completed or processing report per template, or undefined if none yet. */
export function lastGenerated(list: GeneratedReport[], type: ReportType) {
  return list
    .filter((r) => r.type === type && r.status !== "failed")
    .map((r) => r.date)
    .sort()
    .at(-1)
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" })
export const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`))

/** Whole days between an ISO date and the reference date. */
export const daysAgo = (iso: string) =>
  Math.round((Date.parse(`${referenceDate}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000)

export const reportsData: ReportsData = { templates, reports, schedules }
export const emptyReportsData: ReportsData = { templates, reports: [], schedules: [] }

export async function fetchReports(state: DemoState): Promise<ReportsData> {
  await new Promise((r) => setTimeout(r, 600))
  if (state === "error") throw new Error("The reporting service did not respond.")
  if (state === "loading") return new Promise(() => {})
  return state === "empty" ? emptyReportsData : reportsData
}
