"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { fetch, formAction } from "@/core/server"

const role = z.enum(["user", "admin"]).default("user")

const schema = z.object({
  method: z.literal("email"),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  role,
})

export const createUser = formAction(schema, async (data) => {
  try {
    await fetch("/admin/users", { method: "POST", body: JSON.stringify(data) })
  } catch (err) {
    return { errors: { form: [err instanceof Error ? err.message : "Could not create the user."] } }
  }
  revalidatePath("/app/users", "layout")
  return { success: true }
})
