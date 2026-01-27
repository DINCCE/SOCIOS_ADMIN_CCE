/**
 * Search Action Item Component
 *
 * Individual action item in the command palette for quick actions
 * (create entities, navigate to pages, etc.)
 */

'use client'

import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ENTITY_CONFIG } from '@/lib/search/constants'
import { ICON_MAP } from '@/lib/search/actions'
import type { SearchAction } from '@/lib/search/types'
import { CommandItem } from '@/components/ui/command'

interface SearchActionItemProps {
  action: SearchAction
  isSelected?: boolean
  onSelect: () => void
}

/**
 * Visual design:
 * - Distinct from search results with plus icon indicator
 * - Slightly different color scheme for actions
 * - Keyboard shortcut displayed on the right
 */
export function SearchActionItem({ action, isSelected, onSelect }: SearchActionItemProps) {
  const Icon = ICON_MAP[action.icon]

  // Include label and shortcut in value for cmdk filtering
  // Add "command" keyword so all actions show when typing ">"
  const filterValue = `command ${action.label} ${action.shortcut || ''}`.toLowerCase()

  return (
    <CommandItem
      value={filterValue}
      onSelect={onSelect}
      className={cn(
        // Base layout - consistent with SearchResultItem
        'gap-3 px-4 py-3',
        // Remove default cmdk styling to use our custom design
        '!cursor-pointer',
        'rounded-md mx-2 my-1'
      )}
    >
      {/* Icon container - distinctive for actions */}
      <div className={cn(
        'flex-shrink-0 flex items-center justify-center',
        'w-9 h-9 rounded-full',
        // Action-specific background
        'bg-primary/10 dark:bg-primary/20',
        // Primary color for actions
        'text-primary'
      )}>
        {action.type === 'create' ? (
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        ) : (
          Icon && <Icon className="h-4 w-4" strokeWidth={2.5} />
        )}
      </div>

      {/* Content section */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <span className={cn(
          'font-medium text-sm truncate block',
          'text-foreground',
          'tracking-tight'
        )}>
          {action.label}
        </span>

        {/* Type indicator - subtle */}
        <span className="text-xs text-muted-foreground truncate block">
          {action.type === 'create' ? 'Crear nuevo' : 'Navegar a'}
        </span>
      </div>

      {/* Shortcut indicator - shown for actions */}
      {action.shortcut && (
        <span className={cn(
          'text-xs px-2 py-1 rounded',
          'bg-muted text-muted-foreground',
          'font-mono',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'data-[selected=true]:opacity-100'
        )}>
          {action.shortcut.split(' ').pop()}
        </span>
      )}

      {/* Chevron indicator */}
      <ArrowRight className={cn(
        'h-4 w-4 flex-shrink-0 transition-all duration-200',
        'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0',
        'data-[selected=true]:opacity-100 data-[selected=true]:translate-x-0',
        'text-muted-foreground'
      )} />
    </CommandItem>
  )
}
