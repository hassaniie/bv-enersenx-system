"use client"

import * as React from "react"
import { ReceiptTextIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"

import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table"
import { GridFill } from "@/components/dashboard/grid-fill"
import { Panel } from "@/components/dashboard/panel"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Skeleton } from "@/components/ui/skeleton"
import { tariffMonth, type TariffRow } from "@/lib/cost-savings-data"
import { formatNumber } from "@/lib/dashboard-data"

import { TariffTypeBadge } from "./status-badges"

const numeric = {
  headerClassName: "text-end [&>div]:justify-end",
  cellClassName: "text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-14" />,
}

const dash = <span className="text-muted-foreground">—</span>

function TariffGrid({
  rows,
  total,
  loading,
}: {
  rows: TariffRow[]
  total: { kwh: number; cost: number }
  loading?: boolean
}) {
  const columns = React.useMemo<ColumnDef<DataGridFeatures, TariffRow>[]>(
    () => [
      {
        accessorKey: "period",
        header: "Time Period",
        size: 230,
        meta: { skeleton: <Skeleton className="h-4 w-40" /> },
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 100,
        cell: ({ row }) => <TariffTypeBadge type={row.original.type} />,
        meta: { skeleton: <Skeleton className="h-5 w-16" /> },
      },
      {
        accessorKey: "rate",
        header: "Rate (PKR)",
        size: 100,
        cell: ({ row }) => (row.original.rate === null ? dash : row.original.rate.toFixed(2)),
        meta: numeric,
      },
      {
        accessorKey: "kwh",
        header: "Cons. (kWh)",
        size: 110,
        cell: ({ row }) => (row.original.kwh === null ? dash : formatNumber(row.original.kwh)),
        meta: numeric,
      },
      {
        accessorKey: "cost",
        header: "Cost (PKR)",
        size: 120,
        cell: ({ row }) => <span className="font-medium text-foreground">{formatNumber(row.original.cost)}</span>,
        meta: numeric,
      },
      {
        accessorKey: "share",
        header: "% Total",
        size: 80,
        cell: ({ row }) => `${row.original.share.toFixed(1)}%`,
        meta: numeric,
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
  })

  const footer = loading ? undefined : (
    <DataGridTableFootRow>
      <DataGridTableFootRowCell colSpan={3} className="font-semibold text-foreground">
        Total consolidated
      </DataGridTableFootRowCell>
      <DataGridTableFootRowCell className="text-end tabular-nums">
        {formatNumber(total.kwh)}
      </DataGridTableFootRowCell>
      <DataGridTableFootRowCell className="text-end font-semibold text-foreground tabular-nums">
        PKR {formatNumber(total.cost)}
      </DataGridTableFootRowCell>
      <DataGridTableFootRowCell className="text-end tabular-nums">100%</DataGridTableFootRowCell>
    </DataGridTableFootRow>
  )

  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      isLoading={loading}
      tableLayout={{ headerBackground: true, footerBackground: true, rowBorder: true, width: "auto" }}
      tableClassNames={{ base: "h-full w-full min-w-[620px] whitespace-nowrap" }}
    >
      <GridFill>
        <DataGridScrollArea orientation="horizontal" className="h-full">
          <DataGridTable footerContent={footer} />
        </DataGridScrollArea>
      </GridFill>
    </DataGrid>
  )
}

export function TariffPanel({
  status,
  rows,
  total,
  blendedRate,
  error,
  onRetry,
}: {
  status: PanelStatus
  rows: TariffRow[]
  total: { kwh: number; cost: number }
  blendedRate: number
  error?: string
  onRetry: () => void
}) {
  const isEmpty = rows.length === 0
  const peakShare = rows.filter((r) => r.type === "peak").reduce((sum, r) => sum + r.share, 0)

  return (
    <Panel
      title="Tariff Structure & Load Analysis"
      meta={tariffMonth}
      flush={status !== "error" && (status === "loading" || !isEmpty)}
      footer={
        status === "ready" && !isEmpty ? (
          <>
            <span className="tabular-nums">Blended rate PKR {blendedRate.toFixed(2)} / kWh</span>
            <span className="tabular-nums">Peak bands {peakShare.toFixed(1)}% of cost</span>
          </>
        ) : undefined
      }
    >
      <PanelState
        status={status}
        isEmpty={isEmpty}
        error={error}
        onRetry={onRetry}
        skeleton={<TariffGrid rows={[]} total={total} loading />}
        empty={{
          icon: <ReceiptTextIcon />,
          title: "No tariff configured",
          description: "Add your utility tariff to split costs.",
          action: "Add tariff",
        }}
      >
        <TariffGrid rows={rows} total={total} />
      </PanelState>
    </Panel>
  )
}
