/**
 * Global Search Command Palette
 *
 * DESIGN DIRECTION: "Efficient Minimalism"
 * Aesthetic inspired by Linear, Notion, and Attio with intentional
 * differentiation through:
 * - Glassmorphism backdrop with subtle blur
 * - Asymmetrical result group spacing
 * - Circular entity icons with subtle backgrounds
 * - Smooth entrance animations with cubic-bezier easing
 * - High contrast for readability
 * - Entity-specific color coding that adapts to all 12 themes
 * - Command mode with ">" for quick actions
 * - Recent items history
 * - Keyboard shortcuts footer
 *
 * DFII Score: 13/15
 * - Aesthetic Impact: 4/5 - Clean, memorable design
 * - Context Fit: 5/5 - Perfect for business CRM
 * - Implementation Feasibility: 5/5 - Uses existing patterns
 * - Performance Safety: 5/5 - Debounced search, optimized
 * - Consistency Risk: -1 - Low risk, respects theme system
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
  CommandItem,
} from '@/components/ui/command'
import { useCmdK } from '@/hooks/use-cmd-k'
import { useGlobalSearch } from './use-global-search'
import { useRecentSearch } from './use-recent-search'
import { useUser } from '@/hooks/use-user'
import { useOrganization } from '@/hooks/use-organization'
import { SearchResultItem } from './search-result-item'
import { SearchActionItem } from './search-action-item'
import { ENTITY_CONFIG, EMPTY_STATE_MESSAGES, KEYBOARD_SHORTCUTS } from '@/lib/search/constants'
import {
  isCommandMode,
  filterActions,
  SEARCH_ACTIONS,
} from '@/lib/search/actions'
import { SearchSkeleton } from './search-skeleton'
import { NewPersonSheet } from '@/components/socios/personas/new-person-sheet'
import { NewCompanySheet } from '@/components/socios/empresas/new-company-sheet'
import { NewTareaSheet } from '@/components/procesos/tareas/new-tarea-sheet'
import { NewDocComercialSheet } from '@/components/procesos/documentos-comerciales/new-doc-comercial-sheet'
import { AsignarAccionSheet } from '@/components/procesos/acciones/asignar-accion-sheet'
import { Loader2, Search as SearchIcon, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/lib/search/types'
import type { SearchAction } from '@/lib/search/types'

/**
 * Main global search dialog component
 *
 * Features:
 * - Keyboard-first navigation (Cmd+K / Ctrl+K / Alt+K)
 * - Debounced search with TanStack Query caching
 * - Entity-type grouping with visual separation
 * - Theme-aware design using CSS variables
 * - RLS-respecting search via Supabase RPC
 * - Command mode (">") for quick actions
 * - Recent items history
 * - Keyboard shortcuts display
 */
export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showNewPerson, setShowNewPerson] = useState(false)
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [showNewTarea, setShowNewTarea] = useState(false)
  const [showNewDocComercial, setShowNewDocComercial] = useState(false)
  const [showAsignarAccion, setShowAsignarAccion] = useState(false)
  const router = useRouter()

  // Get organization ID for context
  const { data: orgId = null } = useOrganization()

  // Determine if we're in command mode
  const commandMode = isCommandMode(query)

  // Search for entities (only when NOT in command mode)
  const { data: results = [], isLoading, isError } = useGlobalSearch({
    query: commandMode ? '' : query, // Don't search entities in command mode
    orgId,
    enabled: open && !commandMode,
  })

  // Debug logging
  console.log('🎯 Dialog state:', { query, orgId, results, isLoading, isError, resultsLength: results?.length })

  // Get recent items
  const { recentItems, addRecentItem } = useRecentSearch({
    enabled: open && query.length === 0 && !commandMode,
    limit: 5,
  })

  // Filter actions based on command query
  const filteredActions = useMemo(() => {
    return commandMode ? filterActions(query) : []
  }, [commandMode, query])

  // Toggle dialog state
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const newState = !prev
      // Reset query when opening
      if (newState) {
        setQuery('')
      }
      return newState
    })
  }, [])

  // Register keyboard shortcut
  useCmdK({ callback: toggle, enabled: true })

  // Handle result selection with navigation and recent items tracking
  const handleSelect = useCallback(
    (item: SearchResult | { route: string; title: string }) => {
      const route = item.route

      // Add to recent items if it's a SearchResult
      if ('entity_type' in item) {
        addRecentItem(item as SearchResult)
      }

      router.push(route)
      setOpen(false)
      setQuery('')
    },
    [router, addRecentItem]
  )

  // Handle action selection
  const handleActionSelect = useCallback(
    (action: SearchAction) => {
      // Handle navigation actions
      if (action.type === 'navigation' && action.route) {
        router.push(action.route)
        setOpen(false)
        setQuery('')
        return
      }

      // Handle create actions
      if (action.type === 'create') {
        // Close search dialog first for a cleaner transition
        setOpen(false)
        setQuery('')

        // Small delay to let the search dialog close before opening the sheet
        setTimeout(() => {
          if (action.id === 'create-persona') setShowNewPerson(true)
          if (action.id === 'create-empresa') setShowNewCompany(true)
          if (action.id === 'create-tarea') setShowNewTarea(true)
          if (action.id === 'create-doc-comercial') setShowNewDocComercial(true)
          if (action.id === 'asignar-accion') setShowAsignarAccion(true)
        }, 150)
      }
    },
    [router]
  )

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const input = document.querySelector('[cmdk-input]') as HTMLInputElement
        input?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Group results by entity type for organized display
  const groupedResults = useMemo(() => {
    const groups = new Map<string, typeof results>()
    console.log('🔨 Building groups from results:', { results, isArray: Array.isArray(results), length: results?.length })
    results.forEach((result) => {
      if (!groups.has(result.entity_type)) {
        groups.set(result.entity_type, [])
      }
      groups.get(result.entity_type)!.push(result)
    })
    const groupsArray = Array.from(groups.entries())
    console.log('📊 Grouped results:', { groups: groupsArray, resultsCount: results.length, groupSizes: groupsArray.map(([k, v]) => `${k}: ${v.length}`) })
    return groups
  }, [results])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        {/* Command mode: disable cmdk's built-in filtering */}
        <Command
          filter={
            commandMode
              ? (value: string, search: string) => {
                  // In command mode, search without the "/" prefix
                  const cmdQuery = search.trimStart().startsWith('/')
                    ? search.slice(1).trim().toLowerCase()
                    : search.toLowerCase()
                  // Show all actions when query is empty, otherwise filter by value
                  return cmdQuery === '' ? 1 : Number(value.toLowerCase().includes(cmdQuery))
                }
              : undefined
          }
        >
          <CommandInput
          placeholder={
            commandMode
              ? 'Comando: crear, navegar...'
              : 'Buscar personas, tareas, acciones... (escribe "/" para comandos)'
          }
          value={query}
          onValueChange={setQuery}
          leftIcon={
            commandMode ? (
              <Zap className="mr-2 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            )
          }
          className={cn(
            'flex h-11 w-full rounded-md bg-transparent py-3',
            'text-sm outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Remove default focus ring - using dialog-level focus
            'focus:outline-none focus:ring-0'
          )}
        />

        <CommandList
          className={cn(
            'max-h-[calc(100vh-12rem)]',
            // Custom scrollbar styling
            '[&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30'
          )}
        >
          {/* Command mode - show actions */}
          {commandMode && (
            <>
              {filteredActions.length === 0 ? (
                <CommandEmpty>
                  <div className="text-center py-8 px-4">
                    <p className="text-sm text-muted-foreground">
                      No se encontraron comandos para "{query.slice(1).trim()}"
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  {/* Create actions group */}
                  {filteredActions.filter(a => a.type === 'create').length > 0 && (
                    <CommandGroup
                      heading="Crear"
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                        '[&_[cmdk-group-heading]]:text-muted-foreground',
                        '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
                      )}
                    >
                      {filteredActions.filter(a => a.type === 'create').map((action) => (
                        <SearchActionItem
                          key={action.id}
                          action={action}
                          onSelect={() => handleActionSelect(action)}
                        />
                      ))}
                    </CommandGroup>
                  )}

                  {/* Navigation actions group */}
                  {filteredActions.filter(a => a.type === 'navigation').length > 0 && (
                    <CommandGroup
                      heading="Navegar"
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                        '[&_[cmdk-group-heading]]:text-muted-foreground',
                        '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
                      )}
                    >
                      {filteredActions.filter(a => a.type === 'navigation').map((action) => (
                        <SearchActionItem
                          key={action.id}
                          action={action}
                          onSelect={() => handleActionSelect(action)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </>
          )}

          {/* Search mode - loading state */}
          {!commandMode && isLoading && query.length >= 2 && (
            <SearchSkeleton count={5} />
          )}

          {/* Search mode - error state */}
          {!commandMode && isError && (
            <CommandEmpty>
              <div className="text-center py-8 px-4">
                <p className="text-sm text-muted-foreground">{EMPTY_STATE_MESSAGES.error}</p>
              </div>
            </CommandEmpty>
          )}

          {/* Search mode - empty state (no results) */}
          {!commandMode && !isLoading && !isError && results.length === 0 && query.length >= 2 && (
            <CommandEmpty>
              <div className="text-center py-8 px-4">
                <p className="text-sm text-muted-foreground">
                  {EMPTY_STATE_MESSAGES.noResults} para "{query}"
                </p>
              </div>
            </CommandEmpty>
          )}

          {/* Idle state - show recent items */}
          {!commandMode && !isLoading && query.length === 0 && (
            <>
              {/* Recent items */}
              {recentItems.length > 0 && (
                <>
                  <CommandGroup
                    heading="Recientes"
                    className={cn(
                      '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
                      '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                      '[&_[cmdk-group-heading]]:text-muted-foreground',
                      '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
                    )}
                  >
                    {recentItems.map((item) => (
                      <SearchResultItem
                        key={item.entity_id}
                        result={{
                          entity_type: item.entity_type,
                          entity_id: item.entity_id,
                          title: item.title,
                          subtitle: `Visto ${getTimeAgo(item.viewed_at)}`,
                          route: item.route,
                          metadata: {},
                        }}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </CommandGroup>

                  <CommandSeparator />

                  {/* Quick actions preview */}
                  <CommandGroup
                    heading="Acciones"
                    className={cn(
                      '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
                      '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                      '[&_[cmdk-group-heading]]:text-muted-foreground',
                      '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
                    )}
                  >
                    <CommandItem
                      value="command-mode-trigger"
                      onSelect={() => setQuery('/ ')}
                      className={cn(
                        'gap-3 px-4 py-3',
                        '!cursor-pointer',
                        'rounded-md mx-2 my-1',
                        'text-muted-foreground text-sm'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                      <span>Escribe "/" para comandos rápidos</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {/* No recent items - show idle message */}
              {recentItems.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-8 px-4">
                    <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {EMPTY_STATE_MESSAGES.idle}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Escribe "/" para ver acciones rápidas
                    </p>
                  </div>
                </CommandEmpty>
              )}
            </>
          )}

          {/* Search results grouped by entity type */}
          {!commandMode && !isLoading && !isError && results.length > 0 && (
            <>
              {Array.from(groupedResults.entries()).map(([entityType, items], index) => (
                <React.Fragment key={entityType}>
                  {/* Add separator between groups (but not before first group) */}
                  {index > 0 && <CommandSeparator />}

                  <CommandGroup
                    heading={ENTITY_CONFIG[entityType as keyof typeof ENTITY_CONFIG]?.label}
                    className={cn(
                      // Enhanced group styling
                      '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
                      '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                      '[&_[cmdk-group-heading]]:text-muted-foreground',
                      '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
                      // Letter spacing for refinement
                      '[&_[cmdk-group-heading]]:tracking-wide'
                    )}
                  >
                    {items.map((result) => (
                      <SearchResultItem
                        key={result.entity_id}
                        result={result}
                        onSelect={() => handleSelect(result)}
                      />
                    ))}
                  </CommandGroup>
                </React.Fragment>
              ))}

              {/* Keyboard shortcuts footer - rendered after results */}
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-2',
                  'border-t text-xs text-muted-foreground',
                  'bg-muted/30',
                  'sticky bottom-0',
                  'mt-2'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd
                      className={cn(
                        'px-1.5 py-0.5 rounded',
                        'bg-background border',
                        'font-mono text-[10px]'
                      )}
                    >
                      {KEYBOARD_SHORTCUTS.navigate}
                    </kbd>
                    <span>navegar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd
                      className={cn(
                        'px-1.5 py-0.5 rounded',
                        'bg-background border',
                        'font-mono text-[10px]'
                      )}
                    >
                      {KEYBOARD_SHORTCUTS.select}
                    </kbd>
                    <span>seleccionar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd
                      className={cn(
                        'px-1.5 py-0.5 rounded',
                        'bg-background border',
                        'font-mono text-[10px]'
                      )}
                    >
                      esc
                    </kbd>
                    <span>cerrar</span>
                  </span>
                </div>
                <span className="text-[10px] opacity-70">
                  {results.length > 0 ? `${results.length} resultados` : ''}
                </span>
              </div>
            </>
          )}
        </CommandList>
        </Command>
      </CommandDialog>

      {/* Entity Creation Sheets */}
      <NewPersonSheet
        open={showNewPerson}
        onOpenChange={setShowNewPerson}
      />
      <NewCompanySheet
        open={showNewCompany}
        onOpenChange={setShowNewCompany}
      />
      <NewTareaSheet
        open={showNewTarea}
        onOpenChange={setShowNewTarea}
      />
      <NewDocComercialSheet
        open={showNewDocComercial}
        onOpenChange={setShowNewDocComercial}
      />
      <AsignarAccionSheet
        open={showAsignarAccion}
        onOpenChange={setShowAsignarAccion}
      />
    </>
  )
}

/**
 * Get a human-readable time ago string
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'ahora mismo'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} días`
  return `hace ${Math.floor(seconds / 604800)} semanas`
}
