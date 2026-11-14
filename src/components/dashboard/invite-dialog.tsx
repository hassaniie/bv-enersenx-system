"use client"

import * as React from "react"
import { toast } from "sonner"

import { SelectField } from "@/components/forms/select-field"
import { FormError } from "@/components/onboarding/form-error"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { inviteMember, type Role } from "@/lib/api"

export const roleItems: { value: Role; label: string }[] = [
  { value: "owner", label: "Owner: everything, including users and billing" },
  { value: "manager", label: "Manager: sites, bills and actions" },
  { value: "viewer", label: "Viewer: read only" },
]

export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<Role>("manager")
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (!open) return
    setEmail("")
    setRole("manager")
    setSubmitted(false)
    setError(undefined)
  }, [open])

  const emailError = submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Enter an email like name@company.pk." : undefined

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitted(true)
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return
            setPending(true)
            setError(undefined)
            try {
              await inviteMember({ email, role })
              toast.success("Invite sent", { description: `${email.trim()} can join as ${role}.` })
              onOpenChange(false)
            } catch (err) {
              setError((err as Error).message)
            } finally {
              setPending(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite a colleague</DialogTitle>
            <DialogDescription>They get an email with a link to join. In the demo, no email is sent.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!emailError}>
              <FieldLabel htmlFor="inv-email">Email</FieldLabel>
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} />
              <FieldError>{emailError}</FieldError>
            </Field>
            <SelectField id="inv-role" label="Role" value={role} items={roleItems} onChange={setRole} />
          </FieldGroup>
          {error && <FormError title="Couldn’t send the invite" message={error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
