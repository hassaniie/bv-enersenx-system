import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"

/** A request that failed after submit: inline, announced, with what to do next. */
export function FormError({ title = "That didn’t work", message }: { title?: string; message: string }) {
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
