"use client"

import * as React from "react"
import Link from "next/link"
import { ClipboardCheckIcon, CopyIcon, MessageSquareWarningIcon, ShareIcon } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/dashboard/panel"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/app-date"
import type { BillDetail, Finding } from "@/lib/api"
import { formatBillMonthLong, formatPkr } from "@/lib/format"

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
  } catch {
    toast.error("Couldn’t copy", { description: "Select the text and copy it yourself." })
  }
}

/** Each charge in the customer's voice; a "Check" finding asks for the missing fact. */
function complaintReason(f: Finding) {
  if (f.line === "furtherTax") return "We are registered for sales tax (STRN: ____________), so further tax does not apply."
  return f.detail
}

/** The complaint a customer sends their DISCO: reference, month and each possible overcharge. */
export function complaintText(d: BillDetail) {
  const { bill } = d
  const over = d.check.findings.filter((f) => f.kind === "overcharge")
  const total = over.reduce((s, f) => s + f.impactPkr, 0)
  return [
    `To: ${bill.disco} customer services`,
    `Subject: Billing complaint, reference ${bill.referenceNo}, ${formatBillMonthLong(bill.month)} bill`,
    "",
    `Our ${formatBillMonthLong(bill.month)} bill (reference ${bill.referenceNo}, ${d.siteName}, tariff ${bill.tariff}, issued ${formatDate(bill.issueDate)}) for ${formatPkr(bill.amountPayable)} appears to include the following charges in error:`,
    "",
    ...over.map((f, i) => `${i + 1}. ${f.title}: ${formatPkr(f.impactPkr)}. ${complaintReason(f)}`),
    "",
    `Total: ${formatPkr(total)}, sales tax included.`,
    "",
    "Please review these charges, refund or adjust them on the next bill, and correct the account so they do not repeat.",
    "",
    "Regards,",
  ].join("\n")
}

function summaryText(d: BillDetail) {
  const over = d.check.findings.filter((f) => f.kind === "overcharge").reduce((s, f) => s + f.impactPkr, 0)
  const url = typeof window === "undefined" ? "" : window.location.href
  return [
    `${d.siteName}: ${formatBillMonthLong(d.bill.month)} ${d.bill.disco} bill, ${formatPkr(d.bill.amountPayable)}.`,
    over ? `Possible overcharges: ${formatPkr(over)}, one-time (likely, to be checked).` : "No possible overcharges found.",
    url,
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * "What you can do" on a bill (principles.md T1, U11): raise a complaint with
 * copyable text, track it as an action, or share a summary.
 */
export function BillActions({ detail: d, className }: { detail: BillDetail; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const over = d.check.findings.filter((f) => f.kind === "overcharge")
  const draft = React.useMemo(() => complaintText(d), [d])

  return (
    <Panel className={className} title="What You Can Do">
      <ItemGroup>
        {over.length > 0 && (
          <Item variant="outline" size="sm" role="listitem">
            <ItemMedia variant="icon">
              <MessageSquareWarningIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Raise a complaint with {d.bill.disco}</ItemTitle>
              <ItemDescription className="line-clamp-none">
                We drafted it with the reference number and each charge. Check it, then send it.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" onClick={() => setOpen(true)}>
                Draft
              </Button>
            </ItemActions>
          </Item>
        )}
        {d.check.findings.length > 0 && (
          <Item variant="outline" size="sm" role="listitem">
            <ItemMedia variant="icon">
              <ClipboardCheckIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Make it an action</ItemTitle>
              <ItemDescription className="line-clamp-none">Track the fix and see it verified on later bills.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/actions/" />}>
                Actions
              </Button>
            </ItemActions>
          </Item>
        )}
        <Item variant="outline" size="sm" role="listitem">
          <ItemMedia variant="icon">
            <ShareIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Send a copy</ItemTitle>
            <ItemDescription className="line-clamp-none">A short summary with a link, for email or WhatsApp.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" onClick={() => copy(summaryText(d), "Summary copied")}>
              Copy
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Complaint to {d.bill.disco}</DialogTitle>
            <DialogDescription>
              Edit it if you need to, copy it, then paste it into {d.bill.disco}’s online complaint form or a letter. These are possible overcharges: check them against your bill first.
            </DialogDescription>
          </DialogHeader>
          <ComplaintEditor key={draft} initial={draft} onCopied={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

function ComplaintEditor({ initial, onCopied }: { initial: string; onCopied: () => void }) {
  const [text, setText] = React.useState(initial)
  return (
    <>
      <Textarea aria-label="Complaint text" value={text} onChange={(e) => setText(e.target.value)} rows={14} />
      <DialogFooter>
        <Button
          onClick={async () => {
            await copy(text, "Complaint copied")
            onCopied()
          }}
        >
          <CopyIcon data-icon="inline-start" />
          Copy text
        </Button>
      </DialogFooter>
    </>
  )
}
