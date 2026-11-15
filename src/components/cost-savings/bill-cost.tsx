"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChartColumnStackedIcon, ChartSplineIcon, HandCoinsIcon, PercentIcon, ReceiptTextIcon, TrendingUpIcon, WalletIcon } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { BudgetDialog } from "@/components/dashboard/budget-dialog"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { billBreakdownSeries, getSiteCost, TREND_MIN_BILLS, useApiQuery, type Site } from "@/lib/api"
import { formatBillMonthLong } from "@/lib/format"

import { BillingPanel } from "./billing-panel"
import { OpportunitiesPanel } from "./opportunities-panel"
import { TariffPanel } from "./tariff-panel"

const billLink = (row: { id: string }) => `/bills/view/?id=${encodeURIComponent(row.id)}`

const kpiIcons = { cost: WalletIcon, rate: TrendingUpIcon, savings: HandCoinsIcon, budget: PercentIcon }

// Categorical identity colors for bill components, paired for dark mode.
const breakdownConfig = {
  energy: { label: "Energy", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
  fixed: { label: "Fixed charges", theme: { light: "var(--color-cyan-500)", dark: "var(--color-cyan-400)" } },
  adjustments: { label: "FPA and penalties", theme: { light: "var(--color-amber-400)", dark: "var(--color-amber-300)" } },
  taxes: { label: "Taxes", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
} satisfies ChartConfig

const budgetConfig = {
  prev: { label: "Budget", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
  current: { label: "Billed", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
} satisfies ChartConfig

const chartSkeleton = <Skeleton className="h-64 w-full" />

const needMore = (have: number) => `Trends need ${TREND_MIN_BILLS} months of bills. You have ${have}.`

/** Cost & Savings for a site that brings its own bills. */
export function BillCostSavings({ site }: { site: Site }) {
  const router = useRouter()
  const q = useApiQuery(() => getSiteCost(site.id), [site.id])
  const state = { status: q.status, error: q.error, onRetry: q.retry }
  const d = q.data
  const count = d?.billCount ?? 0
  const upload = () => router.push("/bills/upload/")
  const shortHistory = count < TREND_MIN_BILLS
  const [budgetOpen, setBudgetOpen] = React.useState(false)

  return (
    <>
      <KpiRow
        {...state}
        kpis={d?.kpis ?? []}
        icons={kpiIcons}
        empty={{ icon: <ReceiptTextIcon />, title: "No bills yet", description: "Upload a bill to see what this site costs.", action: "Upload a bill", onAction: upload }}
      />

      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Monthly Cost Breakdown" hint={["PKR lakhs", "by bill component"]}>
          <PanelState
            {...state}
            isEmpty={shortHistory}
            skeleton={chartSkeleton}
            empty={{ icon: <ChartColumnStackedIcon />, title: "Not enough months yet", description: needMore(count), action: "Upload bills", onAction: upload }}
          >
            <ChartContainer config={breakdownConfig} className="aspect-auto h-64 w-full">
              <BarChart accessibilityLayer data={d?.billBreakdown ?? []} margin={{ top: 8, left: -20, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                {billBreakdownSeries.map((s, i) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="cost"
                    fill={`var(--color-${s.key})`}
                    maxBarSize={32}
                    radius={i === billBreakdownSeries.length - 1 ? [4, 4, 0, 0] : 0}
                  />
                ))}
                <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </PanelState>
        </Panel>

        <Panel title="Budget vs Actual" hint="PKR millions">
          <PanelState
            {...state}
            isEmpty={shortHistory || !d?.budget}
            skeleton={chartSkeleton}
            empty={
              shortHistory
                ? { icon: <ChartSplineIcon />, title: "Not enough months yet", description: needMore(count), action: "Upload bills", onAction: upload }
                : { icon: <ChartSplineIcon />, title: "No budget set", description: "Set a monthly budget to compare each bill against it.", action: "Set budget", onAction: () => setBudgetOpen(true) }
            }
          >
            <ChartContainer config={budgetConfig} className="aspect-auto h-64 w-full">
              <AreaChart accessibilityLayer data={d?.comparison ?? []} margin={{ top: 8, left: -20, right: 12 }}>
                <defs>
                  <linearGradient id="fill-billed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-current)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-current)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="prev" type="step" stroke="var(--color-prev)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                <Area dataKey="current" type="monotone" stroke="var(--color-current)" fill="url(#fill-billed)" strokeWidth={2} dot={{ r: 3, fill: "var(--card)", strokeWidth: 1.5 }} />
                <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </PanelState>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[2fr_1fr]">
        <TariffPanel
          {...state}
          title="Latest Bill by Charge"
          rateCaption="All-in cost, taxes included,"
          month={d?.latestMonth ? formatBillMonthLong(d.latestMonth) : undefined}
          rows={d?.tariffs ?? []}
          total={d?.tariffTotal ?? { kwh: 0, cost: 0 }}
          blendedRate={d?.blendedRate ?? 0}
          onEmptyAction={upload}
        />
        <OpportunitiesPanel {...state} opportunities={d?.opportunities ?? []} hint="From the latest bill, each with its own period" />
      </div>

      <BillingPanel {...state} title="Bill History" meterLabel="Reference" rateLabel="Energy rate" invoices={d?.invoices ?? []} onEmptyAction={upload} rowHref={billLink} />
      <BudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        siteId={site.id}
        siteName={site.name}
        suggested={d?.tariffTotal.cost || undefined}
      />
    </>
  )
}
