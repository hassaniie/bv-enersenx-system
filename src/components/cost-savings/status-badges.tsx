import { Badge } from "@/components/reui/badge"
import type { Effort, InvoiceStatus, TariffType } from "@/lib/cost-savings-data"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

// State -> ReUI light badge. A fixed charge is not a time band, so it reads neutral.
const tariffType: Record<TariffType, { label: string; variant: BadgeVariant }> = {
  peak: { label: "Peak", variant: "destructive-light" },
  "off-peak": { label: "Off-Peak", variant: "success-light" },
  shoulder: { label: "Shoulder", variant: "warning-light" },
  fixed: { label: "Fixed", variant: "outline" },
}

export const effortMeta: Record<Effort, { label: string; variant: BadgeVariant }> = {
  easy: { label: "Easy", variant: "success-light" },
  medium: { label: "Medium", variant: "warning-light" },
  hard: { label: "Hard", variant: "destructive-light" },
}

export const invoiceStatusMeta: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
  paid: { label: "Paid", variant: "success-light" },
  pending: { label: "Pending", variant: "warning-light" },
  overdue: { label: "Overdue", variant: "destructive-light" },
}

export function TariffTypeBadge({ type }: { type: TariffType }) {
  const m = tariffType[type]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function EffortBadge({ effort }: { effort: Effort }) {
  const m = effortMeta[effort]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const m = invoiceStatusMeta[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}
