"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { logIn, logInAsDemo } from "@/lib/api"

import { FlowLayout } from "./flow-layout"
import { FormError } from "./form-error"

export function LogIn() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState<"email" | "demo" | null>(null)
  const [error, setError] = React.useState<string>()

  const emailError = submitted && !email.trim() ? "Enter your email." : undefined
  const passwordError = submitted && !password ? "Enter your password." : undefined

  const run = async (kind: "email" | "demo") => {
    setError(undefined)
    if (kind === "email") {
      setSubmitted(true)
      if (!email.trim() || !password) return
    }
    setPending(kind)
    try {
      await (kind === "demo" ? logInAsDemo() : logIn(email))
      router.push("/")
    } catch (e) {
      setError((e as Error).message)
      setPending(null)
    }
  }

  return (
    <FlowLayout title="Log in">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back to EnerSenX.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              run("email")
            }}
          >
            <Button type="button" variant="outline" className="w-full" disabled={!!pending} onClick={() => run("demo")}>
              {pending === "demo" && <Spinner data-icon="inline-start" />}
              Continue as the demo owner
            </Button>
            <FieldSeparator>or</FieldSeparator>
            <FieldGroup>
              <Field data-invalid={!!emailError}>
                <FieldLabel htmlFor="li-email">Email</FieldLabel>
                <Input id="li-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} />
                <FieldError>{emailError}</FieldError>
              </Field>
              <Field data-invalid={!!passwordError}>
                <FieldLabel htmlFor="li-password">Password</FieldLabel>
                <Input
                  id="li-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                />
                <FieldError>{passwordError}</FieldError>
              </Field>
            </FieldGroup>
            {error && <FormError title="Couldn’t log you in" message={error} />}
            <Button type="submit" className="w-full" disabled={!!pending}>
              {pending === "email" && <Spinner data-icon="inline-start" />}
              Log in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <span>
            New to EnerSenX?{" "}
            <Link href="/signup/" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </span>
        </CardFooter>
      </Card>
    </FlowLayout>
  )
}
