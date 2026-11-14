import type { Metadata } from "next"

import { LogIn } from "@/components/onboarding/log-in"

export const metadata: Metadata = { title: "Log in · EnerSenX" }

export default function Page() {
  return <LogIn />
}
