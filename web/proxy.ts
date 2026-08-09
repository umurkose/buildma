import { NextResponse, type NextRequest } from "next/server"

const AUTH_PAGES = ["/auth/login", "/auth/signup"]

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  const { pathname } = req.nextUrl

  if (token && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/app", req.url))
  }

  if (!token && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }
}

export const config = {
  matcher: ["/auth/login", "/auth/signup", "/app", "/app/:path*"],
}
