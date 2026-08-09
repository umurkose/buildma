import type { Metadata } from "next"

import { getToken } from "@/core/server"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const isAuth = !!(await getToken())

  return (
    <>
      <Header isAuth={isAuth} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
