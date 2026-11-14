"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { currentSiteNow, getMe, listSitesNow, selectSite, useStoreValue } from "@/lib/api"

import { isCurrent, nav, type NavItem } from "./nav"

export function Logo() {
  return (
    <span className="flex items-start gap-0.5 text-lg font-semibold tracking-tight">
      EnerSen<span className="text-green-600 dark:text-green-400">X</span>
      <span className="text-xs font-medium text-muted-foreground">TM</span>
    </span>
  )
}

/**
 * A page that doesn't exist yet: a disabled menu button (not a link, not
 * focusable) with a "Soon" badge. The installed button drops pointer events
 * when disabled, so the icon-rail tooltip hangs off a wrapper instead.
 */
function ComingSoonItem({ item }: { item: NavItem }) {
  const { state, isMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger render={<span className="block" />}>
          <SidebarMenuButton disabled aria-disabled="true" render={<button type="button" />}>
            <item.icon />
            <span>{item.title}</span>
            <Badge variant="outline">Soon</Badge>
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
          <span className="flex flex-col">
            <span>{item.title}</span>
            <span>Coming soon</span>
          </span>
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-13 flex-row items-center justify-between border-b px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <span className="group-data-[collapsible=icon]:hidden">
          <Logo />
        </span>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Primary">
          <SidebarGroup>
            <SidebarGroupLabel>Energy Monitoring System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  if (!item.href) return <ComingSoonItem key={item.title} item={item} />
                  const active = isCurrent(pathname, item.href)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <FacilityFooter />
    </Sidebar>
  )
}

/** The facility picker lists the organisation's sites; live device status only shows where meters exist (sample data). */
function FacilityFooter() {
  const router = useRouter()
  const ctx = useStoreValue(() => ({ sites: listSitesNow(), current: currentSiteNow(), me: getMe() }))
  const items = ctx?.sites.map((s) => ({ value: s.id, label: s.name })) ?? []

  return (
    <SidebarFooter className="gap-3 group-data-[collapsible=icon]:hidden" role="region" aria-label="Facility">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Facility</span>
        {ctx && items.length === 0 ? (
          <Button variant="outline" size="sm" onClick={() => router.push("/onboarding/")}>
            <PlusIcon data-icon="inline-start" />
            Add a site
          </Button>
        ) : (
          <Select items={items} value={ctx?.current?.id ?? null} onValueChange={(v) => v && selectSite(v)}>
            <SelectTrigger className="w-full" aria-label="Facility">
              <SelectValue placeholder="Loading…" />
            </SelectTrigger>
            <SelectContent>
              {items.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {ctx?.me?.org.data === "sample" && (
        <Card size="sm">
          <CardContent className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
                <span className="truncate tabular-nums">47 of 50 devices online</span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span className="shrink-0">3 offline</span>
                <span aria-hidden className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
                <span className="truncate">checked 2 mins ago</span>
              </span>
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="Refresh device status">
              <RefreshCwIcon />
            </Button>
          </CardContent>
        </Card>
      )}
    </SidebarFooter>
  )
}
