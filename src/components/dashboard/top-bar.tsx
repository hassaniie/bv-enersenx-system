"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

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

const pages = [
  "Dashboard",
  "Energy Overview",
  "Cost & Savings",
  "Load Analysis",
  "Equipment Monitoring",
  "Utility Monitoring",
  "Power Quality",
  "Alarms & Alerts",
  "Reports",
  "Analytics",
]

export function TopBar() {
  const [open, setOpen] = React.useState(false)

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

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" aria-label="Account" />}
        >
          <Avatar size="sm">
            <AvatarFallback>HM</AvatarFallback>
            <AvatarBadge className="bg-success" />
          </Avatar>
          <ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
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
              {pages.map((p) => (
                <CommandItem key={p} onSelect={() => setOpen(false)}>
                  {p}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </header>
  )
}

export function PageHeader() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink href="#">Energy Monitoring System</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:inline-flex" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">Dashboard</BreadcrumbPage>
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
