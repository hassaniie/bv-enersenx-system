"use client"

import Link from "next/link"
import { CalendarClockIcon, CircleAlertIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { getNextBill, useApiQuery, type Site } from "@/lib/api"
import { formatBillMonthLong } from "@/lib/format"

/** The monthly reminder: the next bill to upload, loud only when it's due. */
export function NextBillNotice({ site }: { site: Site }) {
  const q = useApiQuery(() => getNextBill(site.id), [site.id])
  const n = q.data
  if (q.status !== "ready" || !n) return null
  const month = formatBillMonthLong(n.month)

  if (n.status === "due")
    return (
      <Alert variant="warning" role="status">
        <CircleAlertIcon />
        <AlertTitle>Your {month} bill is due</AlertTitle>
        <AlertDescription>
          {site.disco} issued it around {n.issuedAround}. Reminder sent by {n.channels} on {n.remindedOn}.
        </AlertDescription>
        <AlertAction>
          <Button size="xs" nativeButton={false} render={<Link href="/bills/upload/" />}>
            Upload bill
          </Button>
        </AlertAction>
      </Alert>
    )

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <CalendarClockIcon aria-hidden className="size-3.5" />
      Next bill: {month}, expected around {n.issuedAround}. We’ll remind you by {n.channels}.
    </p>
  )
}
