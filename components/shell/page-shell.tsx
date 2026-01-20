import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageShell - Full-height flex container
 *
 * Uses h-screen for full viewport height.
 * Header and Toolbar stay fixed at top via flexbox.
 * Content area supports both vertical and horizontal scrolling via overflow-auto.
 *
 * Layout structure:
 *   - Static header (fixed at top via flex order)
 *   - Static toolbar (fixed below header via flex order)
 *   - Scrollable content (flex-1, fills remaining space with auto overflow)
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
      "flex h-screen w-full flex-col overflow-auto bg-background",
      className
    )}>
      {children}
    </div>
  )
}
