import {
  ActivityIcon,
  BellIcon,
  ChartColumnIcon,
  ChartPieIcon,
  ClipboardCheckIcon,
  CoinsIcon,
  CpuIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  PlugZapIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; icon: LucideIcon; href?: string }

/** Primary navigation. Items without an `href` have no page yet. */
export const nav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboardIcon, href: "/" },
  { title: "Bills", icon: ReceiptTextIcon, href: "/bills/" },
  { title: "Energy Overview", icon: LightbulbIcon },
  { title: "Cost & Savings", icon: CoinsIcon, href: "/cost-savings/" },
  { title: "Savings Actions", icon: ClipboardCheckIcon, href: "/actions/" },
  { title: "Load Analysis", icon: ChartColumnIcon },
  { title: "Equipment Monitoring", icon: CpuIcon },
  { title: "Utility Monitoring", icon: PlugZapIcon },
  { title: "Power Quality", icon: ActivityIcon },
  { title: "Alerts", icon: BellIcon, href: "/alerts/" },
  { title: "Reports", icon: FileTextIcon, href: "/reports/" },
  { title: "Analytics", icon: ChartPieIcon, href: "/analytics/" },
  { title: "Settings", icon: SettingsIcon },
  { title: "User Management", icon: UsersIcon },
]

/** `usePathname()` drops the basePath; trailing slashes vary with `trailingSlash`. */
export function isCurrent(pathname: string, href?: string) {
  if (!href) return false
  const clean = (p: string) => p.replace(/\/+$/, "") || "/"
  // A bill's detail page belongs to Bills.
  return clean(pathname) === clean(href) || (clean(href) !== "/" && clean(pathname).startsWith(`${clean(href)}/`))
}
