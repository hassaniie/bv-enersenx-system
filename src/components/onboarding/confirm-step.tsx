"use client"

import * as React from "react"

import { Badge } from "@/components/reui/badge"
import { SelectField } from "@/components/forms/select-field"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { completeMonths } from "@/lib/app-date"
import { confirmBill, type Bill, type KeyField } from "@/lib/api"
import { formatBillMonth, formatInt } from "@/lib/format"

import { FormError } from "./form-error"

const monthItems = completeMonths(12)
  .reverse()
  .map((iso) => ({ value: iso.slice(0, 7), label: formatBillMonth(iso.slice(0, 7)) }))

type NumField = Exclude<KeyField, "month">

const numberFields: { key: NumField; label: string; unit: string; where: string }[] = [
  { key: "peakKwh", label: "Peak units", unit: "kWh", where: "Units consumed, peak" },
  { key: "offPeakKwh", label: "Off-peak units", unit: "kWh", where: "Units consumed, off-peak" },
  { key: "mdiKw", label: "Maximum demand (MDI)", unit: "kW", where: "MDI under meter readings" },
  { key: "amountPayable", label: "Amount payable", unit: "PKR", where: "Payable within due date" },
]

function Confidence({ value }: { value: number }) {
  return value >= 0.9 ? <Badge variant="success-light">Read clearly</Badge> : <Badge variant="warning-light">Please check</Badge>
}

const parse = (s: string) => Number(s.replace(/,/g, ""))

/** The 5 numbers everything else is calculated from; the person checks them once. */
export function ConfirmStep({ bill, onConfirmed, onReupload }: { bill: Bill; onConfirmed: (b: Bill) => void; onReupload: () => void }) {
  const [month, setMonth] = React.useState(bill.month)
  const [values, setValues] = React.useState<Record<NumField, string>>({
    peakKwh: formatInt(bill.peakKwh),
    offPeakKwh: formatInt(bill.offPeakKwh),
    mdiKw: formatInt(bill.mdiKw),
    amountPayable: formatInt(bill.amountPayable),
  })
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const invalid = (k: NumField) => !(parse(values[k]) > 0)

  return (
    <>
      <CardHeader>
        <CardTitle>Check 5 numbers</CardTitle>
        <CardDescription>
          We read these from your {bill.disco} bill (ref. {bill.referenceNo}, tariff {bill.tariff}). Fix anything that’s wrong; the check uses them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (numberFields.some((f) => invalid(f.key))) return
            setPending(true)
            setError(undefined)
            try {
              onConfirmed(
                await confirmBill(bill.id, {
                  month,
                  peakKwh: parse(values.peakKwh),
                  offPeakKwh: parse(values.offPeakKwh),
                  mdiKw: parse(values.mdiKw),
                  amountPayable: parse(values.amountPayable),
                })
              )
            } catch (err) {
              setError((err as Error).message)
              setPending(false)
            }
          }}
        >
          <FieldGroup>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-end">
                <Confidence value={bill.confidence.month} />
              </div>
              <SelectField id="cf-month" label="Billing month" value={month} items={monthItems} onChange={setMonth} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {numberFields.map((f) => (
                <Field key={f.key} data-invalid={invalid(f.key)}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor={`cf-${f.key}`}>{f.label}</FieldLabel>
                    <Confidence value={bill.confidence[f.key]} />
                  </div>
                  <InputGroup>
                    <InputGroupInput
                      id={`cf-${f.key}`}
                      inputMode="numeric"
                      className="tabular-nums"
                      value={values[f.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value.replace(/[^\d,]/g, "") }))}
                      aria-invalid={invalid(f.key)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>{f.unit}</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {invalid(f.key) ? <FieldError>Enter a number above 0.</FieldError> : <FieldDescription>On the bill: {f.where}.</FieldDescription>}
                </Field>
              ))}
            </div>
          </FieldGroup>
          {error && <FormError title="Couldn’t save the bill" message={error} />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={onReupload} disabled={pending}>
              Upload a different bill
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Confirm and check my bill
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  )
}
