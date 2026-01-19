import { cn } from "@/lib/utils"

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageContent - Scrollable content area
 *
 * This is the ONLY scrollable container in the PageShell layout.
 * Takes remaining height (flex-1) and enables vertical scrolling.
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
    <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-8", className)}>
      {children}
    </div>
  )
}
