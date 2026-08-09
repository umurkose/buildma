"use server"

import { z } from "zod"
import { fetch, afterAuth, formAction, setSession } from "@/core/server"

const schema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export const verify = formAction(schema, async ({ email, code }) => {
  const auth = await fetch("/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  }).catch(() => null)

  if (!auth) return { errors: { form: ["That code is invalid or has expired."] } }

  await setSession(auth.token)
  afterAuth()
})

export async function resend(email: string) {
  try {
    await fetch("/auth/email/resend", { method: "POST", body: JSON.stringify({ email }) })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
