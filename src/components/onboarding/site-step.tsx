"use client"

import * as React from "react"

import { SelectField } from "@/components/forms/select-field"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cities, createSite, discos, tariffFor, tariffs, type ConnectionType, type Disco, type Site } from "@/lib/api"

import { FormError } from "./form-error"

const cityItems = cities.map((c) => ({ value: c.city, label: c.city }))
const discoItems = discos.map((d) => ({ value: d, label: d }))
const connectionItems: { value: ConnectionType; label: string }[] = [
  { value: "industrial", label: "Industrial" },
  { value: "commercial", label: "Commercial" },
]

export function SiteStep({ onCreated }: { onCreated: (site: Site) => void }) {
  const [name, setName] = React.useState("")
  const [city, setCity] = React.useState<string | null>(null)
  const [disco, setDisco] = React.useState<Disco | null>(null)
  const [connection, setConnection] = React.useState<ConnectionType>("industrial")
  const [load, setLoad] = React.useState("")
  const [area, setArea] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  const kw = Number(load)
  const errors = {
    name: !name.trim() ? "Name the site, e.g. “Faisalabad weaving unit”." : undefined,
    city: !city ? "Choose the city." : undefined,
    disco: !disco ? "Choose your electricity company." : undefined,
    load: !(kw > 0 && kw <= 20_000) ? "Enter the sanctioned load in kW (it’s printed on your bill)." : undefined,
  }
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined)
  const tariff = kw > 0 ? tariffFor(connection, kw) : null

  return (
    <>
      <CardHeader>
        <CardTitle>Add your first site</CardTitle>
        <CardDescription>One electricity connection: a factory, branch or building.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitted(true)
            if (Object.values(errors).some(Boolean)) return
            setPending(true)
            setError(undefined)
            try {
              onCreated(
                await createSite({
                  name,
                  city: city!,
                  disco: disco!,
                  connectionType: connection,
                  sanctionedKw: kw,
                  areaSqft: Number(area) > 0 ? Number(area) : undefined,
                })
              )
            } catch (err) {
              setError((err as Error).message)
              setPending(false)
            }
          }}
        >
          <FieldGroup>
            <Field data-invalid={!!show("name")}>
              <FieldLabel htmlFor="site-name">Site name</FieldLabel>
              <Input
                id="site-name"
                placeholder="Faisalabad weaving unit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!show("name")}
              />
              <FieldError>{show("name")}</FieldError>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <SelectField
                  id="site-city"
                  label="City"
                  value={city}
                  placeholder="Choose a city"
                  items={cityItems}
                  onChange={(c) => {
                    setCity(c)
                    setDisco(cities.find((x) => x.city === c)?.disco ?? null)
                  }}
                />
                <FieldError>{show("city")}</FieldError>
              </div>
              <div className="flex flex-col gap-1">
                <SelectField
                  id="site-disco"
                  label="Electricity company"
                  value={disco}
                  placeholder="Choose a DISCO"
                  items={discoItems}
                  onChange={setDisco}
                  description={city ? `Filled in from ${city}; change it if needed.` : undefined}
                />
                <FieldError>{show("disco")}</FieldError>
              </div>
              <SelectField id="site-connection" label="Connection type" value={connection} items={connectionItems} onChange={setConnection} />
              <Field data-invalid={!!show("load")}>
                <FieldLabel htmlFor="site-load">Sanctioned load</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="site-load"
                    inputMode="decimal"
                    placeholder="500"
                    value={load}
                    onChange={(e) => setLoad(e.target.value.replace(/[^\d.]/g, ""))}
                    aria-invalid={!!show("load")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>kW</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{show("load")}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="site-area">Covered area (optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="site-area"
                  inputMode="numeric"
                  placeholder="120,000"
                  value={area}
                  onChange={(e) => setArea(e.target.value.replace(/\D/g, ""))}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>sq ft</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                {tariff ? `Tariff ${tariff}: ${tariffs[tariff].label}.` : "Used for cost per sq ft when you add more sites."}
              </FieldDescription>
            </Field>
          </FieldGroup>
          {error && <FormError title="Couldn’t add the site" message={error} />}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Add site
          </Button>
        </form>
      </CardContent>
    </>
  )
}
