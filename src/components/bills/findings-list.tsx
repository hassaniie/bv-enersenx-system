import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import type { Finding, FindingKind } from "@/lib/api"
import { formatPkr } from "@/lib/format"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

export const findingKindMeta: Record<FindingKind, { label: string; variant: BadgeVariant }> = {
  billing_error: { label: "Billing error", variant: "destructive-light" },
  avoidable: { label: "Avoidable", variant: "warning-light" },
  opportunity: { label: "Saving idea", variant: "info-light" },
}

/** What a bill check found, biggest PKR first, each with its next step. */
export function FindingsList({
  findings,
  size = "default",
  planLink,
}: {
  findings: Finding[]
  size?: "default" | "sm"
  /** Show a link to Savings Actions on each finding. */
  planLink?: boolean
}) {
  const sorted = [...findings].sort((a, b) => b.impactPkr - a.impactPkr)
  return (
    <ItemGroup role="list" aria-label="Findings">
      {sorted.map((f) => (
        <Item key={f.id} variant="outline" size={size} role="listitem" className="items-start">
          <ItemContent className="min-w-0 gap-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <ItemTitle>{f.title}</ItemTitle>
              <span className="text-sm font-semibold tabular-nums">
                {formatPkr(f.impactPkr)}
                <span className="font-normal text-muted-foreground">{f.kind === "opportunity" ? " / month" : ""}</span>
              </span>
            </div>
            <ItemDescription className="line-clamp-none">{f.detail}</ItemDescription>
            <span className="text-xs text-muted-foreground">{f.nextStep}</span>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Badge variant={findingKindMeta[f.kind].variant}>{findingKindMeta[f.kind].label}</Badge>
              {planLink && (
                <Button size="xs" variant="outline" nativeButton={false} render={<Link href="/actions/" />}>
                  Make it an action
                </Button>
              )}
            </div>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}
