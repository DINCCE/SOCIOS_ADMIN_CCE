import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageShell - Full-height flex container
 *
 * Uses h-full to fill available space from parent (SidebarInset).
 * Header and Toolbar stay fixed at top via flexbox.
 * Content area (PageContent) handles scrolling - this shell does not scroll.
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
      "flex h-full w-full max-w-full flex-col overflow-hidden bg-background",
      className
    )}>
      {children}
    </div>
  )
}
