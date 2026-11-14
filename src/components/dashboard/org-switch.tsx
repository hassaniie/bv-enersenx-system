"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { currentSiteNow, getMe, useStoreValue, type Site } from "@/lib/api"

/**
 * The one switch between the two kinds of data a screen can show:
 * the original sample organisation reads the sample files (src/lib/*-data.ts);
 * an organisation created here reads its own bills through src/lib/api.
 */
export function OrgSwitch({ sample, own }: { sample: React.ReactNode; own: (site: Site) => React.ReactNode }) {
  const router = useRouter()
  const ctx = useStoreValue(() => ({ me: getMe(), site: currentSiteNow() }))

  React.useEffect(() => {
    if (ctx && !ctx.me) router.replace("/login/")
  }, [ctx, router])

  if (!ctx?.me) return <Skeleton className="h-40 w-full" aria-label="Loading" />
  if (ctx.me.org.data === "sample") return <>{sample}</>
  if (!ctx.site)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2Icon />
          </EmptyMedia>
          <EmptyTitle>Add your first site</EmptyTitle>
          <EmptyDescription>A site is one electricity connection. Add it, then upload its latest bill.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={() => router.push("/onboarding/")}>
            Add a site
          </Button>
        </EmptyContent>
      </Empty>
    )
  return <>{own(ctx.site)}</>
}
