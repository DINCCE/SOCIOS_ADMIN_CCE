'use client'

import { cn } from "@/lib/utils"

interface PageToolbarProps {
  left?: React.ReactNode // Search + Filters
  right?: React.ReactNode // ViewToggle + DataTableViewOptions
  className?: string
}

/**
 * PageToolbar - Sticky toolbar for filters and controls
 *
 * Extracted from DataTable's embedded toolbar to provide:
 * - Consistent placement across pages
 * - Sticky behavior (stays visible on scroll)
 * - Flexible slot system for left/right controls
 *
 * @example
 * ```tsx
 * <PageToolbar
 *   left={
 *     <>
 *       <CommandSearch />
 *       <Select>...</Select>
 *     </>
 *   }
 *   right={<DataTableViewOptions table={table} />}
 * />
 * ```
 */
export function PageToolbar({ left, right, className }: PageToolbarProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-2 py-3 shrink-0",
      "border-b border-border/60 bg-muted/5 z-10",
      className
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar">
        {left}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {right}
      </div>
    </div>
  )
}
