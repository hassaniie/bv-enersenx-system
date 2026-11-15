"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BellIcon, BellOffIcon, CircleAlertIcon, HandCoinsIcon, InboxIcon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { AppShell } from "@/components/dashboard/app-shell"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { PanelState } from "@/components/dashboard/panel-state"
import { SelectField } from "@/components/forms/select-field"
import { FormError } from "@/components/onboarding/form-error"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { daysBeforeToday, formatDate } from "@/lib/app-date"
import {
  acknowledgeAlert,
  alertToAction,
  ESCALATE_AFTER_HOURS,
  getMe,
  isEscalated,
  listAlerts,
  loadScenario,
  resolveAlert,
  useApiQuery,
  useStoreValue,
  type Alert,
  type AlertKind,
  type AlertStatus,
  type Site,
} from "@/lib/api"
import type { Kpi } from "@/lib/dashboard-data"
import { formatInt, formatPkr } from "@/lib/format"
import { cn } from "@/lib/utils"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const statusMeta: Record<AlertStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: "Open", variant: "destructive-light" },
  acknowledged: { label: "Acknowledged", variant: "warning-light" },
  resolved: { label: "Resolved", variant: "success-light" },
}

const kindLabel: Record<AlertKind, string> = {
  bill_anomaly: "Bill anomaly",
  budget_overrun: "Budget overrun",
  missing_bill: "Missing bill",
}

const severityDot = { critical: "bg-destructive", warning: "bg-warning" } as const

const causes: Record<AlertKind, string[]> = {
  bill_anomaly: ["DISCO billing error", "Meter misread", "Higher production", "Equipment left running", "Other"],
  budget_overrun: ["Higher production", "Seasonal cooling load", "Tariff or FPA increase", "Billing error", "Other"],
  missing_bill: ["Bill not received yet", "Bill with accounts", "Uploaded elsewhere", "Other"],
}

const filters: { value: "open" | "acknowledged" | "resolved" | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
]

const kpiIcons = { open: InboxIcon, critical: CircleAlertIcon, stake: HandCoinsIcon, resolved: ShieldCheckIcon }

const age = (iso: string) => {
  const d = daysBeforeToday(iso)
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`
}

function AckDialog({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const [cause, setCause] = React.useState<string | null>(null)
  const [other, setOther] = React.useState("")
  const [tried, setTried] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    setCause(null)
    setOther("")
    setTried(false)
    setError(undefined)
  }, [alert])

  const value = cause === "Other" ? other.trim() : cause ?? ""
  const missing = tried && !value ? (cause === "Other" ? "Describe the cause." : "Choose a cause.") : undefined

  return (
    <Dialog open={!!alert} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setTried(true)
            if (!value || !alert) return
            setPending(true)
            setError(undefined)
            try {
              await acknowledgeAlert(alert, value)
              toast.success("Alert acknowledged", { description: alert.title })
              onClose()
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setPending(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Acknowledge alert</DialogTitle>
            <DialogDescription>{alert?.title}. Say what caused it so the team knows.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="flex flex-col gap-1">
              <SelectField id="ack-cause" label="Cause" value={cause} placeholder="Choose a cause" items={(alert ? causes[alert.kind] : []).map((c) => ({ value: c, label: c }))} onChange={setCause} />
              {cause !== "Other" && <FieldError>{missing}</FieldError>}
            </div>
            {cause === "Other" && (
              <Field data-invalid={!!missing}>
                <FieldLabel htmlFor="ack-other">Describe the cause</FieldLabel>
                <Textarea id="ack-other" rows={3} value={other} onChange={(e) => setOther(e.target.value)} aria-invalid={!!missing} />
                <FieldError>{missing}</FieldError>
              </Field>
            )}
          </FieldGroup>
          {error && <FormError title="Couldn’t acknowledge" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Acknowledge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResolveDialog({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const [note, setNote] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()
  React.useEffect(() => {
    setNote("")
    setError(undefined)
  }, [alert])

  return (
    <Dialog open={!!alert} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!alert) return
            setPending(true)
            setError(undefined)
            try {
              await resolveAlert(alert, note)
              toast.success("Alert resolved", { description: alert.title })
              onClose()
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setPending(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Resolve alert</DialogTitle>
            <DialogDescription>{alert?.title}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="res-note">How was it resolved? (optional)</FieldLabel>
            <Textarea id="res-note" rows={3} placeholder="Complaint number, credit on next bill…" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {error && <FormError title="Couldn’t resolve" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Resolve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AlertSheet({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const steps = alert
    ? [
        { label: "Raised", date: alert.raisedAt, detail: alert.sentTo },
        ...(alert.acknowledgedAt ? [{ label: `Acknowledged by ${alert.acknowledgedBy ?? "someone"}`, date: alert.acknowledgedAt, detail: alert.cause ? `Cause: ${alert.cause}` : undefined }] : []),
        ...(alert.resolvedAt ? [{ label: "Resolved", date: alert.resolvedAt, detail: alert.resolution }] : []),
      ]
    : []
  return (
    <Sheet open={!!alert} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        {alert && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusMeta[alert.status].variant}>{statusMeta[alert.status].label}</Badge>
                <Badge variant="outline">{kindLabel[alert.kind]}</Badge>
              </div>
              <SheetTitle>{alert.title}</SheetTitle>
              <SheetDescription>{alert.detail}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">At stake</dt>
                  <dd className="font-medium tabular-nums">{alert.impactPkr ? formatPkr(alert.impactPkr) : "Tracking stops until uploaded"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Suggested next step</dt>
                  <dd className="text-end font-medium">{alert.nextStep}</dd>
                </div>
              </dl>
              <ol className="flex flex-col gap-3" aria-label="History">
                {steps.map((s) => (
                  <li key={s.label} className="flex gap-3">
                    <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{[formatDate(s.date), s.detail].filter(Boolean).join(". ")}</span>
                    </div>
                  </li>
                ))}
              </ol>
              {alert.status === "open" && alert.severity === "critical" && (
                <p className="text-xs text-muted-foreground">
                  {isEscalated(alert)
                    ? `No one acknowledged it within ${ESCALATE_AFTER_HOURS} hours, so it went to the organisation’s owner.`
                    : `If no one acknowledges it within ${ESCALATE_AFTER_HOURS} hours, it goes to the organisation’s owner.`}
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SiteAlerts({ site }: { site: Site }) {
  const router = useRouter()
  const q = useApiQuery(() => listAlerts(site.id), [site.id])
  const me = useStoreValue(getMe)
  const canEdit = me?.role !== "viewer"
  const [filter, setFilter] = React.useState<(typeof filters)[number]["value"]>("open")
  const [ack, setAck] = React.useState<Alert | null>(null)
  const [resolving, setResolving] = React.useState<Alert | null>(null)
  const [open, setOpen] = React.useState<Alert | null>(null)

  const all = q.data ?? []
  const shown = filter === "all" ? all : all.filter((a) => a.status === filter)
  const openList = all.filter((a) => a.status !== "resolved")
  const kpis: Kpi[] =
    q.status === "ready" && all.length
      ? [
          { id: "open", label: "Open alerts", value: String(all.filter((a) => a.status === "open").length), unit: "", note: `${all.filter((a) => a.status === "acknowledged").length} acknowledged`, tone: "neutral" },
          { id: "critical", label: "Critical", value: String(openList.filter((a) => a.severity === "critical").length), unit: "", note: `Escalate after ${ESCALATE_AFTER_HOURS} h`, tone: openList.some((a) => a.severity === "critical") ? "destructive" : "success" },
          {
            id: "stake",
            label: "Possible overcharges",
            value: formatInt(openList.filter((a) => a.kind === "bill_anomaly" && a.severity === "critical").reduce((s, a) => s + a.impactPkr, 0)),
            unit: "PKR",
            note: "One-time, on open alerts from the last 3 bills",
            tone: "neutral",
          },
          { id: "resolved", label: "Resolved", value: String(all.filter((a) => a.status === "resolved").length), unit: "", note: "From the last 3 bills", tone: "success" },
        ]
      : []

  const toAction = async (a: Alert) => {
    try {
      const action = await alertToAction(a)
      toast.success("Turned into an action", {
        description: action.title,
        action: { label: "Open", onClick: () => router.push("/actions/") },
      })
    } catch (e) {
      toast.error("Couldn’t create the action", { description: (e as Error).message })
    }
  }

  return (
    <>
      <KpiRow
        status={q.status}
        error={q.error}
        onRetry={q.retry}
        kpis={kpis}
        icons={kpiIcons}
        empty={{ icon: <BellOffIcon />, title: "No alerts", description: "Your latest bills raised nothing to act on.", action: "View bills", onAction: () => router.push("/bills/") }}
      />
      <Frame spacing="default" className="min-w-0">
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle>Inbox</FrameTitle>
            <span className="text-xs text-muted-foreground">Bill anomalies, budget overruns and missing bills for {site.name}</span>
          </div>
          <ToggleGroup variant="outline" size="sm" aria-label="Show alerts" value={[filter]} onValueChange={(v) => v[0] && setFilter(v[0] as typeof filter)}>
            {filters.map((f) => (
              <ToggleGroupItem key={f.value} value={f.value}>
                {f.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-4">
          <PanelState
            status={q.status}
            error={q.error}
            onRetry={q.retry}
            isEmpty={shown.length === 0}
            skeleton={
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            }
            empty={
              filter === "open"
                ? { icon: <BellIcon />, title: "Nothing open", description: "Every alert has been acknowledged or resolved.", action: "Show all", onAction: () => setFilter("all") }
                : { icon: <BellIcon />, title: "No alerts here", description: "Try another filter.", action: "Show all", onAction: () => setFilter("all") }
            }
          >
            <ItemGroup role="list" aria-label="Alerts">
              {shown.map((a) => (
                <Item key={a.id} variant="outline" size="sm" role="listitem" className="items-start">
                  <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", severityDot[a.severity])} />
                  <ItemContent className="min-w-0 gap-1">
                    <ItemTitle className="line-clamp-none">
                      <button type="button" className="text-start underline-offset-4 hover:underline" onClick={() => setOpen(a)}>
                        {a.title}
                      </button>
                      <span className="sr-only">, {a.severity}</span>
                    </ItemTitle>
                    <ItemDescription>{a.status === "open" ? a.detail : a.cause ? `Cause: ${a.cause}` : a.resolution ?? a.detail}</ItemDescription>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                      <Badge variant={statusMeta[a.status].variant}>{statusMeta[a.status].label}</Badge>
                      <span>{kindLabel[a.kind]}</span>
                      <span>Raised {age(a.raisedAt)}</span>
                      {isEscalated(a) && <Badge variant="warning-outline">Escalated to owner</Badge>}
                      {a.impactPkr > 0 && <span className="font-medium text-foreground tabular-nums">{formatPkr(a.impactPkr)}</span>}
                    </div>
                  </ItemContent>
                  {canEdit && a.status !== "resolved" && (
                    <ItemActions className="w-full flex-wrap justify-end sm:w-auto">
                      {a.kind === "missing_bill" ? (
                        <Button size="sm" onClick={() => router.push("/bills/upload/")}>
                          Upload bill
                        </Button>
                      ) : a.actionKind ? (
                        <Button size="sm" variant="outline" onClick={() => toAction(a)}>
                          Make it an action
                        </Button>
                      ) : null}
                      {a.status === "open" ? (
                        <Button size="sm" variant="outline" onClick={() => setAck(a)}>
                          Acknowledge
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setResolving(a)}>
                          Resolve
                        </Button>
                      )}
                    </ItemActions>
                  )}
                </Item>
              ))}
            </ItemGroup>
          </PanelState>
        </FramePanel>
      </Frame>
      <AckDialog alert={ack} onClose={() => setAck(null)} />
      <ResolveDialog alert={resolving} onClose={() => setResolving(null)} />
      <AlertSheet alert={open} onClose={() => setOpen(null)} />
    </>
  )
}

function SampleAlerts() {
  const router = useRouter()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BellIcon />
        </EmptyMedia>
        <EmptyTitle>Alerts come from your bills</EmptyTitle>
        <EmptyDescription>The sample organisation has no bills on record. Load the 12-bill scenario to see bill anomalies and budget overruns.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await loadScenario("bills-12")
            router.refresh()
          }}
        >
          Load the 12-bill scenario
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function AlertsPage() {
  return (
    <AppShell title="Alerts">
      <OrgSwitch sample={<SampleAlerts />} own={(site) => <SiteAlerts site={site} />} />
    </AppShell>
  )
}
