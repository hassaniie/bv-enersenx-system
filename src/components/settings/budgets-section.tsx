"use client"

import * as React from "react"
import { WalletIcon } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { listBudgets, saveBudget, useApiQuery } from "@/lib/api"
import { formatBillMonth, formatInt, formatPkr } from "@/lib/format"

import { ReadOnlyNotice, usePermission } from "./shared"

export function BudgetsSection() {
  const q = useApiQuery(listBudgets, [])
  const perm = usePermission("edit")
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!q.data) return
    setValues((v) => {
      const next = { ...v }
      for (const b of q.data!) if (next[b.site.id] === undefined) next[b.site.id] = b.monthlyPkr ? formatInt(b.monthlyPkr) : ""
      return next
    })
  }, [q.data])

  return (
    <Panel title="Budgets" hint="Monthly electricity budget per site; a bill over it raises an alert">
      {!perm.allowed && perm.ready && <ReadOnlyNotice role={perm.role} need="Manager or Owner" />}
      <PanelState
        status={q.status}
        error={q.error}
        onRetry={q.retry}
        isEmpty={q.data?.length === 0}
        skeleton={<Skeleton className="h-32 w-full" />}
        empty={{ icon: <WalletIcon />, title: "No active sites", description: "Budgets are set per site.", action: "Add a site" }}
      >
        <ItemGroup role="list" aria-label="Budgets">
          {q.data?.map((b) => {
            const raw = values[b.site.id] ?? ""
            const amount = Number(raw.replace(/,/g, ""))
            const used = b.monthlyPkr && b.latestBill ? (b.latestBill / b.monthlyPkr) * 100 : null
            return (
              <Item key={b.site.id} variant="outline" size="sm" role="listitem" className="items-start">
                <ItemContent className="min-w-0 gap-1.5">
                  <ItemTitle>{b.site.name}</ItemTitle>
                  <ItemDescription>
                    {b.latestBill ? `Latest bill ${formatPkr(b.latestBill)} (${formatBillMonth(b.latestMonth!)})` : "No bills yet"}
                    {used !== null ? `, ${used.toFixed(1)}% of budget` : ""}
                  </ItemDescription>
                  {used !== null && <Progress value={Math.min(100, used)} aria-label={`${b.site.name} budget used`} className="w-full max-w-64" />}
                </ItemContent>
                <ItemActions className="w-full flex-wrap justify-end gap-2 sm:w-auto">
                  <InputGroup className="w-44">
                    <InputGroupAddon>
                      <InputGroupText>PKR</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-label={`Monthly budget for ${b.site.name}`}
                      inputMode="numeric"
                      className="tabular-nums"
                      placeholder="No budget"
                      disabled={!perm.allowed}
                      value={raw}
                      onChange={(e) => setValues((v) => ({ ...v, [b.site.id]: e.target.value.replace(/[^\d,]/g, "") }))}
                    />
                  </InputGroup>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!perm.allowed || saving === b.site.id || (raw !== "" && !(amount > 0))}
                    onClick={async () => {
                      setSaving(b.site.id)
                      try {
                        await saveBudget(b.site.id, raw ? amount : null)
                        toast.success(raw ? "Budget saved" : "Budget cleared", { description: raw ? `${formatPkr(amount)} a month for ${b.site.name}` : b.site.name })
                      } catch (e) {
                        toast.error("Couldn’t save the budget", { description: (e as Error).message })
                      } finally {
                        setSaving(null)
                      }
                    }}
                  >
                    Save
                  </Button>
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </PanelState>
    </Panel>
  )
}
