import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/ui/logo"

export function Header({ isAuth }: { isAuth: boolean }) {
  return (
    <header className="w-full shrink-0 border-b border-border">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" aria-label="Blockma — home">
          <Wordmark />
        </Link>

        {isAuth && (
          <nav className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/app">Dashboard</Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
