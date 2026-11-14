"use client"

import * as React from "react"
import { toast } from "sonner"

import { FormError } from "@/components/onboarding/form-error"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { setBudget } from "@/lib/api"
import { formatInt, formatPkr } from "@/lib/format"

export function BudgetDialog({
  open,
  onOpenChange,
  siteId,
  siteName,
  suggested,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  siteId: string
  siteName: string
  /** The latest bill, as a starting point. */
  suggested?: number
}) {
  const [value, setValue] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (!open) return
    setValue(suggested ? formatInt(Math.round((suggested * 0.95) / 10_000) * 10_000) : "")
    setSubmitted(false)
    setError(undefined)
  }, [open, suggested])

  const amount = Number(value.replace(/,/g, ""))
  const invalid = submitted && !(amount > 0)

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitted(true)
            if (!(amount > 0)) return
            setPending(true)
            setError(undefined)
            try {
              await setBudget(siteId, amount)
              toast.success("Budget set", { description: `${formatPkr(amount)} a month for ${siteName}.` })
              onOpenChange(false)
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setPending(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Set a monthly budget</DialogTitle>
            <DialogDescription>For {siteName}. We alert you when a bill goes over it.</DialogDescription>
          </DialogHeader>
          <Field data-invalid={invalid}>
            <FieldLabel htmlFor="budget">Monthly electricity budget</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>PKR</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="budget"
                inputMode="numeric"
                className="tabular-nums"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^\d,]/g, ""))}
                aria-invalid={invalid}
              />
            </InputGroup>
            {invalid ? (
              <FieldError>Enter an amount above 0.</FieldError>
            ) : (
              suggested && <FieldDescription>Suggested: 5% under your latest bill of {formatPkr(suggested)}.</FieldDescription>
            )}
          </Field>
          {error && <FormError title="Couldn’t save the budget" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
