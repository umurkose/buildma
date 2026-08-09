"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  })
}

let browserClient: QueryClient | undefined

function getClient() {
  if (typeof window === "undefined") return makeClient()
  return (browserClient ??= makeClient())
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getClient()}>{children}</QueryClientProvider>
}
