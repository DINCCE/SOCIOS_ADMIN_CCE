import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  metadata?: string // e.g., "128 total"
  actions?: React.ReactNode
  className?: string
}

/**
 * PageHeader - Compact page header (replaces existing PageHeader)
 *
 * Key differences from old PageHeader:
 * - Reduced from text-3xl to text-2xl (compact, Linear-style)
 * - Removed mb-6 margin (no gap)
 * - Added shrink-0 for sticky behavior
 * - Added border-b for visual separation
 * - Actions slot on right side
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Personas"
 *   description="Gestiona las personas registradas"
 *   metadata="128 total"
 *   actions={<NewPersonDialog />}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  metadata,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(
      "flex flex-col gap-1.5 py-[calc(1rem*var(--density-scale))] px-[calc(2rem*var(--density-scale))] shrink-0 border-b border-border/60",
      "bg-background/95 backdrop-blur-sm z-10",
      className
    )}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {metadata && (
            <span className="text-sm font-medium text-muted-foreground/60">
              {metadata}
            </span>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground hidden sm:block">
          {description}
        </p>
      )}
    </header>
  )
}
