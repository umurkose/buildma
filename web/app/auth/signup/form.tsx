"use client"

import Link from "next/link"
import { useActionState } from "react"
import { signup } from "./actions"
import { Form } from "@/components/ui/form"

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {})

  return (
    <Form action={action} className="max-w-sm">
      <Form.Header title="Create account" description="Sign up to get started." />

      <Form.Group>
        <Form.Label htmlFor="name">Name</Form.Label>
        <Form.Input
          id="name"
          name="name"
          placeholder="Ada Lovelace"
          defaultValue={state.values?.name}
          aria-invalid={!!state.errors?.name}
        />
        <Form.Error data={state.errors?.name} />
      </Form.Group>

      <Form.Group>
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          aria-invalid={!!state.errors?.email}
        />
        <Form.Error data={state.errors?.email} />
      </Form.Group>

      <Form.Group>
        <Form.Label htmlFor="password">Password</Form.Label>
        <Form.Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          defaultValue={state.values?.password}
          aria-invalid={!!state.errors?.password}
        />
        <Form.Error data={state.errors?.password} />
      </Form.Group>

      <Form.Error data={state.errors?.form} />

      <Form.Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Form.Button>

      <Form.Footer>
        Already have an account?{" "}
        <Form.Button asChild variant="link" className="h-auto p-0">
          <Link href="/auth/login">Log in</Link>
        </Form.Button>
      </Form.Footer>
    </Form>
  )
}
