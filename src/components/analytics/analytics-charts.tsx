"use client"

import * as React from "react"
import { ChartLineIcon, ChartScatterIcon, ChartSplineIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import { Badge } from "@/components/reui/badge"
import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
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
import {
  buildings,
  regression,
  type Building,
  type ForecastPoint,
  type TempPoint,
  type TrendPoint,
} from "@/lib/analytics-data"

type StateProps = { status: PanelStatus; error?: string; onRetry: () => void }

const chartSkeleton = <Skeleton className="h-64 w-full" />

function PanelSelect<T extends string>({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  items: { value: T; label: string }[]
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger size="sm" aria-label={label}>
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
  )
}

/* -------------------------------- Forecast ------------------------------- */

// Categorical identity colors, paired for dark mode.
const forecastConfig = {
  predicted: { label: "Predicted", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
  actual: { label: "Actual", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
} satisfies ChartConfig

const forecastRanges = [
  { value: "all", label: "Aug 1–23" },
  { value: "10", label: "Last 10 days" },
]

export function ForecastPanel({ data, ...state }: StateProps & { data: ForecastPoint[] }) {
  const [range, setRange] = React.useState("all")
  const points = range === "all" ? data : data.slice(-5) // every 2 days: last 5 points = 10 days

  return (
    <Panel
      title="Predictive Energy Forecast"
      hint="Actual vs AI-predicted load"
      meta={<PanelSelect label="Forecast range" value={range} onChange={setRange} items={forecastRanges} />}
    >
      <PanelState
        {...state}
        isEmpty={data.length === 0}
        skeleton={chartSkeleton}
        empty={{
          icon: <ChartSplineIcon />,
          title: "No forecast yet",
          description: "The model needs 14 days of readings.",
          action: "Check meters",
        }}
      >
        <ChartContainer config={forecastConfig} className="aspect-auto min-h-64 w-full flex-1">
          <AreaChart accessibilityLayer data={points} margin={{ top: 8, left: -20, right: 12 }}>
            <defs>
              <linearGradient id="fill-predicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-predicted)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-predicted)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fill-actual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-actual)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-actual)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area dataKey="predicted" type="monotone" stroke="var(--color-predicted)" fill="url(#fill-predicted)" strokeWidth={2} dot={{ r: 3, fill: "var(--card)", strokeWidth: 1.5 }} />
            <Area dataKey="actual" type="monotone" stroke="var(--color-actual)" fill="url(#fill-actual)" strokeWidth={2} dot={{ r: 3, fill: "var(--card)", strokeWidth: 1.5 }} />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </PanelState>
    </Panel>
  )
}

/* ------------------------- Energy vs temperature ------------------------- */

const correlationConfig = {
  kwh: { label: "Consumption", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
} satisfies ChartConfig

const buildingOptions: { value: "all" | Building; label: string }[] = [{ value: "all", label: "All buildings" }, ...buildings]

export function CorrelationPanel({ data, ...state }: StateProps & { data: TempPoint[] }) {
  const [building, setBuilding] = React.useState<"all" | Building>("all")
  const points = building === "all" ? data : data.filter((p) => p.building === building)
  const fit = regression(points)
  const temps = points.map((p) => p.temp)
  const [minT, maxT] = [Math.min(...temps), Math.max(...temps)]

  return (
    <Panel
      title="Energy vs Temperature"
      hint="Daily kWh against outdoor °C"
      meta={
        <>
          {state.status === "ready" && fit && <Badge variant="outline">R² = {fit.r2.toFixed(2)}</Badge>}
          <PanelSelect label="Building" value={building} onChange={setBuilding} items={buildingOptions} />
        </>
      }
    >
      <PanelState
        {...state}
        isEmpty={data.length === 0}
        skeleton={chartSkeleton}
        empty={{
          icon: <ChartScatterIcon />,
          title: "No weather data",
          description: "Connect a weather feed to correlate load.",
          action: "Connect feed",
        }}
      >
        <ChartContainer config={correlationConfig} className="aspect-auto h-64 w-full">
          <ScatterChart accessibilityLayer margin={{ top: 8, left: -12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="temp"
              name="Temperature"
              unit="°C"
              domain={["dataMin - 1", "dataMax + 1"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis type="number" dataKey="kwh" name="Consumption" unit=" kWh" tickLine={false} axisLine={false} width={72} />
            <ZAxis range={[40, 40]} />
            <ChartTooltip cursor={{ strokeDasharray: "4 4" }} content={<ChartTooltipContent hideLabel />} />
            <Scatter data={points} dataKey="kwh" fill="var(--color-kwh)" fillOpacity={0.75} />
            {fit && (
              <ReferenceLine
                segment={[
                  { x: minT, y: Math.round(fit.offset + fit.slope * minT) },
                  { x: maxT, y: Math.round(fit.offset + fit.slope * maxT) },
                ]}
                stroke="var(--muted-foreground)"
                strokeDasharray="5 5"
                ifOverflow="extendDomain"
              />
            )}
          </ScatterChart>
        </ChartContainer>
      </PanelState>
    </Panel>
  )
}

/* ------------------------------ 90-day trend ----------------------------- */

const trendConfig = {
  raw: { label: "Daily", theme: { light: "var(--color-cyan-500)", dark: "var(--color-cyan-400)" } },
  ma7: { label: "7-day avg", theme: { light: "var(--color-rose-400)", dark: "var(--color-rose-300)" } },
  ma30: { label: "30-day avg", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
} satisfies ChartConfig

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
const fmtDate = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`))

export function TrendPanel({ data, ...state }: StateProps & { data: TrendPoint[] }) {
  return (
    <Panel title="90-Day Trend & Moving Averages" hint="kWh per day · 7D and 30D baselines">
      <PanelState
        {...state}
        isEmpty={data.length === 0}
        skeleton={chartSkeleton}
        empty={{
          icon: <ChartLineIcon />,
          title: "Not enough history",
          description: "Trends appear after 30 days of readings.",
          action: "Check meters",
        }}
      >
        <ChartContainer config={trendConfig} className="aspect-auto h-64 w-full">
          <ComposedChart accessibilityLayer data={data} margin={{ top: 8, left: -20, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={fmtDate} />
            <YAxis tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" labelFormatter={(v) => fmtDate(String(v))} />} />
            <Line dataKey="raw" type="linear" stroke="var(--color-raw)" strokeOpacity={0.6} strokeWidth={1} dot={false} />
            <Line dataKey="ma7" type="monotone" stroke="var(--color-ma7)" strokeWidth={2} dot={false} connectNulls />
            <Line dataKey="ma30" type="monotone" stroke="var(--color-ma30)" strokeWidth={2} dot={false} connectNulls />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
          </ComposedChart>
        </ChartContainer>
      </PanelState>
    </Panel>
  )
}
