import {
  ClipboardCheckIcon,
  CirclePlusIcon,
  LeafIcon,
  SettingsIcon,
  WalletIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { typeLabels, type Person, type ReportStatus, type ReportType } from "@/lib/reports-data"

export const templateIcons: Record<ReportType, LucideIcon> = {
  energy: ZapIcon,
  equipment: SettingsIcon,
  cost: WalletIcon,
  sustainability: LeafIcon,
  compliance: ClipboardCheckIcon,
  custom: CirclePlusIcon,
}

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

export const statusMeta: Record<ReportStatus, { label: string; variant: BadgeVariant }> = {
  completed: { label: "Completed", variant: "success-light" },
  processing: { label: "Processing", variant: "warning-light" },
  failed: { label: "Failed", variant: "destructive-light" },
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const m = statusMeta[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

/** A report type is a tag, not a state: neutral outline badge. */
export function ReportTypeBadge({ type }: { type: ReportType }) {
  return <Badge variant="outline">{typeLabels[type]}</Badge>
}

export function PersonCell({ person }: { person: Person }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback>{person.initials}</AvatarFallback>
      </Avatar>
      <span className="truncate">{person.name}</span>
    </span>
  )
}
