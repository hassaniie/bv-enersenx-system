"use client"

import * as React from "react"
import { CalendarIcon, CircleDotIcon, DownloadIcon, MapPinIcon, ReceiptTextIcon } from "lucide-react"
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table"
import { toast } from "sonner"

import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Filters } from "@/components/reui/filters/filters"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types"
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { PanelState, type PanelStatus } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { Invoice, InvoiceStatus } from "@/lib/cost-savings-data"
import { formatNumber } from "@/lib/dashboard-data"
import { matchesQuery } from "@/lib/filter-predicate"

import { InvoiceStatusBadge, invoiceStatusMeta } from "./status-badges"

const unique = (values: string[]) => [...new Set(values)].map((v) => ({ value: v, label: v }))

/* --------------------------------- CSV export --------------------------------- */

function downloadCsv(rows: Invoice[]) {
  const header = ["Billing Period", "Meter ID", "Location", "Cons. (kWh)", "Rate (PKR)", "Base Amount", "Taxes", "Total PKR", "Status"]
  const quote = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`
  const lines = rows.map((r) =>
    [r.period, r.meterId, r.location, r.kwh, r.rate.toFixed(2), r.base, r.taxes, r.total, invoiceStatusMeta[r.status].label]
      .map(quote)
      .join(",")
  )
  const blob = new Blob([[header.map(quote).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "invoices.csv"
  a.click()
  URL.revokeObjectURL(url)
}

/* ----------------------------------- Panel ----------------------------------- */

const numeric = {
  headerClassName: "text-end [&>div]:justify-end",
  cellClassName: "text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-16" />,
}

const statusOrder: InvoiceStatus[] = ["overdue", "pending", "paid"]

export function BillingPanel({
  status,
  invoices,
  error,
  onRetry,
}: {
  status: PanelStatus
  invoices: Invoice[]
  error?: string
  onRetry: () => void
}) {
  const [query, setQuery] = React.useState<FilterQuery>(() => createFilterQuery())
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 8 })
  const [sorting, setSorting] = React.useState<SortingState>([])

  const fields = React.useMemo<FilterField[]>(
    () => [
      {
        id: "period",
        label: "Billing Period",
        type: "select",
        defaultOperator: "is_any_of",
        options: unique(invoices.map((i) => i.period)),
        searchable: false,
        icon: <CalendarIcon />,
      },
      {
        id: "location",
        label: "Location",
        type: "select",
        defaultOperator: "is_any_of",
        options: unique(invoices.map((i) => i.location)),
        searchable: false,
        icon: <MapPinIcon />,
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        defaultOperator: "is_any_of",
        options: statusOrder.map((s) => ({ value: s, label: invoiceStatusMeta[s].label })),
        searchable: false,
        icon: <CircleDotIcon />,
      },
    ],
    [invoices]
  )

  const rows = React.useMemo(() => invoices.filter((row) => matchesQuery(row, query)), [invoices, query])

  const columns = React.useMemo<ColumnDef<DataGridFeatures, Invoice>[]>(
    () => [
      {
        // Sorts by the period's start date; the cell shows the readable range.
        id: "period",
        accessorFn: (row) => row.periodStart,
        header: ({ column }) => <DataGridColumnHeader title="Billing Period" column={column} />,
        cell: ({ row }) => row.original.period,
        size: 180,
        meta: { skeleton: <Skeleton className="h-4 w-32" /> },
      },
      {
        accessorKey: "meterId",
        header: ({ column }) => <DataGridColumnHeader title="Meter ID" column={column} />,
        size: 120,
        meta: { skeleton: <Skeleton className="h-4 w-20" /> },
      },
      {
        accessorKey: "location",
        header: ({ column }) => <DataGridColumnHeader title="Location" column={column} />,
        size: 160,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.location}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-28" /> },
      },
      {
        accessorKey: "kwh",
        header: ({ column }) => <DataGridColumnHeader title="Cons. (kWh)" column={column} />,
        size: 120,
        cell: ({ row }) => formatNumber(row.original.kwh),
        meta: numeric,
      },
      {
        accessorKey: "rate",
        header: ({ column }) => <DataGridColumnHeader title="Rate (PKR)" column={column} />,
        size: 110,
        cell: ({ row }) => row.original.rate.toFixed(2),
        meta: numeric,
      },
      {
        accessorKey: "base",
        header: ({ column }) => <DataGridColumnHeader title="Base Amount" column={column} />,
        size: 130,
        cell: ({ row }) => formatNumber(row.original.base),
        meta: numeric,
      },
      {
        accessorKey: "taxes",
        header: ({ column }) => <DataGridColumnHeader title="Taxes" column={column} />,
        size: 110,
        cell: ({ row }) => formatNumber(row.original.taxes),
        meta: numeric,
      },
      {
        accessorKey: "total",
        header: ({ column }) => <DataGridColumnHeader title="Total PKR" column={column} />,
        size: 130,
        cell: ({ row }) => <span className="font-semibold text-foreground">{formatNumber(row.original.total)}</span>,
        meta: numeric,
      },
      {
        id: "status",
        accessorFn: (row) => statusOrder.indexOf(row.status),
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        size: 110,
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
        meta: { skeleton: <Skeleton className="h-5 w-14" /> },
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: status === "ready" ? rows : [],
    pageCount: Math.ceil(rows.length / pagination.pageSize),
    getRowId: (row) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  const showGrid = status === "loading" || (status === "ready" && invoices.length > 0)

  return (
    <DataGrid
      table={table}
      recordCount={status === "ready" ? rows.length : 0}
      isLoading={status === "loading"}
      tableLayout={{ headerBackground: true, rowBorder: true }}
      tableClassNames={{ base: "min-w-[1000px]" }}
      emptyMessage={
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>No invoices match</EmptyTitle>
            <EmptyDescription>Try a different period, location or status.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" variant="outline" onClick={() => setQuery(createFilterQuery())}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      }
    >
      <Frame spacing="default" className="min-w-0">
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>Detailed Billing & Invoices</FrameTitle>
          <Button
            size="sm"
            disabled={status !== "ready" || rows.length === 0}
            onClick={() => {
              downloadCsv(rows)
              toast.success("Invoices exported", {
                description: `${rows.length} invoices saved to invoices.csv`,
              })
            }}
          >
            <DownloadIcon data-icon="inline-start" />
            Export Invoice
          </Button>
        </FrameHeader>

        {showGrid ? (
          <FramePanel className="p-0">
            <div className="border-b p-3">
              <Filters
                fields={fields}
                query={query}
                size="sm"
                showClear
                onQueryChange={(next) => {
                  setQuery(next)
                  setPagination((current) => ({ ...current, pageIndex: 0 }))
                }}
              />
            </div>
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>
        ) : (
          <FramePanel className="flex flex-col gap-4">
            <PanelState
              status={status}
              isEmpty
              error={error}
              onRetry={onRetry}
              skeleton={null}
              empty={{
                icon: <ReceiptTextIcon />,
                title: "No invoices yet",
                description: "Invoices appear once a bill is imported.",
                action: "Import bill",
              }}
            >
              {null}
            </PanelState>
          </FramePanel>
        )}

        {showGrid && (
          <FrameFooter>
            <DataGridPagination sizes={[8, 16, 24]} />
          </FrameFooter>
        )}
      </Frame>
    </DataGrid>
  )
}
