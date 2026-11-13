"use client"

import {
  ActivityIcon,
  BellIcon,
  ChartColumnIcon,
  ChartPieIcon,
  CoinsIcon,
  CpuIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  PlugZapIcon,
  RefreshCwIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const nav = [
  { title: "Dashboard", icon: LayoutDashboardIcon, href: "#", active: true },
  { title: "Energy Overview", icon: LightbulbIcon, href: "#" },
  { title: "Cost & Savings", icon: CoinsIcon, href: "#" },
  { title: "Load Analysis", icon: ChartColumnIcon, href: "#" },
  { title: "Equipment Monitoring", icon: CpuIcon, href: "#" },
  { title: "Utility Monitoring", icon: PlugZapIcon, href: "#" },
  { title: "Power Quality", icon: ActivityIcon, href: "#" },
  { title: "Alarms & Alerts", icon: BellIcon, href: "#" },
  { title: "Reports", icon: FileTextIcon, href: "#" },
  { title: "Analytics", icon: ChartPieIcon, href: "#" },
  { title: "Settings", icon: SettingsIcon, href: "#" },
  { title: "User Management", icon: UsersIcon, href: "#" },
]

const facilities = [
  { value: "kabirwala", label: "Nestle Kabirwala" },
  { value: "sheikhupura", label: "Nestle Sheikhupura" },
  { value: "islamabad", label: "Nestle Islamabad" },
]

export function Logo() {
  return (
    <span className="flex items-start gap-0.5 text-lg font-semibold tracking-tight">
      EnerSen<span className="text-green-600 dark:text-green-400">X</span>
      <span className="text-xs font-medium text-muted-foreground">TM</span>
    </span>
  )
}

export function AppSidebar() {
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
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.active}
                    aria-current={item.active ? "page" : undefined}
                    tooltip={item.title}
                    render={<a href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-3 group-data-[collapsible=icon]:hidden" role="region" aria-label="Facility status">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Facility</span>
          <Select items={facilities} defaultValue="kabirwala">
            <SelectTrigger className="w-full" aria-label="Facility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </SidebarFooter>
    </Sidebar>
  )
}
