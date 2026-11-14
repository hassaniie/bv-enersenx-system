"use client"

import * as React from "react"
import { CheckIcon, MinusIcon, UserPlusIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { Panel } from "@/components/dashboard/panel"
import { PanelState } from "@/components/dashboard/panel-state"
import { InviteDialog } from "@/components/dashboard/invite-dialog"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { changeRole, listMembers, removeMember, rolePermissions, useApiQuery, type MemberRow, type Role } from "@/lib/api"

import { ReadOnlyNotice, roleName, usePermission } from "./shared"

const roleItems = (["owner", "manager", "viewer"] as Role[]).map((r) => ({ value: r, label: roleName[r] }))

export function UsersSection() {
  const q = useApiQuery(listMembers, [])
  const perm = usePermission("manage_users")
  const [inviting, setInviting] = React.useState(false)
  const [removing, setRemoving] = React.useState<MemberRow | null>(null)
  const [pending, setPending] = React.useState(false)

  return (
    <>
      <Panel
        title="Users & Roles"
        hint={
          q.data
            ? (() => {
                const n = q.data.filter((m) => m.status === "active").length
                return `${n} member${n === 1 ? "" : "s"}, ${q.data.length - n} invited`
              })()
            : undefined
        }
        meta={
          perm.allowed ? (
            <Button size="sm" onClick={() => setInviting(true)}>
              <UserPlusIcon data-icon="inline-start" />
              Invite
            </Button>
          ) : undefined
        }
      >
        {!perm.allowed && perm.ready && <ReadOnlyNotice role={perm.role} need="Owner" />}
        <PanelState
          status={q.status}
          error={q.error}
          onRetry={q.retry}
          isEmpty={q.data?.length === 0}
          skeleton={
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          }
          empty={{ icon: <UsersIcon />, title: "Just you so far", description: "Invite your facility manager or finance lead.", action: "Invite", onAction: () => setInviting(true) }}
        >
          <ItemGroup role="list" aria-label="Members">
            {q.data?.map((m) => (
              <Item key={m.id} variant="outline" size="sm" role="listitem">
                <ItemMedia>
                  <Avatar>
                    <AvatarFallback>{m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>
                    {m.name}
                    {m.isYou && <Badge variant="outline">You</Badge>}
                    {m.status === "invited" && <Badge variant="warning-light">Invited</Badge>}
                  </ItemTitle>
                  <ItemDescription className="truncate">{m.email}</ItemDescription>
                </ItemContent>
                <ItemActions className="w-full justify-end sm:w-auto">
                  {perm.allowed ? (
                    <>
                      <Select
                        items={roleItems}
                        value={m.role}
                        onValueChange={async (v) => {
                          if (!v || v === m.role) return
                          try {
                            await changeRole(m.id, v as Role)
                            toast.success("Role changed", { description: `${m.name} is now ${roleName[v as Role]}.` })
                          } catch (e) {
                            toast.error("Couldn’t change the role", { description: (e as Error).message })
                          }
                        }}
                      >
                        <SelectTrigger size="sm" aria-label={`Role for ${m.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleItems.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!m.isYou && (
                        <Button size="sm" variant="ghost" onClick={() => setRemoving(m)}>
                          {m.status === "invited" ? "Revoke" : "Remove"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline">{roleName[m.role]}</Badge>
                  )}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </PanelState>
      </Panel>

      <Panel title="What Each Role Can Do">
        <dl className="flex flex-col divide-y text-sm" aria-label="Role permissions">
          <div className="grid grid-cols-[1fr_repeat(3,4.5rem)] items-center gap-2 pb-2 text-xs text-muted-foreground">
            <dt>Permission</dt>
            <dd className="text-center">Owner</dd>
            <dd className="text-center">Manager</dd>
            <dd className="text-center">Viewer</dd>
          </div>
          {rolePermissions.map((p) => (
            <div key={p.label} className="grid grid-cols-[1fr_repeat(3,4.5rem)] items-center gap-2 py-2">
              <dt>{p.label}</dt>
              {(["owner", "manager", "viewer"] as const).map((r) => (
                <dd key={r} className="flex justify-center">
                  {p[r] ? <CheckIcon aria-label="Yes" className="size-4 text-success" /> : <MinusIcon aria-label="No" className="size-4 text-muted-foreground" />}
                </dd>
              ))}
            </div>
          ))}
        </dl>
      </Panel>

      <InviteDialog open={inviting} onOpenChange={setInviting} />
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && !pending && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{removing?.status === "invited" ? `Revoke the invite to ${removing?.email}?` : `Remove ${removing?.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.status === "invited" ? "The link in their email stops working." : "They lose access to this organisation straight away. Their past actions stay in the history."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (!removing) return
                setPending(true)
                try {
                  await removeMember(removing.id)
                  toast.success(removing.status === "invited" ? "Invite revoked" : "Member removed", { description: removing.email })
                  setRemoving(null)
                } catch (e) {
                  toast.error("Couldn’t remove", { description: (e as Error).message })
                } finally {
                  setPending(false)
                }
              }}
            >
              {pending && <Spinner data-icon="inline-start" />}
              {removing?.status === "invited" ? "Revoke invite" : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
