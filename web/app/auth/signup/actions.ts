"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { fetch, formAction } from "@/core/server"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signup = formAction(schema, async (data) => {
  try {
    await fetch("/auth/email/register", { method: "POST", body: JSON.stringify(data) })
  } catch (err) {
    return { errors: { form: [err instanceof Error ? err.message : "Sign up failed"] } }
  }

  redirect(`/auth/verify?email=${encodeURIComponent(data.email)}`)
})
