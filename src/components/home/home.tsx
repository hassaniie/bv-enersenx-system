"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChartColumnStackedIcon, ChartLineIcon, SearchCheckIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { FindingsList } from "@/components/bills/findings-list"
import { NextBillNotice } from "@/components/dashboard/next-bill"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { MoneyHeadlines } from "@/components/money/money-headlines"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  billBreakdownSeries,
  getBillAnalytics,
  getSiteCost,
  getSiteSummary,
  TREND_MIN_BILLS,
  useApiQuery,
  type Site,
} from "@/lib/api"
import { formatBillMonth, formatBillMonthLong, formatInt, formatPkr, formatPkrShort } from "@/lib/format"

import { SetupChecklist } from "./setup-checklist"

// Categorical identity colours for bill components, paired for dark mode.
const chargeConfig = {
  energy: { label: "Energy", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
  fixed: { label: "Fixed charges", theme: { light: "var(--color-cyan-500)", dark: "var(--color-cyan-400)" } },
  adjustments: { label: "FPA and penalties", theme: { light: "var(--color-amber-400)", dark: "var(--color-amber-300)" } },
  taxes: { label: "Taxes", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
} satisfies ChartConfig

const peakConfig = {
  peakShare: { label: "Peak share", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
} satisfies ChartConfig

const chartSkeleton = <Skeleton className="h-64 w-full" />

/**
 * Home for an organisation that brings its own bills (step 3 of the redesign):
 * money headlines first, then setup, the latest bill and its findings, then
 * costs over time. Cost & Savings and Analytics fold in here; live-meter
 * analytics return in Phase 2.
 */
export function Home({ site }: { site: Site }) {
  const router = useRouter()
  const summary = useApiQuery(() => getSiteSummary(site.id), [site.id])
  const cost = useApiQuery(() => getSiteCost(site.id), [site.id])
  const trends = useApiQuery(() => getBillAnalytics(site.id), [site.id])

  const latest = summary.data?.latest
  const check = summary.data?.check
  const count = summary.data?.billCount ?? 0
  const units = latest ? latest.peakKwh + latest.offPeakKwh : 0
  const upload = () => router.push("/bills/upload/")
  const needMore = {
    title: "Not enough months yet",
    description: `Trends need ${TREND_MIN_BILLS} months of bills. You have ${count}.`,
    action: "Upload bills",
    onAction: upload,
  }
  const budget = cost.data?.budget
  const shortHistory = count < TREND_MIN_BILLS

  return (
    <>
      <NextBillNotice site={site} />
      <MoneyHeadlines site={site} />
      <SetupChecklist site={site} latestBill={latest?.amountPayable} />

      <Panel
        title="Latest Bill"
        hint={latest ? [formatBillMonthLong(latest.month), site.disco] : undefined}
        meta={
          latest ? (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/bills/view/?id=${encodeURIComponent(latest.id)}`} />}>
              View bill
            </Button>
          ) : undefined
        }
      >
        <PanelState
          status={summary.status}
          error={summary.error}
          onRetry={summary.retry}
          isEmpty={!latest}
          skeleton={<Skeleton className="h-48 w-full" />}
          empty={{ icon: <SearchCheckIcon />, title: "No bills yet", description: "Upload your latest bill; we check it against the tariff in seconds.", action: "Upload a bill", onAction: upload }}
        >
          {latest && check && (
            <div className="flex flex-col gap-4">
              {/* Billed is context, not a headline (money model). */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-4" aria-label="Latest bill at a glance">
                {[
                  { label: "Billed", value: formatPkr(latest.amountPayable), short: formatPkrShort(latest.amountPayable), note: `Due ${latest.dueDate.slice(8)} ${formatBillMonth(latest.month).slice(0, 3)}` },
                  { label: "Units", value: `${formatInt(units)} kWh`, note: `MDI ${formatInt(latest.mdiKw)} of ${formatInt(site.sanctionedKw)} kW` },
                  { label: "All-in cost per kWh", value: `PKR ${(latest.amountPayable / units).toFixed(2)}`, note: "Amount payable ÷ units" },
                  { label: "Peak-hour share", value: `${Math.round((latest.peakKwh / units) * 100)}%`, note: `${formatInt(latest.peakKwh)} kWh at the peak rate` },
                ].map((s) => (
                  <div key={s.label} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="flex flex-col">
                      <span className="text-base font-semibold tabular-nums">
                        {s.short ? (
                          <>
                            <span className="hidden @md:inline">{s.value}</span>
                            <span className="@md:hidden">{s.short}</span>
                          </>
                        ) : (
                          s.value
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.note}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              {check.findings.length > 0 ? (
                <FindingsList findings={check.findings} size="sm" planLink />
              ) : (
                <p className="text-sm text-muted-foreground">This bill matches the {latest.tariff} tariff. Nothing to fix.</p>
              )}
            </div>
          )}
        </PanelState>
      </Panel>

      <section aria-labelledby="costs-title" className="flex flex-col gap-2">
        <h2 id="costs-title" className="sr-only">
          Costs
        </h2>
        <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[1.5fr_1fr]">
          <Panel title="Cost by Charge" hint={["PKR lakhs a month", budget ? `dashed line: budget ${formatPkrShort(budget)}` : "no budget set"]}>
            <p className="-mt-2 text-xs text-muted-foreground">What each bill was made of: energy, fixed charges, fuel adjustment and penalties, and taxes.</p>
            <PanelState {...{ status: cost.status, error: cost.error, onRetry: cost.retry }} isEmpty={shortHistory} skeleton={chartSkeleton} empty={{ icon: <ChartColumnStackedIcon />, ...needMore }}>
              <ChartContainer config={chargeConfig} className="aspect-auto h-64 w-full">
                <BarChart accessibilityLayer data={cost.data?.billBreakdown ?? []} margin={{ top: 8, left: -20, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  {budget && <ReferenceLine y={budget / 100_000} stroke="var(--muted-foreground)" strokeDasharray="5 5" />}
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

          <Panel title="Peak-Hour Share" hint="% of units billed at the peak rate">
            <p className="-mt-2 text-xs text-muted-foreground">Lower is cheaper: the dashed line marks 20%, a common target for time-of-use tariffs.</p>
            <PanelState {...{ status: trends.status, error: trends.error, onRetry: trends.retry }} isEmpty={shortHistory} skeleton={chartSkeleton} empty={{ icon: <ChartLineIcon />, ...needMore }}>
              <ChartContainer config={peakConfig} className="aspect-auto h-64 w-full">
                <LineChart accessibilityLayer data={trends.data?.monthly ?? []} margin={{ top: 8, left: -20, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} domain={[10, 30]} ticks={[10, 15, 20, 25, 30]} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <ReferenceLine y={20} stroke="var(--muted-foreground)" strokeDasharray="5 5" />
                  <Line dataKey="peakShare" type="monotone" stroke="var(--color-peakShare)" strokeWidth={2} dot={{ r: 3, fill: "var(--card)", strokeWidth: 1.5 }} />
                </LineChart>
              </ChartContainer>
            </PanelState>
          </Panel>
        </div>
      </section>
    </>
  )
}
