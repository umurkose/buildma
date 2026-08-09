"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { track } from "@/core/client"

export function VisitBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    let first = false
    try {
      first = !sessionStorage.getItem("blockma:counted")
      if (first) sessionStorage.setItem("blockma:counted", "1")
    } catch {
      first = true
    }
    track({ metric: first ? "visit" : undefined, path: pathname })
  }, [pathname])

  return null
}
