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
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; icon: LucideIcon; href?: string }

/** Primary navigation. Items without an `href` have no page yet. */
export const nav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboardIcon, href: "/" },
  { title: "Energy Overview", icon: LightbulbIcon },
  { title: "Cost & Savings", icon: CoinsIcon, href: "/cost-savings/" },
  { title: "Load Analysis", icon: ChartColumnIcon },
  { title: "Equipment Monitoring", icon: CpuIcon },
  { title: "Utility Monitoring", icon: PlugZapIcon },
  { title: "Power Quality", icon: ActivityIcon },
  { title: "Alarms & Alerts", icon: BellIcon },
  { title: "Reports", icon: FileTextIcon, href: "/reports/" },
  { title: "Analytics", icon: ChartPieIcon, href: "/analytics/" },
  { title: "Settings", icon: SettingsIcon },
  { title: "User Management", icon: UsersIcon },
]

/** `usePathname()` drops the basePath; trailing slashes vary with `trailingSlash`. */
export function isCurrent(pathname: string, href?: string) {
  if (!href) return false
  const clean = (p: string) => p.replace(/\/+$/, "") || "/"
  return clean(pathname) === clean(href)
}
