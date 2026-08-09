"use client"

import * as React from "react"
import NextForm from "next/form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

function FormRoot({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NextForm>) {
  return (
    <NextForm noValidate className={cn("w-full space-y-4", className)} {...props} />
  )
}

function Header({
  title,
  description,
}: {
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <div className="space-y-1 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

function Group({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5", className)} {...props} />
}

function FormError({
  data,
  className,
  ...props
}: { data?: string[] } & React.ComponentProps<"p">) {
  if (!data?.length) return null
  return (
    <p role="alert" className={cn("text-sm text-destructive", className)} {...props}>
      {data[0]}
    </p>
  )
}

function Footer({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormCheckbox({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Checkbox> & { children?: React.ReactNode }) {
  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <Checkbox {...props} />
      {children}
    </label>
  )
}

export const Form = Object.assign(FormRoot, {
  Header,
  Group,
  Label,
  Input,
  Checkbox: FormCheckbox,
  Error: FormError,
  Button,
  Footer,
})
