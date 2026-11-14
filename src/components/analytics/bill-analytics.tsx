"use client"

import { useRouter } from "next/navigation"
import { ActivityIcon, ChartColumnIcon, ChartLineIcon, FileTextIcon, GaugeIcon, LeafIcon, PercentIcon, ZapIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { KpiRow } from "@/components/dashboard/kpi-row"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { getBillAnalytics, loadScenario, TREND_MIN_BILLS, useApiQuery, type Site } from "@/lib/api"

import { InsightsPanel } from "./analytics-lists"

const kpiIcons = { efficiency: GaugeIcon, peak: ZapIcon, carbon: LeafIcon, anomalies: PercentIcon }

const kwhConfig = { kwh: { label: "Units", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } } } satisfies ChartConfig
const peakConfig = { peakShare: { label: "Peak share", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } } } satisfies ChartConfig

const chartSkeleton = <Skeleton className="h-64 w-full" />

/** Analytics a site can have from bills alone; minute-level analytics need a meter (later phase). */
export function BillAnalytics({ site }: { site: Site }) {
  const router = useRouter()
  const q = useApiQuery(() => getBillAnalytics(site.id), [site.id])
  const state = { status: q.status, error: q.error, onRetry: q.retry }
  const d = q.data
  const count = d?.billCount ?? 0
  const upload = () => router.push("/bills/upload/")
  const needMore = {
    title: "Not enough months yet",
    description: `Trends need ${TREND_MIN_BILLS} months of bills. You have ${count}.`,
    action: "Upload bills",
    onAction: upload,
  }

  return (
    <>
      <KpiRow
        {...state}
        kpis={d?.kpis ?? []}
        icons={kpiIcons}
        empty={{ icon: <FileTextIcon />, title: "No bills yet", description: "Upload a bill to see intensity, demand and carbon.", action: "Upload a bill", onAction: upload }}
      />
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Monthly Consumption" hint="kWh per billing month">
          <PanelState {...state} isEmpty={count < TREND_MIN_BILLS} skeleton={chartSkeleton} empty={{ icon: <ChartColumnIcon />, ...needMore }}>
            <ChartContainer config={kwhConfig} className="aspect-auto h-64 w-full">
              <BarChart accessibilityLayer data={d?.monthly ?? []} margin={{ top: 8, left: 0, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="kwh" fill="var(--color-kwh)" maxBarSize={32} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </PanelState>
        </Panel>
        <InsightsPanel {...state} title="Bill Insights" hint="From your latest bill check" insights={d?.insights ?? []} />
      </div>
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-2">
        <Panel title="Peak-Hour Share" hint={["% of units in peak hours", "20% suggested"]}>
          <PanelState {...state} isEmpty={count < TREND_MIN_BILLS} skeleton={chartSkeleton} empty={{ icon: <ChartLineIcon />, ...needMore }}>
            <ChartContainer config={peakConfig} className="aspect-auto h-64 w-full">
              <LineChart accessibilityLayer data={d?.monthly ?? []} margin={{ top: 8, left: -20, right: 12 }}>
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
        <Panel title="Live Analytics" hint="Load forecast, demand heatmap, anomalies">
          <PanelState
            status="ready"
            isEmpty
            skeleton={null}
            empty={{
              icon: <ActivityIcon />,
              title: "Needs a live meter",
              description: "Forecasts, the demand heatmap and anomaly detection use minute-by-minute readings. They come with meters in a later phase.",
              action: "See them on the sample organisation",
              onAction: async () => {
                await loadScenario("sample")
                router.push("/analytics/")
              },
            }}
          >
            {null}
          </PanelState>
        </Panel>
      </div>
    </>
  )
}
