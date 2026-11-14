"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckIcon, FileTextIcon, GaugeIcon, HandCoinsIcon, ListChecksIcon, ReceiptTextIcon, SearchCheckIcon, ZapIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { FindingsList } from "@/components/bills/findings-list"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getChecklist, getSiteSummary, recoverable, useApiQuery, type ChecklistItem, type Site } from "@/lib/api"
import type { Kpi } from "@/lib/dashboard-data"
import { formatDayMonth } from "@/lib/app-date"
import { formatBillMonth, formatBillMonthLong, formatInt, formatPkr, formatPkrShort } from "@/lib/format"
import { cn } from "@/lib/utils"

import { BudgetDialog } from "./budget-dialog"
import { InviteDialog } from "./invite-dialog"
import { KpiRow } from "./kpi-row"
import { Panel } from "./panel"
import { PanelState } from "./panel-state"

const billIcons = { amount: ReceiptTextIcon, units: ZapIcon, peak: GaugeIcon, found: HandCoinsIcon }

/** The dashboard of a site that has just started: a checklist and its first bills. */
export function GettingStarted({ site }: { site: Site }) {
  const checklist = useApiQuery(() => getChecklist(site.id), [site.id])
  const summary = useApiQuery(() => getSiteSummary(site.id), [site.id])
  const [dialog, setDialog] = React.useState<"invite" | "budget" | null>(null)
  const router = useRouter()

  const s = summary.data
  const latest = s?.latest
  const found = s?.check ? recoverable(s.check.findings) : 0
  const units = latest ? latest.peakKwh + latest.offPeakKwh : 0
  const kpis: Kpi[] = latest
    ? [
        { id: "amount", label: "Latest bill", value: formatInt(latest.amountPayable), unit: "PKR", note: [formatBillMonth(latest.month), `due ${formatDayMonth(latest.dueDate)}`], tone: "neutral" },
        { id: "units", label: "Units", value: formatInt(units), unit: "kWh", note: `MDI ${formatInt(latest.mdiKw)} kW of ${formatInt(site.sanctionedKw)} kW sanctioned`, tone: "neutral" },
        { id: "peak", label: "Peak-hour share", value: String(Math.round((latest.peakKwh / units) * 100)), unit: "%", note: `${formatInt(latest.peakKwh)} kWh at the peak rate`, tone: latest.peakKwh / units > 0.2 ? "warning" : "neutral" },
        { id: "found", label: "Found on this bill", value: formatInt(found), unit: "PKR", note: found ? "Billing errors and avoidable charges" : "Nothing to recover", tone: found ? "destructive" : "success" },
      ]
    : []

  const actions: Record<ChecklistItem["id"], React.ReactNode> = {
    bills: (
      <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/onboarding/" />}>
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

  const done = checklist.data?.filter((c) => c.done).length ?? 0

  return (
    <>
      <Panel
        title="Get started"
        hint={checklist.data ? `${done} of ${checklist.data.length} done` : undefined}
        meta={<Badge variant="outline">{site.name}</Badge>}
      >
        <PanelState
          status={checklist.status}
          error={checklist.error}
          onRetry={checklist.retry}
          isEmpty={checklist.data?.length === 0}
          skeleton={
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          }
          empty={{ icon: <ListChecksIcon />, title: "All set up", description: "Nothing left to set up for this site.", action: "View bills" }}
        >
          <ItemGroup role="list" aria-label="Setup checklist">
            {checklist.data?.map((c) => (
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
                  <ItemTitle>
                    {c.title}
                    <span className="sr-only">{c.done ? ", done" : ", to do"}</span>
                  </ItemTitle>
                  <ItemDescription>{c.detail}</ItemDescription>
                  {c.progress && !c.done && (
                    <div className="flex items-center gap-2 pt-1">
                      <Progress value={(c.progress.value / c.progress.max) * 100} aria-label={`${c.progress.value} of ${c.progress.max} bills`} className="w-full max-w-48" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.progress.value} of {c.progress.max}
                      </span>
                    </div>
                  )}
                </ItemContent>
                {!c.done && <ItemActions>{actions[c.id]}</ItemActions>}
              </Item>
            ))}
          </ItemGroup>
        </PanelState>
      </Panel>

      <KpiRow
        status={summary.status}
        kpis={kpis}
        error={summary.error}
        onRetry={summary.retry}
        icons={billIcons}
        empty={{
          icon: <FileTextIcon />,
          title: "No bills yet",
          description: "Upload your latest bill to see what it costs and what it hides.",
          action: "Upload a bill",
          onAction: () => router.push("/onboarding/"),
        }}
      />

      {latest && s?.check && (
        <Panel
          title="What we found"
          hint={[formatBillMonthLong(latest.month), `${formatPkrShort(found)} recoverable`]}
          meta={<span className="tabular-nums">Billed {formatPkr(latest.amountPayable)}</span>}
        >
          <PanelState
            status={summary.status}
            error={summary.error}
            onRetry={summary.retry}
            isEmpty={s.check.findings.length === 0}
            skeleton={<Skeleton className="h-40 w-full" />}
            empty={{ icon: <SearchCheckIcon />, title: "This bill checks out", description: "It matches the tariff. Upload more months to find savings.", action: "Upload a bill" }}
          >
            <FindingsList findings={s.check.findings} size="sm" />
          </PanelState>
        </Panel>
      )}

      <InviteDialog open={dialog === "invite"} onOpenChange={(o) => setDialog(o ? "invite" : null)} />
      <BudgetDialog
        open={dialog === "budget"}
        onOpenChange={(o) => setDialog(o ? "budget" : null)}
        siteId={site.id}
        siteName={site.name}
        suggested={latest?.amountPayable}
      />
    </>
  )
}
