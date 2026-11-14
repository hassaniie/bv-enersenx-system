import type { Metadata } from "next"

import { AlertsPage } from "@/components/alerts/alerts-page"

export const metadata: Metadata = { title: "Alerts · EnerSenX" }

export default function Page() {
  return <AlertsPage />
}
