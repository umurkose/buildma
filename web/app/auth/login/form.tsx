"use client"

import Link from "next/link"
import { useActionState } from "react"
import { login } from "./actions"
import { Form } from "@/components/ui/form"

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {})

  return (
    <Form action={action} className="max-w-sm">
      <Form.Header title="Log in" description="Welcome back. Log in to continue." />

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
        {pending ? "Logging in…" : "Log in"}
      </Form.Button>

      <Form.Footer>
        Don&apos;t have an account?{" "}
        <Form.Button asChild variant="link" className="h-auto p-0">
          <Link href="/auth/signup">Sign up</Link>
        </Form.Button>
      </Form.Footer>
    </Form>
  )
}
