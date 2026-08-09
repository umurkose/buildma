import { me, myId } from "@/core/server"
import { Detail } from "./detail"

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await me()
  return <Detail key={id} id={id} currentUserId={(await myId()) ?? ""} />
}
