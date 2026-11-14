"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { parseSection, SettingsPage } from "@/components/settings/settings-page"

function FromUrl() {
  return <SettingsPage section={parseSection(useSearchParams().get("section"))} />
}

// The section is a query parameter, so one static page serves them all.
export default function Page() {
  return (
    <Suspense fallback={<SettingsPage section="organisation" />}>
      <FromUrl />
    </Suspense>
  )
}
