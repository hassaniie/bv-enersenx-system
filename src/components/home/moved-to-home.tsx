"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HouseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

/** Old bookmarks: Cost & Savings and Analytics now live on Home for bills-first organisations. */
export function MovedToHome({ page }: { page: string }) {
  const router = useRouter()
  React.useEffect(() => {
    const t = window.setTimeout(() => router.replace("/"), 1500)
    return () => window.clearTimeout(t)
  }, [router])
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HouseIcon />
        </EmptyMedia>
        <EmptyTitle>{page} is now part of Home</EmptyTitle>
        <EmptyDescription>Costs by charge, the monthly trend and peak-hour share are on Home. Taking you there…</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={() => router.replace("/")}>
          Go to Home
        </Button>
      </EmptyContent>
    </Empty>
  )
}
