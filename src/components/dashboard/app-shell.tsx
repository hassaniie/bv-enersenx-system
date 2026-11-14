"use client"

import { MotionConfig } from "motion/react"

import { DemoBanner } from "@/components/demo/demo-banner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { MobileTabBar } from "./mobile-tab-bar"
import { PageHeader, TopBar } from "./top-bar"

/** The app chrome every page shares: sidebar, top bar, breadcrumb header and a container-query content area. */
export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <DemoBanner />
          <TopBar />
          <PageHeader title={title} />
          {/* Bottom padding clears the phone tab bar. */}
          <div className="@container flex min-w-0 flex-col gap-2 p-3 pb-24 md:pb-3">
            <h1 className="sr-only">{title}</h1>
            {children}
          </div>
          <MobileTabBar />
        </SidebarInset>
      </SidebarProvider>
    </MotionConfig>
  )
}
