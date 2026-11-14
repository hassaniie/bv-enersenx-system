import type { Metadata } from "next"

import { UploadPage } from "@/components/bills/upload-flow"

export const metadata: Metadata = { title: "Upload Bill · EnerSenX" }

export default function Page() {
  return <UploadPage />
}
