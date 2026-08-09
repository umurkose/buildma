"use server"

import { z } from "zod"
import { fetch, afterAuth, formAction, setSession } from "@/core/server"

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export const login = formAction(schema, async (data) => {
  const auth = await fetch("/auth/email/login", {
    method: "POST",
    body: JSON.stringify(data),
  }).catch(() => null)

  if (!auth) return { errors: { form: ["Invalid email or password"] } }

  await setSession(auth.token)
  afterAuth()
})
