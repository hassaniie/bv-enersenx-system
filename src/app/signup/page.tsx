import type { Metadata } from "next"

import { SignUp } from "@/components/onboarding/sign-up"

export const metadata: Metadata = { title: "Sign up · EnerSenX" }

export default function Page() {
  return <SignUp />
}
