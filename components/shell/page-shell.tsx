import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageShell - Full-height flex container
 *
 * Uses h-screen for full viewport height.
 * Header and Toolbar stay fixed at top via flexbox (no sticky positioning needed).
 * PageContent is the only scrollable area.
 *
 * Layout structure:
 *   - Static header (fixed at top via flex order)
 *   - Static toolbar (fixed below header via flex order)
 *   - Scrollable content (flex-1, fills remaining space)
 *
 * @example
 * ```tsx
 * <PageShell>
 *   <PageHeader title="Personas" />
 *   <PageToolbar left={<Search />} />
 *   <PageContent><DataTable /></PageContent>
 * </PageShell>
 * ```
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn(
      "flex h-screen w-full flex-col overflow-hidden bg-background",
      className
    )}>
      {children}
    </div>
  )
}
