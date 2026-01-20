import { cn } from "@/lib/utils"

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageContent - Scrollable content area
 *
 * The main content container in the PageShell layout.
 * Takes remaining height (flex-1) and enables both vertical and horizontal scrolling.
 * Header and Toolbar stay fixed above this area.
 *
 * @example
 * ```tsx
 * <PageContent>
 *   <DataTable />
 *   <KanbanBoard />
 * </PageContent>
 * ```
 */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("flex-1 min-w-0 max-w-full overflow-auto px-8 pb-8 pt-0", className)}>
      {children}
    </div>
  )
}
