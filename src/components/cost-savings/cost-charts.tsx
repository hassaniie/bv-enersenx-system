"use client"

import * as React from "react"
import { ChartColumnStackedIcon, ChartSplineIcon } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Panel } from "@/components/dashboard/panel"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { CostBreakdownPoint, CostSavingsData } from "@/lib/cost-savings-data"

type RowProps = {
  status: PanelStatus
  data: CostSavingsData
  error?: string
  onRetry: () => void
}

// Categorical identity colors (energy sources, years), paired for dark mode.
const breakdownConfig = {
  grid: { label: "Grid", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
  genset: { label: "Genset", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
  solar: { label: "Solar", theme: { light: "var(--color-cyan-500)", dark: "var(--color-cyan-400)" } },
  gas: { label: "Gas", theme: { light: "var(--color-amber-400)", dark: "var(--color-amber-300)" } },
} satisfies ChartConfig

const comparisonConfig = {
  prev: { label: "2024 (Prev)", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
  current: { label: "2025 (Current)", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
} satisfies ChartConfig

const sources = ["grid", "genset", "solar", "gas"] as const

const periods = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
]

const round1 = (n: number) => Math.round(n * 10) / 10

function toQuarters(months: CostBreakdownPoint[]): CostBreakdownPoint[] {
  const quarters: CostBreakdownPoint[] = []
  for (let q = 0; q * 3 < months.length; q++) {
    const slice = months.slice(q * 3, q * 3 + 3)
    quarters.push({
      month: `Q${q + 1}`,
      grid: round1(slice.reduce((s, m) => s + m.grid, 0)),
      genset: round1(slice.reduce((s, m) => s + m.genset, 0)),
      solar: round1(slice.reduce((s, m) => s + m.solar, 0)),
      gas: round1(slice.reduce((s, m) => s + m.gas, 0)),
    })
  }
  return quarters
}

const chartSkeleton = <Skeleton className="h-64 w-full" />

export function CostChartsRow({ status, data, error, onRetry }: RowProps) {
  const [period, setPeriod] = React.useState("monthly")
  const breakdown = React.useMemo(
    () => (period === "quarterly" ? toQuarters(data.breakdown) : data.breakdown),
    [period, data.breakdown]
  )

  return (
    <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[1.3fr_1fr]">
      <Panel
        title="Monthly Cost Breakdown"
        hint="PKR (Lakhs) · 2025 consolidated"
        meta={
          <Select items={periods} value={period} onValueChange={(v) => v && setPeriod(v)}>
            <SelectTrigger size="sm" aria-label="Breakdown period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <PanelState
          status={status}
          isEmpty={data.breakdown.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={chartSkeleton}
          empty={{
            icon: <ChartColumnStackedIcon />,
            title: "No cost data yet",
            description: "Costs appear once a bill is imported.",
            action: "Import bill",
          }}
        >
          <ChartContainer config={breakdownConfig} className="aspect-auto h-64 w-full">
            <BarChart accessibilityLayer data={breakdown} margin={{ top: 8, left: -20, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              {sources.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="cost"
                  fill={`var(--color-${key})`}
                  maxBarSize={32}
                  radius={i === sources.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        </PanelState>
      </Panel>

      <Panel title="Cost Comparison" hint="2025 vs 2024 · PKR millions">
        <PanelState
          status={status}
          isEmpty={data.comparison.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={chartSkeleton}
          empty={{
            icon: <ChartSplineIcon />,
            title: "No history to compare",
            description: "Two years of bills are needed.",
            action: "Import history",
          }}
        >
          <ChartContainer config={comparisonConfig} className="aspect-auto h-64 w-full">
            <AreaChart accessibilityLayer data={data.comparison} margin={{ top: 8, left: -20, right: 12 }}>
              <defs>
                <linearGradient id="fill-prev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-prev)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-prev)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fill-current" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-current)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-current)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} domain={[0, "auto"]} />
              <ChartTooltip cursor={{ strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
              <Area
                dataKey="prev"
                type="linear"
                stroke="var(--color-prev)"
                fill="url(#fill-prev)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--card)", strokeWidth: 1.5 }}
              />
              <Area
                dataKey="current"
                type="linear"
                stroke="var(--color-current)"
                fill="url(#fill-current)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--card)", strokeWidth: 1.5 }}
              />
              <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </PanelState>
      </Panel>
    </div>
  )
}
