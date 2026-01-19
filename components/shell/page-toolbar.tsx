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
      "flex items-center justify-between gap-4 px-8 pt-8 pb-2 shrink-0",
      "bg-background/95 backdrop-blur-sm z-10",
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
