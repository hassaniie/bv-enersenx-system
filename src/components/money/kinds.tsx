import { Badge } from "@/components/reui/badge"
import type { Confidence, FindingKind } from "@/lib/api"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

/** The label and period every finding kind carries (principles.md, money model). */
export const kindMeta: Record<FindingKind, { label: string; variant: BadgeVariant; period: string }> = {
  overcharge: { label: "Possible overcharge", variant: "destructive-light", period: "one-time, on this bill" },
  avoidable: { label: "Avoidable", variant: "warning-light", period: "a month" },
  estimate: { label: "Could save", variant: "info-light", period: "a month, estimate" },
}

export const confidenceMeta: Record<Confidence, { label: string; hint: string }> = {
  confirmed: { label: "Confirmed", hint: "Checked against a verified tariff table" },
  likely: { label: "Likely", hint: "Standard rule, not yet verified for your DISCO" },
  check: { label: "Check", hint: "Depends on something we can't see yet" },
}

export function KindBadge({ kind }: { kind: FindingKind }) {
  return <Badge variant={kindMeta[kind].variant}>{kindMeta[kind].label}</Badge>
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <Badge variant="outline" title={confidenceMeta[confidence].hint}>
      {confidenceMeta[confidence].label}
    </Badge>
  )
}
