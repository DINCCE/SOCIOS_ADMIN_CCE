import { cn } from "@/lib/utils"

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex gap-6 md:gap-10">
            <a href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Molten Filament</span>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            {/* UserNav would go here */}
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <nav className="grid items-start gap-2">
            <span className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 text-slate-800">
              Dashboard
            </span>
            <span className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled">
              Settings
            </span>
          </nav>
        </aside>
        <main className={cn("flex w-full flex-1 flex-col overflow-hidden", className)} {...props}>
          {children}
        </main>
      </div>
    </div>
  )
}
