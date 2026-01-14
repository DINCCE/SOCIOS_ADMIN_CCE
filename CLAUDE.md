# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Guidelines

### Database Access

**ALWAYS use Supabase MCP** for database operations, NOT CLI commands:

- Use `mcp__supabase__execute_sql` for raw SQL queries
- Use `mcp__supabase__list_tables`, `mcp__supabase__list_extensions` for inspection
- Use `mcp__supabase__apply_migration` for DDL/schema changes
- NEVER use `npx supabase db push` or other CLI database commands directly

### Database Documentation Verification

**ALWAYS verify and update docs/database/ files when making database changes**:

- Before performing database operations, check [docs/database/](docs/database/) for existing documentation
- Use Supabase MCP tools to verify current database state matches documentation
- Update relevant docs after schema changes:
  - [docs/database/API.md](docs/database/API.md) - CRUD endpoints and RPC functions
  - [docs/database/TABLES.md](docs/database/TABLES.md) - Table schemas
  - [docs/database/VIEWS.md](docs/database/VIEWS.md) - Database views and optimized queries
  - [docs/database/FUNCTIONS.md](docs/database/FUNCTIONS.md) - RPC functions
  - [docs/database/RLS.md](docs/database/RLS.md) - Security policies
  - [docs/database/OVERVIEW.md](docs/database/OVERVIEW.md) - Architecture overview
- Documentation is the single source of truth for database operations

### Basic CRUD Operations

**DO NOT create custom APIs or functions for basic CRUD**. Supabase provides auto-generated REST endpoints via PostgREST:

- All tables have automatic CRUD endpoints (SELECT, INSERT, UPDATE, DELETE)
- Use these endpoints directly via the Supabase client
- Reference [docs/database/API.md](docs/database/API.md) for complete API documentation
- Only create custom RPC functions for complex business logic that cannot be expressed as simple CRUD
- When creating new RPC functions, document them in [docs/database/FUNCTIONS.md](docs/database/FUNCTIONS.md)

### Library Documentation

**ALWAYS use Context7 MCP** when you need library/API documentation:

- For any library documentation, code examples, setup steps, or configuration
- Call `mcp__context7__resolve-library-id` first to get the library ID
- Then call `mcp__context7__query-docs` with the library ID and question
- Do this proactively without waiting for explicit user request

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server (default: localhost:3000)

# Code Quality
npm run lint            # Run ESLint
npx tsc --noEmit        # TypeScript type check (no build output)
npm run test            # Run Vitest tests
npm run build           # Production build

# Database
npx supabase db push    # Apply migrations to local database
npx supabase db diff    # Show migration diff
npx supabase gen types typescript --local  # Generate DB types to types_db.ts
```

## Architecture Overview

This is a Next.js 16 application for managing business partners (personas and empresas), relationships, opportunities, tasks, and shares. The codebase uses a vertical slice architecture with Supabase as the backend.

### Core Database Pattern: CTI (Corporate-Trade-Item)

The data model follows a three-tier hierarchy:

1. **dm_actores** (Corporate tier) - Master table containing both personas and empresas
   - Unified `dm_actores` table with `tipo_actor` enum ('persona' | 'empresa')
   - Stores all core identity, contact, and profile data
   - Uses `organizacion_id` for multi-tenancy
   - Soft deletes via `eliminado_en` timestamp

2. **tr_doc_comercial** (Trade tier) - Opportunities, offers, orders
   - Commercial documents linked to actores via relationships
   - Status workflow: 'Nueva' → 'En Progreso' → 'Ganada'/'Pérdida'/'Descartada'

3. **dm_acciones** (Item tier) - Individual shares/holdings
   - Action ownership linked to actores
   - Status workflow: 'disponible' → 'asignada'/'arrendada'/'bloqueada'/'inactiva'

### Feature-Based Architecture

Major domains follow vertical slice architecture (see [features/README.md](features/README.md)):

- `features/socios/` - Business Partners (Personas, Empresas)
- `features/procesos/` - Opportunities and Tasks management
- `features/billing/` - Billing functionality
- `features/dashboard/` - Dashboard components

Each feature contains:
- `components/` - Feature-specific React components
- `hooks/` - Custom React hooks
- `server/` - Server Actions
- `types/` - TypeScript types and Zod schemas

### Server Actions Pattern

All database mutations use Server Actions in `app/actions/`:

- Use `createClient()` from `@/lib/supabase/server` (NEVER use browser client in actions)
- Actions are marked with `'use server'` directive
- Return standardized response: `{ success: boolean, message: string, ... }`
- Call `revalidatePath()` after mutations to refresh cached data

Example from [app/actions/personas.ts](app/actions/personas.ts:14):

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearPersonaFromPersonFormValues(formData: PersonFormValues) {
  const supabase = await createClient()

  // ... database operations ...

  revalidatePath('/admin/socios/actores')
  return { success: true, message: '...' }
}
```

### Supabase Client Usage

**CRITICAL:** Use the correct client for the context:

- **Server Components/Actions**: `import { createClient } from '@/lib/supabase/server'`
- **Client Components**: `import { createClient } from '@/lib/supabase/client'`

The server client uses `@supabase/ssr` with cookie-based auth. The client client uses browser localStorage.

### Type System

- **Database Types**: Auto-generated in `types_db.ts` via `npx supabase gen types typescript --local`
- **ENUM Types**: Centralized in [lib/db-types.ts](lib/db-types.ts) with helper functions `getEnumOptions()`, `formatEnumValue()`, `getStatusColor()`
- **Form Schemas**: Zod schemas in `lib/schemas/` (e.g., [person-schema.ts](lib/schemas/person-schema.ts))

### RPC Functions

Database RPCs handle complex operations and permissions:

- `can_user_v2(p_resource, p_action, p_org)` - Check user permissions
- `is_org_admin_v2(p_org)` - Check if user is org admin
- `crear_persona(...)` - Create person with business partner generation
- `obtener_relaciones_bp(p_bp_id, p_solo_vigentes)` - Get BP relationships

### Permission System

Multi-tenant RBAC via config_organizacion_miembros:

- Check permissions: `checkPermission(resource, action, organizacion_id)` in [lib/auth/permissions.ts](lib/auth/permissions.ts:11)
- Admin check: `isAdmin(organizacion_id)`
- Owner check: `isOwner(organizacion_id)`

### UI Components

- **shadcn/ui**: Base components in `components/ui/` (button, dialog, form, etc.)
- **Feature Components**: Domain-specific in `components/socios/`, `components/procesos/`, etc.
- **Shell Components**: Page layout in `components/shell/` (page-header, page-content, page-toolbar)
- **Providers**: QueryProvider, ThemeProvider, ColorSchemeProvider in root layout

### Key Integrations

- **TanStack Query**: Data fetching and caching via QueryProvider
- **PostHog**: Analytics via `@/components/providers/posthog-provider.tsx`
- **Sentry**: Error tracking (client, server, edge configs)
- **PWA**: `@ducanh2912/next-pwa` for offline support
- **Supabase Auth**: NextAuth-compatible auth flow

### Testing

- **Framework**: Vitest with React Testing Library
- **Config**: [vitest.config.mts](vitest.config.mts)
- **Tests**: `tests/actions/*.test.ts` cover Server Actions
- **Coverage**: 80% threshold enforced
- **Setup**: [tests/setup.ts](tests/setup.ts)

## Important Patterns

### Colocation

Keep related code together. If a component is only used by one feature, place it in that feature's directory (e.g., `features/socios/personas/components/`) not in shared `components/`.

### Server vs Client Components

- **Default**: Use Server Components (no `'use client'` directive)
- **Use Client Components** only for:
  - Interactive UI (forms, state management, event handlers)
  - React hooks (useState, useEffect, etc.)
  - Context providers
  - TanStack Query

### Data Fetching

- **Server Components**: Direct Supabase queries using server client
- **Client Components**: Use TanStack Query with browser client

### Error Handling

- Use `use-notify.ts` hook for toast notifications
- Server Actions return `{ success, message }` pattern
- Log errors with `console.error()` for debugging

### Schema Validation

- Use Zod schemas for all form inputs
- Schemas defined in `lib/schemas/`
- Validate before database operations in Server Actions
