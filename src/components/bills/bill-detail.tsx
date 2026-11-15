"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, FileQuestionIcon, SearchCheckIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable, DataGridTableFootRow, DataGridTableFootRowCell } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { AppShell } from "@/components/dashboard/app-shell"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { Panel } from "@/components/dashboard/panel"
import { PanelError, PanelState } from "@/components/dashboard/panel-state"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/app-date"
import { getBillDetail, tariffs, useApiQuery, type Bill, type BillLine, type BillLineKey } from "@/lib/api"
import { formatBillMonthLong, formatInt, formatPkr } from "@/lib/format"
import { cn } from "@/lib/utils"

import { billHref, BillStatusBadge } from "./bills-page"
import { FindingsList } from "./findings-list"

type LineRow = { key: BillLineKey; label: string; basis: string; billed: number; expected: number; diff: number }

const numeric = {
  headerClassName: "text-end [&>div]:justify-end",
  cellClassName: "text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-16" />,
}

function toRows(billed: BillLine[], expected: BillLine[]): LineRow[] {
  return expected.map((e) => {
    const b = billed.find((l) => l.key === e.key)?.amount ?? 0
    return { key: e.key, label: e.label, basis: e.basis, billed: b, expected: e.amount, diff: b - e.amount }
  })
}

function LinesGrid({ rows, loading }: { rows: LineRow[]; loading?: boolean }) {
  const columns = React.useMemo<ColumnDef<DataGridFeatures, LineRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Line",
        size: 260,
        cell: ({ row }) => (
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{row.original.label}</span>
            <span className="text-xs text-muted-foreground">{row.original.basis}</span>
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-8 w-44" /> },
      },
      { accessorKey: "billed", header: "Billed", size: 120, cell: ({ row }) => formatInt(row.original.billed), meta: numeric },
      { accessorKey: "expected", header: "Our calculation", size: 140, cell: ({ row }) => formatInt(row.original.expected), meta: numeric },
      {
        accessorKey: "diff",
        header: "Difference",
        size: 120,
        cell: ({ row }) => {
          const d = row.original.diff
          if (!d) return <span className="text-muted-foreground">—</span>
          return <span className={cn("font-medium", d > 0 && "text-destructive-foreground dark:text-destructive")}>{`${d > 0 ? "+" : "−"}${formatInt(Math.abs(d))}`}</span>
        },
        meta: numeric,
      },
    ],
    []
  )
  const table = useTable({ features: dataGridFeatures, data: rows, columns, getRowId: (r) => r.key })
  const sum = (k: "billed" | "expected" | "diff") => rows.reduce((s, r) => s + r[k], 0)
  const total = sum("diff")

  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      isLoading={loading}
      tableLayout={{ headerBackground: true, footerBackground: true, rowBorder: true, width: "auto" }}
      tableClassNames={{ base: "w-full min-w-[620px]" }}
    >
      <DataGridScrollArea orientation="horizontal">
        <DataGridTable
          footerContent={
            loading ? undefined : (
              <DataGridTableFootRow>
                <DataGridTableFootRowCell className="font-semibold text-foreground">Amount payable</DataGridTableFootRowCell>
                <DataGridTableFootRowCell className="text-end font-semibold text-foreground tabular-nums">{formatInt(sum("billed"))}</DataGridTableFootRowCell>
                <DataGridTableFootRowCell className="text-end tabular-nums">{formatInt(sum("expected"))}</DataGridTableFootRowCell>
                <DataGridTableFootRowCell className={cn("text-end font-semibold tabular-nums", total > 0 && "text-destructive-foreground dark:text-destructive")}>
                  {total ? `${total > 0 ? "+" : "−"}${formatInt(Math.abs(total))}` : "—"}
                </DataGridTableFootRowCell>
              </DataGridTableFootRow>
            )
          }
        />
      </DataGridScrollArea>
    </DataGrid>
  )
}

function Facts({ bill, siteName }: { bill: Bill; siteName: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Site", siteName],
    ["Electricity company", bill.disco],
    ["Reference", <span key="r" className="tabular-nums">{bill.referenceNo}</span>],
    ["Tariff", `${bill.tariff}: ${tariffs[bill.tariff].label}`],
    ["Sanctioned load", `${formatInt(bill.sanctionedKw)} kW`],
    ["Maximum demand (MDI)", `${formatInt(bill.mdiKw)} kW`],
    ["Peak units", `${formatInt(bill.peakKwh)} kWh`],
    ["Off-peak units", `${formatInt(bill.offPeakKwh)} kWh`],
    ["Power factor", bill.powerFactor.toFixed(2)],
    ["Issued", formatDate(bill.issueDate)],
    ["Due", formatDate(bill.dueDate)],
    ["Source", bill.source.fileName],
  ]
  return (
    <Panel title="Bill Facts" hint="Confirmed after reading">
      <dl className="flex flex-col gap-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">{k}</dt>
            <dd className="min-w-0 text-end font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function Detail({ id }: { id: string }) {
  const router = useRouter()
  const q = useApiQuery(() => getBillDetail(id), [id])

  if (q.status === "error") {
    const missing = q.error?.includes("doesn’t exist")
    return missing ? (
      <Frame spacing="default">
        <FramePanel>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileQuestionIcon />
              </EmptyMedia>
              <EmptyTitle>Bill not found</EmptyTitle>
              <EmptyDescription>It may have been removed, or it belongs to another organisation.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={() => router.push("/bills/")}>
                Back to bills
              </Button>
            </EmptyContent>
          </Empty>
        </FramePanel>
      </Frame>
    ) : (
      <PanelError title="Couldn’t load this bill" error={q.error} onRetry={q.retry} />
    )
  }

  const d = q.data
  const loading = q.status === "loading" || !d
  const rows = d ? toRows(d.bill.lines, d.check.expected) : []
  const found = d ? d.check.findings.filter((f) => f.kind === "overcharge").reduce((s, f) => s + f.impactPkr, 0) : 0

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {loading ? (
            <>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{formatBillMonthLong(d.bill.month)} bill</h2>
                <BillStatusBadge status={d.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {d.bill.disco}, billed {formatPkr(d.bill.amountPayable)}
                {found > 0 ? `. Possible overcharges on this bill: ${formatPkr(found)}, one-time.` : ". No possible overcharges found."}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => toast.info("Original file isn’t stored in the demo", { description: d?.bill.source.fileName })}
          >
            <DownloadIcon data-icon="inline-start" />
            Original
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Previous month"
            disabled={!d?.previousId}
            nativeButton={false}
            render={d?.previousId ? <Link href={billHref(d.previousId)} /> : <span />}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Next month"
            disabled={!d?.nextId}
            nativeButton={false}
            render={d?.nextId ? <Link href={billHref(d.nextId)} /> : <span />}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 @5xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-2">
          <Frame spacing="default" className="min-w-0">
            <FrameHeader className="flex-row flex-wrap items-baseline justify-between gap-2">
              <FrameTitle>Bill Lines</FrameTitle>
              <span className="text-xs text-muted-foreground">PKR, as billed vs the {d?.bill.tariff ?? ""} tariff</span>
            </FrameHeader>
            <FramePanel className="p-0">
              <LinesGrid rows={rows} loading={loading} />
            </FramePanel>
          </Frame>
          <Panel title="What We Found" hint={found ? `${formatPkr(found)} possible overcharges, one-time` : undefined}>
            <PanelState
              status={loading ? "loading" : "ready"}
              isEmpty={!!d && d.check.findings.length === 0}
              skeleton={<Skeleton className="h-40 w-full" />}
              empty={{ icon: <SearchCheckIcon />, title: "Nothing to fix on this bill", description: "Every line matches the tariff.", action: "Back to bills", onAction: () => router.push("/bills/") }}
            >
              {d && <FindingsList findings={d.check.findings} size="sm" planLink />}
            </PanelState>
          </Panel>
        </div>
        {d ? <Facts bill={d.bill} siteName={d.siteName} /> : <Skeleton className="h-96 w-full" />}
      </div>
    </>
  )
}

export function BillDetailPage({ id }: { id: string | null }) {
  return (
    <AppShell title="Bill">
      <OrgSwitch
        sample={<PanelError title="Bills belong to your own organisation" error="Load a bills scenario from the Demo banner." />}
        own={() => (id ? <Detail id={id} /> : <PanelError title="No bill chosen" error="Open a bill from the Bills page." />)}
      />
    </AppShell>
  )
}
