import { redirect } from "next/navigation"
import { Screen } from "@/components/ui/screen"
import { VerifyForm } from "./form"

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  if (!email) redirect("/auth/signup")

  return (
    <Screen center>
      <VerifyForm email={email} />
    </Screen>
  )
}
