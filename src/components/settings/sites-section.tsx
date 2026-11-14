"use client"

import * as React from "react"
import { ArchiveIcon, ArchiveRestoreIcon, Building2Icon, PencilIcon, PlusIcon } from "lucide-react"
import { useTable, type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { PanelState } from "@/components/dashboard/panel-state"
import { SelectField } from "@/components/forms/select-field"
import { FormError } from "@/components/onboarding/form-error"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  cities,
  createSite,
  discos,
  getSites,
  setSiteArchived,
  tariffFor,
  tariffs,
  updateSite,
  useApiQuery,
  type ConnectionType,
  type Disco,
  type NewSite,
  type Site,
} from "@/lib/api"
import { formatInt } from "@/lib/format"

import { ReadOnlyNotice, usePermission } from "./shared"

const cityItems = cities.map((c) => ({ value: c.city, label: c.city }))
const discoItems = discos.map((d) => ({ value: d, label: d }))
const connectionItems: { value: ConnectionType; label: string }[] = [
  { value: "industrial", label: "Industrial" },
  { value: "commercial", label: "Commercial" },
]

function SiteDialog({ open, site, onClose }: { open: boolean; site: Site | null; onClose: () => void }) {
  const [form, setForm] = React.useState({ name: "", city: null as string | null, disco: null as Disco | null, connection: "industrial" as ConnectionType, load: "", area: "" })
  const [tried, setTried] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (!open) return
    setForm(
      site
        ? { name: site.name, city: site.city, disco: site.disco, connection: site.connectionType, load: String(site.sanctionedKw), area: site.areaSqft ? String(site.areaSqft) : "" }
        : { name: "", city: null, disco: null, connection: "industrial", load: "", area: "" }
    )
    setTried(false)
    setError(undefined)
  }, [open, site])

  const kw = Number(form.load)
  const errors = {
    name: !form.name.trim() ? "Name the site." : undefined,
    city: !form.city ? "Choose the city." : undefined,
    disco: !form.disco ? "Choose the electricity company." : undefined,
    load: !(kw > 0 && kw <= 20_000) ? "Enter the sanctioned load in kW." : undefined,
  }
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined)
  const tariff = kw > 0 ? tariffFor(form.connection, kw) : null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setTried(true)
            if (Object.values(errors).some(Boolean)) return
            const input: NewSite = {
              name: form.name,
              city: form.city!,
              disco: form.disco!,
              connectionType: form.connection,
              sanctionedKw: kw,
              areaSqft: Number(form.area) > 0 ? Number(form.area) : undefined,
            }
            setPending(true)
            setError(undefined)
            try {
              if (site) await updateSite(site.id, input)
              else await createSite(input)
              toast.success(site ? "Site updated" : "Site added", { description: input.name })
              onClose()
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setPending(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{site ? "Edit site" : "Add a site"}</DialogTitle>
            <DialogDescription>One electricity connection: a factory, branch or building.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!show("name")}>
              <FieldLabel htmlFor="sd-name">Site name</FieldLabel>
              <Input id="sd-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} aria-invalid={!!show("name")} />
              <FieldError>{show("name")}</FieldError>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <SelectField
                  id="sd-city"
                  label="City"
                  value={form.city}
                  placeholder="Choose a city"
                  items={cityItems}
                  onChange={(c) => setForm((f) => ({ ...f, city: c, disco: cities.find((x) => x.city === c)?.disco ?? f.disco }))}
                />
                <FieldError>{show("city")}</FieldError>
              </div>
              <div className="flex flex-col gap-1">
                <SelectField id="sd-disco" label="Electricity company" value={form.disco} placeholder="Choose a DISCO" items={discoItems} onChange={(d) => setForm((f) => ({ ...f, disco: d }))} />
                <FieldError>{show("disco")}</FieldError>
              </div>
              <SelectField id="sd-conn" label="Connection type" value={form.connection} items={connectionItems} onChange={(c) => setForm((f) => ({ ...f, connection: c }))} />
              <Field data-invalid={!!show("load")}>
                <FieldLabel htmlFor="sd-load">Sanctioned load</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="sd-load" inputMode="decimal" value={form.load} onChange={(e) => setForm((f) => ({ ...f, load: e.target.value.replace(/[^\d.]/g, "") }))} aria-invalid={!!show("load")} />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>kW</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{show("load")}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="sd-area">Covered area (optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput id="sd-area" inputMode="numeric" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value.replace(/\D/g, "") }))} />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>sq ft</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>{tariff ? `Tariff ${tariff}: ${tariffs[tariff].label}.` : "Used for cost per sq ft."}</FieldDescription>
            </Field>
          </FieldGroup>
          {error && <FormError title={site ? "Couldn’t update the site" : "Couldn’t add the site"} message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {site ? "Save site" : "Add site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SitesSection() {
  const q = useApiQuery(() => getSites({ includeArchived: true }), [])
  const perm = usePermission("edit")
  const [editing, setEditing] = React.useState<Site | null | "new">(null)
  const [archiving, setArchiving] = React.useState<Site | null>(null)
  const [pending, setPending] = React.useState(false)
  const rows = React.useMemo(() => [...(q.data ?? [])].sort((a, b) => Number(a.archived) - Number(b.archived)), [q.data])

  const columns = React.useMemo<ColumnDef<DataGridFeatures, Site>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Site",
        size: 220,
        cell: ({ row }) => (
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.city}</span>
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-8 w-36" /> },
      },
      { accessorKey: "disco", header: "DISCO", size: 100, meta: { skeleton: <Skeleton className="h-4 w-14" /> } },
      { accessorKey: "tariff", header: "Tariff", size: 90, meta: { skeleton: <Skeleton className="h-4 w-12" /> } },
      {
        accessorKey: "sanctionedKw",
        header: "Sanctioned",
        size: 110,
        cell: ({ row }) => `${formatInt(row.original.sanctionedKw)} kW`,
        meta: { headerClassName: "text-end [&>div]:justify-end", cellClassName: "text-end tabular-nums", skeleton: <Skeleton className="ms-auto h-4 w-14" /> },
      },
      {
        accessorKey: "areaSqft",
        header: "Area",
        size: 120,
        cell: ({ row }) => (row.original.areaSqft ? `${formatInt(row.original.areaSqft)} sq ft` : <span className="text-muted-foreground">—</span>),
        meta: { headerClassName: "text-end [&>div]:justify-end", cellClassName: "text-end tabular-nums", skeleton: <Skeleton className="ms-auto h-4 w-16" /> },
      },
      {
        accessorKey: "archived",
        header: "Status",
        size: 100,
        cell: ({ row }) => (row.original.archived ? <Badge variant="outline">Archived</Badge> : <Badge variant="success-light">Active</Badge>),
        meta: { skeleton: <Skeleton className="h-5 w-14" /> },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 100,
        cell: ({ row }) =>
          perm.allowed ? (
            <span className="flex justify-end gap-1">
              {!row.original.archived && (
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${row.original.name}`} onClick={() => setEditing(row.original)}>
                  <PencilIcon />
                </Button>
              )}
              {row.original.archived ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Restore ${row.original.name}`}
                  onClick={async () => {
                    await setSiteArchived(row.original.id, false)
                    toast.success("Site restored", { description: row.original.name })
                  }}
                >
                  <ArchiveRestoreIcon />
                </Button>
              ) : (
                <Button size="icon-sm" variant="ghost" aria-label={`Archive ${row.original.name}`} onClick={() => setArchiving(row.original)}>
                  <ArchiveIcon />
                </Button>
              )}
            </span>
          ) : null,
        meta: { skeleton: <Skeleton className="ms-auto h-6 w-14" /> },
      },
    ],
    [perm.allowed]
  )
  const table = useTable({ features: dataGridFeatures, data: q.status === "ready" ? rows : [], columns, getRowId: (r) => r.id })

  return (
    <>
      <Frame spacing="default" className="min-w-0">
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle>Sites</FrameTitle>
            <span className="text-xs text-muted-foreground">Each site is one electricity connection, billed per site.</span>
          </div>
          {perm.allowed && (
            <Button size="sm" onClick={() => setEditing("new")}>
              <PlusIcon data-icon="inline-start" />
              Add site
            </Button>
          )}
        </FrameHeader>
        {!perm.allowed && perm.ready && (
          <FramePanel>
            <ReadOnlyNotice role={perm.role} need="Manager or Owner" />
          </FramePanel>
        )}
        {q.status === "error" || (q.status === "ready" && rows.length === 0) ? (
          <FramePanel className="flex flex-col gap-4">
            <PanelState
              status={q.status}
              error={q.error}
              onRetry={q.retry}
              isEmpty
              skeleton={null}
              empty={{ icon: <Building2Icon />, title: "No sites yet", description: "Add the first electricity connection to start.", action: "Add site", onAction: () => setEditing("new") }}
            >
              {null}
            </PanelState>
          </FramePanel>
        ) : (
          <FramePanel className="p-0">
            <DataGrid table={table} recordCount={rows.length} isLoading={q.status === "loading"} tableLayout={{ headerBackground: true, rowBorder: true }} tableClassNames={{ base: "min-w-[760px]" }}>
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGrid>
          </FramePanel>
        )}
      </Frame>

      <SiteDialog open={editing !== null} site={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      <AlertDialog open={!!archiving} onOpenChange={(o) => !o && !pending && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiving?.name}?</AlertDialogTitle>
            <AlertDialogDescription>It leaves the facility picker and stops alerts and billing. Its bills stay, and you can restore it any time.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (!archiving) return
                setPending(true)
                try {
                  await setSiteArchived(archiving.id, true)
                  toast.success("Site archived", { description: archiving.name })
                  setArchiving(null)
                } catch (e) {
                  toast.error("Couldn’t archive", { description: (e as Error).message })
                } finally {
                  setPending(false)
                }
              }}
            >
              {pending && <Spinner data-icon="inline-start" />}
              Archive site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
