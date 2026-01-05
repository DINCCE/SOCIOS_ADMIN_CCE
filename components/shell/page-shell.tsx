import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageShell - Full-height container with sticky header/toolbar
 *
 * Calculates height as: calc(100vh - 96px)
 *   - 64px for admin layout header (SidebarTrigger + Breadcrumb)
 *   - 32px for layout padding (p-4: 16px top + 16px bottom)
 *
 * Layout structure:
 *   - Sticky header (fixed at top)
 *   - Sticky toolbar (below header)
 *   - Scrollable content (fills remaining space)
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
      "flex flex-col h-[calc(100vh-96px)] bg-background overflow-hidden",
      className
    )}>
      {children}
    </div>
  )
}
