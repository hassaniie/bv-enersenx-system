"use client"

import * as React from "react"
import { ActivityIcon, ChartSplineIcon, PiggyBankIcon, RotateCcwIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPkr, type DashboardData, type PowerQualityRow } from "@/lib/dashboard-data"

import { Panel } from "./panel"
import { PanelState, type PanelStatus } from "./panel-state"

type RowProps = {
  status: PanelStatus
  data: DashboardData
  error?: string
  onRetry: () => void
}

const intensityConfig = {
  value: { label: "kWh / unit", theme: { light: "var(--color-violet-500)", dark: "var(--color-violet-400)" } },
} satisfies ChartConfig

const savingConfig = {
  value: { label: "Savings (PKR M)", color: "var(--success)" },
} satisfies ChartConfig

const numeric = {
  headerClassName: "text-end [&>div]:justify-end",
  cellClassName: "text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-10" />,
}

export function BottomRow({ status, data, error, onRetry }: RowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @7xl:grid-cols-[1.25fr_1fr_1fr]">
      <PowerQuality status={status} rows={data.powerQuality} error={error} onRetry={onRetry} />

      <Panel title="Energy intensity" hint="kWh / unit produced" meta="Monthly">
        <PanelState
          status={status}
          isEmpty={data.intensity.trend.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={<Skeleton className="h-64 w-full" />}
          empty={{
            icon: <ChartSplineIcon />,
            title: "No production data",
            description: "Log production to compute intensity.",
            action: "Log production",
          }}
        >
          <div className="grid grid-cols-3 items-center gap-2 text-center">
            <Stat label="This month" value={data.intensity.thisMonth.toFixed(3)} unit="kWh / unit" />
            <Stat label="Last month" value={data.intensity.lastMonth.toFixed(3)} unit="kWh / unit" divided />
            <Stat label="Improvement" value={`${data.intensity.improvement}%`} unit="vs last month" divided tone />
          </div>
          <ChartContainer config={intensityConfig} className="aspect-auto h-44 w-full">
            <AreaChart data={data.intensity.trend} margin={{ top: 8, left: -24, right: 8 }}>
              <defs>
                <linearGradient id="fill-intensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="url(#fill-intensity)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-value)" }} />
            </AreaChart>
          </ChartContainer>
        </PanelState>
      </Panel>

      <Panel title="Energy saving trend" meta="2026" className="@3xl:col-span-2 @7xl:col-span-1">
        <PanelState
          status={status}
          isEmpty={data.savingTrend.trend.length === 0}
          error={error}
          onRetry={onRetry}
          skeleton={<Skeleton className="h-64 w-full" />}
          empty={{
            icon: <PiggyBankIcon />,
            title: "No savings yet",
            description: "Savings show once a baseline is set.",
            action: "Set baseline",
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Total savings</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground">PKR</span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatPkr(data.savingTrend.total)}
              </span>
            </span>
          </div>
          <ChartContainer config={savingConfig} className="aspect-auto h-48 w-full">
            <AreaChart data={data.savingTrend.trend} margin={{ top: 8, left: -24, right: 8 }}>
              <defs>
                <linearGradient id="fill-saving" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 25]} ticks={[0, 5, 10, 15, 20, 25]} tickFormatter={(v) => `${v}M`} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area dataKey="value" type="linear" stroke="var(--color-value)" fill="url(#fill-saving)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-value)" }} />
            </AreaChart>
          </ChartContainer>
        </PanelState>
      </Panel>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  divided,
  tone,
}: {
  label: string
  value: string
  unit: string
  divided?: boolean
  tone?: boolean
}) {
  return (
    <div className="flex min-w-0 items-stretch gap-2">
      {divided && <Separator orientation="vertical" />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span
          className={
            tone
              ? "text-xl font-semibold tracking-tight tabular-nums text-success-foreground dark:text-success"
              : "text-xl font-semibold tracking-tight tabular-nums"
          }
        >
          {value}
        </span>
        <span className="truncate text-xs text-info-foreground dark:text-info">{unit}</span>
      </div>
    </div>
  )
}

function PowerQuality({
  status,
  rows,
  error,
  onRetry,
}: {
  status: PanelStatus
  rows: PowerQualityRow[]
  error?: string
  onRetry: () => void
}) {
  const columns = React.useMemo<ColumnDef<DataGridFeatures, PowerQualityRow>[]>(
    () => [
      {
        accessorKey: "parameter",
        header: "Parameter",
        meta: { skeleton: <Skeleton className="h-4 w-24" /> },
      },
      { accessorKey: "l1", header: "L1", meta: numeric },
      { accessorKey: "l2", header: "L2", meta: numeric },
      { accessorKey: "l3", header: "L3", meta: numeric },
      {
        accessorKey: "avg",
        header: "Avg",
        meta: { ...numeric, cellClassName: "text-end tabular-nums font-semibold" },
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    data: status === "ready" ? rows : [],
    columns,
    getRowId: (row) => row.id,
  })

  const emptyMessage =
    status === "error" ? (
      <div className="flex flex-col items-center gap-2 py-6 text-sm">
        <span className="text-destructive-foreground dark:text-destructive">
          {error ?? "Couldn’t load power quality."}
        </span>
        <Button size="xs" variant="outline" onClick={onRetry}>
          <RotateCcwIcon data-icon="inline-start" />
          Retry
        </Button>
      </div>
    ) : (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ActivityIcon />
          </EmptyMedia>
          <EmptyTitle>No phase readings</EmptyTitle>
          <EmptyDescription>Connect a power analyser to see L1–L3.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline">
            Connect analyser
          </Button>
        </EmptyContent>
      </Empty>
    )

  return (
    <Frame spacing="default" className="min-w-0">
      <FrameHeader className="flex-row items-center justify-between gap-2">
        <FrameTitle>Power quality</FrameTitle>
        <span className="text-xs text-muted-foreground">Live</span>
      </FrameHeader>
      <FramePanel className="p-0">
        <DataGrid
          table={table}
          recordCount={rows.length}
          className="h-full"
          isLoading={status === "loading"}
          emptyMessage={emptyMessage}
          tableLayout={{ headerBackground: true, rowBorder: true, stripped: true, width: "auto" }}
          tableClassNames={{ base: "h-full w-full min-w-[480px]" }}
        >
          <DataGridScrollArea className="h-full">
            <DataGridTable />
          </DataGridScrollArea>
        </DataGrid>
      </FramePanel>
      {status === "ready" && rows.length > 0 && (
        <FrameFooter className="flex-row flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="success-light">Within limits</Badge>
            <span>THD under 5%</span>
            <span aria-hidden className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
            <span>voltage within ±1%</span>
          </span>
          <span className="text-xs text-muted-foreground">Updated 2 mins ago</span>
        </FrameFooter>
      )}
    </Frame>
  )
}
