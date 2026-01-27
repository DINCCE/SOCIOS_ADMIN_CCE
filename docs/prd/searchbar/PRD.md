# Global Search Command Palette - PRD

**Project:** SOCIOS_ADMIN CRM
**Feature:** Global Search Command Palette (Spotlight-style)
**Version:** 1.0
**Last Updated:** 2025-01-27

---

## Executive Summary

Build a keyboard-driven global search interface (Cmd+K / Alt+K) inspired by Linear, Notion, and Attio. The command palette will search across all entities in the CRM and provide quick actions for creating new records.

**Design Philosophy:** Minimalistic, fast, keyboard-first, visually refined.

---

## Table of Contents

1. [Product Requirements](#1-product-requirements)
2. [Design Specifications](#2-design-specifications)
3. [Technical Architecture](#3-technical-architecture)
4. [Implementation Phases](#4-implementation-phases)
5. [AI Developer Instructions](#5-ai-developer-instructions)
6. [Success Criteria](#6-success-criteria)

---

## 1. Product Requirements

### 1.1 Core Functionality

| Requirement | Description | Priority |
|-------------|-------------|----------|
| **Global Search** | Search across all entities from one interface | P0 |
| **Keyboard Shortcut** | Open with Cmd+K (Mac) / Alt+K (Windows/Linux) | P0 |
| **Entity Navigation** | Navigate directly to detail pages from search results | P0 |
| **Quick Actions** | Execute common actions (create, view, edit) from palette | P0 |
| **Fuzzy Matching** | Find results even with typos or partial matches | P1 |
| **Recent History** | Show recently viewed items | P1 |
| **Entity Filtering** | Filter results by entity type | P2 |

### 1.2 Searchable Entities

| Entity | Route | Icon | Search Fields |
|--------|-------|------|---------------|
| Personas | `/admin/socios/personas/[id]` | User | nombre_completo, num_documento, email_principal |
| Empresas | `/admin/socios/personas/[id]` | Building | razon_social, codigo_bp |
| Tareas | *(future)* | CheckCircle | titulo, codigo_tarea, descripcion |
| Acciones | `/admin/procesos/acciones/[id]` | Badge | codigo_accion, propietario_nombre |
| Documentos | *(future)* | File | codigo, titulo, solicitante_nombre |

### 1.3 Quick Actions

| Action | Type | Behavior |
|--------|------|----------|
| Crear Persona | Command | Opens drawer/modal to create new person |
| Crear Empresa | Command | Opens drawer/modal to create new company |
| Crear Tarea | Command | Opens drawer/modal to create new task |
| Ver Mis Tareas | Navigation | Redirects to `/admin/mis-tareas` |
| Ver Personas | Navigation | Redirects to `/admin/socios/personas` |
| Configuración | Navigation | Redirects to `/admin/settings` |

---

## 2. Design Specifications

### 2.1 Visual Design Principles

**Inspiration:** Linear, Notion, Attio

**Key Characteristics:**
- Ultra-minimal interface
- Subtle glassmorphism (backdrop blur)
- Smooth, purposeful animations
- High contrast for readability
- Entity type color coding
- Keyboard shortcuts visible

### 2.2 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐    │
│  │  🔍 Search...              ⌘K                   │    │  ← Fixed header
│  ├─────────────────────────────────────────────────┤    │
│  │                                                   │    │
│  │  Recent                                           │    │
│  │  ┌───────────────────────────────────────────┐   │    │
│  │  │ 👤 Juan Pérez        persona              │   │    │
│  │  │    12345678                              │   │    │
│  │  └───────────────────────────────────────────┘   │    │
│  │  ┌───────────────────────────────────────────┐   │    │
│  │  │ ✅ Tarea importante  tarea                │   │    │
│  │  │    Vence hoy                              │   │    │
│  │  └───────────────────────────────────────────┘   │    │
│  │                                                   │    │
│  │  Actions                                    ↑↓   │    │  ← Scrollable
│  │  ┌───────────────────────────────────────────┐   │    │
│  │  │ + Crear Persona                            │   │    │
│  │  └───────────────────────────────────────────┘   │    │
│  │  ┌───────────────────────────────────────────┐   │    │
│  │  │ + Crear Tarea                              │   │    │
│  │  └───────────────────────────────────────────┘   │    │
│  │                                                   │    │
│  └─────────────────────────────────────────────────┘    │
│                    ↓ 5 of 12 ─                           │  ← Footer
└─────────────────────────────────────────────────────────┘
```

### 2.3 Component States

| State | Description |
|-------|-------------|
| **Idle** | Shows recent items + quick actions |
| **Searching** | Shows loading skeleton |
| **Results** | Shows grouped results by entity |
| **Empty** | Shows "No results found" + quick actions |
| **Error** | Shows error message + retry option |

### 2.4 Animation Specifications

```css
/* Entrance Animation */
.dialog-enter {
  animation: command-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes command-fade-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Item Hover Animation */
.item-hover {
  transition: background-color 0.15s ease, transform 0.1s ease;
}

/* Selection Pulse */
.selection-pulse {
  animation: subtle-pulse 2s infinite;
}

@keyframes subtle-pulse {
  0%, 100% { box-shadow: 0 0 0 0px var(--ring); }
  50% { box-shadow: 0 0 0 2px var(--ring); }
}
```

### 2.5 Theming

The command palette must respect all existing themes:
- Default (light/dark)
- capuccino
- retro
- claude
- doom-64
- grafito
- cielo
- neo-brutal
- jardin
- mandarina
- country
- country-max

**CSS Variables to Use:**
- `--background` (dialog background)
- `--foreground` (text color)
- `--muted` (item default state)
- `--accent` (selected/hover state)
- `--border` (dialog border)
- `--ring` (focus ring)

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Component | Technology |
|-----------|------------|
| **UI Component** | Radix UI Dialog + cmdk |
| **State Management** | React hooks (useState, useCallback) |
| **Data Fetching** | TanStack Query (useQuery) |
| **Database** | Supabase (PostgreSQL) |
| **Routing** | Next.js App Router (useRouter) |
| **Keyboard Events** | React hooks (useEffect) |
| **Fuzzy Search** | Client-side: fuse.js OR Server-side: pg_trgm |

### 3.2 Database Schema (New RPC Function)

**IMPORTANT:** Use Supabase MCP tools to create the database function.

```sql
-- File: docs/prd/searchbar/migrations/001_create_search_global_rpc.sql

CREATE OR REPLACE FUNCTION search_global(
  p_query TEXT,
  p_org_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  subtitle TEXT,
  route TEXT,
  metadata JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search_term TEXT := '%' || LOWER(p_query) || '%';
BEGIN
  -- Search in Personas/Empresas (dm_actores via v_actores_org)
  RETURN QUERY
  SELECT
    'actor'::TEXT as entity_type,
    a.id as entity_id,
    COALESCE(a.nombre_completo, a.razon_social, 'Sin nombre') as title,
    COALESCE(
      a.num_documento,
      a.codigo_bp,
      a.email_principal
    ) as subtitle,
    '/admin/socios/personas/' || a.id::TEXT as route,
    jsonb_build_object(
      'tipo_actor', a.tipo_actor,
      'tags', a.tags,
      'estado', a.estado
    ) as metadata
  FROM v_actores_org a
  WHERE a.organizacion_id = p_org_id
    AND a.eliminado_en IS NULL
    AND (
      LOWER(a.nombre_completo) LIKE v_search_term
      OR LOWER(a.razon_social) LIKE v_search_term
      OR LOWER(a.num_documento) LIKE v_search_term
      OR LOWER(a.codigo_bp) LIKE v_search_term
      OR LOWER(a.email_principal) LIKE v_search_term
    )
  LIMIT p_limit;

  -- Search in Tareas (tr_tareas via v_tareas_org)
  RETURN QUERY
  SELECT
    'tarea'::TEXT as entity_type,
    t.id as entity_id,
    t.titulo as title,
    COALESCE(
      t.codigo_tarea,
      t.asignado_nombre_completo,
      'Sin asignar'
    ) as subtitle,
    '/admin/procesos/tareas/' || t.id::TEXT as route,
    jsonb_build_object(
      'estado', t.estado,
      'prioridad', t.prioridad,
      'fecha_vencimiento', t.fecha_vencimiento,
      'tags', t.tags
    ) as metadata
  FROM v_tareas_org t
  WHERE t.organizacion_id = p_org_id
    AND t.eliminado_en IS NULL
    AND (
      LOWER(t.titulo) LIKE v_search_term
      OR LOWER(t.codigo_tarea) LIKE v_search_term
      OR LOWER(t.descripcion) LIKE v_search_term
    )
  LIMIT p_limit;

  -- Search in Acciones (dm_acciones via v_acciones_org)
  RETURN QUERY
  SELECT
    'accion'::TEXT as entity_type,
    acc.id as entity_id,
    acc.codigo_accion as title,
    acc.propietario_nombre_completo as subtitle,
    '/admin/procesos/acciones/' || acc.id::TEXT as route,
    jsonb_build_object(
      'estado', acc.estado,
      'organizacion', acc.organizacion_nombre
    ) as metadata
  FROM v_acciones_org acc
  WHERE acc.organizacion_id = p_org_id
    AND acc.eliminado_en IS NULL
    AND (
      LOWER(acc.codigo_accion) LIKE v_search_term
      OR LOWER(acc.propietario_nombre_completo) LIKE v_search_term
    )
  LIMIT p_limit;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_global(TEXT, UUID, INTEGER) TO authenticated;
```

### 3.3 File Structure

```
docs/prd/searchbar/
├── PRD.md                           (this file)
├── migrations/
│   ├── 001_create_search_global_rpc.sql
│   └── 002_add_recently_viewed_table.sql
├── examples/
│   └── search-response-example.json
└── ai-instructions.md               (detailed AI guide)

app/
├── components/
│   └── search/
│       ├── global-search-dialog.tsx        (main component)
│       ├── search-result-item.tsx          (result item component)
│       ├── search-action-item.tsx          (action item component)
│       ├── search-skeleton.tsx             (loading skeleton)
│       └── use-global-search.ts            (custom hook)
├── hooks/
│   └── use-cmd-k.ts                       (keyboard shortcut hook)
└── lib/
    └── search/
        ├── types.ts                        (TypeScript types)
        ├── constants.ts                    (entity config, icons)
        └── utils.ts                        (search utilities)
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Core Search)
**Goal:** Basic search functionality with keyboard navigation

**Deliverables:**
1. Database RPC function `search_global()`
2. `useGlobalSearch` hook
3. `GlobalSearchDialog` component with cmdk
4. Keyboard shortcut (Cmd+K / Alt+K)
5. Basic result display

**Acceptance Criteria:**
- [ ] Opens with Cmd+K / Alt+K
- [ ] Searches personas, empresas, acciones
- [ ] Navigate results with arrow keys
- [ ] Press Enter to navigate to detail page
- [ ] Press Esc to close
- [ ] Closes when clicking outside

**Estimated Time:** 4-6 hours

---

### Phase 2: Enhanced Search (All Entities)
**Goal:** Complete entity coverage + better UX

**Deliverables:**
1. Add tareas to search RPC
2. Add documentos to search RPC
3. Entity type icons
4. Result grouping by entity type
5. Empty state design
6. Loading skeleton

**Acceptance Criteria:**
- [ ] All 5 entities searchable
- [ ] Results grouped by type (Personas, Tareas, etc.)
- [ ] Each result shows appropriate icon
- [ ] Empty state shows quick actions
- [ ] Loading state shows skeleton

**Estimated Time:** 3-4 hours

---

### Phase 3: Quick Actions
**Goal:** Command palette for common actions

**Deliverables:**
1. Action command structure
2. "Create" actions (Persona, Empresa, Tarea)
3. Navigation actions (Mis Tareas, Settings)
4. Action execution (open modals/drawers)
5. Action item styling

**Acceptance Criteria:**
- [ ] Type ">" to enter command mode
- [ ] "Crear Persona" opens create drawer
- [ ] "Crear Tarea" opens create drawer
- [ ] Actions work with keyboard
- [ ] Actions visually distinct from search results

**Estimated Time:** 3-4 hours

---

### Phase 4: Polish & Performance
**Goal:** Production-ready quality

**Deliverables:**
1. Debounced search (300ms)
2. Recent items history
3. Keyboard shortcuts display
4. Search result highlighting
5. Theme integration testing
6. Error handling

**Acceptance Criteria:**
- [ ] Search debounces properly
- [ ] Shows last 5 recent items
- [ ] Keyboard shortcuts visible
- [ ] Works in all 12 themes
- [ ] Handles errors gracefully
- [ ] Performance < 200ms for queries

**Estimated Time:** 4-5 hours

---

### Phase 5: Advanced Features (Future)
**Goal:** Enhanced capabilities

**Deliverables:**
1. Fuzzy matching with fuse.js
2. Entity type filters (Shift+1, Shift+2, etc.)
3. Search analytics
4. Advanced filters (by status, date, etc.)
5. Search preferences

**Estimated Time:** 6-8 hours

---

## 5. AI Developer Instructions

### 5.1 Getting Started

**Step 1: Apply Database Migration**

Use Supabase MCP tool `mcp__supabase__apply_migration` with the SQL file:
```
docs/prd/searchbar/migrations/001_create_search_global_rpc.sql
```

**Step 2: Create Core Types**

Create `app/lib/search/types.ts`:

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

export interface SearchAction {
  id: string
  type: 'navigation' | 'create'
  label: string
  icon: string // Lucide icon name
  shortcut?: string
  action: () => void
}

export interface SearchResponse {
  results: SearchResult[]
  actions: SearchAction[]
}
```

**Step 3: Create Entity Configuration**

Create `app/lib/search/constants.ts`:

```typescript
import { User, Building, CheckCircle, Badge, File } from 'lucide-react'
import type { EntityType } from './types'

export const ENTITY_CONFIG: Record<EntityType, {
  icon: typeof User
  color: string
  label: string
  singular: string
}> = {
  actor: {
    icon: User,
    color: 'text-blue-600',
    label: 'Personas y Empresas',
    singular: 'Persona'
  },
  tarea: {
    icon: CheckCircle,
    color: 'text-amber-600',
    label: 'Tareas',
    singular: 'Tarea'
  },
  accion: {
    icon: Badge,
    color: 'text-purple-600',
    label: 'Acciones',
    singular: 'Acción'
  },
  documento: {
    icon: File,
    color: 'text-green-600',
    label: 'Documentos',
    singular: 'Documento'
  }
}
```

### 5.2 Building the Component

**Use Supabase MCP for All Database Operations:**

❌ **NEVER:** Use Supabase CLI commands
✅ **ALWAYS:** Use Supabase MCP tools:
- `mcp__supabase__execute_sql` - Test queries
- `mcp__supabase__apply_migration` - Apply schema changes
- `mcp__supabase__list_tables` - Explore schema
- `mcp__supabase__get_advisors` - Check performance

**Component Implementation Order:**

1. **First:** Create `useGlobalSearch` hook
   - Use TanStack Query's `useQuery`
   - Call Supabase RPC function
   - Handle loading/error states

2. **Second:** Create `SearchResultItem` component
   - Display title, subtitle, icon
   - Handle hover/focus states
   - Support keyboard navigation

3. **Third:** Create `GlobalSearchDialog` component
   - Wrap cmdk CommandDialog
   - Add keyboard shortcut listener
   - Integrate search hook
   - Handle navigation

4. **Fourth:** Create `useCmdK` hook
   - Listen for Cmd+K / Alt+K
   - Prevent default browser behavior
   - Toggle dialog state

### 5.3 Coding Guidelines

**DO:**
- ✅ Use existing theme variables from `globals.css`
- ✅ Follow the project's vertical slice architecture
- ✅ Use TanStack Query for data fetching
- ✅ Add proper TypeScript types
- ✅ Handle loading and error states
- ✅ Test keyboard navigation
- ✅ Use Supabase MCP for database work

**DON'T:**
- ❌ Use any AI-default fonts (Inter is already in project)
- ❌ Create new database tables without migration
- ❌ Hardcode organization ID (get from auth)
- ❌ Ignore dark mode/theme switching
- ❌ Use inline styles (use Tailwind classes)

### 5.4 Testing Checklist

Before marking a phase complete, test:

- [ ] Opens with Cmd+K (Mac) and Alt+K (Windows)
- [ ] Closes with Escape key
- [ ] Navigate results with arrow keys
- [ ] Select with Enter key
- [ ] Click outside closes dialog
- [ ] Search works in all themes
- [ ] Empty state shows correctly
- [ ] Loading state shows correctly
- [ ] Errors display user-friendly message
- [ ] Navigation goes to correct route
- [ ] RLS policies enforced (test with different users)

### 5.5 Example Code Structure

```typescript
// app/components/search/use-global-search.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useGlobalSearch(query: string, orgId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['global-search', query, orgId],
    queryFn: async () => {
      if (!query.trim()) return []

      const { data, error } = await supabase.rpc('search_global', {
        p_query: query,
        p_org_id: orgId,
        p_limit: 20
      })

      if (error) throw error
      return data
    },
    enabled: query.length >= 2, // Only search after 2 chars
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

---

## 6. Success Criteria

### 6.1 User Experience

| Metric | Target |
|--------|--------|
| Time to open | < 100ms |
| Search latency | < 200ms |
| Time to navigate | < 500ms (from Cmd+K to detail page) |
| Keyboard support | 100% of actions keyboard-accessible |
| Theme support | Works in all 12 themes |

### 6.2 Technical Quality

| Metric | Target |
|--------|--------|
| Type coverage | 100% TypeScript |
| Test coverage | > 80% (critical paths) |
| Bundle size impact | < 15KB gzipped |
| Accessibility | WCAG 2.1 AA compliant |
| Performance | Lighthouse score > 90 |

### 6.3 Feature Completeness

- [ ] Phase 1: Core Search ✅
- [ ] Phase 2: Enhanced Search ✅
- [ ] Phase 3: Quick Actions ✅
- [ ] Phase 4: Polish & Performance ✅
- [ ] Phase 5: Advanced Features (optional)

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Alt+K` | Open search |
| `Esc` | Close search |
| `↑` / `↓` | Navigate results |
| `Enter` | Select result |
| `>` | Enter command mode |
| `Shift+1` | Filter by Personas |
| `Shift+2` | Filter by Tareas |
| `Shift+3` | Filter by Acciones |
| `Shift+4` | Filter by Documentos |

## Appendix B: Entity Route Mapping

| Entity | Detail Route | Status |
|--------|--------------|--------|
| Persona | `/admin/socios/personas/[id]` | ✅ Exists |
| Empresa | `/admin/socios/personas/[id]` | ✅ Exists |
| Tarea | *(TBD)* | ⏳ Future |
| Acción | `/admin/procesos/acciones/[id]` | ✅ Exists |
| Documento | *(TBD)* | ⏳ Future |

## Appendix C: Design References

- **Linear:** https://linear.app
- **Notion:** https://notion.so
- **Attio:** https://attio.com
- **cmdk docs:** https://cmdk.paco.me

---

**Document Status:** 🟢 Ready for Implementation
**Next Step:** Begin Phase 1 - Foundation
