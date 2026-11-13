"use client"

import * as React from "react"
import { MotionConfig } from "motion/react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  dashboardData,
  fetchDashboard,
  type DashboardData,
  type DemoState,
} from "@/lib/dashboard-data"

import { AppSidebar } from "./app-sidebar"
import { BottomRow } from "./bottom-row"
import { BreakdownRow } from "./breakdown-row"
import { ChartsRow } from "./charts-row"
import { KpiRow } from "./kpi-row"
import type { PanelStatus } from "./panel-state"
import { PageHeader, TopBar } from "./top-bar"

function useDashboard(demo: DemoState) {
  const [status, setStatus] = React.useState<PanelStatus>("loading")
  const [data, setData] = React.useState<DashboardData>(dashboardData)
  const [error, setError] = React.useState<string>()
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    let alive = true
    setStatus("loading")
    // After a Retry, load real data so the demo error can be dismissed.
    fetchDashboard(attempt > 0 && demo === "error" ? "ready" : demo)
      .then((d) => {
        if (!alive) return
        setData(d)
        setStatus("ready")
      })
      .catch((e: Error) => {
        if (!alive) return
        setError(e.message)
        setStatus("error")
      })
    return () => {
      alive = false
    }
  }, [demo, attempt])

  return { status, data, error, retry: () => setAttempt((a) => a + 1) }
}

export function Dashboard({ demo }: { demo: DemoState }) {
  const { status, data, error, retry } = useDashboard(demo)
  const rowProps = { status, data, error, onRetry: retry }

  return (
    <MotionConfig reducedMotion="user">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopBar />
          <PageHeader />
          <div className="@container flex min-w-0 flex-col gap-2 p-3">
            <h1 className="sr-only">Dashboard</h1>
            <KpiRow status={status} kpis={data.kpis} error={error} onRetry={retry} />
            <ChartsRow {...rowProps} />
            <BreakdownRow {...rowProps} />
            <BottomRow {...rowProps} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MotionConfig>
  )
}
