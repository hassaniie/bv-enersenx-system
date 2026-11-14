"use client"

import { MotionConfig } from "motion/react"

import { DemoBanner } from "@/components/demo/demo-banner"
import { Logo } from "@/components/dashboard/app-sidebar"
import { cn } from "@/lib/utils"

/** Pages people finish and leave (sign-up, onboarding): logo, one centred column. */
export function FlowLayout({
  children,
  width = "sm",
  title,
}: {
  children: React.ReactNode
  width?: "sm" | "xl"
  /** Page name for screen readers; the card carries the visible heading. */
  title: string
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-svh flex-col bg-muted/30">
        <DemoBanner />
        <main className="flex flex-1 flex-col items-center gap-6 px-4 py-8 sm:py-12">
          <h1 className="sr-only">{title}</h1>
          <Logo />
          <div className={cn("flex w-full flex-col gap-4", width === "sm" ? "max-w-sm" : "max-w-xl")}>{children}</div>
        </main>
      </div>
    </MotionConfig>
  )
}
