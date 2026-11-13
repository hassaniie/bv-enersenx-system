"use client"

import { CalendarClockIcon, PlusIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import type { Frequency, Schedule } from "@/lib/reports-data"

const frequencyLabels: Record<Frequency, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" }

export function SchedulesPanel({
  status,
  schedules,
  error,
  onRetry,
  onAdd,
  onToggle,
}: {
  status: PanelStatus
  schedules: Schedule[]
  error?: string
  onRetry: () => void
  onAdd: () => void
  onToggle: (id: string, enabled: boolean) => void
}) {
  return (
    <Panel
      title="Scheduled Reports"
      meta={
        <Button size="sm" variant="ghost" onClick={onAdd}>
          <PlusIcon data-icon="inline-start" />
          Add schedule
        </Button>
      }
      footer={status === "ready" && schedules.length > 0 ? <span>All times in PKT (UTC+5)</span> : undefined}
    >
      <PanelState
        status={status}
        isEmpty={schedules.length === 0}
        error={error}
        onRetry={onRetry}
        skeleton={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        }
        empty={{
          icon: <CalendarClockIcon />,
          title: "No schedules",
          description: "Run a report automatically on a schedule.",
          action: "Add schedule",
          onAction: onAdd,
        }}
      >
        <ul className="flex flex-1 flex-col justify-between divide-y">
          {schedules.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`schedule-${s.id}`} className="min-w-0 truncate text-sm font-medium">
                  {s.name}
                </label>
                <Switch
                  id={`schedule-${s.id}`}
                  checked={s.enabled}
                  onCheckedChange={(checked) => onToggle(s.id, checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Badge variant="outline">{frequencyLabels[s.frequency]}</Badge>
                  <span className="truncate text-xs text-muted-foreground">
                    {s.enabled ? `Next: ${s.next}` : "Paused"}
                  </span>
                </span>
                <span
                  role="group"
                  className="flex shrink-0 items-center gap-1"
                  aria-label={`Recipients: ${s.recipients.map((p) => p.name).join(", ")}`}
                >
                  {s.recipients.map((p) => (
                    <Avatar key={p.initials} size="sm" aria-hidden>
                      <AvatarFallback>{p.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </PanelState>
    </Panel>
  )
}
