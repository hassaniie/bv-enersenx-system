"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChartColumnIcon, CheckIcon, FileTextIcon, GaugeIcon, HandCoinsIcon, ListChecksIcon, ReceiptTextIcon, SearchCheckIcon, ZapIcon } from "lucide-react"

import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/reui/badge"
import { FindingsList } from "@/components/bills/findings-list"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { can, getMe, useStoreValue, getChecklist, getSiteSummary, overcharged, TREND_MIN_BILLS, useApiQuery, type ChecklistItem, type Site } from "@/lib/api"
import type { Kpi } from "@/lib/dashboard-data"
import { formatDayMonth } from "@/lib/app-date"
import { formatBillMonth, formatBillMonthLong, formatInt, formatPkrShort } from "@/lib/format"
import { cn } from "@/lib/utils"

import { BudgetDialog } from "./budget-dialog"
import { InviteDialog } from "./invite-dialog"
import { KpiRow } from "./kpi-row"
import { NextBillNotice } from "./next-bill"
import { MoneyHeadlines } from "@/components/money/money-headlines"
import { Panel } from "./panel"
import { PanelState } from "./panel-state"

const trendConfig = {
  amount: { label: "Billed", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
} satisfies ChartConfig

const billIcons = { amount: ReceiptTextIcon, units: ZapIcon, peak: GaugeIcon, found: HandCoinsIcon }

/** The dashboard of a site that has just started: a checklist and its first bills. */
export function GettingStarted({ site }: { site: Site }) {
  const checklist = useApiQuery(() => getChecklist(site.id), [site.id])
  const summary = useApiQuery(() => getSiteSummary(site.id), [site.id])
  const [dialog, setDialog] = React.useState<"invite" | "budget" | null>(null)
  const router = useRouter()
  const role = useStoreValue(() => getMe()?.role)

  const s = summary.data
  const latest = s?.latest
  const found = s?.check ? overcharged(s.check.findings) : 0
  const units = latest ? latest.peakKwh + latest.offPeakKwh : 0
  const kpis: Kpi[] = latest
    ? [
        { id: "amount", label: "Latest bill", value: formatInt(latest.amountPayable), unit: "PKR", short: formatPkrShort(latest.amountPayable), note: [formatBillMonth(latest.month), `due ${formatDayMonth(latest.dueDate)}`], tone: "neutral" },
        { id: "units", label: "Units", value: formatInt(units), unit: "kWh", short: `${(units / 1000).toFixed(1)}k kWh`, note: `MDI ${formatInt(latest.mdiKw)} kW of ${formatInt(site.sanctionedKw)} kW sanctioned`, tone: "neutral" },
        { id: "peak", label: "Peak-hour share", value: String(Math.round((latest.peakKwh / units) * 100)), unit: "%", note: `${formatInt(latest.peakKwh)} kWh at the peak rate`, tone: latest.peakKwh / units > 0.2 ? "warning" : "neutral" },
        { id: "found", label: "Possible overcharges", value: formatInt(found), unit: "PKR", short: formatPkrShort(found), note: found ? `One-time, on the ${formatBillMonth(latest.month)} bill` : "None on this bill", tone: found ? "destructive" : "success" },
      ]
    : []

  const actions: Record<ChecklistItem["id"], React.ReactNode> = {
    bills: (
      <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/bills/upload/" />}>
        Upload a bill
      </Button>
    ),
    invite: (
      <Button size="sm" variant="outline" onClick={() => setDialog("invite")}>
        Invite
      </Button>
    ),
    budget: (
      <Button size="sm" variant="outline" onClick={() => setDialog("budget")}>
        Set budget
      </Button>
    ),
  }

  const done = checklist.data?.filter((c) => c.done).length ?? 0
  const allDone = checklist.status === "ready" && checklist.data?.every((c) => c.done)
  const trend = (s?.history ?? []).map((h) => ({ month: formatBillMonth(h.month).replace(" 20", " ’"), amount: Math.round(h.amount / 10_000) / 10 }))

  return (
    <>
      <NextBillNotice site={site} />
      <MoneyHeadlines site={site} />
      {!allDone && (
      <Panel
        title="Get started"
        hint={checklist.data ? `${done} of ${checklist.data.length} done` : undefined}
        meta={<Badge variant="outline">{site.name}</Badge>}
      >
        <PanelState
          status={checklist.status}
          error={checklist.error}
          onRetry={checklist.retry}
          isEmpty={checklist.data?.length === 0}
          skeleton={
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          }
          empty={{ icon: <ListChecksIcon />, title: "All set up", description: "Nothing left to set up for this site.", action: "View bills" }}
        >
          <ItemGroup role="list" aria-label="Setup checklist">
            {checklist.data?.map((c) => (
              <Item key={c.id} variant="outline" size="sm" role="listitem">
                <ItemMedia>
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border",
                      c.done ? "border-transparent bg-primary text-primary-foreground" : "border-dashed text-muted-foreground"
                    )}
                  >
                    {c.done && <CheckIcon aria-hidden className="size-3.5" />}
                  </span>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>
                    {c.title}
                    <span className="sr-only">{c.done ? ", done" : ", to do"}</span>
                  </ItemTitle>
                  <ItemDescription>{c.detail}</ItemDescription>
                  {c.progress && !c.done && (
                    <div className="flex items-center gap-2 pt-1">
                      <Progress value={(c.progress.value / c.progress.max) * 100} aria-label={`${c.progress.value} of ${c.progress.max} bills`} className="w-full max-w-48" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.progress.value} of {c.progress.max}
                      </span>
                    </div>
                  )}
                </ItemContent>
                {!c.done && can(role, c.id === "invite" ? "manage_users" : "edit") && (
                  <ItemActions className="basis-full justify-end @md:basis-auto">{actions[c.id]}</ItemActions>
                )}
              </Item>
            ))}
          </ItemGroup>
        </PanelState>
      </Panel>
      )}

      <KpiRow
        compact
        status={summary.status}
        kpis={kpis}
        error={summary.error}
        onRetry={summary.retry}
        icons={billIcons}
        empty={{
          icon: <FileTextIcon />,
          title: "No bills yet",
          description: "Upload your latest bill to see what it costs and what it hides.",
          action: "Upload a bill",
          onAction: () => router.push("/bills/upload/"),
        }}
      />

      {s && s.billCount > 0 && (
        <Panel title="Monthly Bills" hint={["PKR lakhs", s.budget ? `budget ${formatPkrShort(s.budget)}` : "no budget set"]}>
          <PanelState
            status={summary.status}
            error={summary.error}
            onRetry={summary.retry}
            isEmpty={s.billCount < TREND_MIN_BILLS}
            skeleton={<Skeleton className="h-56 w-full" />}
            empty={{
              icon: <ChartColumnIcon />,
              title: "Not enough months yet",
              description: `A trend needs ${TREND_MIN_BILLS} months of bills. You have ${s.billCount}.`,
              action: "Upload a bill",
              onAction: () => router.push("/bills/upload/"),
            }}
          >
            <ChartContainer config={trendConfig} className="aspect-auto h-56 w-full">
              <BarChart accessibilityLayer data={trend} margin={{ top: 8, left: -20, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                {s.budget && <ReferenceLine y={s.budget / 100_000} stroke="var(--muted-foreground)" strokeDasharray="5 5" />}
                <Bar dataKey="amount" fill="var(--color-amount)" maxBarSize={40} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </PanelState>
        </Panel>
      )}

      {latest && s?.check && (
        <Panel
          title="What we found"
          hint={[formatBillMonthLong(latest.month), `${formatPkrShort(found)} possible overcharges, one-time`]}
          meta={
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/bills/view/?id=${encodeURIComponent(latest.id)}`} />}>
              View bill
            </Button>
          }
        >
          <PanelState
            status={summary.status}
            error={summary.error}
            onRetry={summary.retry}
            isEmpty={s.check.findings.length === 0}
            skeleton={<Skeleton className="h-40 w-full" />}
            empty={{ icon: <SearchCheckIcon />, title: "This bill checks out", description: "It matches the tariff. Upload more months to find savings.", action: "Upload a bill" }}
          >
            <FindingsList findings={s.check.findings} size="sm" planLink />
          </PanelState>
        </Panel>
      )}

      <InviteDialog open={dialog === "invite"} onOpenChange={(o) => setDialog(o ? "invite" : null)} />
      <BudgetDialog
        open={dialog === "budget"}
        onOpenChange={(o) => setDialog(o ? "budget" : null)}
        siteId={site.id}
        siteName={site.name}
        suggested={latest?.amountPayable}
      />
    </>
  )
}
