"use client"

import { ArrowUpIcon, CheckIcon, FlagIcon, ShieldAlertIcon, SparklesIcon, SunIcon, TrendingUpIcon, type LucideIcon } from "lucide-react"

import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Anomaly, AnomalyStatus, Insight, InsightTone, Severity } from "@/lib/analytics-data"

type StateProps = { status: PanelStatus; error?: string; onRetry: () => void }

const listSkeleton = (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)

/* -------------------------------- Insights ------------------------------- */

const insightIcons: Record<Insight["icon"], LucideIcon> = {
  up: ArrowUpIcon,
  flag: FlagIcon,
  trend: TrendingUpIcon,
  sun: SunIcon,
  check: CheckIcon,
}

// The soft tile tints from currentColor, so a state text pair retints it (icon only; copy stays foreground).
const toneText: Record<InsightTone, string> = {
  warning: "text-warning-foreground dark:text-warning",
  destructive: "text-destructive-foreground dark:text-destructive",
  info: "text-info-foreground dark:text-info",
  success: "text-success-foreground dark:text-success",
}

export function InsightsPanel({ insights, ...state }: StateProps & { insights: Insight[] }) {
  return (
    <Panel title="AI-Generated Insights" hint="Operational recommendations">
      <PanelState
        {...state}
        isEmpty={insights.length === 0}
        skeleton={listSkeleton}
        empty={{
          icon: <SparklesIcon />,
          title: "No insights yet",
          description: "Insights appear after a week of data.",
          action: "Check meters",
        }}
      >
        <ItemGroup className="flex-1 justify-between">
          {insights.map((i) => {
            const Icon = insightIcons[i.icon]
            return (
              <Item key={i.id} size="xs" role="listitem">
                <ItemMedia>
                  <IconTile variant="soft" size="sm" className={toneText[i.tone]} aria-hidden>
                    <Icon />
                  </IconTile>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>{i.title}</ItemTitle>
                  <ItemDescription>{i.detail}</ItemDescription>
                </ItemContent>
              </Item>
            )
          })}
        </ItemGroup>
      </PanelState>
    </Panel>
  )
}

/* ------------------------------- Anomalies ------------------------------- */

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const statusMeta: Record<AnomalyStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: "New", variant: "destructive-light" },
  investigating: { label: "Investigating", variant: "warning-light" },
  resolved: { label: "Resolved", variant: "success-light" },
}

// Inline status text pair from the ReUI color recipes.
const severityText: Record<Severity, string> = {
  critical: "text-destructive-foreground dark:text-destructive",
  warning: "text-warning-foreground dark:text-warning",
}
const severityDot: Record<Severity, string> = { critical: "bg-destructive", warning: "bg-warning" }

export function AnomaliesPanel({ anomalies, ...state }: StateProps & { anomalies: Anomaly[] }) {
  return (
    <Panel
      title="Anomaly Detection & Triage"
      hint="Last 7 days"
      footer={
        state.status === "ready" && anomalies.length > 0 ? (
          <>
            <span className="tabular-nums">{anomalies.length} in the last 7 days</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toast.info("The full anomaly log comes with Alarms & Alerts", { description: "That page isn’t built yet." })}
            >
              View all anomalies
            </Button>
          </>
        ) : undefined
      }
      meta={
        state.status === "ready" && anomalies.length > 0 ? (
          <span className="flex items-center gap-3">
            {(["critical", "warning"] as Severity[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 capitalize">
                <span aria-hidden className={cn("size-2 rounded-full", severityDot[s])} />
                {s}
              </span>
            ))}
          </span>
        ) : undefined
      }
    >
      <PanelState
        {...state}
        isEmpty={anomalies.length === 0}
        skeleton={listSkeleton}
        empty={{
          icon: <ShieldAlertIcon />,
          title: "No anomalies",
          description: "Nothing unusual in the last 7 days.",
          action: "Adjust thresholds",
        }}
      >
        <ul className="flex flex-col divide-y">
          {anomalies.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", severityDot[a.severity])} />
                  <span className="truncate">{a.location}</span>
                  <span className="sr-only">({a.severity})</span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="shrink-0">{a.when}</span>
                  <span aria-hidden className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                  <span className="truncate">{a.kind}</span>
                </span>
              </div>
              <span className={cn("w-12 text-end text-sm font-semibold tabular-nums", severityText[a.severity])}>
                +{a.deviation}%
              </span>
              <span className="flex w-24 justify-end">
                <Badge variant={statusMeta[a.status].variant}>{statusMeta[a.status].label}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </PanelState>
    </Panel>
  )
}

