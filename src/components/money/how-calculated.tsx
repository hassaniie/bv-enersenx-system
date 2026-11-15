"use client"

import { CalculatorIcon } from "lucide-react"

import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import type { Method } from "@/lib/api"

/**
 * "How we calculated this" (principles.md T4, M7): the rule, the inputs from
 * the bill and the arithmetic, one tap from any PKR figure.
 */
export function HowCalculated({ method, label = "How we calculated this", subject }: { method: Method; label?: string; subject?: string }) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex w-fit items-center gap-1 rounded-sm text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        <CalculatorIcon aria-hidden className="size-3.5" />
        {label}
        {subject && <span className="sr-only">: {subject}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
        <PopoverHeader>
          <PopoverTitle>How we calculated this</PopoverTitle>
          <PopoverDescription>{method.rule}</PopoverDescription>
        </PopoverHeader>
        <dl className="flex flex-col gap-1.5 text-xs">
          {method.lines.map((l) => (
            <div key={l.label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{l.label}</dt>
              <dd className="font-medium tabular-nums">{l.value}</dd>
            </div>
          ))}
        </dl>
        {method.note && <p className="text-xs text-muted-foreground">{method.note}</p>}
      </PopoverContent>
    </Popover>
  )
}
