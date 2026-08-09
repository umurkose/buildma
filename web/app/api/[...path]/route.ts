import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "@/core/server"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function handler(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params
  const token = await getToken()
  const url = `${BASE_URL}/api/${path.join("/")}${req.nextUrl.search}`

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: req.method === "GET" ? undefined : await req.text(),
    cache: "no-store",
  })

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
