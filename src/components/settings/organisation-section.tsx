"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { SelectField } from "@/components/forms/select-field"
import { FormError } from "@/components/onboarding/form-error"
import { businessTypes } from "@/components/onboarding/sign-up"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { getOrganisationSettings, switchOrganisation, updateOrganisation, useApiQuery, type BusinessType } from "@/lib/api"

import { ReadOnlyNotice, roleName, usePermission } from "./shared"

export function OrganisationSection() {
  const router = useRouter()
  const q = useApiQuery(getOrganisationSettings, [])
  const perm = usePermission("edit")
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<BusinessType | null>(null)
  const [ntn, setNtn] = React.useState("")
  const [strn, setStrn] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  const loadedFor = React.useRef<string>("")
  React.useEffect(() => {
    if (!q.data || loadedFor.current === q.data.org.id) return
    loadedFor.current = q.data.org.id
    setName(q.data.org.name)
    setType(q.data.org.businessType)
    setNtn(q.data.settings.ntn ?? "")
    setStrn(q.data.settings.strn ?? "")
  }, [q.data])

  const ro = !perm.allowed
  return (
    <>
      <Panel title="Organisation" hint="Shown on reports and invoices">
        <PanelState
          status={q.status}
          error={q.error}
          onRetry={q.retry}
          skeleton={<Skeleton className="h-56 w-full" />}
          empty={{ icon: null, title: "", description: "", action: "" }}
        >
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setPending(true)
              setError(undefined)
              try {
                await updateOrganisation({ name, businessType: type ?? "other", ntn, strn })
                toast.success("Organisation saved", { description: name })
              } catch (err) {
                setError((err as Error).message)
              } finally {
                setPending(false)
              }
            }}
          >
            {ro && perm.ready && <ReadOnlyNotice role={perm.role} need="Manager or Owner" />}
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="org-name">Organisation name</FieldLabel>
                  <Input id="org-name" value={name} disabled={ro} onChange={(e) => setName(e.target.value)} />
                </Field>
                <SelectField id="org-type" label="Business type" value={type} items={businessTypes} onChange={setType} disabled={ro} />
                <Field>
                  <FieldLabel htmlFor="org-ntn">NTN (optional)</FieldLabel>
                  <Input id="org-ntn" inputMode="numeric" placeholder="1234567-8" value={ntn} disabled={ro} onChange={(e) => setNtn(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-strn">Sales tax registration, STRN (optional)</FieldLabel>
                  <Input id="org-strn" inputMode="numeric" placeholder="32-77-8761-234-56" value={strn} disabled={ro} onChange={(e) => setStrn(e.target.value)} />
                  <FieldDescription>Registered consumers shouldn’t pay 3% further tax; we flag it when they do.</FieldDescription>
                </Field>
              </div>
            </FieldGroup>
            {error && <FormError title="Couldn’t save" message={error} />}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={ro || pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Save changes
              </Button>
            </div>
          </form>
        </PanelState>
      </Panel>

      <Panel title="Your Organisations" hint="Switch to work in another one">
        <PanelState
          status={q.status}
          error={q.error}
          onRetry={q.retry}
          skeleton={<Skeleton className="h-24 w-full" />}
          isEmpty={q.data?.orgs.length === 0}
          empty={{ icon: null, title: "No organisations", description: "Create one to get started.", action: "Sign up", onAction: () => router.push("/signup/") }}
        >
          <ItemGroup role="list" aria-label="Your organisations">
            {q.data?.orgs.map((o) => {
              const current = o.id === q.data?.org.id
              return (
                <Item key={o.id} variant="outline" size="sm" role="listitem">
                  <ItemContent className="min-w-0">
                    <ItemTitle>{o.name}</ItemTitle>
                    <ItemDescription>
                      {roleName[o.role]}
                      {o.data === "sample" ? ", sample data" : ""}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {current ? (
                      <Badge variant="success-light">Current</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await switchOrganisation(o.id)
                          loadedFor.current = ""
                          toast.success("Switched organisation", { description: o.name })
                          router.push("/")
                        }}
                      >
                        Switch
                      </Button>
                    )}
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </PanelState>
      </Panel>
    </>
  )
}
