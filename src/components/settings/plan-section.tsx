"use client"

import * as React from "react"
import { CheckIcon, ReceiptTextIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { FormError } from "@/components/onboarding/form-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatDate } from "@/lib/app-date"
import { annualPrice, choosePlan, getOrganisationSettings, getSites, plans, trialDaysLeft, useApiQuery, type BillingCycle, type Plan } from "@/lib/api"
import { formatInt, formatPkr } from "@/lib/format"

import { ReadOnlyNotice, usePermission } from "./shared"

export function PlanSection() {
  const q = useApiQuery(getOrganisationSettings, [])
  const sites = useApiQuery(() => getSites(), [])
  const perm = usePermission("manage_billing")
  const [cycle, setCycle] = React.useState<BillingCycle>("monthly")
  const [choosing, setChoosing] = React.useState<Plan | null>(null)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  const settings = q.data?.settings
  const siteCount = sites.data?.length ?? 1
  const left = settings ? trialDaysLeft(settings.plan.trialEnds) : 0
  const chosen = settings?.plan.chosen

  const price = (p: Plan) => (p.pricePerSite === null ? null : cycle === "annual" ? annualPrice(p.pricePerSite) : p.pricePerSite)

  return (
    <>
      <Panel title="Plan & Billing" hint="Priced per site; payments aren’t live in the demo">
        {!perm.allowed && perm.ready && <ReadOnlyNotice role={perm.role} need="Owner" />}
        <PanelState status={q.status} error={q.error} onRetry={q.retry} skeleton={<Skeleton className="h-72 w-full" />} empty={{ icon: null, title: "", description: "", action: "" }}>
          {settings && (
            <div className="flex flex-col gap-4">
              <Alert variant={chosen || left > 3 ? "info" : "warning"}>
                <ReceiptTextIcon />
                <AlertTitle>
                  {chosen
                    ? `${plans.find((p) => p.id === chosen)?.name} plan, billed ${settings.plan.cycle === "annual" ? "annually" : "monthly"}`
                    : left > 0
                      ? `Free trial: ${left} day${left === 1 ? "" : "s"} left`
                      : `Your free trial ended on ${formatDate(settings.plan.trialEnds)}`}
                </AlertTitle>
                <AlertDescription>
                  {chosen
                    ? left > 0
                      ? `Billing starts when the trial ends on ${formatDate(settings.plan.trialEnds)}, for ${siteCount} site${siteCount === 1 ? "" : "s"}.`
                      : `Active since ${formatDate(settings.plan.trialEnds)} for ${siteCount} site${siteCount === 1 ? "" : "s"}. Payments aren’t live in the demo.`
                    : left > 0
                      ? `Trial ends ${formatDate(settings.plan.trialEnds)}. Choose a plan to keep your bills, actions and alerts.`
                      : "Choose a plan to keep your bills, actions and alerts."}
                </AlertDescription>
              </Alert>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {siteCount} active site{siteCount === 1 ? "" : "s"}. Annual plans get 2 months free.
                </span>
                <ToggleGroup variant="outline" size="sm" aria-label="Billing cycle" value={[cycle]} onValueChange={(v) => v[0] && setCycle(v[0] as BillingCycle)}>
                  <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
                  <ToggleGroupItem value="annual">Annual</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-3">
                {plans.map((p) => {
                  const amount = price(p)
                  const current = chosen === p.id
                  return (
                    <Card key={p.id} size="sm">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle>{p.name}</CardTitle>
                          {current ? <Badge variant="success-light">Chosen</Badge> : p.id === "starter" ? <Badge variant="info-light">For bills</Badge> : null}
                        </div>
                        <CardDescription>{p.for}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-baseline gap-1">
                            <span className="text-2xl font-semibold tracking-tight tabular-nums">{amount === null ? "Custom" : formatInt(amount)}</span>
                            {amount !== null && <span className="text-xs text-muted-foreground">PKR / site / {cycle === "annual" ? "year" : "month"}</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.perMeter ? `+ PKR ${formatInt(p.perMeter)} per live meter / month. ` : ""}
                            {p.users}
                            {amount !== null ? `. ${formatPkr(amount * siteCount)} for your ${siteCount} site${siteCount === 1 ? "" : "s"}.` : ". Billed annually."}
                          </span>
                        </div>
                        <ul className="flex flex-col gap-1.5 text-sm">
                          {p.includes.map((f) => (
                            <li key={f} className="flex gap-2">
                              <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          size="sm"
                          className="w-full"
                          variant={p.id === "starter" ? "default" : "outline"}
                          disabled={!perm.allowed || (current && settings.plan.cycle === cycle)}
                          onClick={() => {
                            setError(undefined)
                            setChoosing(p)
                          }}
                        >
                          {p.id === "enterprise" ? "Talk to us" : current && settings.plan.cycle === cycle ? "Current choice" : `Choose ${p.name}`}
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </PanelState>
      </Panel>

      <Panel title="Invoices">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>No invoices during the trial</EmptyTitle>
            <EmptyDescription>Your first invoice comes when the trial ends, by card, JazzCash or Easypaisa once payments are live.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Panel>

      <Dialog open={!!choosing} onOpenChange={(o) => !o && !pending && setChoosing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{choosing?.id === "enterprise" ? "Enterprise plan" : `Choose ${choosing?.name}, ${cycle}`}</DialogTitle>
            <DialogDescription>
              {choosing?.id === "enterprise"
                ? "Enterprise is priced per group. We’ll record your interest; in the product, our team gets in touch."
                : `${choosing && price(choosing) !== null ? `${formatPkr(price(choosing)! * siteCount)} per ${cycle === "annual" ? "year" : "month"} for ${siteCount} site${siteCount === 1 ? "" : "s"}. ` : ""}Payments aren’t live in the demo, so no card is asked for; your choice is saved.`}
            </DialogDescription>
          </DialogHeader>
          {error && <FormError title="Couldn’t choose the plan" message={error} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChoosing(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={async () => {
                if (!choosing) return
                setPending(true)
                setError(undefined)
                try {
                  await choosePlan(choosing.id, cycle)
                  toast.success("Plan saved", { description: `${choosing.name}, ${cycle}` })
                  setChoosing(null)
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setPending(false)
                }
              }}
            >
              {pending && <Spinner data-icon="inline-start" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
