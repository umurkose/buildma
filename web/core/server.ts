import { cache } from "react"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { FormState, Role } from "@/types"
import { unwrap } from "./shared"

export * from "./shared"
export * from "./meta"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
const COOKIE = "token"
const MAX_AGE = 60 * 60 * 24

// --- Cache policy (the one place server-side caching is configured) ---
const CACHE: Record<string, { revalidate: number; tag: string }> = {}

// --- Fetch ---

async function request(path: string, init?: RequestInit) {
  const policy = (init?.method ?? "GET") === "GET" ? CACHE[path] : undefined
  const token = policy ? undefined : await getToken()
  const res = await globalThis.fetch(`${BASE_URL}/api${path}`, {
    ...(policy
      ? { next: { revalidate: policy.revalidate, tags: [policy.tag] } }
      : { cache: "no-store" }),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  return unwrap(res, path)
}

export { request as fetch }

// --- Session (the dynamic import keeps next/headers out of the module graph

export async function getToken() {
  const { cookies } = await import("next/headers")
  return (await cookies()).get(COOKIE)?.value
}

export async function myId(): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(payload)).sub ?? null
  } catch {
    return null
  }
}

export async function setSession(token: string) {
  const { cookies } = await import("next/headers")
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export function afterAuth(): never {
  redirect("/app")
}

const currentUser = cache(async () => {
  const token = await getToken()
  const user = token ? await request("/user").catch(() => null) : null
  return { token, user }
})

export async function me(role?: Role) {
  const { token, user } = await currentUser()
  if (!user) redirect(token ? "/auth/logout" : "/auth/login")
  if (role && user.role !== role) redirect("/")
  return user
}

// --- Forms (server actions) ---

export function formAction<T>(schema: z.ZodType<T>, run: (data: T) => Promise<FormState | void>) {
  return async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const values = Object.fromEntries(formData) as Record<string, string>
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      return { errors: z.flattenError(parsed.error).fieldErrors, values }
    }
    return (await run(parsed.data)) ?? {}
  }
}
