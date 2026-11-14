"use client"

import Link from "next/link"
import { UploadIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { FindingsList } from "@/components/bills/findings-list"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelError } from "@/components/dashboard/panel-state"
import { getFindings, recoverable, useApiQuery, type Bill } from "@/lib/api"
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
  const lost = recoverable(findings)
  const month = formatBillMonthLong(bill.month)
  const share = ((lost / bill.amountPayable) * 100).toFixed(1)

  return (
    <>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success-light">Bill checked</Badge>
          {elapsed && <span className="text-xs text-muted-foreground">You got here in {elapsed}</span>}
        </div>
        <CardTitle className="tracking-tight">
          {lost > 0 ? `${formatPkrShort(lost)} of avoidable charges on your ${month} bill` : `Your ${month} bill checks out`}
        </CardTitle>
        <CardDescription>
          {lost > 0
            ? `${formatPkr(lost)}, ${share}% of the ${formatPkr(bill.amountPayable)} you were billed. Left as is, that’s about ${formatPkrShort(lost * 12)} a year.`
            : `It matches the ${bill.tariff} tariff. Upload more months to find trends and savings.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {findings.length > 0 && <FindingsList findings={findings} size="sm" />}
        <p className="text-xs text-muted-foreground">One bill shows one month. Each extra month you add makes the check sharper and catches charges that repeat.</p>
      </CardContent>
      <CardFooter className="flex flex-col-reverse gap-2 border-t sm:flex-row sm:justify-between">
        <Button variant="outline" className="w-full sm:w-auto" onClick={onMore}>
          <UploadIcon data-icon="inline-start" />
          Upload another month
        </Button>
        <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/" />}>
          Go to dashboard
        </Button>
      </CardFooter>
    </>
  )
}
