import Link from "next/link"

import { ConfidenceBadge, KindBadge, kindMeta } from "@/components/money/kinds"
import { HowCalculated } from "@/components/money/how-calculated"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import type { Finding } from "@/lib/api"
import { formatPkr } from "@/lib/format"

export { kindMeta as findingKindMeta }

/**
 * What a bill check found (principles.md T1): what, why, what to do, how sure,
 * with each figure's kind and period, biggest first within a kind.
 */
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
  const order = { overcharge: 0, avoidable: 1, estimate: 2 }
  const sorted = [...findings].sort((a, b) => order[a.kind] - order[b.kind] || b.impactPkr - a.impactPkr)
  return (
    <ItemGroup role="list" aria-label="Findings">
      {sorted.map((f) => (
        <Item key={f.id} variant="outline" size={size} role="listitem" className="items-start">
          <ItemContent className="min-w-0 gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <ItemTitle className="line-clamp-none">{f.title}</ItemTitle>
              <span className="text-sm font-semibold tabular-nums">
                {f.kind === "estimate" ? "about " : ""}
                {formatPkr(f.impactPkr)}
                <span className="font-normal text-muted-foreground"> {kindMeta[f.kind].period}</span>
              </span>
            </div>
            <ItemDescription className="line-clamp-none">{f.detail}</ItemDescription>
            <span className="text-xs text-muted-foreground">Next step: {f.nextStep}</span>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="flex flex-wrap items-center gap-2">
                <KindBadge kind={f.kind} />
                <ConfidenceBadge confidence={f.confidence} />
                <HowCalculated method={f.method} subject={f.title} />
              </span>
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
