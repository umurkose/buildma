import { APP_NAME, CODE_TTL_MINUTES } from '@/core'
import { send, layout } from '@/notify/email'

// The email verification template, built on the shared base. Call from a route:
//   await email_verification(c.env, user.email, code)
export function email_verification(env: CloudflareBindings, to: string, code: string) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#18181b;">Welcome to ${APP_NAME}</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#71717a;">Enter this code to verify your email.</p>
    <div style="font-size:34px;font-weight:500;letter-spacing:8px;padding-left:8px;color:#18181b;">${code}</div>
    <p style="margin:14px 0 0;font-size:13px;line-height:20px;color:#a1a1aa;">This code expires in ${CODE_TTL_MINUTES} minutes.</p>
    <p style="margin:4px 0 0;font-size:12px;line-height:18px;color:#a1a1aa;">Never share it — ${APP_NAME} will never ask for this code.</p>`

  return send(env, {
    to,
    subject: `Welcome to ${APP_NAME} — verify your email`,
    html: layout(body, `Your ${APP_NAME} verification code is ${code}`),
  })
}
