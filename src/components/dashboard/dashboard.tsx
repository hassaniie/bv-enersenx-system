"use client"

import { dashboardData, fetchDashboard, type DemoState } from "@/lib/dashboard-data"
import { useDemoQuery } from "@/lib/use-demo-query"

import { AppShell } from "./app-shell"
import { BottomRow } from "./bottom-row"
import { BreakdownRow } from "./breakdown-row"
import { ChartsRow } from "./charts-row"
import { KpiRow } from "./kpi-row"

export function Dashboard({ demo }: { demo: DemoState }) {
  const { status, data, error, retry } = useDemoQuery(fetchDashboard, demo, dashboardData)
  const rowProps = { status, data, error, onRetry: retry }

  return (
    <AppShell title="Dashboard">
      <KpiRow status={status} kpis={data.kpis} error={error} onRetry={retry} />
      <ChartsRow {...rowProps} />
      <BreakdownRow {...rowProps} />
      <BottomRow {...rowProps} />
    </AppShell>
  )
}
