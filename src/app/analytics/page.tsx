"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { Analytics } from "@/components/analytics/analytics"
import { parseDemoState } from "@/lib/use-demo-query"

function AnalyticsFromUrl() {
  return <Analytics demo={parseDemoState(useSearchParams().get("state"))} />
}

// Reads ?state= in the browser, so the page also works as a static export (GitHub Pages).
export default function Page() {
  return (
    <Suspense fallback={<Analytics demo="loading" />}>
      <AnalyticsFromUrl />
    </Suspense>
  )
}
