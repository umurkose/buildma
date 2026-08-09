// --- Envelope ---

export async function unwrap(res: Response, path: string) {
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message ?? `Request failed: ${path}`)
  }
  return body.data
}
