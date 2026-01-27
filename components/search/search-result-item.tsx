/**
 * Search Result Item Component
 *
 * Individual result item in the global search command palette.
 * Features distinctive design with subtle animations and
 * entity-specific visual differentiation.
 */

'use client'

import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ENTITY_CONFIG } from '@/lib/search/constants'
import type { SearchResult, EntityType } from '@/lib/search/types'

interface SearchResultItemProps {
  result: SearchResult
  isSelected?: boolean
  onSelect: () => void
}

/**
 * Visual design principles:
 * - Asymmetrical icon placement for visual interest
 * - Subtle hover animation with horizontal translate
 * - Entity-specific color coding that adapts to theme
 * - High contrast for readability
 * - Sparse motion for polish
 */
export function SearchResultItem({ result, isSelected, onSelect }: SearchResultItemProps) {
  const config = ENTITY_CONFIG[result.entity_type]
  const Icon = config.icon

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        // Base layout - asymmetrical with left padding variation
        'group flex items-center gap-3 px-4 py-3',
        // Interactive states - subtle translate on hover
        'cursor-pointer transition-all duration-200',
        'hover:translate-x-1 hover:bg-accent/50',
        // Selected state
        isSelected && 'bg-accent translate-x-1',
        // Focus ring for keyboard navigation
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        // Rounded corners with theme-aware radius
        'rounded-md mx-2 my-1'
      )}
    >
      {/* Icon container - distinctive circular background */}
      <div className={cn(
        'flex-shrink-0 flex items-center justify-center',
        'w-9 h-9 rounded-full',
        // Theme-aware background using CSS variables
        'bg-primary/5 dark:bg-primary/10',
        // Entity-specific color
        config.colorLight,
        'dark:' + config.colorDark
      )}>
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>

      {/* Content section - flexible width */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Title - distinctive typography */}
        <span className={cn(
          'font-medium text-sm truncate block',
          'text-foreground',
          // Subtle letter spacing for refinement
          'tracking-tight'
        )}>
          {result.title}
        </span>

        {/* Subtitle - muted and smaller */}
        {result.subtitle && (
          <span className="text-xs text-muted-foreground truncate block">
            {result.subtitle}
          </span>
        )}
      </div>

      {/* Chevron indicator - appears on hover/selection */}
      <ArrowRight className={cn(
        'h-4 w-4 flex-shrink-0 transition-all duration-200',
        // Hidden by default, slides in on hover/select
        'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0',
        isSelected && 'opacity-100 translate-x-0',
        'text-muted-foreground'
      )} />
    </div>
  )
}
