"use client"

import * as React from "react"
import {
  BellIcon,
  ChevronDownIcon,
  FileTextIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { can, currentSiteNow, getMe, openAlertCountNow, signOut, useStoreValue } from "@/lib/api"

import { navFor } from "./nav"

export function TopBar() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const me = useStoreValue(getMe)
  const alerts = useStoreValue(() => (getMe()?.org.data === "own" ? openAlertCountNow(currentSiteNow()?.id) : 0)) ?? 0

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-10 flex h-13 shrink-0 items-center gap-2 border-b bg-card px-3">
      <SidebarTrigger className="md:hidden" />

      <div className="flex flex-1 justify-center">
        <Button
          variant="outline"
          className="w-full max-w-64 justify-start text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <SearchIcon data-icon="inline-start" />
          <span className="flex-1 text-start">Search</span>
          <Kbd>⌘K</Kbd>
        </Button>
      </div>

      {me?.org.data === "own" && can(me.role, "edit") && (
        <Button size="sm" className="hidden md:inline-flex" nativeButton={false} render={<Link href="/bills/upload/" />}>
          <UploadIcon data-icon="inline-start" />
          Upload bill
        </Button>
      )}

      {me?.org.data === "own" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={alerts ? `Alerts, ${alerts} open` : "Alerts"}
          nativeButton={false}
          render={<Link href="/alerts/" />}
          className="relative"
        >
          <BellIcon />
          {alerts > 0 && (
            <Badge variant="destructive" radius="full" className="absolute -end-0.5 -top-0.5 tabular-nums" aria-hidden>
              {alerts}
            </Badge>
          )}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" aria-label="Account" />}
        >
          <Avatar size="sm">
            <AvatarFallback>{me?.user.initials ?? ""}</AvatarFallback>
            <AvatarBadge className="bg-success" />
          </Avatar>
          <ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {me && (
            <>
              <div className="flex flex-col gap-0.5 px-2 py-1.5">
                <span className="truncate text-sm font-medium">{me.user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {me.org.name}, {me.role}
                </span>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="md:hidden" onClick={() => router.push("/reports/")}>
            <FileTextIcon />
            Reports
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings/")}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await signOut()
              router.push("/login/")
            }}
          >
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search">
        <Command>
          <CommandInput placeholder="Search pages…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {navFor(me?.org.data).map((item) => (
                <CommandItem
                  key={item.title}
                  disabled={!item.href}
                  onSelect={() => {
                    if (!item.href) return
                    setOpen(false)
                    router.push(item.href)
                  }}
                >
                  <item.icon />
                  {item.title}
                  {!item.href && <Badge variant="outline">Soon</Badge>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </header>
  )
}

export function PageHeader({ title }: { title: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink render={<Link href="/" />}>EnerSenX</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:inline-flex" />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Theme"
          value={mounted && theme ? [theme] : []}
          onValueChange={(v) => v[0] && setTheme(v[0])}
        >
          <ToggleGroupItem value="light" aria-label="Light theme">
            <SunIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark theme">
            <MoonIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="System theme">
            <LaptopIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="icon-sm" aria-label="Dashboard settings">
          <SettingsIcon />
        </Button>
      </div>
    </div>
  )
}
