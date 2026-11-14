"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { SelectField } from "@/components/forms/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { createOrganisation, getPendingUser, signUp, type BusinessType, type User } from "@/lib/api"

import { FlowLayout } from "./flow-layout"
import { FormError } from "./form-error"

export const businessTypes: { value: BusinessType; label: string }[] = [
  { value: "textile", label: "Textile or garments" },
  { value: "food", label: "Food and beverage" },
  { value: "cold-storage", label: "Cold storage" },
  { value: "hospital", label: "Hospital or clinic" },
  { value: "school", label: "School or university" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
]

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

function AccountStep({ onDone }: { onDone: (u: User) => void }) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState<"email" | "google" | null>(null)
  const [error, setError] = React.useState<string>()

  const errors = {
    name: !name.trim() ? "Enter your name." : undefined,
    email: !emailOk(email) ? "Enter a work email like name@company.pk." : undefined,
    password: password.length < 8 ? "Use at least 8 characters." : undefined,
  }
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined)

  const run = async (method: "email" | "google") => {
    setError(undefined)
    if (method === "email") {
      setSubmitted(true)
      if (errors.name || errors.email || errors.password) return
    }
    setPending(method)
    try {
      onDone(await signUp(method === "google" ? { method } : { method, name, email, password }))
    } catch (e) {
      setError((e as Error).message)
      setPending(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Find what your electricity bill is hiding in under 10 minutes.</CardDescription>
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
          <Button type="button" variant="outline" className="w-full" disabled={!!pending} onClick={() => run("google")}>
            {pending === "google" && <Spinner data-icon="inline-start" />}
            Continue with Google
          </Button>
          <FieldSeparator>or</FieldSeparator>
          <FieldGroup>
            <Field data-invalid={!!show("name")}>
              <FieldLabel htmlFor="su-name">Full name</FieldLabel>
              <Input id="su-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!show("name")} />
              <FieldError>{show("name")}</FieldError>
            </Field>
            <Field data-invalid={!!show("email")}>
              <FieldLabel htmlFor="su-email">Work email</FieldLabel>
              <Input
                id="su-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!show("email")}
              />
              <FieldError>{show("email")}</FieldError>
            </Field>
            <Field data-invalid={!!show("password")}>
              <FieldLabel htmlFor="su-password">Password</FieldLabel>
              <Input
                id="su-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!show("password")}
              />
              {show("password") ? <FieldError>{show("password")}</FieldError> : <FieldDescription>At least 8 characters.</FieldDescription>}
            </Field>
          </FieldGroup>
          {error && <FormError title="Couldn’t create your account" message={error} />}
          <Button type="submit" className="w-full" disabled={!!pending}>
            {pending === "email" && <Spinner data-icon="inline-start" />}
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          Already have an account?{" "}
          <Link href="/login/" className="font-medium text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}

function OrganisationStep({ user }: { user: User }) {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<BusinessType | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string>()

  const nameError = submitted && !name.trim() ? "Enter your organisation’s name." : undefined
  const typeError = submitted && !type ? "Choose the closest match." : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name your organisation</CardTitle>
        <CardDescription>Welcome, {user.name.split(" ")[0]}. Your sites, bills and team live here.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitted(true)
            if (!name.trim() || !type) return
            setPending(true)
            setError(undefined)
            try {
              await createOrganisation({ name, businessType: type })
              router.push("/onboarding/")
            } catch (err) {
              setError((err as Error).message)
              setPending(false)
            }
          }}
        >
          <FieldGroup>
            <Field data-invalid={!!nameError}>
              <FieldLabel htmlFor="org-name">Organisation name</FieldLabel>
              <Input
                id="org-name"
                autoComplete="organization"
                placeholder="Rehmat Textiles (Pvt) Ltd"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!nameError}
              />
              <FieldError>{nameError}</FieldError>
            </Field>
            <div className="flex flex-col gap-1">
              <SelectField id="org-type" label="Business type" value={type} onChange={setType} items={businessTypes} placeholder="Choose one" />
              {typeError && <FieldError>{typeError}</FieldError>}
            </div>
          </FieldGroup>
          {error && <FormError title="Couldn’t create the organisation" message={error} />}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SignUp() {
  const [user, setUser] = React.useState<User | null>(null)
  // A reload between the two steps keeps the account.
  React.useEffect(() => setUser(getPendingUser()), [])
  return (
    <FlowLayout title="Sign up">
      {user ? <OrganisationStep user={user} /> : <AccountStep onDone={setUser} />}
      <p className="text-center text-xs text-muted-foreground">Step {user ? 2 : 1} of 2. A site and your first bill come next.</p>
    </FlowLayout>
  )
}
