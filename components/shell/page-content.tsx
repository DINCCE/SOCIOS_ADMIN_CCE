import { cn } from "@/lib/utils"

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageContent - Scrollable content area
 *
 * Takes remaining height and enables overflow scrolling.
 * Header and Toolbar stay fixed, only this area scrolls.
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
    <div className={cn("flex-1 overflow-y-auto px-2 py-4", className)}>
      {children}
    </div>
  )
}
