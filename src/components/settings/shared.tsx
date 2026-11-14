"use client"

import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { can, getMe, useStoreValue, type Permission, type Role } from "@/lib/api"

const roleName: Record<Role, string> = { owner: "Owner", manager: "Manager", viewer: "Viewer" }

/** The current user's role and what it allows. */
export function usePermission(p: Permission) {
  const me = useStoreValue(getMe)
  return { role: me?.role, allowed: can(me?.role, p), ready: me !== undefined }
}

/** Why the controls below are read-only, shown instead of hiding the section. */
export function ReadOnlyNotice({ role, need }: { role?: Role; need: "Manager or Owner" | "Owner" }) {
  return (
    <Alert variant="info">
      <InfoIcon />
      <AlertTitle>View only</AlertTitle>
      <AlertDescription>
        You’re a {role ? roleName[role] : "member"} here. Only {need === "Owner" ? "an Owner" : "a Manager or Owner"} can change this.
      </AlertDescription>
    </Alert>
  )
}

export { roleName }
