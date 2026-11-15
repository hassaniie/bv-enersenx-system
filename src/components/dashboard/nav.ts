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
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; icon: LucideIcon; href?: string }

/**
 * Organisations that bring their own bills (the MVP): six places, nothing
 * disabled (principles.md U8, U11). Cost and analytics live on Home; live-meter
 * screens return with Phase 2.
 */
export const billsNav: NavItem[] = [
  { title: "Home", icon: LayoutDashboardIcon, href: "/" },
  { title: "Bills", icon: ReceiptTextIcon, href: "/bills/" },
  { title: "Actions", icon: ClipboardCheckIcon, href: "/actions/" },
  { title: "Alerts", icon: BellIcon, href: "/alerts/" },
  { title: "Reports", icon: FileTextIcon, href: "/reports/" },
  { title: "Settings", icon: SettingsIcon, href: "/settings/" },
]

/** The Phase 2 preview (the original live-meter organisation) keeps its full navigation. */
export const previewNav: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboardIcon, href: "/" },
  { title: "Energy Overview", icon: LightbulbIcon },
  { title: "Cost & Savings", icon: CoinsIcon, href: "/cost-savings/" },
  { title: "Load Analysis", icon: ChartColumnIcon },
  { title: "Equipment Monitoring", icon: CpuIcon },
  { title: "Utility Monitoring", icon: PlugZapIcon },
  { title: "Power Quality", icon: ActivityIcon },
  { title: "Reports", icon: FileTextIcon, href: "/reports/" },
  { title: "Analytics", icon: ChartPieIcon, href: "/analytics/" },
  { title: "Settings", icon: SettingsIcon, href: "/settings/" },
]

/** The navigation for an organisation's kind of data. */
export const navFor = (data: "sample" | "own" | undefined) => (data === "sample" ? previewNav : billsNav)

/** Kept for code that lists every page (search). */
export const nav = billsNav

/** `usePathname()` drops the basePath; trailing slashes vary with `trailingSlash`. */
export function isCurrent(pathname: string, href?: string) {
  if (!href) return false
  const clean = (p: string) => p.replace(/\/+$/, "") || "/"
  // A bill's detail page belongs to Bills.
  return clean(pathname) === clean(href) || (clean(href) !== "/" && clean(pathname).startsWith(`${clean(href)}/`))
}
