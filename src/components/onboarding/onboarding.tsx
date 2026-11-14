"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
} from "@/components/reui/stepper"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { billsInProgress, currentSiteNow, getMe, timeSinceSignUp, useStoreValue, type Bill, type Site } from "@/lib/api"

import { BillStep } from "./bill-step"
import { ConfirmStep } from "./confirm-step"
import { FlowLayout } from "./flow-layout"
import { InsightStep } from "./insight-step"
import { SiteStep } from "./site-step"

const steps = ["Site", "Bill", "Check", "Results"]

type Stage =
  | { step: 1 }
  | { step: 2; site: Site; existing?: Bill }
  | { step: 3; site: Site; bill: Bill }
  | { step: 4; site: Site; bill: Bill }

export function Onboarding() {
  const router = useRouter()
  const initial = useStoreValue(() => ({ me: getMe(), site: currentSiteNow(), bills: billsInProgress() }))
  const [stage, setStage] = React.useState<Stage | null>(null)

  // Resume where the person left off: no site, a bill being read, or a bill to confirm.
  React.useEffect(() => {
    if (!initial || stage) return
    if (!initial.me) {
      router.replace("/signup/")
      return
    }
    const { site, bills } = initial
    const pending = site && bills.find((b) => b.siteId === site.id)
    if (!site) setStage({ step: 1 })
    else if (pending?.status === "needs_review") setStage({ step: 3, site, bill: pending })
    else setStage({ step: 2, site, existing: pending?.status === "reading" ? pending : undefined })
  }, [initial, stage, router])

  const current = stage?.step ?? 1
  const elapsed = React.useMemo(() => (stage?.step === 4 ? timeSinceSignUp() : undefined), [stage?.step])
  const onRead = React.useCallback((bill: Bill) => setStage((s) => (s && "site" in s ? { step: 3, site: s.site, bill } : s)), [])

  return (
    <FlowLayout title="Set up your first site" width="xl">
      {/* A progress display, not navigation: the step buttons in the card move between steps. */}
      <Stepper value={current} role="group" aria-orientation={undefined} aria-label={`Step ${current} of ${steps.length}: ${steps[current - 1]}`}>
        <StepperNav>
          {steps.map((label, i) => (
            <StepperItem key={label} step={i + 1} completed={i + 1 < current}>
              <span className="flex flex-col items-center gap-1.5 sm:flex-row" aria-hidden>
                <StepperIndicator>{i + 1}</StepperIndicator>
                <StepperTitle className="text-xs">{label}</StepperTitle>
              </span>
              {i < steps.length - 1 && <StepperSeparator className="mx-2" />}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>

      <Card>
        {!stage ? (
          <CardContent className="flex flex-col gap-3" aria-busy="true">
            <span className="sr-only">Loading</span>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        ) : stage.step === 1 ? (
          <SiteStep onCreated={(site) => setStage({ step: 2, site })} />
        ) : stage.step === 2 ? (
          <BillStep key={stage.existing?.id ?? "new"} site={stage.site} existing={stage.existing} onRead={onRead} />
        ) : stage.step === 3 ? (
          <ConfirmStep
            bill={stage.bill}
            onConfirmed={(bill) => setStage({ step: 4, site: stage.site, bill })}
            onReupload={() => setStage({ step: 2, site: stage.site })}
          />
        ) : (
          <InsightStep bill={stage.bill} elapsed={elapsed} onMore={() => setStage({ step: 2, site: stage.site })} />
        )}
      </Card>
    </FlowLayout>
  )
}
