"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, ListChecksIcon } from "lucide-react"

import { BudgetDialog } from "@/components/dashboard/budget-dialog"
import { InviteDialog } from "@/components/dashboard/invite-dialog"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { can, getChecklist, getMe, useApiQuery, useStoreValue, type ChecklistItem, type Site } from "@/lib/api"
import { cn } from "@/lib/utils"

/**
 * Setup progress (principles.md U16): done steps first with their check,
 * "2 of 4 done", each open step saying what it unlocks. Hidden once complete.
 * References: Searchable, Wix and Square getting-started lists.
 */
export function SetupChecklist({ site, latestBill }: { site: Site; latestBill?: number }) {
  const q = useApiQuery(() => getChecklist(site.id), [site.id])
  const role = useStoreValue(() => getMe()?.role)
  const [dialog, setDialog] = React.useState<"invite" | "budget" | null>(null)
  const items = q.data ?? []
  const done = items.filter((c) => c.done).length
  if (q.status === "ready" && items.length > 0 && done === items.length) return null

  const actions: Partial<Record<ChecklistItem["id"], React.ReactNode>> = {
    bills: (
      <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/bills/upload/" />}>
        Upload a bill
      </Button>
    ),
    invite: (
      <Button size="sm" variant="outline" onClick={() => setDialog("invite")}>
        Invite
      </Button>
    ),
    budget: (
      <Button size="sm" variant="outline" onClick={() => setDialog("budget")}>
        Set budget
      </Button>
    ),
  }

  return (
    <>
      <Panel title="Set up" hint={items.length ? `${done} of ${items.length} done` : undefined}>
        {items.length > 0 && <Progress value={(done / items.length) * 100} aria-label={`Setup ${done} of ${items.length} done`} />}
        <PanelState
          status={q.status}
          error={q.error}
          onRetry={q.retry}
          isEmpty={items.length === 0}
          skeleton={
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          }
          empty={{ icon: <ListChecksIcon />, title: "All set up", description: "Nothing left to set up for this site.", action: "View bills" }}
        >
          <ItemGroup role="list" aria-label="Setup steps">
            {items.map((c) => (
              <Item key={c.id} variant="outline" size="sm" role="listitem">
                <ItemMedia>
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border",
                      c.done ? "border-transparent bg-primary text-primary-foreground" : "border-dashed text-muted-foreground"
                    )}
                  >
                    {c.done && <CheckIcon aria-hidden className="size-3.5" />}
                  </span>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className={cn(c.done && "text-muted-foreground line-through")}>
                    {c.title}
                    <span className="sr-only">{c.done ? ", done" : ", to do"}</span>
                  </ItemTitle>
                  {!c.done && <ItemDescription>{c.detail}</ItemDescription>}
                  {c.progress && !c.done && (
                    <div className="flex items-center gap-2 pt-1">
                      <Progress value={(c.progress.value / c.progress.max) * 100} aria-label={`${c.progress.value} of ${c.progress.max} bills`} className="w-full max-w-48" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.progress.value} of {c.progress.max}
                      </span>
                    </div>
                  )}
                </ItemContent>
                {!c.done && actions[c.id] && can(role, c.id === "invite" ? "manage_users" : "edit") && (
                  <ItemActions className="basis-full justify-end @md:basis-auto">{actions[c.id]}</ItemActions>
                )}
              </Item>
            ))}
          </ItemGroup>
        </PanelState>
      </Panel>
      <InviteDialog open={dialog === "invite"} onOpenChange={(o) => setDialog(o ? "invite" : null)} />
      <BudgetDialog
        open={dialog === "budget"}
        onOpenChange={(o) => setDialog(o ? "budget" : null)}
        siteId={site.id}
        siteName={site.name}
        suggested={latestBill}
      />
    </>
  )
}
