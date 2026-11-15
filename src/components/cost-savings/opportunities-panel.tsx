"use client"

import * as React from "react"
import { ChevronRightIcon, LightbulbIcon } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { potentialSavings, type SavingsOpportunity } from "@/lib/cost-savings-data"
import { formatNumber } from "@/lib/dashboard-data"

import { EffortBadge, effortMeta } from "./status-badges"

export function OpportunitiesPanel({
  status,
  opportunities,
  error,
  onRetry,
  hint,
}: {
  status: PanelStatus
  opportunities: SavingsOpportunity[]
  error?: string
  onRetry: () => void
  /** Replaces the summed "Potential PKR … / yr" (organisations with their own bills mix kinds, so never sum them). */
  hint?: string
}) {
  const [selected, setSelected] = React.useState<SavingsOpportunity | null>(null)
  const potential = potentialSavings(opportunities)

  return (
    <Panel
      title="Savings Opportunities"
      hint={hint ?? (status === "ready" && potential > 0 ? `Potential PKR ${formatNumber(potential)} / yr` : undefined)}
    >
      <PanelState
        status={status}
        isEmpty={opportunities.length === 0}
        error={error}
        onRetry={onRetry}
        skeleton={
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        }
        empty={{
          icon: <LightbulbIcon />,
          title: "No opportunities yet",
          description: "Run an energy audit to find savings.",
          action: "Run audit",
        }}
      >
        <ItemGroup>
          {opportunities.map((o) => (
            // The row is a button, so a wrapper is the list item.
            <div key={o.id} role="listitem">
              <Item
                variant="outline"
                size="sm"
                className="text-start hover:bg-muted dark:hover:bg-muted/50"
                render={<button type="button" onClick={() => setSelected(o)} />}
              >
                <ItemMedia variant="icon">
                  <LightbulbIcon aria-hidden />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>{o.title}</ItemTitle>
                  <ItemDescription className="tabular-nums">
                    {o.valueLabel ?? `PKR ${formatNumber(o.annualSavings)} est. annual savings`}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <EffortBadge effort={o.effort} />
                  <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
                </ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </PanelState>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {effortMeta[selected.effort].label} to implement
                </DialogDescription>
              </DialogHeader>
              {selected.valueLabel ? (
                <p className="text-sm font-medium tabular-nums">{selected.valueLabel}</p>
              ) : (
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">Est. annual savings</dt>
                    <dd className="font-semibold tabular-nums">PKR {formatNumber(selected.annualSavings)}</dd>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-muted-foreground">Share of total potential</dt>
                      <dd className="font-medium tabular-nums">{Math.round((selected.annualSavings / potential) * 100)}%</dd>
                    </div>
                    <Progress value={(selected.annualSavings / potential) * 100} aria-label="Share of total potential" />
                  </div>
                </dl>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Added to action plan", { description: selected.title })
                    setSelected(null)
                  }}
                >
                  Add to plan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
