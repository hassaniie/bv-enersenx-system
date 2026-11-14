"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon, BellIcon, CircleCheckIcon, ClipboardCheckIcon, MinusIcon, RepeatIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { AppShell } from "@/components/dashboard/app-shell"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { Panel } from "@/components/dashboard/panel"
import { PanelError } from "@/components/dashboard/panel-state"
import { BillStep } from "@/components/onboarding/bill-step"
import { ConfirmStep } from "@/components/onboarding/confirm-step"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { billsInProgress, getMonthChange, useApiQuery, type Bill, type Delta, type Site } from "@/lib/api"
import { formatBillMonthLong, formatInt, formatPkr } from "@/lib/format"
import { cn } from "@/lib/utils"

import { billHref } from "./bills-page"

function DeltaCard({ d }: { d: Delta }) {
  const diff = d.now - d.before
  const pct = d.before ? (diff / d.before) * 100 : 0
  const value = (n: number) => (d.digits ? n.toFixed(d.digits) : formatInt(n))
  const Icon = Math.abs(pct) < 0.5 ? MinusIcon : diff > 0 ? ArrowUpIcon : ArrowDownIcon
  const tone = Math.abs(pct) < 0.5 ? "text-muted-foreground" : diff > 0 ? "text-destructive-foreground dark:text-destructive" : "text-success-foreground dark:text-success"
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{d.label}</span>
        <span className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value(d.now)}</span>
          <span className="text-xs text-muted-foreground">{d.unit}</span>
        </span>
        <span className={cn("flex items-center gap-1 text-xs tabular-nums", tone)}>
          <Icon aria-hidden className="size-3.5" />
          {d.unit === "%" ? `${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)} points` : `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`}
          <span className="text-muted-foreground">from {value(d.before)}</span>
        </span>
      </CardContent>
    </Card>
  )
}

/** The payoff of a monthly upload: what moved since the previous bill, and what it means. */
function MonthChangeView({ billId, onAnother }: { billId: string; onAnother: () => void }) {
  const q = useApiQuery(() => getMonthChange(billId), [billId])
  if (q.status === "error") return <PanelError title="Couldn’t compare this bill" error={q.error} onRetry={q.retry} />
  if (q.status === "loading" || !q.data)
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <span className="sr-only">Loading</span>
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-2 @5xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )

  const c = q.data
  const month = formatBillMonthLong(c.bill.month)
  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" nativeButton={false} render={<Link href={billHref(c.bill.id)} />}>
        View the {month} bill
      </Button>
      <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/" />}>
        Go to dashboard
      </Button>
      <Button size="sm" variant="outline" onClick={onAnother}>
        Upload another bill
      </Button>
    </div>
  )

  if (!c.previous)
    return (
      <Frame spacing="default">
        <FramePanel>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleCheckIcon />
              </EmptyMedia>
              <EmptyTitle>{month} bill added</EmptyTitle>
              <EmptyDescription>There’s no earlier bill to compare it with. It’s checked and in your history.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{actions}</EmptyContent>
          </Empty>
        </FramePanel>
      </Frame>
    )

  const prevMonth = formatBillMonthLong(c.previous.month)
  const changed = c.lines.filter((l) => l.now !== l.before)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-semibold tracking-tight">What changed in {month}</h2>
          <p className="text-sm text-muted-foreground">Compared with {prevMonth}. The bill is checked and saved.</p>
        </div>
        {actions}
      </div>
      <section aria-label="Changes since last month" className="grid grid-cols-1 gap-2 @md:grid-cols-2 @5xl:grid-cols-4">
        {c.deltas.map((d) => (
          <DeltaCard key={d.label} d={d} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-2">
        <Panel title="Findings This Month" hint={`vs ${prevMonth}`}>
          <ItemGroup role="list" aria-label="Findings compared with last month">
            {c.checked.map((a) => (
              <Item key={a.id} variant="outline" size="sm" role="listitem">
                <ItemMedia variant="icon">
                  <ClipboardCheckIcon aria-hidden />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-none">{a.title}</ItemTitle>
                  <ItemDescription>
                    {a.status === "verified"
                      ? `Verified: ${formatPkr(a.verification!.savedMonthlyPkr)} a month saved against the average of the bills before. `
                      : "Not achieved yet. "}
                    {a.verification?.reason}
                  </ItemDescription>
                </ItemContent>
                <Badge variant={a.status === "verified" ? "success-light" : "destructive-light"}>{a.status === "verified" ? "Verified" : "Not achieved"}</Badge>
              </Item>
            ))}
            {c.gone.map((f) => (
              <Item key={f.id} variant="outline" size="sm" role="listitem">
                <ItemMedia variant="icon">
                  <CircleCheckIcon aria-hidden />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-none">{f.title}</ItemTitle>
                  <ItemDescription>Gone from this bill. It was {formatPkr(f.impactPkr)} in {prevMonth}.</ItemDescription>
                </ItemContent>
                <Badge variant="success-light">Fixed</Badge>
              </Item>
            ))}
            {c.newFindings.map((f) => (
              <Item key={f.id} variant="outline" size="sm" role="listitem">
                <ItemMedia variant="icon">
                  <SparklesIcon aria-hidden />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-none">{f.title}</ItemTitle>
                  <ItemDescription>New this month: {formatPkr(f.impactPkr)}. {f.nextStep}</ItemDescription>
                </ItemContent>
                <Badge variant="destructive-light">New</Badge>
              </Item>
            ))}
            {c.stillThere.map((f) => (
              <Item key={f.id} variant="outline" size="sm" role="listitem">
                <ItemMedia variant="icon">
                  <RepeatIcon aria-hidden />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-none">{f.title}</ItemTitle>
                  <ItemDescription>Still on this bill: {formatPkr(f.impactPkr)}. {f.nextStep}</ItemDescription>
                </ItemContent>
                <Badge variant="warning-light">Repeats</Badge>
              </Item>
            ))}
          </ItemGroup>
        </Panel>

        <div className="flex min-w-0 flex-col gap-2">
          <Panel title="New Alerts" hint={c.alerts.length ? `${c.alerts.length} raised` : undefined}>
            {c.alerts.length ? (
              <ItemGroup role="list" aria-label="New alerts">
                {c.alerts.map((a) => (
                  <Item key={a.id} variant="outline" size="sm" role="listitem" render={<Link href="/alerts/" />}>
                    <ItemMedia variant="icon">
                      <BellIcon aria-hidden />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="line-clamp-none">{a.title}</ItemTitle>
                      <ItemDescription>{a.nextStep}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <p className="text-sm text-muted-foreground">This bill raised no alerts.</p>
            )}
          </Panel>
          <Panel title="Lines That Moved" hint="PKR">
            {changed.length ? (
              <dl className="flex flex-col gap-2 text-sm">
                {changed.map((l) => (
                  <div key={l.key} className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{l.label}</dt>
                    <dd className="text-end tabular-nums">
                      <span className="text-muted-foreground">{formatInt(l.before)} → </span>
                      <span className="font-medium">{formatInt(l.now)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Every line matches last month.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}

type Stage = { step: "upload"; existing?: Bill } | { step: "check"; bill: Bill } | { step: "result"; billId: string }

function UploadForSite({ site }: { site: Site }) {
  const [stage, setStage] = React.useState<Stage | null>(null)
  React.useEffect(() => {
    const pending = billsInProgress().find((b) => b.siteId === site.id)
    setStage(pending?.status === "needs_review" ? { step: "check", bill: pending } : { step: "upload", existing: pending?.status === "reading" ? pending : undefined })
  }, [site.id])
  const onRead = React.useCallback((bill: Bill) => setStage({ step: "check", bill }), [])

  if (!stage) return <Skeleton className="mx-auto h-72 w-full max-w-xl" />
  if (stage.step === "result") return <MonthChangeView billId={stage.billId} onAnother={() => setStage({ step: "upload" })} />
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Step {stage.step === "upload" ? 1 : 2} of 3 for {site.name}: {stage.step === "upload" ? "upload" : "check 5 numbers"}, then see what changed.
      </p>
      <Card>
        {stage.step === "upload" ? (
          <BillStep key={stage.existing?.id ?? "new"} site={site} existing={stage.existing} onRead={onRead} />
        ) : (
          <ConfirmStep bill={stage.bill} onConfirmed={(b) => setStage({ step: "result", billId: b.id })} onReupload={() => setStage({ step: "upload" })} />
        )}
      </Card>
    </div>
  )
}

export function UploadPage() {
  return (
    <AppShell title="Upload Bill">
      <OrgSwitch
        sample={<PanelError title="Uploads go to your own organisation" error="Load a bills scenario or sign up from the Demo banner." />}
        own={(site) => <UploadForSite site={site} />}
      />
    </AppShell>
  )
}
