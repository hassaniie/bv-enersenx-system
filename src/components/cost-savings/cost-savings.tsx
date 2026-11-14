"use client"

import { HandCoinsIcon, PercentIcon, ReceiptTextIcon, TrendingUpIcon, WalletIcon } from "lucide-react"

import { AppShell } from "@/components/dashboard/app-shell"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { costSavingsData, fetchCostSavings, type DemoState } from "@/lib/cost-savings-data"
import { useDemoQuery } from "@/lib/use-demo-query"

import { BillCostSavings } from "./bill-cost"
import { BillingPanel } from "./billing-panel"
import { CostChartsRow } from "./cost-charts"
import { OpportunitiesPanel } from "./opportunities-panel"
import { TariffPanel } from "./tariff-panel"

const kpiIcons = {
  cost: WalletIcon,
  rate: TrendingUpIcon,
  savings: HandCoinsIcon,
  budget: PercentIcon,
}

export function CostSavings({ demo }: { demo: DemoState }) {
  return (
    <AppShell title="Cost & Savings">
      <OrgSwitch sample={<SampleCostSavings demo={demo} />} own={(site) => <BillCostSavings site={site} />} />
    </AppShell>
  )
}

/** The original sample organisation: every panel reads the sample files. */
function SampleCostSavings({ demo }: { demo: DemoState }) {
  const { status, data, error, retry } = useDemoQuery(fetchCostSavings, demo, costSavingsData)
  const state = { status, error, onRetry: retry }

  return (
    <>
      <KpiRow
        {...state}
        kpis={data.kpis}
        icons={kpiIcons}
        empty={{
          icon: <ReceiptTextIcon />,
          title: "No billing data",
          description: "Import a bill to see cost metrics.",
          action: "Import bill",
        }}
      />
      <CostChartsRow {...state} data={data} />
      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[2fr_1fr]">
        <TariffPanel {...state} rows={data.tariffs} total={data.tariffTotal} blendedRate={data.blendedRate} />
        <OpportunitiesPanel {...state} opportunities={data.opportunities} />
      </div>
      <BillingPanel {...state} invoices={data.invoices} />
    </>
  )
}
