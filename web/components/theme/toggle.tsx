"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export function ThemeSelect({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  return (
    <NativeSelect
      className={className}
      value={mounted ? (theme ?? "system") : "system"}
      onChange={(e) => setTheme(e.target.value)}
      disabled={!mounted}
    >
      <NativeSelectOption value="light">Light</NativeSelectOption>
      <NativeSelectOption value="dark">Dark</NativeSelectOption>
      <NativeSelectOption value="system">System</NativeSelectOption>
    </NativeSelect>
  )
}
