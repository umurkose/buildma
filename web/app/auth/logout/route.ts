import { NextResponse, type NextRequest } from "next/server"

import { fetch } from "@/core/server"

export async function GET(req: NextRequest) {
  await fetch("/auth/logout", { method: "POST" }).catch(() => {})

  const res = NextResponse.redirect(new URL("/", req.url))
  res.cookies.set("token", "", { path: "/", maxAge: 0 })
  return res
}
