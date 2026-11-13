"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { CostSavings } from "@/components/cost-savings/cost-savings"
import { parseDemoState } from "@/lib/use-demo-query"

function CostSavingsFromUrl() {
  return <CostSavings demo={parseDemoState(useSearchParams().get("state"))} />
}

// Reads ?state= in the browser, so the page also works as a static export (GitHub Pages).
export default function Page() {
  return (
    <Suspense fallback={<CostSavings demo="loading" />}>
      <CostSavingsFromUrl />
    </Suspense>
  )
}
