# AI Developer Instructions - Global Search Command Palette

**Purpose:** This document provides detailed, step-by-step instructions for an AI developer implementing the Global Search Command Palette feature.

**Last Updated:** 2025-01-27

---

## Quick Start Checklist

Before starting implementation, ensure you have:

- [ ] Read the complete PRD document
- [ ] Reviewed the existing codebase structure
- [ ] Understood the theme system (12 themes)
- [ ] Located existing components (cmdk, command, button, etc.)
- [ ] Reviewed Supabase MCP tools availability

---

## Step-by-Step Implementation Guide

### Phase 1: Foundation (Core Search)

#### Step 1.1: Apply Database Migration

**CRITICAL:** Use Supabase MCP tool - NOT the CLI

```bash
# In your MCP tool, use:
mcp__supabase__apply_migration
```

With the file: `docs/prd/searchbar/migrations/001_create_search_global_rpc.sql`

**Verification:**
```bash
# Test the function works
mcp__supabase__execute_sql
SELECT * FROM search_global('test', '<org-id-uuid>', 5);
```

#### Step 1.2: Create TypeScript Types

**File:** `app/lib/search/types.ts`

```typescript
export type EntityType = 'actor' | 'tarea' | 'accion' | 'documento'

export interface SearchResult {
  entity_type: EntityType
  entity_id: string
  title: string
  subtitle: string
  route: string
  metadata: Record<string, unknown>
}

export interface SearchResponse {
  results: SearchResult[]
}

export interface SearchHookOptions {
  query: string
  orgId: string
  enabled?: boolean
  limit?: number
}
```

#### Step 1.3: Create Entity Configuration

**File:** `app/lib/search/constants.ts`

```typescript
import { User, Building2, CheckCircle2, Badge, FileText } from 'lucide-react'
import type { EntityType } from './types'
import type { LucideIcon } from 'lucide-react'

export interface EntityConfig {
  icon: LucideIcon
  label: string
  singular: string
  color: string
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  actor: {
    icon: User,
    label: 'Personas y Empresas',
    singular: 'Persona',
    color: 'text-blue-600 dark:text-blue-400',
  },
  tarea: {
    icon: CheckCircle2,
    label: 'Tareas',
    singular: 'Tarea',
    color: 'text-amber-600 dark:text-amber-400',
  },
  accion: {
    icon: Badge,
    label: 'Acciones',
    singular: 'Acción',
    color: 'text-purple-600 dark:text-purple-400',
  },
  documento: {
    icon: FileText,
    label: 'Documentos',
    singular: 'Documento',
    color: 'text-green-600 dark:text-green-400',
  },
}

export const SEARCH_MIN_LENGTH = 2
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_LIMIT = 20
```

#### Step 1.4: Create Search Hook

**File:** `app/components/search/use-global-search.ts`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SearchResult } from '@/lib/search/types'
import { SEARCH_MIN_LENGTH, SEARCH_DEBOUNCE_MS, SEARCH_LIMIT } from '@/lib/search/constants'

interface UseGlobalSearchOptions {
  query: string
  orgId: string | null
  enabled?: boolean
}

export function useGlobalSearch({ query, orgId, enabled = true }: UseGlobalSearchOptions) {
  const supabase = createClient()

  return useQuery<SearchResult[]>({
    queryKey: ['global-search', query, orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID is required')

      const { data, error } = await supabase.rpc('search_global', {
        p_query: query,
        p_org_id: orgId,
        p_limit: SEARCH_LIMIT,
      })

      if (error) {
        console.error('Search error:', error)
        throw error
      }

      return data || []
    },
    enabled: enabled && query.length >= SEARCH_MIN_LENGTH && !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
  })
}
```

#### Step 1.5: Create Keyboard Shortcut Hook

**File:** `app/hooks/use-cmd-k.ts`

```typescript
'use client'

import { useEffect } from 'react'

export function useCmdK(callback: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        callback()
      }

      // Alt+K as alternative
      if (e.altKey && e.key === 'k') {
        e.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [callback, enabled])
}
```

#### Step 1.6: Create Search Result Item Component

**File:** `app/components/search/search-result-item.tsx`

```typescript
'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ENTITY_CONFIG } from '@/lib/search/constants'
import type { SearchResult } from '@/lib/search/types'

interface SearchResultItemProps {
  result: SearchResult
  isSelected?: boolean
  onSelect: () => void
}

export function SearchResultItem({ result, isSelected, onSelect }: SearchResultItemProps) {
  const config = ENTITY_CONFIG[result.entity_type]
  const Icon = config.icon

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        // Base styles
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-all duration-150',
        // Interactive states
        'hover:bg-accent hover:translate-x-0.5',
        // Selected state
        isSelected && 'bg-accent',
        // Focus ring (for keyboard navigation)
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0', config.color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Title */}
          <span className="font-medium text-sm text-foreground truncate">
            {result.title}
          </span>
        </div>

        {/* Subtitle */}
        {result.subtitle && (
          <span className="text-xs text-muted-foreground truncate block">
            {result.subtitle}
          </span>
        )}
      </div>

      {/* Chevron indicator */}
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  )
}
```

#### Step 1.7: Create Main Dialog Component

**File:** `app/components/search/global-search-dialog.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { useCmdK } from '@/hooks/use-cmd-k'
import { useGlobalSearch } from './use-global-search'
import { SearchResultItem } from './search-result-item'
import { Spinner } from '@/components/ui/spinner'
import { useOrganization } from '@/contexts/organization-context' // or wherever you get orgId

export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { organizationId } = useOrganization() // Adjust to your auth context

  const { data: results = [], isLoading, isError } = useGlobalSearch({
    query,
    orgId: organizationId,
    enabled: open,
  })

  // Toggle dialog
  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  // Register keyboard shortcut
  useCmdK(toggle)

  // Handle selection
  const handleSelect = useCallback((route: string) => {
    router.push(route)
    setOpen(false)
    setQuery('')
  }, [router])

  // Group results by entity type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.entity_type]) {
      acc[result.entity_type] = []
    }
    acc[result.entity_type].push(result)
    return acc
  }, {} as Record<string, typeof results>)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar... (Ctrl+K)"
        value={query}
        onValueChange={setQuery}
      />

      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        )}

        {isError && (
          <CommandEmpty>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Error al buscar. Intenta de nuevo.
              </p>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && !isError && results.length === 0 && query.length >= 2 && (
          <CommandEmpty>
            No se encontraron resultados para "{query}"
          </CommandEmpty>
        )}

        {!isLoading && !isError && results.length > 0 && (
          <>
            {Object.entries(groupedResults).map(([entityType, items]) => (
              <CommandGroup
                key={entityType}
                heading={ENTITY_CONFIG[entityType as keyof typeof ENTITY_CONFIG]?.label}
              >
                {items.map((result) => (
                  <SearchResultItem
                    key={result.entity_id}
                    result={result}
                    onSelect={() => handleSelect(result.route)}
                  />
                ))}
              </CommandGroup>
            ))}
          </>
        )}

        {query.length === 0 && (
          <CommandEmpty>
            Escribe para buscar en personas, tareas, acciones y más...
          </CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  )
}
```

#### Step 1.8: Add to Layout

**File:** `app/layout.tsx` or wherever your main layout is

```typescript
import { GlobalSearchDialog } from '@/components/search/global-search-dialog'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <GlobalSearchDialog />
      </body>
    </html>
  )
}
```

---

### Phase 2: Enhanced Search (All Entities)

#### Step 2.1: Add Quick Actions

**File:** `app/lib/search/actions.ts`

```typescript
import {
  UserPlus,
  Building2,
  CheckCircle2,
  LayoutList,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface SearchAction {
  id: string
  type: 'navigation' | 'create'
  label: string
  icon: LucideIcon
  shortcut?: string
  route?: string
  action?: () => void
}

export const SEARCH_ACTIONS: SearchAction[] = [
  {
    id: 'create-persona',
    type: 'create',
    label: 'Crear Persona',
    icon: UserPlus,
    shortcut: '> crear persona',
  },
  {
    id: 'create-empresa',
    type: 'create',
    label: 'Crear Empresa',
    icon: Building2,
    shortcut: '> crear empresa',
  },
  {
    id: 'create-tarea',
    type: 'create',
    label: 'Crear Tarea',
    icon: CheckCircle2,
    shortcut: '> crear tarea',
  },
  {
    id: 'nav-mis-tareas',
    type: 'navigation',
    label: 'Ver Mis Tareas',
    icon: LayoutList,
    shortcut: '> mis tareas',
    route: '/admin/mis-tareas',
  },
  {
    id: 'nav-personas',
    type: 'navigation',
    label: 'Ver Personas',
    icon: Users,
    shortcut: '> personas',
    route: '/admin/socios/personas',
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    label: 'Configuración',
    icon: Settings,
    shortcut: '> configuración',
    route: '/admin/settings',
  },
]
```

#### Step 2.2: Create Action Item Component

**File:** `app/components/search/search-action-item.tsx`

```typescript
'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchAction } from '@/lib/search/actions'

interface SearchActionItemProps {
  action: SearchAction
  isSelected?: boolean
  onSelect: () => void
}

export function SearchActionItem({ action, isSelected, onSelect }: SearchActionItemProps) {
  const Icon = action.icon

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-all duration-150',
        'hover:bg-accent hover:translate-x-0.5',
        isSelected && 'bg-accent'
      )}
    >
      <div className="flex-shrink-0 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>

      <span className="font-medium text-sm text-foreground">
        {action.label}
      </span>

      {action.shortcut && (
        <span className="ml-auto text-xs text-muted-foreground">
          {action.shortcut}
        </span>
      )}

      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
    </div>
  )
}
```

---

## Important Notes for AI Developer

### DO's ✅

1. **Always use Supabase MCP tools** for database operations
2. **Follow the existing theme system** - use CSS variables from `globals.css`
3. **Respect the vertical slice architecture** - keep search components together
4. **Use TanStack Query** for all data fetching
5. **Test in multiple themes** - at least default, capuccino, retro, and doom-64
6. **Handle loading and error states** gracefully
7. **Support keyboard navigation** throughout
8. **Make it responsive** - works on mobile and desktop

### DON'Ts ❌

1. **Don't use Supabase CLI** - always use MCP tools
2. **Don't hardcode organization ID** - get from auth context
3. **Don't ignore RLS policies** - they must be enforced
4. **Don't use inline styles** - use Tailwind classes
5. **Don't create new database tables** without migrations
6. **Don't break existing functionality** - test thoroughly
7. **Don't add unnecessary dependencies** - use what's already installed
8. **Don't ignore accessibility** - use proper ARIA attributes

### Testing Checklist

Before moving to next phase:

- [ ] Opens with Cmd+K (Mac) and Ctrl+K/Alt+K (Windows)
- [ ] Closes with Escape key
- [ ] Arrow keys navigate results
- [ ] Enter key selects result
- [ ] Click outside closes dialog
- [ ] Search works in all 12 themes
- [ ] Empty state displays correctly
- [ ] Loading state shows spinner
- [ ] Errors show user-friendly message
- [ ] Navigation routes correctly
- [ ] RLS policies enforced

### Debugging Tips

1. **Search not working:**
   - Check orgId is passed correctly
   - Verify RPC function exists: `mcp__supabase__execute_sql` → `SELECT proname FROM pg_proc WHERE proname = 'search_global'`
   - Check browser console for errors

2. **Keyboard shortcut not working:**
   - Check if another element is capturing the event
   - Verify useCmdK hook is mounted
   - Test with both Ctrl+K and Alt+K

3. **Theme issues:**
   - Ensure CSS variables are used, not hardcoded colors
   - Test in dark mode for each theme

4. **Performance issues:**
   - Check if debouncing is working
   - Verify database indexes on searched columns
   - Use `mcp__supabase__get_advisors` to check for optimization tips

---

## Supabase MCP Tool Reference

### Apply Migration
```typescript
// Use this tool to apply the SQL migration file
Tool: mcp__supabase__apply_migration
Parameters:
  - migration_content: (content of .sql file)
```

### Execute SQL
```typescript
// Use this tool to test queries or run ad-hoc SQL
Tool: mcp__supabase__execute_sql
Parameters:
  - query: "SELECT * FROM search_global('juan', 'org-uuid', 5)"
```

### List Tables
```typescript
// Use this to explore the database schema
Tool: mcp__supabase__list_tables
```

### Get Advisors
```typescript
// Use this to check for performance/security issues
Tool: mcp__supabase__get_advisors
```

---

## Next Steps

After completing Phase 1 and 2:

1. ✅ Test thoroughly in all themes
2. ✅ Add recent items history (Phase 4)
3. ✅ Implement command mode with ">" (Phase 3)
4. ✅ Add keyboard shortcuts display
5. ✅ Polish animations and transitions

**Remember:** Build incrementally, test often, and use Supabase MCP for all database operations!
