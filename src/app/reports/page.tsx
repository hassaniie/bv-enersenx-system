"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { Reports } from "@/components/reports/reports"
import { parseDemoState } from "@/lib/use-demo-query"

function ReportsFromUrl() {
  return <Reports demo={parseDemoState(useSearchParams().get("state"))} />
}

// Reads ?state= in the browser, so the page also works as a static export (GitHub Pages).
export default function Page() {
  return (
    <Suspense fallback={<Reports demo="loading" />}>
      <ReportsFromUrl />
    </Suspense>
  )
}
