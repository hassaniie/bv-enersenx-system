"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BellIcon, CameraIcon, ClipboardCheckIcon, LayoutDashboardIcon, ReceiptTextIcon, type LucideIcon } from "lucide-react"

import { can, getMe, useStoreValue } from "@/lib/api"
import { cn } from "@/lib/utils"

import { isCurrent } from "./nav"

type Tab = { href: string; label: string; icon: LucideIcon; primary?: boolean }

const tabs: Tab[] = [
  { href: "/", label: "Home", icon: LayoutDashboardIcon },
  { href: "/bills/", label: "Bills", icon: ReceiptTextIcon },
  { href: "/bills/upload/", label: "Upload", icon: CameraIcon, primary: true },
  { href: "/actions/", label: "Actions", icon: ClipboardCheckIcon },
  { href: "/alerts/", label: "Alerts", icon: BellIcon },
]

/**
 * Phones only: the five places people go most, with bill upload (camera) in the
 * middle. Organisations that bring their own bills; the sample org keeps the sidebar.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const me = useStoreValue(getMe)
  if (!me || me.org.data !== "own") return null
  const shown = tabs.filter((t) => !t.primary || can(me.role, "edit"))
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {shown.map((t) => {
          // "Bills" stays lit on a bill's page, but not on Upload, which has its own tab.
          const active = t.href === "/bills/" ? isCurrent(pathname, t.href) && !pathname.startsWith("/bills/upload") : isCurrent(pathname, t.href)
          return (
            <li key={t.href} className="flex flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full",
                    t.primary ? "size-9 -mt-4 bg-primary text-primary-foreground ring-4 ring-card" : "size-5"
                  )}
                >
                  <t.icon aria-hidden className="size-5" />
                </span>
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
