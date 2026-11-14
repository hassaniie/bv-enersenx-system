"use client"

import { GaugeIcon, LeafIcon, TriangleAlertIcon, ZapIcon } from "lucide-react"

import { AppShell } from "@/components/dashboard/app-shell"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { analyticsData, fetchAnalytics, type DemoState } from "@/lib/analytics-data"
import { useDemoQuery } from "@/lib/use-demo-query"

import { CorrelationPanel, ForecastPanel, TrendPanel } from "./analytics-charts"
import { AnomaliesPanel, InsightsPanel } from "./analytics-lists"
import { BillAnalytics } from "./bill-analytics"
import { HeatmapPanel } from "./heatmap-panel"

const kpiIcons = { efficiency: GaugeIcon, peak: ZapIcon, carbon: LeafIcon, anomalies: TriangleAlertIcon }

export function Analytics({ demo }: { demo: DemoState }) {
  return (
    <AppShell title="Analytics">
      <OrgSwitch sample={<SampleAnalytics demo={demo} />} own={(site) => <BillAnalytics site={site} />} />
    </AppShell>
  )
}

/** The original sample organisation (live meters): every panel reads the sample files. */
function SampleAnalytics({ demo }: { demo: DemoState }) {
  const { status, data, error, retry } = useDemoQuery(fetchAnalytics, demo, analyticsData)
  const state = { status, error, onRetry: retry }

  return (
    <>
      <KpiRow {...state} kpis={data.kpis} icons={kpiIcons} />
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[1.4fr_1fr]">
        <ForecastPanel {...state} data={data.forecast} />
        <InsightsPanel {...state} insights={data.insights} />
      </div>
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-2">
        <HeatmapPanel {...state} cells={data.heatmap} />
        <AnomaliesPanel {...state} anomalies={data.anomalies} />
      </div>
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-2">
        <CorrelationPanel {...state} data={data.temperature} />
        <TrendPanel {...state} data={data.trend} />
      </div>
    </>
  )
}
