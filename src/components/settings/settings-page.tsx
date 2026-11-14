"use client"

import * as React from "react"
import Link from "next/link"
import { BellRingIcon, Building2Icon, CreditCardIcon, LandmarkIcon, UsersIcon, WalletIcon, type LucideIcon } from "lucide-react"

import { AppShell } from "@/components/dashboard/app-shell"
import { OrgSwitch } from "@/components/dashboard/org-switch"
import { Button } from "@/components/ui/button"

import { BudgetsSection } from "./budgets-section"
import { NotificationsSection } from "./notifications-section"
import { OrganisationSection } from "./organisation-section"
import { PlanSection } from "./plan-section"
import { SitesSection } from "./sites-section"
import { UsersSection } from "./users-section"

export type SectionId = "organisation" | "sites" | "users" | "budgets" | "notifications" | "plan"

const sections: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "organisation", label: "Organisation", icon: LandmarkIcon },
  { id: "sites", label: "Sites", icon: Building2Icon },
  { id: "users", label: "Users & roles", icon: UsersIcon },
  { id: "budgets", label: "Budgets", icon: WalletIcon },
  { id: "notifications", label: "Notifications", icon: BellRingIcon },
  { id: "plan", label: "Plan & billing", icon: CreditCardIcon },
]

export const parseSection = (v: string | null): SectionId => (sections.some((s) => s.id === v) ? (v as SectionId) : "organisation")

const body: Record<SectionId, React.ReactNode> = {
  organisation: <OrganisationSection />,
  sites: <SitesSection />,
  users: <UsersSection />,
  budgets: <BudgetsSection />,
  notifications: <NotificationsSection />,
  plan: <PlanSection />,
}

function Settings({ section }: { section: SectionId }) {
  return (
    <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="min-w-0">
        <ul className="flex gap-1 overflow-x-auto pb-1 @3xl:flex-col @3xl:overflow-visible @3xl:pb-0">
          {sections.map((s) => {
            const active = s.id === section
            return (
              <li key={s.id} className="shrink-0">
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  aria-current={active ? "page" : undefined}
                  nativeButton={false}
                  render={<Link href={`/settings/?section=${s.id}`} />}
                >
                  <s.icon data-icon="inline-start" />
                  {s.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-2">{body[section]}</div>
    </div>
  )
}

export function SettingsPage({ section }: { section: SectionId }) {
  return (
    <AppShell title="Settings">
      <OrgSwitch sample={<Settings section={section} />} own={() => <Settings section={section} />} />
    </AppShell>
  )
}

