import type { Metadata } from "next"

import { ActionsPage } from "@/components/actions/actions-page"

export const metadata: Metadata = { title: "Savings Actions · EnerSenX" }

export default function Page() {
  return <ActionsPage />
}
