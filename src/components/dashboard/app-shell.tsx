"use client"

import { MotionConfig } from "motion/react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { PageHeader, TopBar } from "./top-bar"

/** The app chrome every page shares: sidebar, top bar, breadcrumb header and a container-query content area. */
export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopBar />
          <PageHeader title={title} />
          <div className="@container flex min-w-0 flex-col gap-2 p-3">
            <h1 className="sr-only">{title}</h1>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MotionConfig>
  )
}
