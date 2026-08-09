import { APP_NAME, SUPPORT_EMAIL } from '@/core'

export async function send(
  env: CloudflareBindings,
  message: { to: string; subject: string; html: string },
) {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER) {
    throw new Error('Email not configured: set BREVO_API_KEY and BREVO_SENDER.')
  }

  console.log(`[email] sending "${message.subject}" → ${message.to} (from ${env.BREVO_SENDER})`)

  let res: Response
  try {
    res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER, name: APP_NAME },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
      }),
    })
  } catch (err) {
    console.error('[email] could not reach Brevo:', err)
    throw err
  }

  const payload = await res.text().catch(() => '')
  if (!res.ok) {
    console.error(`[email] Brevo rejected (${res.status}): ${payload}`)
    throw new Error(`Brevo ${res.status}: ${payload}`)
  }
  console.log(`[email] accepted by Brevo (${res.status})`)
  return payload
}

export function layout(body: string, preview = '') {
  const year = new Date().getFullYear()
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;">
            <tr>
              <td align="center" style="padding:0 0 24px;">
                <span style="font-size:18px;font-weight:600;letter-spacing:-0.02em;color:#18181b;">${APP_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:40px 32px;text-align:center;">
                ${body}
                <div style="height:1px;background-color:#f4f4f5;margin:28px 0 18px;"></div>
                <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
                  Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#3f3f46;text-decoration:underline;">Contact support</a> &mdash; we&rsquo;re happy to help.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 24px 0;">
                <p style="margin:0 0 14px;font-size:12px;line-height:18px;">
                  <a href="#" style="color:#71717a;text-decoration:none;">Help Center</a>
                  &nbsp;&middot;&nbsp;
                  <a href="#" style="color:#71717a;text-decoration:none;">Privacy</a>
                  &nbsp;&middot;&nbsp;
                  <a href="#" style="color:#71717a;text-decoration:none;">Terms</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:18px;color:#a1a1aa;">
                  &copy; ${year} ${APP_NAME}. All rights reserved.<br />
                  This is an automated message — please don&rsquo;t reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
