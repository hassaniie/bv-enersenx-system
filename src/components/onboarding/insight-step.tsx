"use client"

import Link from "next/link"
import { UploadIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { FindingsList } from "@/components/bills/findings-list"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelError } from "@/components/dashboard/panel-state"
import { getFindings, useApiQuery, type Bill, type Finding } from "@/lib/api"
import { formatBillMonthLong, formatPkr, formatPkrShort } from "@/lib/format"

/** The payoff: what the first bill check found, in rupees. */
export function InsightStep({ bill, elapsed, onMore }: { bill: Bill; elapsed?: string; onMore: () => void }) {
  const q = useApiQuery(() => getFindings(bill.id), [bill.id])

  if (q.status === "loading") {
    return (
      <CardContent className="flex flex-col gap-3" aria-busy="true">
        <span className="sr-only">Loading</span>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </CardContent>
    )
  }
  if (q.status === "error" || !q.data) {
    return (
      <CardContent>
        <PanelError title="Couldn’t load the results" error={q.error} onRetry={q.retry} />
      </CardContent>
    )
  }

  const { findings } = q.data
  const month = formatBillMonthLong(bill.month)
  const total = (k: Finding["kind"]) => findings.filter((f) => f.kind === k).reduce((s, f) => s + f.impactPkr, 0)
  const over = total("overcharge")
  const avoid = total("avoidable")
  const estimate = total("estimate")
  // Each kind on its own line with its period (principles.md M1–M3); nothing is added up or annualised.
  const lines = [
    over > 0 && { label: "Possible overcharges", value: formatPkr(over), period: "one-time, on this bill" },
    avoid > 0 && { label: "Avoidable charges", value: formatPkr(avoid), period: "a month, until fixed" },
    estimate > 0 && { label: "Could save", value: `about ${formatPkr(estimate)}`, period: "a month, estimate" },
  ].filter(Boolean) as { label: string; value: string; period: string }[]

  return (
    <>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success-light">Bill checked</Badge>
          {elapsed && <span className="text-xs text-muted-foreground">You got here in {elapsed}</span>}
        </div>
        <CardTitle className="tracking-tight">
          {over > 0
            ? `Your ${month} bill may include ${formatPkrShort(over)} in overcharges`
            : avoid > 0
              ? `Your ${month} bill has ${formatPkrShort(avoid)} a month in avoidable charges`
              : `Your ${month} bill checks out`}
        </CardTitle>
        <CardDescription>
          {lines.length
            ? `Billed ${formatPkr(bill.amountPayable)}. Overcharges are marked Likely until the tariff rules are checked against the current NEPRA notification.`
            : `It matches the ${bill.tariff} tariff. Upload more months to find trends and savings.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {lines.length > 0 && (
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="What this bill shows">
            {lines.map((l) => (
              <div key={l.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{l.label}</dt>
                <dd className="flex flex-col">
                  <span className="text-base font-semibold tabular-nums">{l.value}</span>
                  <span className="text-xs text-muted-foreground">{l.period}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
        {findings.length > 0 && <FindingsList findings={findings} size="sm" />}
        <p className="text-xs text-muted-foreground">One bill shows one month. Each extra month you add makes the check sharper and catches charges that repeat.</p>
      </CardContent>
      <CardFooter className="flex flex-col-reverse gap-2 border-t sm:flex-row sm:justify-between">
        <Button variant="outline" className="w-full sm:w-auto" onClick={onMore}>
          <UploadIcon data-icon="inline-start" />
          Upload another month
        </Button>
        <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/" />}>
          Go to Home
        </Button>
      </CardFooter>
    </>
  )
}
