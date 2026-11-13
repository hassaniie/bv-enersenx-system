"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  formatLabels,
  type Frequency,
  type ReportFormat,
  type ReportTemplate,
  type ReportType,
} from "@/lib/reports-data"

export const rangeOptions = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
]

export const formatOptions = (Object.keys(formatLabels) as ReportFormat[]).map((f) => ({
  value: f,
  label: formatLabels[f],
}))

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

export type GenerateRequest = { template: ReportType; name: string; range: string; format: ReportFormat }
export type ScheduleRequest = { template: ReportType; name: string; frequency: Frequency }

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  items,
}: {
  id: string
  label: string
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string }[]
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(v) => v && onChange(v as T)}>
        <SelectTrigger id={id} className="w-full">
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
    </Field>
  )
}

const defaultName = (templates: ReportTemplate[], t: ReportType, suffix: string) =>
  `${templates.find((x) => x.id === t)?.title ?? "Report"} – ${suffix}`

export function GenerateReportDialog({
  open,
  onOpenChange,
  templates,
  initialTemplate,
  initialRange,
  initialFormat,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: ReportTemplate[]
  initialTemplate: ReportType
  initialRange: string
  initialFormat: ReportFormat
  onSubmit: (req: GenerateRequest) => void
}) {
  const [template, setTemplate] = React.useState(initialTemplate)
  const [name, setName] = React.useState("")
  const [range, setRange] = React.useState(initialRange)
  const [format, setFormat] = React.useState(initialFormat)

  // Re-seed the form every time it opens, from whatever card or toolbar opened it.
  React.useEffect(() => {
    if (!open) return
    setTemplate(initialTemplate)
    setName(defaultName(templates, initialTemplate, "Aug 2025"))
    setRange(initialRange)
    setFormat(initialFormat)
  }, [open, initialTemplate, initialRange, initialFormat, templates])

  const templateItems = templates.map((t) => ({ value: t.id, label: t.title }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit({ template, name: name.trim() || defaultName(templates, template, "Aug 2025"), range, format })
          }}
        >
          <DialogHeader>
            <DialogTitle>Generate report</DialogTitle>
            <DialogDescription>It appears in Generated Reports when ready.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <SelectField
              id="gen-template"
              label="Template"
              value={template}
              items={templateItems}
              onChange={(t) => {
                setTemplate(t)
                setName(defaultName(templates, t, "Aug 2025"))
              }}
            />
            <Field>
              <FieldLabel htmlFor="gen-name">Report name</FieldLabel>
              <Input id="gen-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <SelectField id="gen-range" label="Range" value={range} items={rangeOptions} onChange={setRange} />
              <SelectField id="gen-format" label="Format" value={format} items={formatOptions} onChange={setFormat} />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Generate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ScheduleReportDialog({
  open,
  onOpenChange,
  templates,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: ReportTemplate[]
  onSubmit: (req: ScheduleRequest) => void
}) {
  const [template, setTemplate] = React.useState<ReportType>("energy")
  const [frequency, setFrequency] = React.useState<Frequency>("weekly")
  const [name, setName] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setTemplate("energy")
    setFrequency("weekly")
    setName("")
  }, [open])

  const templateItems = templates.map((t) => ({ value: t.id, label: t.title }))
  const fallback = `${frequencyOptions.find((f) => f.value === frequency)?.label} ${templates.find((t) => t.id === template)?.title ?? "Report"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit({ template, frequency, name: name.trim() || fallback })
          }}
        >
          <DialogHeader>
            <DialogTitle>Schedule report</DialogTitle>
            <DialogDescription>Runs automatically and emails the recipients.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <SelectField id="sch-template" label="Template" value={template} items={templateItems} onChange={setTemplate} />
            <SelectField id="sch-frequency" label="Frequency" value={frequency} items={frequencyOptions} onChange={setFrequency} />
            <Field>
              <FieldLabel htmlFor="sch-name">Name</FieldLabel>
              <Input id="sch-name" placeholder={fallback} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteReportDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={name !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete report?</AlertDialogTitle>
          <AlertDialogDescription>
            “{name}” will be removed for everyone. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
