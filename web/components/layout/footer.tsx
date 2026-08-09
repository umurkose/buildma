export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full shrink-0 border-t border-border">
      <div className="container flex h-14 items-center justify-center">
        <p className="text-xs text-muted-foreground">© App {year}</p>
      </div>
    </footer>
  )
}
