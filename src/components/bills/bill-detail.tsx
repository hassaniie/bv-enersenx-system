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
import { getBillDetail, tariffs, useApiQuery, type Bill, type BillLine, type BillLineKey, type Finding } from "@/lib/api"
import { formatBillMonthLong, formatInt, formatPkr, formatPkrShort } from "@/lib/format"
import { cn } from "@/lib/utils"

import { KindBadge } from "@/components/money/kinds"

import { BillActions } from "./bill-actions"
import { billHref, BillStatusBadge } from "./bills-page"
import { FindingsList } from "./findings-list"
import { lineHelp } from "./line-help"

type LineRow = { key: BillLineKey; label: string; basis: string; billed: number; expected: number; diff: number; finding?: Finding }

const numeric = {
  headerClassName: "text-end [&>div]:justify-end",
  cellClassName: "text-end tabular-nums",
  skeleton: <Skeleton className="ms-auto h-4 w-16" />,
}

function toRows(billed: BillLine[], expected: BillLine[], findings: Finding[]): LineRow[] {
  return expected.map((e) => {
    const b = billed.find((l) => l.key === e.key)?.amount ?? 0
    const finding = findings.find((f) => f.line === e.key && f.kind !== "estimate")
    return { key: e.key, label: e.label, basis: e.basis, billed: b, expected: e.amount, diff: b - e.amount, finding }
  })
}

const signed = (d: number) => `${d > 0 ? "+" : "−"}${formatInt(Math.abs(d))}`

/** What the line is, how we calculated it, and whether a finding is about it. */
function LineLabel({ row }: { row: LineRow }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5 whitespace-normal">
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{row.label}</span>
        {row.finding && <KindBadge kind={row.finding.kind} />}
      </span>
      <span className="text-xs text-muted-foreground">{lineHelp[row.key]}</span>
      <span className="text-xs text-muted-foreground tabular-nums">Our calculation: {row.basis}</span>
      {row.diff !== 0 && !row.finding && <span className="text-xs text-muted-foreground">Different because of the lines above.</span>}
    </span>
  )
}

/** Phones: one row per line, the difference under the amount (principles.md U14). */
function LinesList({ rows }: { rows: LineRow[] }) {
  const total = rows.reduce((s, r) => s + r.billed, 0)
  return (
    <ul className="flex flex-col divide-y text-sm" aria-label="Bill lines">
      {rows.map((r) => (
        <li key={r.key} className="flex items-start justify-between gap-3 px-4 py-3">
          <LineLabel row={r} />
          <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
            <span className="font-medium">{formatInt(r.billed)}</span>
            {r.diff !== 0 && (
              <span className={cn("text-xs", r.diff > 0 ? "text-destructive-foreground dark:text-destructive" : "text-muted-foreground")}>
                {signed(r.diff)} vs {formatInt(r.expected)}
              </span>
            )}
          </span>
        </li>
      ))}
      <li className="flex items-baseline justify-between gap-3 px-4 py-3 font-semibold">
        <span>Amount payable</span>
        <span className="tabular-nums">{formatInt(total)}</span>
      </li>
    </ul>
  )
}

function LinesGrid({ rows, loading }: { rows: LineRow[]; loading?: boolean }) {
  const columns = React.useMemo<ColumnDef<DataGridFeatures, LineRow>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Line",
        size: 380,
        cell: ({ row }) => <LineLabel row={row.original} />,
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
          return <span className={cn("font-medium", d > 0 && "text-destructive-foreground dark:text-destructive")}>{signed(d)}</span>
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
      tableClassNames={{ base: "w-full min-w-[720px]" }}
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

function Facts({ bill, siteName, className }: { bill: Bill; siteName: string; className?: string }) {
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
    <Panel className={className} title="Bill Facts" hint="Confirmed after reading">
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
  const rows = d ? toRows(d.bill.lines, d.check.expected, d.check.findings) : []
  const found = d ? d.check.findings.filter((f) => f.kind === "overcharge").reduce((s, f) => s + f.impactPkr, 0) : 0

  return (
    <>
      {/* Document header (references.md §12: Stripe, Shopify bill): what, whose, when, then three figures. */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
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
                  {d.bill.disco} · Reference <span className="tabular-nums">{d.bill.referenceNo}</span> · Due {formatDate(d.bill.dueDate)}
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
        {loading ? (
          <Skeleton className="h-14 w-full" />
        ) : (
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3" aria-label="This bill in figures">
            {[
              { label: "Billed", value: formatPkr(d.bill.amountPayable), short: formatPkrShort(d.bill.amountPayable), note: "Amount payable" },
              { label: "Our calculation", value: formatPkr(d.check.expectedTotal), short: formatPkrShort(d.check.expectedTotal), note: `${d.bill.tariff} tariff` },
              {
                label: "Possible overcharge",
                value: found ? formatPkr(found) : "None",
                short: found ? formatPkrShort(found) : "None",
                note: found ? "One-time, on this bill" : "Every line matches",
                tone: found ? "text-destructive-foreground dark:text-destructive" : undefined,
              },
            ].map((f) => (
              <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="flex flex-col">
                  <span className={cn("text-base font-semibold tabular-nums", f.tone)}>
                    <span className="hidden @xl:inline">{f.value}</span>
                    <span className="@xl:hidden">{f.short}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{f.note}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {/* Phones: found, what to do, lines, facts. Wide: findings and lines left, actions and facts right. */}
      <div className="flex flex-col gap-2 @5xl:grid @5xl:grid-cols-[minmax(0,1fr)_22rem] @5xl:items-start">
        <div className="flex min-w-0 flex-col gap-2 @max-5xl:contents">
          <Panel className="order-1" title="What We Found" hint={found ? `${formatPkr(found)} possible overcharges, one-time` : undefined}>
            <PanelState
              status={loading ? "loading" : "ready"}
              isEmpty={!!d && d.check.findings.length === 0}
              skeleton={<Skeleton className="h-40 w-full" />}
              empty={{ icon: <SearchCheckIcon />, title: "Nothing to fix on this bill", description: "Every line matches the tariff.", action: "Back to bills", onAction: () => router.push("/bills/") }}
            >
              {d && <FindingsList findings={d.check.findings} size="sm" />}
            </PanelState>
          </Panel>
          <Frame spacing="default" className="order-3 min-w-0">
            <FrameHeader className="flex-row flex-wrap items-baseline justify-between gap-2">
              <FrameTitle>Bill Lines</FrameTitle>
              <span className="text-xs text-muted-foreground">PKR, as billed vs the {d?.bill.tariff ?? ""} tariff</span>
            </FrameHeader>
            <FramePanel className="p-0">
              <div className="hidden @xl:block">
                <LinesGrid rows={rows} loading={loading} />
              </div>
              <div className="@xl:hidden">{loading ? <Skeleton className="m-4 h-64" /> : <LinesList rows={rows} />}</div>
            </FramePanel>
          </Frame>
        </div>
        <div className="flex min-w-0 flex-col gap-2 @max-5xl:contents">
          {d ? <BillActions className="order-2" detail={d} /> : <Skeleton className="order-2 h-40 w-full" />}
          {d ? <Facts className="order-4" bill={d.bill} siteName={d.siteName} /> : <Skeleton className="order-4 h-96 w-full" />}
        </div>
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
