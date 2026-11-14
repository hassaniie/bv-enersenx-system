"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarIcon, CircleDotIcon, FileStackIcon, HandCoinsIcon, PercentIcon, ReceiptTextIcon, UploadIcon, WalletIcon } from "lucide-react"
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table"

import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Filters } from "@/components/reui/filters/filters"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types"
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { AppShell } from "@/components/dashboard/app-shell"
import { KpiRow } from "@/components/dashboard/kpi-row"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { PanelState } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { listBillRows, loadScenario, useApiQuery, type BillCheckStatus, type BillRow, type Site } from "@/lib/api"
import type { Kpi } from "@/lib/dashboard-data"
import { matchesQuery } from "@/lib/filter-predicate"
import { formatBillMonth, formatInt } from "@/lib/format"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

export const billStatusMeta: Record<BillCheckStatus, { label: string; variant: BadgeVariant }> = {
  overcharged: { label: "Overcharged", variant: "destructive-light" },
  avoidable: { label: "Avoidable charges", variant: "warning-light" },
  ok: { label: "Checks out", variant: "success-light" },
}

export function BillStatusBadge({ status }: { status: BillCheckStatus }) {
  return <Badge variant={billStatusMeta[status].variant}>{billStatusMeta[status].label}</Badge>
}

const kpiIcons = { count: FileStackIcon, billed: WalletIcon, found: HandCoinsIcon, share: PercentIcon }

const numeric = {
  headerClassName: "text-end [&>div]:justify-end",
  cellClassName: "text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-16" />,
}

export const billHref = (id: string) => `/bills/view/?id=${encodeURIComponent(id)}`

function BillsGrid({ rows: all, status, error, onRetry }: { rows: BillRow[]; status: "loading" | "error" | "ready"; error?: string; onRetry: () => void }) {
  const router = useRouter()
  const [query, setQuery] = React.useState<FilterQuery>(() => createFilterQuery())
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 12 })
  const [sorting, setSorting] = React.useState<SortingState>([])

  const fields = React.useMemo<FilterField[]>(
    () => [
      {
        id: "year",
        label: "Year",
        type: "select",
        defaultOperator: "is_any_of",
        options: [...new Set(all.map((r) => r.month.slice(0, 4)))].map((y) => ({ value: y, label: y })),
        searchable: false,
        icon: <CalendarIcon />,
      },
      {
        id: "status",
        label: "Check result",
        type: "select",
        defaultOperator: "is_any_of",
        options: (Object.keys(billStatusMeta) as BillCheckStatus[]).map((s) => ({ value: s, label: billStatusMeta[s].label })),
        searchable: false,
        icon: <CircleDotIcon />,
      },
    ],
    [all]
  )

  const rows = React.useMemo(
    () => all.filter((r) => matchesQuery({ ...r, year: r.month.slice(0, 4) }, query)),
    [all, query]
  )

  const columns = React.useMemo<ColumnDef<DataGridFeatures, BillRow>[]>(
    () => [
      {
        accessorKey: "month",
        header: ({ column }) => <DataGridColumnHeader title="Month" column={column} />,
        cell: ({ row }) => (
          <Link href={billHref(row.original.id)} className="font-medium text-foreground underline-offset-4 hover:underline">
            {formatBillMonth(row.original.month)}
          </Link>
        ),
        size: 110,
        meta: { skeleton: <Skeleton className="h-4 w-16" /> },
      },
      {
        accessorKey: "referenceNo",
        header: "Reference",
        size: 170,
        cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.referenceNo}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-28" /> },
      },
      { accessorKey: "kwh", header: ({ column }) => <DataGridColumnHeader title="Units (kWh)" column={column} />, cell: ({ row }) => formatInt(row.original.kwh), size: 110, meta: numeric },
      { accessorKey: "mdiKw", header: ({ column }) => <DataGridColumnHeader title="MDI (kW)" column={column} />, cell: ({ row }) => formatInt(row.original.mdiKw), size: 90, meta: numeric },
      { accessorKey: "powerFactor", header: "PF", cell: ({ row }) => row.original.powerFactor.toFixed(2), size: 60, meta: numeric },
      {
        accessorKey: "billed",
        header: ({ column }) => <DataGridColumnHeader title="Billed (PKR)" column={column} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{formatInt(row.original.billed)}</span>,
        size: 120,
        meta: numeric,
      },
      { accessorKey: "expected", header: "Should be (PKR)", cell: ({ row }) => formatInt(row.original.expected), size: 130, meta: numeric },
      {
        accessorKey: "found",
        header: ({ column }) => <DataGridColumnHeader title="Found (PKR)" column={column} />,
        cell: ({ row }) => (row.original.found ? formatInt(row.original.found) : <span className="text-muted-foreground">—</span>),
        size: 110,
        meta: numeric,
      },
      {
        accessorKey: "status",
        header: "Check",
        cell: ({ row }) => <BillStatusBadge status={row.original.status} />,
        size: 150,
        meta: { skeleton: <Skeleton className="h-5 w-20" /> },
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: status === "ready" ? rows : [],
    pageCount: Math.ceil(rows.length / pagination.pageSize),
    getRowId: (r) => r.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  const showGrid = status === "loading" || (status === "ready" && all.length > 0)

  return (
    <DataGrid
      table={table}
      recordCount={status === "ready" ? rows.length : 0}
      isLoading={status === "loading"}
      tableLayout={{ headerBackground: true, rowBorder: true }}
      tableClassNames={{ base: "min-w-[1000px] whitespace-nowrap" }}
      emptyMessage={
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>No bills match</EmptyTitle>
            <EmptyDescription>Try another year or check result.</EmptyDescription>
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
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle>Bill History</FrameTitle>
            <span className="text-xs text-muted-foreground">Every bill, checked against the tariff.</span>
          </div>
          <Button size="sm" onClick={() => router.push("/bills/upload/")}>
            <UploadIcon data-icon="inline-start" />
            Upload bill
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
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
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
                title: "No bills yet",
                description: "Upload your latest bill; we check it against the tariff in seconds.",
                action: "Upload a bill",
                onAction: () => router.push("/bills/upload/"),
              }}
            >
              {null}
            </PanelState>
          </FramePanel>
        )}
        {showGrid && (
          <FrameFooter>
            <DataGridPagination sizes={[12, 24]} />
          </FrameFooter>
        )}
      </Frame>
    </DataGrid>
  )
}

function SiteBills({ site }: { site: Site }) {
  const router = useRouter()
  const q = useApiQuery(() => listBillRows(site.id), [site.id])
  const rows = q.data ?? []
  const year = rows.slice(0, 12)
  const billed = year.reduce((s, r) => s + r.billed, 0)
  const found = rows.reduce((s, r) => s + r.found, 0)
  const over = rows.filter((r) => r.status === "overcharged").length
  const kpis: Kpi[] = rows.length
    ? [
        { id: "count", label: "Bills on record", value: String(rows.length), unit: rows.length === 1 ? "bill" : "bills", note: `${formatBillMonth(rows.at(-1)!.month)} – ${formatBillMonth(rows[0].month)}`, tone: "neutral" },
        { id: "billed", label: year.length >= 12 ? "Billed, last 12 months" : `Billed, ${year.length} month${year.length === 1 ? "" : "s"}`, value: formatInt(billed), unit: "PKR", note: site.name, tone: "neutral" },
        { id: "found", label: "Found across bills", value: formatInt(found), unit: "PKR", note: `${((found / billed) * 100).toFixed(1)}% of what you were billed`, tone: found ? "destructive" : "success" },
        { id: "share", label: "Bills overcharged", value: `${over} of ${rows.length}`, unit: "", note: over ? "Billing errors to raise with your DISCO" : "No billing errors found", tone: over ? "warning" : "success" },
      ]
    : []
  return (
    <>
      <KpiRow
        status={q.status}
        kpis={kpis}
        error={q.error}
        onRetry={q.retry}
        icons={kpiIcons}
        empty={{ icon: <ReceiptTextIcon />, title: "No bills yet", description: "Bills you upload are listed and checked here.", action: "Upload a bill", onAction: () => router.push("/bills/upload/") }}
      />
      <BillsGrid rows={rows} status={q.status} error={q.error} onRetry={q.retry} />
    </>
  )
}

function SampleBills() {
  const router = useRouter()
  return (
    <Frame spacing="default">
      <FramePanel>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>This sample organisation has no uploaded bills</EmptyTitle>
            <EmptyDescription>Its figures come from live meters and sample invoices. Load a bills scenario to see bill history and checks.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await loadScenario("bills-12")
                router.refresh()
              }}
            >
              Load the 12-bill scenario
            </Button>
          </EmptyContent>
        </Empty>
      </FramePanel>
    </Frame>
  )
}

export function BillsPage() {
  return (
    <AppShell title="Bills">
      <OrgSwitch sample={<SampleBills />} own={(site) => <SiteBills site={site} />} />
    </AppShell>
  )
}
