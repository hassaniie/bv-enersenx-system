"use client"

import * as React from "react"
import { toast } from "sonner"

import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { FormError } from "@/components/onboarding/form-error"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { getOrganisationSettings, saveNotifications, useApiQuery, type NotificationChannel, type NotificationTopic, type OrgSettings } from "@/lib/api"

import { ReadOnlyNotice, usePermission } from "./shared"

const topics: { id: NotificationTopic; label: string; detail: string }[] = [
  { id: "bill_anomaly", label: "Bill anomalies", detail: "Billing errors and unusual units on a new bill" },
  { id: "budget_overrun", label: "Budget overruns", detail: "A bill over the site’s monthly budget" },
  { id: "missing_bill", label: "Missing bills", detail: "The month’s bill isn’t uploaded by the 25th" },
  { id: "bill_reminder", label: "Next-bill reminder", detail: "When the next bill should be out" },
  { id: "monthly_report", label: "Monthly report", detail: "PDF summary on the 5th of every month" },
]
const channels: { id: NotificationChannel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
]

export function NotificationsSection() {
  const q = useApiQuery(getOrganisationSettings, [])
  const perm = usePermission("edit")
  const [prefs, setPrefs] = React.useState<OrgSettings["notifications"] | null>(null)
  const [whatsapp, setWhatsapp] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (!q.data || prefs) return
    setPrefs(q.data.settings.notifications)
    setWhatsapp(q.data.settings.whatsapp ?? "")
  }, [q.data, prefs])

  const ro = !perm.allowed
  return (
    <Panel title="Notifications" hint="Where alerts and reminders go">
      {ro && perm.ready && <ReadOnlyNotice role={perm.role} need="Manager or Owner" />}
      <PanelState status={q.status} error={q.error} onRetry={q.retry} skeleton={<Skeleton className="h-64 w-full" />} empty={{ icon: null, title: "", description: "", action: "" }}>
        {prefs && (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setPending(true)
              setError(undefined)
              try {
                await saveNotifications({ notifications: prefs, whatsapp })
                toast.success("Notification settings saved")
              } catch (err) {
                setError((err as Error).message)
              } finally {
                setPending(false)
              }
            }}
          >
            <div className="flex flex-col divide-y" role="group" aria-label="Notification channels">
              <div className="grid grid-cols-[1fr_repeat(2,5rem)] items-center gap-2 pb-2 text-xs text-muted-foreground" aria-hidden>
                <span>Notify me about</span>
                {channels.map((c) => (
                  <span key={c.id} className="text-center">
                    {c.label}
                  </span>
                ))}
              </div>
              {topics.map((t) => (
                <div key={t.id} className="grid grid-cols-[1fr_repeat(2,5rem)] items-center gap-2 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.detail}</span>
                  </div>
                  {channels.map((c) => (
                    <span key={c.id} className="flex justify-center">
                      <Switch
                        aria-label={`${t.label} by ${c.label}`}
                        checked={prefs[t.id][c.id]}
                        disabled={ro}
                        onCheckedChange={(v) => setPrefs((p) => p && { ...p, [t.id]: { ...p[t.id], [c.id]: v } })}
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <Field className="max-w-sm">
              <FieldLabel htmlFor="wa">WhatsApp number</FieldLabel>
              <Input id="wa" type="tel" inputMode="tel" placeholder="0300 1234567" value={whatsapp} disabled={ro} onChange={(e) => setWhatsapp(e.target.value)} />
              <FieldDescription>Messages come from the EnerSenX business account. In the demo, nothing is sent.</FieldDescription>
            </Field>
            {error && <FormError title="Couldn’t save" message={error} />}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={ro || pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Save notifications
              </Button>
            </div>
          </form>
        )}
      </PanelState>
    </Panel>
  )
}
