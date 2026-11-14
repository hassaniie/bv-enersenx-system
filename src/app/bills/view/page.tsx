"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { BillDetailPage } from "@/components/bills/bill-detail"

function FromUrl() {
  return <BillDetailPage id={useSearchParams().get("id")} />
}

// The bill id is a query parameter, so one static page serves every bill (GitHub Pages).
export default function Page() {
  return (
    <Suspense fallback={<BillDetailPage id={null} />}>
      <FromUrl />
    </Suspense>
  )
}
