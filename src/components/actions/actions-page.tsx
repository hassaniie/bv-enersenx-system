"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CircleCheckIcon, ClipboardListIcon, HandCoinsIcon, HourglassIcon, LightbulbIcon, ListTodoIcon, TrendingDownIcon, UndoIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { AppShell } from "@/components/dashboard/app-shell"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, TODAY } from "@/lib/app-date"
import { dismissAction, getMe, listActions, loadScenario, restoreAction, useApiQuery, useStoreValue, type ActionStatus, type SavingsAction, type Site } from "@/lib/api"
import type { Kpi } from "@/lib/dashboard-data"
import { formatBillMonth, formatInt, formatPkr } from "@/lib/format"

import { AcceptDialog, DoneDialog } from "./action-dialogs"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

export const actionStatusMeta: Record<ActionStatus, { label: string; variant: BadgeVariant }> = {
  suggested: { label: "Suggested", variant: "info-light" },
  accepted: { label: "In progress", variant: "primary-light" },
  done: { label: "Waiting for bills", variant: "warning-light" },
  verified: { label: "Verified", variant: "success-light" },
  not_achieved: { label: "Not achieved", variant: "destructive-light" },
  dismissed: { label: "Dismissed", variant: "outline" },
}

const kpiIcons = { open: LightbulbIcon, progress: ListTodoIcon, verified: HandCoinsIcon, missed: TrendingDownIcon }

const listSkeleton = (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 2 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
)

function Owner({ a }: { a: SavingsAction }) {
  if (!a.owner) return null
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Avatar size="sm">
        <AvatarFallback>{a.owner.initials}</AvatarFallback>
      </Avatar>
      {a.owner.name}
    </span>
  )
}

function ActionRow({ a, children, onOpen }: { a: SavingsAction; children?: React.ReactNode; onOpen: (a: SavingsAction) => void }) {
  const overdue = a.status === "accepted" && a.dueDate && a.dueDate < TODAY
  const value = a.verification ? a.verification.savedMonthlyPkr : a.estMonthlyPkr
  return (
    <Item variant="outline" size="sm" role="listitem" className="items-start">
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className="line-clamp-none">
          <button type="button" className="text-start underline-offset-4 hover:underline" onClick={() => onOpen(a)}>
            {a.title}
          </button>
        </ItemTitle>
        <ItemDescription>
          {a.status === "verified" || a.status === "not_achieved" ? a.verification?.reason : a.detail}
        </ItemDescription>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <Badge variant={actionStatusMeta[a.status].variant}>{actionStatusMeta[a.status].label}</Badge>
          <Owner a={a} />
          {a.status === "accepted" && a.dueDate && (
            <span className={overdue ? "text-xs text-destructive-foreground dark:text-destructive" : "text-xs text-muted-foreground"}>
              {overdue ? "Overdue since" : "Due"} {formatDate(a.dueDate)}
            </span>
          )}
          {a.doneAt && a.status === "done" && <span className="text-xs text-muted-foreground">Done {formatDate(a.doneAt)}, next bill will tell</span>}
        </div>
      </ItemContent>
      <ItemActions className="flex-col items-end gap-2 sm:flex-row sm:items-center">
        <span className="text-sm font-semibold tabular-nums">
          {formatPkr(value)}
          <span className="font-normal text-muted-foreground"> / mo</span>
        </span>
        {children}
      </ItemActions>
    </Item>
  )
}

function Section({
  title,
  hint,
  status,
  error,
  onRetry,
  items,
  empty,
  render,
}: {
  title: string
  hint: string
  status: PanelStatus
  error?: string
  onRetry: () => void
  items: SavingsAction[]
  empty: { title: string; description: string; action: string; onAction: () => void; icon: React.ReactNode }
  render: (a: SavingsAction) => React.ReactNode
}) {
  return (
    <Panel title={title} hint={hint} meta={status === "ready" ? <span className="tabular-nums">{items.length}</span> : undefined}>
      <PanelState status={status} error={error} onRetry={onRetry} isEmpty={items.length === 0} skeleton={listSkeleton} empty={empty}>
        <ItemGroup role="list" aria-label={title}>
          {items.map(render)}
        </ItemGroup>
      </PanelState>
    </Panel>
  )
}

function Timeline({ a }: { a: SavingsAction }) {
  const steps: { label: string; date?: string; detail?: string }[] = [
    { label: "Suggested from a bill", date: a.suggestedAt, detail: `Estimated ${formatPkr(a.estMonthlyPkr)} a month` },
    ...(a.acceptedAt ? [{ label: `Accepted, assigned to ${a.owner?.name ?? "someone"}`, date: a.acceptedAt, detail: a.dueDate ? `Due ${formatDate(a.dueDate)}` : undefined }] : []),
    ...(a.doneAt ? [{ label: "Marked done", date: a.doneAt, detail: a.note }] : []),
  ]
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s) => (
        <li key={s.label} className="flex gap-3">
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">{s.label}</span>
            <span className="text-xs text-muted-foreground">{[s.date && formatDate(s.date), s.detail].filter(Boolean).join(". ")}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function ActionSheet({ a, onClose }: { a: SavingsAction | null; onClose: () => void }) {
  const v = a?.verification
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        {a && (
          <>
            <SheetHeader>
              <div className="flex">
                <Badge variant={actionStatusMeta[a.status].variant}>{actionStatusMeta[a.status].label}</Badge>
              </div>
              <SheetTitle>{a.title}</SheetTitle>
              <SheetDescription>{a.detail}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
              <Timeline a={a} />
              {v ? (
                <section aria-labelledby="verify-title" className="flex flex-col gap-3">
                  <h3 id="verify-title" className="text-sm font-semibold tracking-tight">
                    {a.status === "verified" ? "How we verified it" : "Why it isn’t counted yet"}
                  </h3>
                  <dl className="flex flex-col gap-2 text-sm">
                    {[
                      ["Measured", v.measure],
                      [`Before (${v.before.map(formatBillMonth).join(", ")})`, v.beforeValue],
                      [`After (${v.after.map(formatBillMonth).join(", ")})`, v.afterValue],
                      ["Saving", v.savedMonthlyPkr ? `${formatPkr(v.savedMonthlyPkr)} a month` : "None counted"],
                    ].map(([k, val]) => (
                      <div key={k} className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-end font-medium tabular-nums">{val}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs text-muted-foreground">{v.reason} Up to 3 bills before the month it was done are compared with up to 3 after.</p>
                </section>
              ) : a.status === "done" ? (
                <p className="text-sm text-muted-foreground">Waiting for the first bill after {formatDate(a.doneAt!)}. Upload it and we’ll verify the saving.</p>
              ) : null}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SiteActions({ site }: { site: Site }) {
  const router = useRouter()
  const q = useApiQuery(() => listActions(site.id), [site.id])
  const me = useStoreValue(getMe)
  const canEdit = me?.role !== "viewer"
  const [accepting, setAccepting] = React.useState<SavingsAction | null>(null)
  const [finishing, setFinishing] = React.useState<SavingsAction | null>(null)
  const [open, setOpen] = React.useState<SavingsAction | null>(null)

  const all = q.data ?? []
  const by = (...s: ActionStatus[]) => all.filter((a) => s.includes(a.status))
  const suggested = by("suggested")
  const progress = by("accepted").sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
  const waiting = by("done")
  const results = by("verified", "not_achieved")
  const dismissed = by("dismissed")
  const sum = (list: SavingsAction[], f: (a: SavingsAction) => number) => list.reduce((s, a) => s + f(a), 0)
  const verified = sum(by("verified"), (a) => a.verification!.savedMonthlyPkr)

  const kpis: Kpi[] =
    q.status === "ready" && all.length
      ? [
          { id: "open", label: "Open potential", value: formatInt(sum(suggested, (a) => a.estMonthlyPkr)), unit: "PKR / mo", note: `${suggested.length} suggestion${suggested.length === 1 ? "" : "s"}`, tone: "neutral" },
          { id: "progress", label: "In progress", value: String(progress.length + waiting.length), unit: "actions", note: `${waiting.length} waiting for the next bill`, tone: "neutral" },
          { id: "verified", label: "Verified savings", value: formatInt(verified), unit: "PKR / mo", note: verified ? `About ${formatPkr(verified * 12)} a year` : "Nothing verified yet", tone: verified ? "success" : "neutral" },
          { id: "missed", label: "Not achieved", value: String(by("not_achieved").length), unit: "", note: by("not_achieved").length ? "Open one to see why" : "None so far", tone: by("not_achieved").length ? "warning" : "neutral" },
        ]
      : []

  const state = { status: q.status as PanelStatus, error: q.error, onRetry: q.retry }
  const upload = () => router.push("/onboarding/")

  return (
    <>
      <KpiRow {...state} kpis={kpis} icons={kpiIcons} empty={{ icon: <ClipboardListIcon />, title: "No actions yet", description: "Upload a bill; we suggest actions from what it shows.", action: "Upload a bill", onAction: upload }} />
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-2">
        <Section
          {...state}
          title="Suggested"
          hint="From your latest bill"
          items={suggested}
          empty={{ icon: <LightbulbIcon />, title: "No new suggestions", description: "Every finding on your latest bill already has an action.", action: "Upload a bill", onAction: upload }}
          render={(a) => (
            <ActionRow key={a.id} a={a} onOpen={setOpen}>
              {canEdit && (
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await dismissAction(a)
                      toast("Suggestion dismissed", { description: a.title })
                    }}
                  >
                    Dismiss
                  </Button>
                  <Button size="sm" onClick={() => setAccepting(a)}>
                    Accept
                  </Button>
                </span>
              )}
            </ActionRow>
          )}
        />
        <Section
          {...state}
          title="In Progress"
          hint="Assigned, not done yet"
          items={progress}
          empty={{ icon: <ListTodoIcon />, title: "Nothing in progress", description: "Accept a suggestion and give it an owner and a due date.", action: "Review suggestions", onAction: () => window.scrollTo({ top: 0 }) }}
          render={(a) => (
            <ActionRow key={a.id} a={a} onOpen={setOpen}>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setFinishing(a)}>
                  Mark done
                </Button>
              )}
            </ActionRow>
          )}
        />
        <Section
          {...state}
          title="Waiting for Bills"
          hint="Verified against the next bills"
          items={waiting}
          empty={{ icon: <HourglassIcon />, title: "Nothing waiting", description: "Actions marked done wait here for the next bill.", action: "Upload a bill", onAction: upload }}
          render={(a) => <ActionRow key={a.id} a={a} onOpen={setOpen} />}
        />
        <Section
          {...state}
          title="Results"
          hint="Checked against later bills"
          items={results}
          empty={{ icon: <CircleCheckIcon />, title: "No results yet", description: "Savings show here once a later bill confirms them.", action: "Upload a bill", onAction: upload }}
          render={(a) => <ActionRow key={a.id} a={a} onOpen={setOpen} />}
        />
      </div>
      {dismissed.length > 0 && (
        <Panel title="Dismissed" hint="Hidden from suggestions">
          <ItemGroup role="list" aria-label="Dismissed">
            {dismissed.map((a) => (
              <ActionRow key={a.id} a={a} onOpen={setOpen}>
                {canEdit && (
                  <Button size="sm" variant="ghost" onClick={() => restoreAction(a)}>
                    <UndoIcon data-icon="inline-start" />
                    Restore
                  </Button>
                )}
              </ActionRow>
            ))}
          </ItemGroup>
        </Panel>
      )}

      <AcceptDialog
        action={accepting}
        onClose={() => setAccepting(null)}
        onDone={(a) => {
          setAccepting(null)
          toast.success("Action accepted", { description: a.title })
        }}
      />
      <DoneDialog
        action={finishing}
        onClose={() => setFinishing(null)}
        onDone={(a) => {
          setFinishing(null)
          toast.success("Marked done", { description: `${a.title}. The next bill will verify it.` })
        }}
      />
      <ActionSheet a={open} onClose={() => setOpen(null)} />
    </>
  )
}

function SampleActions() {
  const router = useRouter()
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ClipboardListIcon />
        </EmptyMedia>
        <EmptyTitle>Actions come from bill checks</EmptyTitle>
        <EmptyDescription>The sample organisation has no bills on record. Load the 12-bill scenario to see actions verified against later bills.</EmptyDescription>
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

export function ActionsPage() {
  return (
    <AppShell title="Savings Actions">
      <OrgSwitch sample={<SampleActions />} own={(site) => <SiteActions site={site} />} />
    </AppShell>
  )
}
