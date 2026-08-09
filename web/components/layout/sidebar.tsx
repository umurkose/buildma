"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useReducedMotion } from "motion/react"
import {
  type LucideIcon,
  ChevronsUpDown,
  ScrollText,
  UserRound,
  ChartColumn,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  Settings,
  Users,
  X,
} from "lucide-react"
import { IndicatorFill } from "@/components/ui/indicator"
import { Logo } from "@/components/ui/logo"
import { Dock, DockIcon } from "@/components/ui/dock"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { APP_NAME } from "@/core/client"
import type { Role } from "@/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

type User = {
  name: string | null
  email: string | null
  phone: string | null
  role: Role
}

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}
const nav: { label: string; items: NavItem[] }[] = [
  {
    label: "Platform",
    items: [
      { title: "Overview", href: "/app", icon: LayoutDashboard, adminOnly: true },
      { title: "Users", href: "/app/users", icon: Users, adminOnly: true },
      { title: "Traffic", href: "/app/traffic", icon: ChartColumn, adminOnly: true },
      { title: "Downloads", href: "/app/downloads", icon: Download, adminOnly: true },
      { title: "Logs", href: "/app/logs", icon: ScrollText, adminOnly: true },
      { title: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
]

const ROW_TRANSITION =
  "transition-[width,height,padding,color,background-color,scale] md:active:scale-[0.97]"

const ROW = "flex items-center gap-2 p-2"

const initialsOf = (name: string | null) =>
  (name ?? "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"

// --- Shared content (desktop sidebar + mobile menu) ---

const isCurrent = (href: string, pathname: string) =>
  href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`)

function NavMenu({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {nav.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items
              .filter((item) => !item.adminOnly || role === "admin")
              .map((item) => {
                const active = isCurrent(item.href, pathname)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className={active ? undefined : ROW_TRANSITION}
                    >
                      {active ? (
                        <span aria-current="page">
                          <IndicatorFill layout={ROW}>
                            <item.icon />
                            <span>{item.title}</span>
                          </IndicatorFill>
                        </span>
                      ) : (
                        <Link href={item.href} onClick={onNavigate}>
                          <IndicatorFill layout={ROW}>
                            <item.icon />
                            <span>{item.title}</span>
                          </IndicatorFill>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

function AccountItems({ user, userId }: { user: User; userId?: string }) {
  const initials = initialsOf(user.name)
  const primary = user.name ?? user.phone
  const secondary = user.email ?? (user.name ? user.phone : null)

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-[0.625rem]">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{primary}</span>
            <span className="truncate text-xs text-muted-foreground">{secondary}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {userId && (
        <DropdownMenuItem asChild>
          <Link href={`/app/users/${userId}`}>
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem asChild>
        <a href="/auth/logout">
          <LogOut />
          Log out
        </a>
      </DropdownMenuItem>
    </>
  )
}

function UserMenu({ user, userId }: { user: User; userId?: string }) {
  const initials = initialsOf(user.name)
  const primary = user.name ?? user.phone
  const secondary = user.email ?? (user.name ? user.phone : null)
  const { state, isMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile

  return (
    <SidebarMenu indicator={false}>
      <SidebarMenuItem>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-1!"
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback className="text-[0.625rem]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{primary}</span>
                    <span className="truncate text-xs text-muted-foreground">{secondary}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" hidden={!collapsed}>
              Profile
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg [&_svg]:text-primary"
            side={collapsed ? "right" : "top"}
            align="end"
            sideOffset={4}
          >
            <AccountItems user={user} userId={userId} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// --- Desktop sidebar (fixed). Mobile uses SidebarMobile instead. ---

export function Sidebar({ user, userId }: { user: User; userId?: string }) {
  const { isMobile } = useSidebar()
  if (isMobile) return null

  return (
    <SidebarPrimitive
      collapsible="icon"
      className="opacity-(--nav-o,1) [pointer-events:var(--nav-hit,auto)] [visibility:var(--nav-vis,visible)] transform-[translateX(calc(var(--nav-x,0)*-105%))]"
    >
      <SidebarHeader>
        <Link
          href="/app"
          aria-label={`${APP_NAME} — home`}
          className="flex h-8 items-center gap-2 rounded-full px-2 select-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Logo className="text-foreground" />
          <span className="truncate font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="mt-2">
        <NavMenu role={user.role} />
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} userId={userId} />
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  )
}

// --- Mobile full-page menu (drops below the top bar) ---

export function SidebarMobile({ user, userId }: { user: User; userId?: string }) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  if (!isMobile || !openMobile) return null

  return (
    <div className="absolute inset-x-0 top-12 bottom-0 z-20 flex flex-col bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <NavMenu role={user.role} onNavigate={() => setOpenMobile(false)} />
      </div>
      <div className="shrink-0 border-t border-border p-2">
        <UserMenu user={user} userId={userId} />
      </div>
    </div>
  )
}

// --- Desktop dock (the other shell: the same nav list, laid on its side) ---

const DOCK_REM = { size: 2.25, magnified: 2.75 }

function useRootSize() {
  const [px, setPx] = useState(16)
  useEffect(() => {
    const read = () => setPx(parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
    return () => mo.disconnect()
  }, [])
  return px
}

const DOCK_ITEM = "flex size-full items-center justify-center rounded-full [&_svg]:size-5"

export function NavDock({ user, userId }: { user: User; userId?: string }) {
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const reduce = useReducedMotion()
  const rem = useRootSize()
  if (isMobile) return null

  const items = nav
    .flatMap((section) => section.items)
    .filter((item) => !item.adminOnly || user.role === "admin")

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-4 opacity-(--nav-do,0) [visibility:var(--nav-dvis,hidden)] transform-[translateY(calc(var(--nav-dy,1)*140%))]">
      <Dock
        iconSize={DOCK_REM.size * rem}
        disableMagnification={reduce ?? false}
        iconMagnification={DOCK_REM.magnified * rem}
        iconDistance={7.5 * rem}
        direction="middle"
        className={cn(
          "mt-0 h-14 gap-1 rounded-full p-1.5 backdrop-blur-2xl backdrop-saturate-180",
          "border-border bg-background/45! shadow-none dark:bg-background/35!",
          "[pointer-events:var(--nav-dhit,none)]",
          "[@media(prefers-reduced-transparency:reduce)]:bg-background! [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none",
        )}
      >
        {items.map((item) => {
          const active = isCurrent(item.href, pathname)
          return (
            <DockIcon
              key={item.title}
              className={
                active
                  ? "cursor-default bg-primary [&_svg]:text-primary-foreground"
                  : "hover:bg-sidebar-accent [&_svg]:text-primary"
              }
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  {active ? (
                    <span aria-current="page" className={DOCK_ITEM}>
                      <item.icon />
                      <span className="sr-only">{item.title}</span>
                    </span>
                  ) : (
                    <Link href={item.href} className={DOCK_ITEM}>
                      <item.icon />
                      <span className="sr-only">{item.title}</span>
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="top">{item.title}</TooltipContent>
              </Tooltip>
            </DockIcon>
          )
        })}

        <Separator orientation="vertical" className="mx-1 h-auto self-stretch" />

        <DockIcon className="hover:bg-sidebar-accent [&_svg]:text-primary has-data-[state=open]:bg-primary has-data-[state=open]:[&_svg]:text-primary-foreground">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={DOCK_ITEM}>
                    <UserRound />
                    <span className="sr-only">Account</span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Account</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={8}
              className="min-w-56 rounded-lg [&_svg]:text-primary"
            >
              <AccountItems user={user} userId={userId} />
            </DropdownMenuContent>
          </DropdownMenu>
        </DockIcon>
      </Dock>
    </div>
  )
}

// --- Top bar (title + sidebar toggle + a slot pages fill via TopbarPortal) ---

const TITLES: Record<string, string> = {
  "/app": "Overview",
  "/app/users": "Users",
  "/app/traffic": "Traffic",
  "/app/downloads": "Downloads",
  "/app/logs": "Logs",
  "/app/settings": "Settings",
}

function SidebarToggle({ className }: { className?: string }) {
  const { isMobile, openMobile, toggleSidebar } = useSidebar()
  const Icon = isMobile ? (openMobile ? X : Menu) : PanelLeft
  const label = isMobile ? "Toggle Menu" : "Toggle Sidebar"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" className={className} onClick={toggleSidebar}>
          <Icon />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function Topbar() {
  const pathname = usePathname()
  const title =
    TITLES[pathname] ??
    TITLES[pathname.replace(/\/[^/]+$/, "")] ??
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/^./, (c) => c.toUpperCase()) ??
    "Overview"

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarToggle className="-ml-1 opacity-(--nav-o,1) [pointer-events:var(--nav-hit,auto)] transform-[translateY(calc(var(--nav-x,0)*-200%))]" />
      <span className="shrink-0 text-sm font-medium transform-[translateX(calc(var(--nav-x,0)*-2rem))]">
        {title}
      </span>
      <div id="topbar-actions" className="flex min-w-0 flex-1 items-center justify-end gap-2" />
    </div>
  )
}

export function TopbarPortal({ children }: { children: React.ReactNode }) {
  const [target] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.getElementById("topbar-actions"),
  )
  return target ? createPortal(children, target) : null
}
