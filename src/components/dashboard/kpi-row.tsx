"use client"

import {
  GaugeIcon,
  HandCoinsIcon,
  TrendingUpIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { Kpi } from "@/lib/dashboard-data"
import { cn } from "@/lib/utils"

import { PanelState, type PanelStatus } from "./panel-state"
import { Segments } from "./segments"

const dashboardIcons: Record<string, LucideIcon> = {
  power: ZapIcon,
  energy: TrendingUpIcon,
  cost: HandCoinsIcon,
  demand: GaugeIcon,
}

// The note's text color, per tone.
const tone = {
  neutral: { note: "text-muted-foreground" },
  info: { note: "text-info-foreground dark:text-info" },
  warning: { note: "text-warning-foreground dark:text-warning" },
  destructive: { note: "text-destructive-foreground dark:text-destructive" },
  success: { note: "text-success-foreground dark:text-success" },
} as const

const grid = "grid grid-cols-1 gap-2 @md:grid-cols-2 @5xl:grid-cols-4"
/** Two columns from phone width, for KPIs that carry a short value. */
const compactGrid = "grid grid-cols-2 gap-2 @5xl:grid-cols-4"

export function KpiRow({
  status,
  kpis,
  error,
  onRetry,
  icons = dashboardIcons,
  compact,
  className,
  empty = {
    icon: <ZapIcon />,
    title: "No meters connected",
    description: "Connect a meter to see live metrics.",
    action: "Add meter",
  },
}: {
  status: PanelStatus
  kpis: Kpi[]
  error?: string
  onRetry: () => void
  /** Icon per KPI id. */
  icons?: Record<string, LucideIcon>
  empty?: React.ComponentProps<typeof PanelState>["empty"]
  /** Two columns on phones; use with `short` values. */
  compact?: boolean
  className?: string
}) {
  const g = compact ? compactGrid : grid
  return (
    <section aria-label="Key metrics" className={className}>
      <PanelState
        status={status}
        isEmpty={kpis.length === 0}
        error={error}
        onRetry={onRetry}
        skeleton={
          <div className={g}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} size="sm">
                <CardContent className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
        empty={empty}
      >
        <div className={g}>
          {kpis.map((kpi) => {
            const Icon = icons[kpi.id] ?? ZapIcon
            const t = tone[kpi.tone]
            return (
              <Card key={kpi.id} size="sm">
                <CardContent className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm text-muted-foreground">{kpi.label}</span>
                    <span className={cn("flex items-baseline gap-1.5", kpi.short && "hidden @md:flex")}>
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">
                        {kpi.value}
                      </span>
                      {kpi.unit && <span className="text-xs text-muted-foreground">{kpi.unit}</span>}
                    </span>
                    {kpi.short && (
                      <span className="text-xl font-semibold tracking-tight tabular-nums @md:hidden">{kpi.short}</span>
                    )}
                    {kpi.progress !== undefined ? (
                      <Progress value={kpi.progress} aria-label={`${kpi.label} ${kpi.value}`} />
                    ) : (
                      <span className={cn("flex min-w-0 items-center gap-1.5 text-xs", compact && "flex-wrap gap-y-0.5 *:whitespace-normal @md:flex-nowrap @md:*:whitespace-nowrap", t.note)}>
                        <Segments parts={kpi.note} />
                      </span>
                    )}
                  </div>
                  <Icon aria-hidden className={cn("size-4 shrink-0 text-muted-foreground", compact && "hidden @md:block")} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </PanelState>
    </section>
  )
}
