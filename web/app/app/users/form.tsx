"use client"

import { useActionState, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { TopbarPortal } from "@/components/layout/sidebar"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { createUser } from "./actions"

export function NewUserForm() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createUser, {})

  useEffect(() => {
    if (!state.success) return
    const frame = window.requestAnimationFrame(() => setOpen(false))
    return () => window.cancelAnimationFrame(frame)
  }, [state.success])

  return (
    <TopbarPortal>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus />
            New User
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Create an email account.</DialogDescription>
          </DialogHeader>

          <Form action={action}>
            <Form.Group>
              <Form.Label htmlFor="name">Name</Form.Label>
              <Form.Input
                id="name"
                name="name"
                placeholder="Ada Lovelace"
                defaultValue={state.values?.name}
                aria-invalid={!!state.errors?.name}
              />
              <Form.Error data={state.errors?.name} />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="role">Role</Form.Label>
              <NativeSelect
                id="role"
                name="role"
                defaultValue={state.values?.role ?? "user"}
                className="w-full"
              >
                <NativeSelectOption value="user">User</NativeSelectOption>
                <NativeSelectOption value="admin">Admin</NativeSelectOption>
              </NativeSelect>
            </Form.Group>

            <input type="hidden" name="method" value="email" />
            <Form.Group>
              <Form.Label htmlFor="email">Email</Form.Label>
              <Form.Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={state.values?.email}
                aria-invalid={!!state.errors?.email}
              />
              <Form.Error data={state.errors?.email} />
            </Form.Group>

            <Form.Group>
              <Form.Label htmlFor="password">Password</Form.Label>
              <Form.Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                defaultValue={state.values?.password}
                aria-invalid={!!state.errors?.password}
              />
              <Form.Error data={state.errors?.password} />
            </Form.Group>

            <Form.Error data={state.errors?.form} />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Form.Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Save"}
              </Form.Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </TopbarPortal>
  )
}
