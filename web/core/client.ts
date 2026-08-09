"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query"
import { unwrap } from "./shared"

export * from "./shared"
export * from "./meta"

// --- Fetch ---

type ClientOptions<TData = any> = Omit<UseQueryOptions<TData, Error, TData>, "queryKey" | "queryFn">
function useFetch<TData = any>(path: string, options?: ClientOptions<TData>) {
  return useQuery<TData, Error, TData>({
    queryKey: [path],
    queryFn: () =>
      globalThis
        .fetch(`/api${path}`, { headers: { "Content-Type": "application/json" } })
        .then((res) => unwrap(res, path) as Promise<TData>),
    ...options,
  })
}

export { useFetch as fetch }

export function useInvalidate() {
  const qc = useQueryClient()
  return (...paths: string[]) => {
    for (const path of paths) qc.invalidateQueries({ queryKey: [path] })
  }
}

export async function mutate(path: string, init: RequestInit & { method: string }) {
  const res = await globalThis.fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  })
  return unwrap(res, path)
}

// --- Writes ---

export function useMutate(onDone?: () => void) {
  const m = useMutation({
    mutationFn: (write: () => Promise<unknown>) => write(),
    onSuccess: onDone,
  })

  async function run(write: () => Promise<unknown>) {
    try {
      await m.mutateAsync(write)
      return true
    } catch {
      return false
    }
  }

  return { run, pending: m.isPending, error: m.error?.message }
}

// --- Forms ---

export function useForm<T extends Record<string, unknown>>(initial: T) {
  const key = JSON.stringify(initial)
  const [values, setValues] = useState(initial)
  const [base, setBase] = useState({ key, values: initial })

  if (key !== base.key) {
    setBase({ key, values: initial })
    setValues(initial)
  }

  const dirty = Object.keys(base.values).some((k) => values[k] !== base.values[k])

  return {
    values,
    set: (patch: Partial<T>) => setValues((v: T) => ({ ...v, ...patch })),
    dirty,
    reset: () => setValues(base.values),
  }
}

// --- Theme ---

export function useAccent() {
  const [accent, setAccent] = useState("#3b82f6")
  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
      if (value) setAccent(value)
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] })
    return () => mo.disconnect()
  }, [])
  return accent
}

// --- Anonymous counters ---

function beacon(path: string, body: unknown) {
  const json = JSON.stringify(body)

  try {
    if (navigator.sendBeacon?.(path, new Blob([json], { type: "application/json" }))) return
  } catch {
  }

  void globalThis
    .fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      keepalive: true,
    })
    .catch(() => {})
}

export function track(body: { metric?: "visit" | "download" | "copy"; path?: string }) {
  beacon("/api/track", body)
}

export async function trackExport(
  kind: "download" | "copy",
  html: string,
  blockTypes: string[],
  rating?: number,
): Promise<string | null> {
  try {
    const res = await globalThis.fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        html,
        blocks: blockTypes.length,
        blockTypes: blockTypes.join(","),
        rating: rating || null,
      }),
    })
    if (!res.ok) return null
    const body = await res.json()
    return body?.data?.id ?? null
  } catch {
    return null
  }
}

export function rateExport(id: string, rating: number) {
  beacon(`/api/exports/${id}`, { rating })
}
