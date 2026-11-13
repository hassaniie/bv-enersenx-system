"use client"

import { Grid3x3Icon } from "lucide-react"

import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { heatDays, type HeatCell, type HeatLevel } from "@/lib/analytics-data"
import { formatNumber } from "@/lib/dashboard-data"
import { cn } from "@/lib/utils"

// A sequential ramp on one identity hue (data intensity, not a state), paired for dark mode.
const levelClass: Record<HeatLevel, string> = {
  0: "bg-rose-500/15 dark:bg-rose-400/15",
  1: "bg-rose-500/50 dark:bg-rose-400/45",
  2: "bg-rose-500 dark:bg-rose-400",
}
const levelLabel: Record<HeatLevel, string> = { 0: "Low", 1: "Medium", 2: "High" }

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`
const slots = Array.from({ length: 12 }, (_, i) => i * 2)

export function HeatmapPanel({
  cells,
  status,
  error,
  onRetry,
}: {
  cells: HeatCell[]
  status: PanelStatus
  error?: string
  onRetry: () => void
}) {
  return (
    <Panel title="Load Profile Heatmap" hint="Avg kW per 2-hour slot, this week">
      <PanelState
        status={status}
        error={error}
        onRetry={onRetry}
        isEmpty={cells.length === 0}
        skeleton={<Skeleton className="h-56 w-full" />}
        empty={{
          icon: <Grid3x3Icon />,
          title: "No hourly readings",
          description: "Interval meters feed this view.",
          action: "Check meters",
        }}
      >
        <div className="flex flex-1 flex-col justify-center gap-3">
          <div
            role="group"
            aria-label="Load by day and time"
            className="grid grid-cols-[2.5rem_repeat(12,minmax(0,1fr))] gap-1"
          >
            {heatDays.map((day) => (
              <div key={day} className="contents">
                <span className="self-center text-xs text-muted-foreground">{day}</span>
                {slots.map((hour) => {
                  const cell = cells.find((c) => c.day === day && c.hour === hour)
                  if (!cell) return <span key={hour} />
                  const label = `${day} ${pad(hour)}–${pad(hour + 2)}: ${formatNumber(cell.kw)} kW (${levelLabel[cell.level]})`
                  return (
                    <Tooltip key={hour}>
                      <TooltipTrigger
                        render={<span role="img" aria-label={label} className={cn("h-6 rounded-sm", levelClass[cell.level])} />}
                      />
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
            <span />
            {slots.map((hour) => (
              <span key={hour} className="text-center text-xs text-muted-foreground tabular-nums">
                {hour % 4 === 0 ? pad(hour) : ""}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Low</span>
            {([0, 1, 2] as HeatLevel[]).map((l) => (
              <span key={l} aria-hidden className={cn("size-3 rounded-sm", levelClass[l])} />
            ))}
            <span>High</span>
          </div>
        </div>
      </PanelState>
    </Panel>
  )
}
