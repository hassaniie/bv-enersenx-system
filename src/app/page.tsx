"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { Dashboard } from "@/components/dashboard/dashboard"
import type { DemoState } from "@/lib/dashboard-data"

const states: DemoState[] = ["ready", "loading", "empty", "error"]

function DashboardFromUrl() {
  const state = useSearchParams().get("state")
  const demo = states.includes(state as DemoState) ? (state as DemoState) : "ready"
  return <Dashboard demo={demo} />
}

// Reads ?state= in the browser, so the page also works as a static export (GitHub Pages).
export default function Page() {
  return (
    <Suspense fallback={<Dashboard demo="loading" />}>
      <DashboardFromUrl />
    </Suspense>
  )
}
