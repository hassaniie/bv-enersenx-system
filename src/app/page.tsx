"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { Dashboard } from "@/components/dashboard/dashboard"
import { parseDemoState } from "@/lib/use-demo-query"

function DashboardFromUrl() {
  return <Dashboard demo={parseDemoState(useSearchParams().get("state"))} />
}

// Reads ?state= in the browser, so the page also works as a static export (GitHub Pages).
export default function Page() {
  return (
    <Suspense fallback={<Dashboard demo="loading" />}>
      <DashboardFromUrl />
    </Suspense>
  )
}
