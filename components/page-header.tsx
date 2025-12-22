import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  metadata?: string // e.g., "128 total"
  className?: string
}

/**
 * PageHeader - Standardized page header with optional metadata
 *
 * Metadata appears as low-opacity text next to title (e.g., "128 total")
 * to avoid "Badge fatigue" while providing data context.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Personas"
 *   description="Gestiona las personas registradas"
 *   metadata="128 total"
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  metadata,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-baseline gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {metadata && (
          <span className="text-sm font-medium text-muted-foreground/60">
            {metadata}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
