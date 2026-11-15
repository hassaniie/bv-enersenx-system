"use client"

import { HandCoinsIcon, PiggyBankIcon, TrendingDownIcon } from "lucide-react"

import { HowCalculated } from "@/components/money/how-calculated"
import { PanelState } from "@/components/dashboard/panel-state"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSiteMoney, useApiQuery, type Site } from "@/lib/api"
import { formatBillMonth, formatPkr, formatPkrShort } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * The three money headlines (principles.md M1–M7): Recoverable (one-time),
 * Losing per month (avoidable + estimate) and Saved (verified, per month).
 * Every figure says its kind, its scope and how it was calculated.
 */
export function MoneyHeadlines({ site, className }: { site: Site; className?: string }) {
  const q = useApiQuery(() => getSiteMoney(site.id), [site.id])
  const m = q.data
  const grid = "grid grid-cols-1 gap-2 @2xl:grid-cols-3"
  const wide = "hidden gap-2 @md:grid @md:grid-cols-1 @2xl:grid-cols-3"

  return (
    <section aria-label="Money at a glance" className={className}>
      <PanelState
        status={q.status}
        error={q.error}
        onRetry={q.retry}
        isEmpty={!m?.latest}
        skeleton={
          <div className={grid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        }
        empty={{ icon: <HandCoinsIcon />, title: "No bills yet", description: "Upload a bill to see what you can recover and save.", action: "Upload a bill" }}
      >
        {m && (
          /* Phones: one headline and two supporting lines, so content starts above the fold (principles.md U14). */
          <Card size="sm" className="@md:hidden">
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Recoverable</span>
                <span className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatPkrShort(m.recoverable.amount)}</span>
                  <span className="text-xs text-muted-foreground">one-time, possible overcharges</span>
                </span>
                <HowCalculated method={m.recoverable.method} subject="Recoverable" />
              </div>
              <dl className="flex flex-col gap-2 border-t pt-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Losing per month</dt>
                  <dd className="font-semibold tabular-nums">{formatPkrShort(m.losing.amount)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Saved per month</dt>
                  <dd className="font-semibold tabular-nums">{formatPkrShort(m.saved.amount)}</dd>
                </div>
              </dl>
              <span className="-mt-1 flex flex-wrap gap-x-3">
                <HowCalculated method={m.losing.method} label="How: losing" subject="Losing per month" />
                <HowCalculated method={m.saved.method} label="How: saved" subject="Saved per month" />
              </span>
            </CardContent>
          </Card>
        )}
        {m && (
          <div className={wide}>
            <Headline
              icon={HandCoinsIcon}
              label="Recoverable"
              value={m.recoverable.amount}
              period="one-time"
              scope={m.recoverable.from && m.recoverable.to ? `Possible overcharges on ${m.recoverable.billCount} bill${m.recoverable.billCount === 1 ? "" : "s"}, ${formatBillMonth(m.recoverable.from)} – ${formatBillMonth(m.recoverable.to)}` : "Possible overcharges"}
              tone={m.recoverable.amount ? "destructive" : "neutral"}
              method={m.recoverable.method}
            />
            <Headline
              icon={TrendingDownIcon}
              label="Losing per month"
              value={m.losing.amount}
              period="a month"
              scope={`Avoidable ${formatPkr(m.losing.avoidable)} + could save about ${formatPkr(m.losing.couldSave)} (estimate)${m.losing.month ? `, ${formatBillMonth(m.losing.month)} bill` : ""}`}
              tone={m.losing.amount ? "warning" : "neutral"}
              method={m.losing.method}
            />
            <Headline
              icon={PiggyBankIcon}
              label="Saved"
              value={m.saved.amount}
              period="a month"
              scope={m.saved.actions ? `Verified on later bills, ${m.saved.actions} action${m.saved.actions === 1 ? "" : "s"}` : "Nothing verified yet"}
              tone={m.saved.amount ? "success" : "neutral"}
              method={m.saved.method}
            />
          </div>
        )}
      </PanelState>
    </section>
  )
}

const tones = {
  neutral: "text-muted-foreground",
  destructive: "text-destructive-foreground dark:text-destructive",
  warning: "text-warning-foreground dark:text-warning",
  success: "text-success-foreground dark:text-success",
} as const

function Headline({
  icon: Icon,
  label,
  value,
  period,
  scope,
  tone,
  method,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  value: number
  period: string
  scope: string
  tone: keyof typeof tones
  method: React.ComponentProps<typeof HowCalculated>["method"]
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon aria-hidden className={cn("size-4 shrink-0", tones[tone])} />
        </div>
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            <span className="hidden @md:inline">{formatPkr(value)}</span>
            <span className="@md:hidden">{formatPkrShort(value)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{period}</span>
        </span>
        <span className="text-xs text-muted-foreground">{scope}</span>
        <HowCalculated method={method} subject={label} />
      </CardContent>
    </Card>
  )
}
