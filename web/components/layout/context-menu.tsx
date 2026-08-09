"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, LayoutGrid, RotateCw } from "lucide-react"

import { toast } from "@/components/ui/sonner"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useNavShell, type NavShell } from "@/components/layout/shell"

const MOD =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"

export function AppContextMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { shell, setShell } = useNavShell()

  const reload = () => {
    const id = toast.loading("Reloading…")
    router.refresh()
    setTimeout(() => toast.success("Reloaded", { id }), 600)
  }
  const [mod] = React.useState(MOD)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 [&_svg]:text-primary">
        <ContextMenuItem onClick={() => router.back()}>
          <ArrowLeft />
          Back
          <ContextMenuShortcut>{mod}[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => router.forward()}>
          <ArrowRight />
          Forward
          <ContextMenuShortcut>{mod}]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={reload}>
          <RotateCw />
          Reload
          <ContextMenuShortcut>{mod}R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <LayoutGrid />
            Navigation
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 [&_svg]:text-primary">
            <ContextMenuRadioGroup
              value={shell}
              onValueChange={(value) => setShell(value as NavShell)}
            >
              <ContextMenuRadioItem value="sidebar">Sidebar</ContextMenuRadioItem>
              <ContextMenuRadioItem value="dock">Dock</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}
