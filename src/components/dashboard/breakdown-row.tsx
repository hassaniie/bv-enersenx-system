"use client"

import {
  BatteryChargingIcon,
  CpuIcon,
  FactoryIcon,
  FanIcon,
  FlameIcon,
  FuelIcon,
  HeaterIcon,
  PieChartIcon,
  PlugZapIcon,
  SnowflakeIcon,
  SunIcon,
  UtilityPoleIcon,
  WindIcon,
  type LucideIcon,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { IconTile } from "@/components/reui/icon-tile"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber, type DashboardData } from "@/lib/dashboard-data"
import { cn } from "@/lib/utils"

import { Panel } from "./panel"
import { PanelState, type PanelStatus } from "./panel-state"

type RowProps = {
  status: PanelStatus
  data: DashboardData
  error?: string
  onRetry: () => void
}

// Categorical identity colors, paired for dark mode.
const breakdownConfig = {
  hvac: { label: "HVAC", theme: { light: "var(--color-green-500)", dark: "var(--color-green-400)" } },
  production: { label: "Production", theme: { light: "var(--color-blue-600)", dark: "var(--color-blue-500)" } },
  compressors: { label: "Compressors", theme: { light: "var(--color-amber-500)", dark: "var(--color-amber-400)" } },
  boilers: { label: "Boilers", theme: { light: "var(--color-slate-500)", dark: "var(--color-slate-400)" } },
  lighting: { label: "Lighting", theme: { light: "var(--color-blue-400)", dark: "var(--color-blue-300)" } },
  others: { label: "Others", theme: { light: "var(--color-cyan-500)", dark: "var(--color-cyan-400)" } },
} satisfies ChartConfig

// Same colors as Tailwind classes, for the legend dots outside the chart.
const legendDot: Record<string, string> = {
  hvac: "bg-green-500 dark:bg-green-400",
  production: "bg-blue-600 dark:bg-blue-500",
  compressors: "bg-amber-500 dark:bg-amber-400",
  boilers: "bg-slate-500 dark:bg-slate-400",
  lighting: "bg-blue-400 dark:bg-blue-300",
  others: "bg-cyan-500 dark:bg-cyan-400",
}

const equipmentIcons: Record<string, LucideIcon> = {
  "boiler-1": HeaterIcon,
  chiller: SnowflakeIcon,
  compressor: WindIcon,
  "line-1": FactoryIcon,
  "ahu-b": FanIcon,
}

const utilityStyle: Record<string, { icon: LucideIcon; tile: string; amount: string }> = {
  solar: { icon: SunIcon, tile: "bg-green-600 text-white dark:bg-green-500", amount: "text-green-700 dark:text-green-400" },
  grid: { icon: UtilityPoleIcon, tile: "bg-amber-500 text-white dark:bg-amber-500", amount: "text-amber-700 dark:text-amber-400" },
  generators: { icon: FuelIcon, tile: "bg-red-600 text-white dark:bg-red-500", amount: "text-red-700 dark:text-red-400" },
  batteries: { icon: BatteryChargingIcon, tile: "bg-blue-600 text-white dark:bg-blue-500", amount: "text-blue-700 dark:text-blue-400" },
  gas: { icon: FlameIcon, tile: "bg-cyan-600 text-white dark:bg-cyan-500", amount: "text-cyan-700 dark:text-cyan-400" },
}

const listSkeleton = (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-7 w-full" />
    ))}
  </div>
)

export function BreakdownRow({ status, data, error, onRetry }: RowProps) {
  const { breakdown, equipment, utilities } = data

  return (
    <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @7xl:grid-cols-3">
      <Panel title="Energy breakdown" meta="Today">
        <PanelState
          status={status}
          isEmpty={breakdown.slices.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={
            <div className="flex items-center gap-6">
              <Skeleton className="size-40 shrink-0 rounded-full" />
              {listSkeleton}
            </div>
          }
          empty={{
            icon: <PieChartIcon />,
            title: "No zones mapped",
            description: "Map meters to zones to see the split.",
            action: "Map zones",
          }}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="relative size-44 shrink-0">
              <ChartContainer config={breakdownConfig} className="aspect-square size-44">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
                  <Pie
                    data={breakdown.slices}
                    dataKey="share"
                    nameKey="key"
                    innerRadius={58}
                    outerRadius={86}
                    strokeWidth={2}
                    stroke="var(--card)"
                  >
                    {breakdown.slices.map((s) => (
                      <Cell key={s.key} fill={`var(--color-${s.key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold tracking-tight tabular-nums">
                  {formatNumber(breakdown.totalKwh)}
                </span>
                <span className="text-xs text-muted-foreground">kWh</span>
              </div>
            </div>

            <ul className="flex w-full min-w-0 flex-col gap-2.5 text-sm">
              {breakdown.slices.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", legendDot[s.key])} />
                    <span className="truncate">{breakdownConfig[s.key as keyof typeof breakdownConfig]?.label ?? s.label}</span>
                  </span>
                  <span className="font-medium tabular-nums">{s.share.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-baseline justify-between gap-1.5 border-t pt-3 text-sm">
            <span className="text-muted-foreground">Total zones</span>
            <span className="font-semibold tabular-nums">{String(breakdown.zones).padStart(2, "0")}</span>
          </div>
        </PanelState>
      </Panel>

      <Panel title="Top energy consumers" meta="Today">
        <PanelState
          status={status}
          isEmpty={equipment.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={listSkeleton}
          empty={{
            icon: <CpuIcon />,
            title: "No equipment tracked",
            description: "Add equipment to rank its usage.",
            action: "Add equipment",
          }}
        >
          <div className="flex flex-1 flex-col">
            <div className="grid grid-cols-[1fr_auto] gap-2 pb-2 text-xs text-muted-foreground sm:grid-cols-[1fr_5rem_8rem_3.5rem]">
              <span>Equipment</span>
              <span className="hidden text-end sm:block">kWh</span>
              <span className="hidden sm:block" />
              <span className="text-end">Share</span>
            </div>
            <ul className="flex flex-1 flex-col divide-y text-sm">
              {equipment.map((e) => {
                const Icon = equipmentIcons[e.id] ?? CpuIcon
                return (
                  <li
                    key={e.id}
                    className="grid flex-1 grid-cols-[1fr_auto] items-center gap-2 py-2 sm:grid-cols-[1fr_5rem_8rem_3.5rem]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{e.name}</span>
                    </span>
                    <span className="hidden text-end tabular-nums sm:block">{formatNumber(e.kwh)}</span>
                    <Progress
                      value={(e.share / equipment[0].share) * 100}
                      aria-label={`${e.name} share`}
                      className="hidden sm:flex [&_[data-slot=progress-indicator]]:bg-success"
                    />
                    <span className="text-end font-medium tabular-nums">{e.share.toFixed(1)}%</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </PanelState>
      </Panel>

      <Panel title="Utility overview" meta="Today" className="@3xl:col-span-2 @7xl:col-span-1">
        <PanelState
          status={status}
          isEmpty={utilities.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={listSkeleton}
          empty={{
            icon: <PlugZapIcon />,
            title: "No utilities connected",
            description: "Connect a utility source to track it.",
            action: "Connect utility",
          }}
        >
          <ul className="flex flex-1 flex-col divide-y text-sm">
            {utilities.map((u) => {
              const s = utilityStyle[u.id] ?? utilityStyle.grid
              return (
                <li key={u.id} className="flex flex-1 items-center gap-3 py-2">
                  <IconTile variant="solid" size="sm" className={s.tile} aria-hidden>
                    <s.icon />
                  </IconTile>
                  <span className="min-w-0 flex-1 truncate font-medium">{u.name}</span>
                  <span className={cn("tabular-nums", s.amount)}>
                    {u.amount} <span className="text-xs">{u.unit}</span>
                  </span>
                  <span className="w-24 text-end tabular-nums">
                    <span className="text-xs text-muted-foreground">PKR </span>
                    {u.cost}
                  </span>
                </li>
              )
            })}
          </ul>
        </PanelState>
      </Panel>
    </div>
  )
}
