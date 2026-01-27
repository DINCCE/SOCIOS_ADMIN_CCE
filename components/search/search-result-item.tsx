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
import { CommandItem } from '@/components/ui/command'

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

  // IMPORTANT: cmdk uses the `value` prop for filtering items based on the input.
  // We include title, subtitle, and entity_type in the value for proper search matching.
  // Adding a unique prefix to ensure each item has a unique value across the list.
  const searchValue = `${result.entity_type}:${result.title}:${result.subtitle || ''}:${result.entity_id}`

  return (
    <CommandItem
      value={searchValue}
      onSelect={onSelect}
      className={cn(
        // Base layout - asymmetrical with left padding variation
        'gap-3 px-4 py-3',
        // Remove default cmdk styling to use our custom design
        '!cursor-pointer',
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
        'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 data-[selected=true]:opacity-100 data-[selected=true]:translate-x-0',
        'text-muted-foreground'
      )} />
    </CommandItem>
  )
}
