"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { verify, resend } from "./actions"
import { Form } from "@/components/ui/form"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const RESEND_SECONDS = 60

export function VerifyForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(verify, {})
  const formRef = useRef<HTMLFormElement>(null)

  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const [resending, startResend] = useTransition()

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds(seconds - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  function onResend() {
    startResend(async () => {
      const { ok } = await resend(email)
      if (ok) setSeconds(RESEND_SECONDS)
    })
  }

  return (
    <Form ref={formRef} action={action} className="max-w-sm">
      <input type="hidden" name="email" value={email} />
      <Form.Header
        title="Check your email"
        description={
          <>
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>. Enter it
            below to verify your account.
          </>
        }
      />

      <Form.Group className="flex flex-col items-center">
        <InputOTP
          name="code"
          maxLength={6}
          autoFocus
          disabled={pending}
          containerClassName="justify-center"
          aria-invalid={!!state.errors}
          onComplete={() => formRef.current?.requestSubmit()}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Form.Error data={state.errors?.code ?? state.errors?.form} />
      </Form.Group>

     <div className="flex items-center justify-center">
       <Form.Button type="submit" disabled={pending}>
        {pending ? "Verifying…" : "Verify email"}
      </Form.Button>
     </div>

      <Form.Footer>
        Didn&apos;t get the code?{" "}
        <Form.Button
          type="button"
          variant="link"
          className="h-auto p-0 align-baseline"
          disabled={seconds > 0 || resending}
          onClick={onResend}
        >
          {seconds > 0
            ? `Resend in ${seconds}s`
            : resending
              ? "Sending…"
              : "Resend code"}
        </Form.Button>
      </Form.Footer>
    </Form>
  )
}
