"use client"

import * as React from "react"
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react"

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useSidebar } from "@/components/ui/sidebar"

const KEY = "nav-shell"
export type NavShell = "sidebar" | "dock"
const DEFAULT: NavShell = "sidebar"

const LABELS: Record<NavShell, string> = {
  sidebar: "Sidebar",
  dock: "Dock",
}

const DESKTOP = "(min-width: 768px)"

const GUTTER = "0.625rem"
const SIDEBAR_W = "16rem"
const SIDEBAR_ICON_W = "3rem"

const DOCK_CLEARANCE = "4.5rem"

const STAGGER = 0.12

const HOLD = 0.45
const fade = (away: number) => 1 - Math.min(1, Math.max(0, (away - HOLD) / (1 - HOLD)))

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

export const navShellScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  KEY,
)})!=="dock"||!matchMedia(${JSON.stringify(
  DESKTOP,
)}).matches)return;var s=document.documentElement.style;s.setProperty("--nav-x","1");s.setProperty("--nav-o","0");s.setProperty("--nav-hit","none");s.setProperty("--nav-vis","hidden");s.setProperty("--nav-dy","0");s.setProperty("--nav-do","1");s.setProperty("--nav-dhit","auto");s.setProperty("--nav-dvis","visible");s.setProperty("--nav-ml",${JSON.stringify(
  GUTTER,
)});s.setProperty("--nav-pb",${JSON.stringify(
  DOCK_CLEARANCE,
)});s.setProperty("--nav-w","0px");s.setProperty("--nav-wi","0px")}catch(e){}})()`

function stored(): NavShell {
  try {
    const value = localStorage.getItem(KEY)
    return value === "dock" || value === "sidebar" ? value : DEFAULT
  } catch {
    return DEFAULT
  }
}

type NavShellContext = {
  shell: NavShell
  setShell: (next: NavShell) => void
}

const Context = React.createContext<NavShellContext | null>(null)

export function useNavShell() {
  const context = React.useContext(Context)
  if (!context) throw new Error("useNavShell must be used within a NavShell.")
  return context
}

export function NavShellProvider({ children }: { children: React.ReactNode }) {
  const [shell, setShellState] = React.useState<NavShell>(() =>
    typeof window === "undefined" || !window.matchMedia(DESKTOP).matches ? DEFAULT : stored(),
  )

  const setShell = React.useCallback((next: NavShell) => {
    setShellState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
    }
  }, [])

  React.useEffect(() => {
    const mql = window.matchMedia(DESKTOP)
    const sync = () => {
      if (mql.matches) setShellState((current) => (current === DEFAULT ? stored() : current))
    }
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  const value = React.useMemo(() => ({ shell, setShell }), [shell, setShell])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function NavShell({ children }: { children: React.ReactNode }) {
  const { shell } = useNavShell()
  const { isMobile } = useSidebar()
  const reduce = useReducedMotion()
  const active: NavShell = isMobile ? "sidebar" : shell

  const chrome = useMotionValue(active === "dock" ? 1 : 0)
  const dock = useMotionValue(active === "dock" ? 1 : 0)

  const publish = React.useCallback(() => {
    const element = typeof document === "undefined" ? null : document.documentElement
    if (!element) return
    const c = chrome.get()
    const d = dock.get()
    element.style.setProperty("--nav-x", String(reduce ? 0 : c))
    const o = fade(c)
    const dockO = fade(1 - d)
    element.style.setProperty("--nav-o", String(o))
    element.style.setProperty("--nav-hit", c > 0.02 ? "none" : "auto")
    element.style.setProperty("--nav-dy", String(reduce ? 0 : 1 - d))
    element.style.setProperty("--nav-do", String(dockO))
    element.style.setProperty("--nav-dhit", d > 0.5 ? "auto" : "none")
    element.style.setProperty("--nav-vis", o > 0 ? "visible" : "hidden")
    element.style.setProperty("--nav-dvis", dockO > 0 ? "visible" : "hidden")
    const g = reduce ? (c > 0.5 ? 1 : 0) : c
    element.style.setProperty("--nav-ml", `calc(${g} * ${GUTTER})`)
    element.style.setProperty("--nav-w", `calc((1 - ${g}) * ${SIDEBAR_W})`)
    element.style.setProperty("--nav-wi", `calc((1 - ${g}) * ${SIDEBAR_ICON_W})`)
    element.style.setProperty("--nav-pb", d > 0.5 ? DOCK_CLEARANCE : "0px")
  }, [chrome, dock, reduce])

  useMotionValueEvent(chrome, "change", publish)
  useMotionValueEvent(dock, "change", publish)

  useIsomorphicLayoutEffect(publish, [publish])

  const settled = React.useRef(active)
  React.useEffect(() => {
    if (settled.current === active) return
    settled.current = active
    const to = active === "dock" ? 1 : 0
    const spring = { type: "spring", bounce: 0, duration: reduce ? 0.2 : 0.4 } as const
    const chromeControls = animate(chrome, to, { ...spring, delay: to === 1 ? 0 : STAGGER })
    const dockControls = animate(dock, to, { ...spring, delay: to === 1 ? STAGGER : 0 })
    return () => {
      chromeControls.stop()
      dockControls.stop()
    }
  }, [active, chrome, dock, reduce])

  return (
    <>
      {children}
    </>
  )
}

export function NavShellSelect({ className }: { className?: string }) {
  const { shell, setShell } = useNavShell()

  return (
    <NativeSelect
      className={className}
      value={shell}
      onChange={(e) => setShell(e.target.value as NavShell)}
    >
      {(Object.keys(LABELS) as NavShell[]).map((option) => (
        <NativeSelectOption key={option} value={option}>
          {LABELS[option]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
