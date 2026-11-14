// Reports for organisations created here: templates (with what each needs),
// generated reports and schedules, saved in the demo store.

import { TODAY } from "@/lib/app-date"
import { nextRun, templates, type Frequency, type GeneratedReport, type ReportsData, type ReportType, type Schedule } from "@/lib/reports-data"

import { getMe } from "./auth"
import { listBillsNow } from "./bills"
import { latency } from "./client"
import { newId, read, write } from "./store"

/** Templates with the reason each one can't run yet, if any. */
function templatesFor(billCount: number) {
  return templates.map((t) => ({
    ...t,
    unavailable:
      t.id === "equipment"
        ? "Needs live meters (later phase)."
        : billCount === 0
          ? "Upload a bill first."
          : undefined,
  }))
}

export async function getReports(siteId: string): Promise<ReportsData> {
  await latency(400)
  const db = read()
  const orgId = db.session?.orgId
  return {
    templates: templatesFor(listBillsNow(siteId).length),
    reports: (db.reports ?? []).filter((r) => r.orgId === orgId).sort((a, b) => b.date.localeCompare(a.date)),
    schedules: (db.schedules ?? []).filter((s) => s.orgId === orgId),
  }
}

export async function generateReport(input: { name: string; type: ReportType }): Promise<GeneratedReport> {
  await latency(300)
  const me = getMe()
  const orgId = read().session?.orgId ?? ""
  const report: GeneratedReport & { orgId: string } = {
    id: newId("r"),
    orgId,
    name: input.name,
    type: input.type,
    date: TODAY,
    by: { initials: me?.user.initials ?? "", name: me?.user.name ?? "" },
    sizeMb: 0,
    status: "processing",
  }
  write((d) => ({ ...d, reports: [report, ...(d.reports ?? [])] }))
  // Demo only: the report "finishes" a moment later.
  window.setTimeout(() => {
    write((d) => ({ ...d, reports: (d.reports ?? []).map((r) => (r.id === report.id ? { ...r, status: "completed", sizeMb: 1.2 } : r)) }))
  }, 2_500)
  return report
}

export async function deleteReport(id: string) {
  await latency(250)
  write((d) => ({ ...d, reports: (d.reports ?? []).filter((r) => r.id !== id) }))
}

export async function addSchedule(input: { name: string; frequency: Frequency }): Promise<Schedule> {
  await latency(300)
  const me = getMe()
  const schedule: Schedule & { orgId: string } = {
    id: newId("sch"),
    orgId: read().session?.orgId ?? "",
    name: input.name,
    frequency: input.frequency,
    next: nextRun(input.frequency),
    enabled: true,
    recipients: [{ initials: me?.user.initials ?? "", name: me?.user.name ?? "" }],
  }
  write((d) => ({ ...d, schedules: [...(d.schedules ?? []), schedule] }))
  return schedule
}

export async function setScheduleEnabled(id: string, enabled: boolean) {
  await latency(200)
  write((d) => ({ ...d, schedules: (d.schedules ?? []).map((s) => (s.id === id ? { ...s, enabled } : s)) }))
}
