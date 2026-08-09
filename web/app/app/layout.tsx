import type { Metadata } from "next"

import { me, myId } from "@/core/server"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar, SidebarMobile, Topbar, NavDock } from "@/components/layout/sidebar"
import { NavShell, NavShellProvider } from "@/components/layout/shell"
import { AppContextMenu } from "@/components/layout/context-menu"

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, userId] = await Promise.all([me("admin"), myId()])

  return (
    <NavShellProvider>
      <AppContextMenu>
        <SidebarProvider className="min-h-0 flex-1 bg-sidebar">
          <NavShell>
            <Sidebar user={user} userId={userId ?? undefined} />

            <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden max-sm:rounded-none max-sm:border-0 bg-background sm:my-2.5 sm:mr-2.5 sm:ml-(--nav-ml,0px) sm:rounded-xl sm:border sm:border-border">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <Topbar />
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-(--nav-pb,0px)">
                  {children}
                </div>
                <SidebarMobile user={user} userId={userId ?? undefined} />
              </div>
              <div id="panel-slot" className="flex shrink-0" />
              <NavDock user={user} userId={userId ?? undefined} />
            </div>
          </NavShell>
        </SidebarProvider>
      </AppContextMenu>
    </NavShellProvider>
  )
}
