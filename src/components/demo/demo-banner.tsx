"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RotateCcwIcon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
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
import { resetDemo } from "@/lib/api"

/**
 * Sits on every page: says this is a demo with sample data kept in this
 * browser, and offers a fresh start.
 */
export function DemoBanner() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  return (
    <div
      role="region"
      aria-label="Demo mode"
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Badge variant="info-light">Demo mode</Badge>
        <span className="truncate">Sample data, saved only in this browser.</span>
      </span>
      <span className="flex items-center gap-1">
        <Button size="xs" variant="ghost" nativeButton={false} render={<Link href="/signup/" />}>
          <UserPlusIcon data-icon="inline-start" />
          Try as a new user
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setOpen(true)}>
          <RotateCcwIcon data-icon="inline-start" />
          Reset demo
        </Button>
      </span>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the demo?</AlertDialogTitle>
            <AlertDialogDescription>
              Organisations, sites and bills you added in this browser are removed, and the sample organisation comes back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetDemo()
                setOpen(false)
                toast.success("Demo reset", { description: "You’re back on the sample organisation." })
                router.push("/")
              }}
            >
              Reset demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
