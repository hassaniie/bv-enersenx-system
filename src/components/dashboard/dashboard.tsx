"use client"

import { getMe, useStoreValue } from "@/lib/api"
import { dashboardData, fetchDashboard, type DemoState } from "@/lib/dashboard-data"
import { useDemoQuery } from "@/lib/use-demo-query"

import { AppShell } from "./app-shell"
import { BottomRow } from "./bottom-row"
import { BreakdownRow } from "./breakdown-row"
import { ChartsRow } from "./charts-row"
import { GettingStarted } from "./getting-started"
import { KpiRow } from "./kpi-row"
import { OrgSwitch } from "./org-switch"

/** The original sample organisation: every panel reads the sample files. */
function SampleDashboard({ demo }: { demo: DemoState }) {
  const { status, data, error, retry } = useDemoQuery(fetchDashboard, demo, dashboardData)
  const rowProps = { status, data, error, onRetry: retry }
  return (
    <>
      <KpiRow status={status} kpis={data.kpis} error={error} onRetry={retry} />
      <ChartsRow {...rowProps} />
      <BreakdownRow {...rowProps} />
      <BottomRow {...rowProps} />
    </>
  )
}

export function Dashboard({ demo }: { demo: DemoState }) {
  // Bills-first organisations call it Home; the Phase 2 preview keeps "Dashboard".
  const title = useStoreValue(() => getMe()?.org.data) === "sample" ? "Dashboard" : "Home"
  return (
    <AppShell title={title}>
      <OrgSwitch sample={<SampleDashboard demo={demo} />} own={(site) => <GettingStarted site={site} />} />
    </AppShell>
  )
}
