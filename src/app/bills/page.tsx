import type { Metadata } from "next"

import { BillsPage } from "@/components/bills/bills-page"

export const metadata: Metadata = { title: "Bills · EnerSenX" }

export default function Page() {
  return <BillsPage />
}
