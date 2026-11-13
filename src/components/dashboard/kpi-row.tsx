"use client"

import {
  GaugeIcon,
  HandCoinsIcon,
  TrendingUpIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Kpi } from "@/lib/dashboard-data"
import { cn } from "@/lib/utils"

import { PanelState, type PanelStatus } from "./panel-state"

const icons: Record<string, LucideIcon> = {
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

export function KpiRow({
  status,
  kpis,
  error,
  onRetry,
}: {
  status: PanelStatus
  kpis: Kpi[]
  error?: string
  onRetry: () => void
}) {
  return (
    <section aria-label="Key metrics">
      <PanelState
        status={status}
        isEmpty={kpis.length === 0}
        error={error}
        onRetry={onRetry}
        skeleton={
          <div className={grid}>
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
        empty={{
          icon: <ZapIcon />,
          title: "No meters connected",
          description: "Connect a meter to see live metrics.",
          action: "Add meter",
        }}
      >
        <div className={grid}>
          {kpis.map((kpi) => {
            const Icon = icons[kpi.id] ?? ZapIcon
            const t = tone[kpi.tone]
            return (
              <Card key={kpi.id} size="sm">
                <CardContent className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm text-muted-foreground">{kpi.label}</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">
                        {kpi.value}
                      </span>
                      <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                    </span>
                    <span className={cn("truncate text-xs", t.note)}>{kpi.note}</span>
                  </div>
                  <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </PanelState>
    </section>
  )
}
