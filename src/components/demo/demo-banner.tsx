"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDownIcon, EyeIcon, LayersIcon, RotateCcwIcon, UserPlusIcon } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuItem,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { currentScenario, getMe, loadScenario, resetDemo, scenarios, setDemoRole, useStoreValue, type Role, type Scenario } from "@/lib/api"

/**
 * Sits on every page: says this is a demo with sample data kept in this
 * browser, and offers a fresh start.
 */
export function DemoBanner() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const scenario = useStoreValue(currentScenario)
  const role = useStoreValue(() => getMe()?.role)

  const pickScenario = async (s: Scenario) => {
    await loadScenario(s)
    toast.success("Scenario loaded", { description: scenarios.find((x) => x.value === s)?.label })
    router.push("/")
  }
  const pickRole = async (r: Role) => {
    await setDemoRole(r)
    toast.success(`Viewing as ${r}`, { description: "Controls you can’t use are hidden, and the data layer refuses them." })
  }

  return (
    <div
      role="region"
      aria-label="Demo mode"
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Badge variant="info-light">Demo mode</Badge>
        <span className="hidden truncate sm:inline">Sample data, saved only in this browser.</span>
        <span className="truncate sm:hidden">Saved in this browser</span>
      </span>
      {/* Phones: everything in one menu, so the banner stays one row. */}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="xs" variant="ghost" className="sm:hidden" />}>
          <LayersIcon data-icon="inline-start" />
          Demo
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Scenario</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={scenario ?? ""} onValueChange={(v) => pickScenario(v as Scenario)}>
              {scenarios.map((s) => (
                <DropdownMenuRadioItem key={s.value} value={s.value} closeOnClick>
                  {s.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          {role && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>View as</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={role} onValueChange={(v) => pickRole(v as Role)}>
                  {(["owner", "manager", "viewer"] as Role[]).map((r) => (
                    <DropdownMenuRadioItem key={r} value={r} closeOnClick>
                      {r[0].toUpperCase() + r.slice(1)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/signup/")}>
            <UserPlusIcon />
            Try as a new user
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            <RotateCcwIcon />
            Reset demo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="hidden flex-wrap items-center gap-1 sm:flex">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="xs" variant="ghost" />}>
            <LayersIcon data-icon="inline-start" />
            Scenario
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Load a demo scenario</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={scenario ?? ""}
                onValueChange={(v) => pickScenario(v as Scenario)}
              >
                {scenarios.map((s) => (
                  <DropdownMenuRadioItem key={s.value} value={s.value} closeOnClick>
                    <span className="flex flex-col gap-0.5">
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.detail}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {role && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="xs" variant="ghost" />}>
              <EyeIcon data-icon="inline-start" />
              View as {role[0].toUpperCase() + role.slice(1)}
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Your role in this organisation</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={role}
                  onValueChange={(v) => pickRole(v as Role)}
                >
                  {(["owner", "manager", "viewer"] as Role[]).map((r) => (
                    <DropdownMenuRadioItem key={r} value={r} closeOnClick>
                      {r[0].toUpperCase() + r.slice(1)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
              Organisations, sites and bills you added in this browser are removed, and the default demo (Rehmat Textiles, 12 bills) comes back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetDemo()
                setOpen(false)
                toast.success("Demo reset", { description: "Back to the default demo: Rehmat Textiles, 12 bills." })
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
