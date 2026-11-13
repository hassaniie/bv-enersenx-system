"use client"

import * as React from "react"
import { CalendarPlusIcon, LayoutGridIcon, ListIcon, PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { createFilterQuery, createFilterRule } from "@/components/reui/filters/filters-query"
import type { FilterQuery } from "@/components/reui/filters/filters-types"
import { AppShell } from "@/components/dashboard/app-shell"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { matchesQuery } from "@/lib/filter-predicate"
import {
  daysAgo,
  fetchReports,
  formatLabels,
  nextRun,
  lastGenerated,
  people,
  referenceDate,
  reportsData,
  type DemoState,
  type GeneratedReport,
  type ReportFormat,
  type ReportType,
  type Schedule,
} from "@/lib/reports-data"
import { useDemoQuery } from "@/lib/use-demo-query"

import {
  DeleteReportDialog,
  formatOptions,
  GenerateReportDialog,
  rangeOptions,
  ScheduleReportDialog,
  type GenerateRequest,
  type ScheduleRequest,
} from "./report-dialogs"
import { ReportTemplates } from "./report-templates"
import { ReportsTable } from "./reports-table"
import { SchedulesPanel } from "./schedules-panel"


function ToolbarSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  items: { value: string; label: string }[]
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger size="sm" aria-label={label}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function Reports({ demo }: { demo: DemoState }) {
  const { status, data, error, retry } = useDemoQuery(fetchReports, demo, reportsData)

  // Local copies so generate, delete and toggle work without a backend.
  const [reports, setReports] = React.useState<GeneratedReport[]>(data.reports)
  const [schedules, setSchedules] = React.useState<Schedule[]>(data.schedules)
  React.useEffect(() => {
    setReports(data.reports)
    setSchedules(data.schedules)
  }, [data])

  const [search, setSearch] = React.useState("")
  const [range, setRange] = React.useState("30")
  const [format, setFormat] = React.useState<ReportFormat>("pdf")
  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [query, setQuery] = React.useState<FilterQuery>(() => createFilterQuery())

  const [generateFor, setGenerateFor] = React.useState<ReportType | null>(null)
  const [scheduleOpen, setScheduleOpen] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<GeneratedReport | null>(null)

  const term = search.trim().toLowerCase()
  const templates = data.templates.filter(
    (t) => !term || t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)
  )
  const visibleReports = reports.filter(
    (r) =>
      (range === "all" || daysAgo(r.date) <= Number(range)) &&
      (!term || r.name.toLowerCase().includes(term)) &&
      matchesQuery(r, query)
  )

  const clearAll = () => {
    setSearch("")
    setRange("all")
    setQuery(createFilterQuery())
  }

  const generated = React.useRef(0)
  const generate = (req: GenerateRequest) => {
    generated.current += 1
    const id = `generated-${generated.current}`
    setReports((list) => [
      { id, name: req.name, type: req.template, date: referenceDate, by: people.hm, sizeMb: 0, status: "processing" },
      ...list,
    ])
    setGenerateFor(null)
    toast.success("Report queued", { description: `${formatLabels[req.format]}, ${req.name}` })
    // Demo only: pretend the reporting service finishes after a moment.
    window.setTimeout(() => {
      setReports((list) => list.map((r) => (r.id === id ? { ...r, status: "completed", sizeMb: 3.4 } : r)))
    }, 2500)
  }

  const addSchedule = (req: ScheduleRequest) => {
    setSchedules((list) => [
      ...list,
      { id: `s${list.length + 1}-${req.template}`, name: req.name, frequency: req.frequency, next: nextRun(req.frequency), enabled: true, recipients: [people.hm] },
    ])
    setScheduleOpen(false)
    toast.success("Schedule added", { description: req.name })
  }

  const rowActions = React.useMemo(
    () => ({
      onDownload: (r: GeneratedReport) =>
        toast.info("Download needs the reporting service", { description: `${r.name} is a sample report.` }),
      onShare: (r: GeneratedReport) => {
        const url = `${window.location.origin}${window.location.pathname}#${r.id}`
        navigator.clipboard?.writeText(url).then(
          () => toast.success("Link copied", { description: r.name }),
          () => toast.error("Couldn’t copy the link")
        )
      },
      onDelete: (r: GeneratedReport) => setToDelete(r),
    }),
    []
  )

  return (
    <AppShell title="Reports">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setGenerateFor("energy")}>
          <PlusIcon data-icon="inline-start" />
          Generate report
        </Button>
        <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
          <CalendarPlusIcon data-icon="inline-start" />
          Schedule
        </Button>
        <ToolbarSelect label="Range" value={range} onChange={setRange} items={rangeOptions} />
        <ToolbarSelect label="Format" value={format} onChange={(v) => setFormat(v as ReportFormat)} items={formatOptions} />
        <div className="flex min-w-0 basis-full items-center justify-end gap-2 @3xl:basis-auto @3xl:flex-1">
          <InputGroup className="min-w-0 flex-1 @3xl:max-w-64">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search templates and reports"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <ToggleGroup
            variant="outline"
            size="sm"
            aria-label="Template view"
            value={[view]}
            onValueChange={(v) => v[0] && setView(v[0] as "grid" | "list")}
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGridIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <ListIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <ReportTemplates
        status={status}
        templates={templates}
        lastGenerated={(t) => lastGenerated(reports, t)}
        view={view}
        error={error}
        onRetry={retry}
        onClearSearch={() => setSearch("")}
        actions={{
          onGenerate: setGenerateFor,
          onSchedule: () => setScheduleOpen(true),
          onShowReports: (t) => {
            setRange("all")
            setQuery(createFilterQuery([createFilterRule({ id: `type-${t}`, path: ["type"], operator: "is_any_of", value: [t] })]))
            document.getElementById("generated-reports")?.scrollIntoView({ block: "start" })
          },
        }}
      />

      <div id="generated-reports" className="grid scroll-mt-16 grid-cols-1 gap-2 @7xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ReportsTable
          status={status}
          reports={visibleReports}
          totalReports={reports.length}
          query={query}
          onQueryChange={setQuery}
          error={error}
          onRetry={retry}
          onClear={clearAll}
          onGenerate={() => setGenerateFor("energy")}
          actions={rowActions}
        />
        <SchedulesPanel
          status={status}
          schedules={schedules}
          error={error}
          onRetry={retry}
          onAdd={() => setScheduleOpen(true)}
          onToggle={(id, enabled) => {
            setSchedules((list) => list.map((s) => (s.id === id ? { ...s, enabled } : s)))
            const name = schedules.find((s) => s.id === id)?.name
            toast.success(enabled ? "Schedule resumed" : "Schedule paused", { description: name })
          }}
        />
      </div>

      <GenerateReportDialog
        open={generateFor !== null}
        onOpenChange={(open) => !open && setGenerateFor(null)}
        templates={data.templates}
        initialTemplate={generateFor ?? "energy"}
        initialRange={range === "all" ? "30" : range}
        initialFormat={format}
        onSubmit={generate}
      />
      <ScheduleReportDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        templates={data.templates}
        onSubmit={addSchedule}
      />
      <DeleteReportDialog
        name={toDelete?.name ?? null}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          setReports((list) => list.filter((r) => r.id !== toDelete.id))
          toast.success("Report deleted", { description: toDelete.name })
          setToDelete(null)
        }}
      />
    </AppShell>
  )
}
