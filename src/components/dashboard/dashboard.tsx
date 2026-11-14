"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { currentSiteNow, getMe, useStoreValue } from "@/lib/api"
import { dashboardData, fetchDashboard, type DemoState } from "@/lib/dashboard-data"
import { useDemoQuery } from "@/lib/use-demo-query"

import { AppShell } from "./app-shell"
import { BottomRow } from "./bottom-row"
import { BreakdownRow } from "./breakdown-row"
import { ChartsRow } from "./charts-row"
import { GettingStarted } from "./getting-started"
import { KpiRow } from "./kpi-row"

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
  const router = useRouter()
  const ctx = useStoreValue(() => ({ me: getMe(), site: currentSiteNow() }))

  React.useEffect(() => {
    if (ctx && !ctx.me) router.replace("/login/")
  }, [ctx, router])

  let body: React.ReactNode
  if (!ctx?.me) body = <Skeleton className="h-40 w-full" aria-label="Loading" />
  else if (ctx.me.org.data === "sample") body = <SampleDashboard demo={demo} />
  else if (!ctx.site)
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2Icon />
          </EmptyMedia>
          <EmptyTitle>Add your first site</EmptyTitle>
          <EmptyDescription>A site is one electricity connection. Add it, then upload its latest bill.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={() => router.push("/onboarding/")}>
            Add a site
          </Button>
        </EmptyContent>
      </Empty>
    )
  else body = <GettingStarted site={ctx.site} />

  return <AppShell title="Dashboard">{body}</AppShell>
}
