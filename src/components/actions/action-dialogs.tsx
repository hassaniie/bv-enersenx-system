"use client"

import * as React from "react"

import { SelectField } from "@/components/forms/select-field"
import { FormError } from "@/components/onboarding/form-error"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { daysFromToday, TODAY } from "@/lib/app-date"
import { acceptAction, listAssignees, markActionDone, useApiQuery, type SavingsAction } from "@/lib/api"
import { formatPkr } from "@/lib/format"

function useSubmit(fn: () => Promise<unknown>, onDone: () => void) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const run = async () => {
    setPending(true)
    setError(undefined)
    try {
      await fn()
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }
  return { pending, error, run, reset: () => setError(undefined) }
}

/** Accept a suggestion: who owns it and by when. */
export function AcceptDialog({ action, onClose, onDone }: { action: SavingsAction | null; onClose: () => void; onDone: (a: SavingsAction) => void }) {
  const people = useApiQuery(listAssignees, [])
  const [owner, setOwner] = React.useState<string | null>(null)
  const [due, setDue] = React.useState(daysFromToday(30))
  const [note, setNote] = React.useState("")
  const items = (people.data ?? []).map((p) => ({ value: p.name, label: p.name }))
  const submit = useSubmit(
    () => acceptAction(action!, { owner: people.data!.find((p) => p.name === owner)!, dueDate: due, note: note.trim() || undefined }),
    () => onDone(action!)
  )

  React.useEffect(() => {
    if (!action) return
    setOwner(null)
    setDue(daysFromToday(30))
    setNote("")
    submit.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action])

  const [tried, setTried] = React.useState(false)
  React.useEffect(() => setTried(false), [action])
  const ownerError = tried && !owner ? "Choose who will do it." : undefined
  const dueError = tried && (!due || due < TODAY) ? "Choose a date from today on." : undefined

  return (
    <Dialog open={!!action} onOpenChange={(o) => !o && !submit.pending && onClose()}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setTried(true)
            if (!owner || !due || due < TODAY) return
            submit.run()
          }}
        >
          <DialogHeader>
            <DialogTitle>{action?.title}</DialogTitle>
            <DialogDescription>Estimated {action ? formatPkr(action.estMonthlyPkr) : ""} a month. Assign it to make it happen.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="flex flex-col gap-1">
              <SelectField id="act-owner" label="Owner" value={owner} items={items} onChange={setOwner} placeholder={people.status === "loading" ? "Loading people…" : "Choose a person"} />
              <FieldError>{ownerError}</FieldError>
            </div>
            <Field data-invalid={!!dueError}>
              <FieldLabel htmlFor="act-due">Due date</FieldLabel>
              <Input id="act-due" type="date" min={TODAY} value={due} onChange={(e) => setDue(e.target.value)} aria-invalid={!!dueError} />
              <FieldError>{dueError}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="act-note">Note (optional)</FieldLabel>
              <Textarea id="act-note" rows={3} placeholder="Quote from the contractor, complaint number…" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </FieldGroup>
          {submit.error && <FormError title="Couldn’t accept the action" message={submit.error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submit.pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={submit.pending}>
              {submit.pending && <Spinner data-icon="inline-start" />}
              Accept and assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Mark an action done; the next bills then verify it. */
export function DoneDialog({ action, onClose, onDone }: { action: SavingsAction | null; onClose: () => void; onDone: (a: SavingsAction) => void }) {
  const [date, setDate] = React.useState(TODAY)
  const [note, setNote] = React.useState("")
  const submit = useSubmit(() => markActionDone(action!, { doneAt: date, note: note.trim() || undefined }), () => onDone(action!))

  React.useEffect(() => {
    if (!action) return
    setDate(TODAY)
    setNote("")
    submit.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action])

  const dateError = !date || date > TODAY ? "Choose today or an earlier date." : undefined

  return (
    <Dialog open={!!action} onOpenChange={(o) => !o && !submit.pending && onClose()}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (dateError) return
            submit.run()
          }}
        >
          <DialogHeader>
            <DialogTitle>Mark as done</DialogTitle>
            <DialogDescription>{action?.title}. We’ll check the next bills and mark the saving verified, or not achieved.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!dateError}>
              <FieldLabel htmlFor="done-date">Done on</FieldLabel>
              <Input id="done-date" type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!dateError} />
              {dateError ? <FieldError>{dateError}</FieldError> : <FieldDescription>Bills for later months are compared with the 3 before it.</FieldDescription>}
            </Field>
            <Field>
              <FieldLabel htmlFor="done-note">What was done (optional)</FieldLabel>
              <Textarea id="done-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </FieldGroup>
          {submit.error && <FormError title="Couldn’t save" message={submit.error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submit.pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={submit.pending}>
              {submit.pending && <Spinner data-icon="inline-start" />}
              Mark done
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
