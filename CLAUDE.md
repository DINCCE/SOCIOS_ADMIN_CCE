# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SOCIOS_ADMIN** is a Next.js 16 business partner management CRM for managing corporate partnerships, opportunities, tasks, and share ownership. Built with Supabase, TypeScript, and shadcn/ui.

## Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Code Quality
npm run lint         # Run ESLint
npx tsc --noEmit    # Type check without emitting files
npm run test        # Run Vitest tests

# Production
npm run build       # Build for production
npm run start        # Start production server

# Database (use Supabase MCP tools instead of CLI)
# The project uses Supabase with auto-generated CRUD via PostgREST
```

## High-Level Architecture

### Vertical Slice Feature Structure

The project follows a **vertical slice architecture** where each business domain is a feature:

```
features/{feature}/
├── components/    # Feature-specific React components
├── hooks/         # Custom React hooks
├── server/        # Server Actions (mutations)
└── types/         # TypeScript types and Zod schemas
```

**Rule**: Colocate code within features. If a component is only used by one feature, keep it in that feature's directory - not in shared `components/`.

### CTI Data Model (Database)

Three-tier hierarchy with multi-tenancy:

1. **dm_actores** (Corporate tier) - Master table for all actors (personas + empresas)
   - Unified by `tipo_actor` enum
   - Multi-tenant via `organizacion_id`
   - Soft deletes via `eliminado_en`

2. **tr_doc_comercial** (Trade tier) - Commercial documents (opportunities, offers, orders)

3. **dm_acciones** (Item tier) - Individual shares/holdings

### Table Naming Conventions

- **config_***: Configuration/reference tables (roles, permissions, organizations, cities)
- **dm_***: Master data/domain model tables (actors, actions)
- **vn_***: Relationship/assignment tables (relaciones, asociados)
- **tr_***: Transaction tables (doc_comercial, tareas)

## Critical Development Patterns

### Supabase Client Usage

**CRITICAL**: Use the correct client for context:

```typescript
// Server Components/Actions
import { createClient } from '@/lib/supabase/server'

// Client Components (with TanStack Query)
import { createClient } from '@/lib/supabase/client'
```

The server client uses `@supabase/ssr` with cookie-based auth. The client uses browser localStorage.

### Server Actions Pattern

All database mutations use Server Actions in `app/actions/`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPersona(data: PersonFormValues) {
  const supabase = await createClient()
  // Database operations...
  revalidatePath('/admin/socios/actores')
  return { success: true, message: '...' }
}
```

### Server vs Client Components

- **Default**: Use Server Components (no `'use client'` directive)
- **Use Client Components** only for:
  - Interactive UI (forms, state, event handlers)
  - React hooks (useState, useEffect, etc.)
  - Context providers
  - TanStack Query

### Permission System

Multi-tenant RBAC via Supabase RPCs:

```typescript
import { checkPermission, isAdmin, isOwner } from '@/lib/auth/permissions'

// Check specific permission
const canEdit = await checkPermission('dm_actores', 'update', orgId)

// Check admin role
const isAdmin = await isAdmin(orgId)

// Check owner role
const isOwner = await isOwner(orgId)
```

**Roles**: owner (full access), admin (business tables), analyst (no delete), auditor (read-only)

**Database functions**:
- `can_user_v2(resource, action, org_id)` - Permission check
- `is_org_admin_v2(org_id)` - Admin verification
- `is_org_owner_v2(org_id)` - Owner verification

## UI Patterns

### PageTable Pattern (List Pages)

All table-based list pages follow this structure:

1. **Server Component** (`page.tsx`) - Simple pass-through to client component
2. **Client Component** (`{entity}-page-client.tsx`) - Main logic with TanStack Table
3. **Type/Schema** (`types/{entity}-schema.ts`) - Zod schema for list view
4. **Columns** (`columns.tsx`) - Column definitions for the table
5. **DataTable** (`data-table.tsx`) - Pure presentation component

**Key files**:
- [docs/UI/PageTable_Structure.md](docs/UI/PageTable_Structure.md)
- [docs/UI/PageDetail_Structure.md](docs/UI/PageDetail_Structure.md)

### Shell Components

Located in `components/shell/`:
- `PageShell` - Full-height layout container
- `PageHeader` - Title, description, metadata, actions
- `PageToolbar` - Search, filters, view options
- `PageContent` - Scrollable content area

### Sidebar Layout

Uses shadcn/ui's Sidebar with flex-based layout:
- Custom width: `w-[21rem]` (336px)
- Variant: `inset` (rounded, padded, shadow)
- Mobile: Hidden, replaced by Sheet drawer

See [docs/UI/SIDEBAR.md](docs/UI/SIDEBAR.md) for details.

## Database Operations

### Use Supabase MCP Tools

When working with the database, **always use Supabase MCP tools** instead of CLI commands:
- `mcp__supabase__execute_sql` - Execute raw SQL queries
- `mcp__supabase__apply_migration` - Apply DDL migrations
- `mcp__supabase__list_tables` - List tables
- `mcp__supabase__get_advisors` - Check for security/performance issues

### Auto-generated CRUD

Supabase provides REST endpoints via PostgREST - no need to create custom APIs for basic CRUD. Access directly from client components.

### RPC Functions

Use database RPCs for complex operations:
- `vn_asociados_crear_asignacion()` - Create action assignments
- `soft_delete_actor()` - Soft delete with permissions
- `search_locations()` - Search cities
- `dm_actores_*_existe()` - Check duplicates

See [docs/database/FUNCTIONS.md](docs/database/FUNCTIONS.md) for complete reference.

### RLS Policies

All tables have RLS enabled. Access control via:
1. Organization membership (`config_organizacion_miembros`)
2. User role (`config_roles_permisos`)
3. Data ownership (`organizacion_id`, `creado_por`)

**Important**: Always filter soft-deleted records with `.is('eliminado_en', null)`

See [docs/database/RLS.md](docs/database/RLS.md) for complete security model.

## Key Development Practices

### Data Fetching

- **Server Components**: Direct Supabase queries using server client
- **Client Components**: Use TanStack Query with browser client

### Error Handling

- Use `use-notify.ts` hook for toast notifications
- Server Actions return `{ success, message }` pattern
- Console.error for debugging

### Schema Validation

- Use Zod schemas for all form inputs
- Schemas defined in `lib/schemas/` or feature `types/`
- Validate before database operations in Server Actions

### Soft Delete

Never hard delete records. Use soft delete:
- Set `eliminado_en = now()`
- RLS automatically filters soft-deleted records in SELECT queries

## Environment Variables

Required from `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

## Testing

- **Framework**: Vitest + React Testing Library
- **Run tests**: `npm run test`
- Tests located in `tests/`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + PostgREST)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Auth**: Supabase Auth

## Documentation

- [README.md](README.md) - Complete project overview
- [features/README.md](features/README.md) - Feature architecture guide
- [docs/database/TABLES.md](docs/database/TABLES.md) - Complete table documentation
- [docs/database/FUNCTIONS.md](docs/database/FUNCTIONS.md) - Database functions reference
- [docs/database/RLS.md](docs/database/RLS.md) - Security and permissions model

## Resource Usage Guidelines

### Documentation Lookup

Before implementing features or using libraries:

1. **Use Context7 MCP Server** to check for up-to-date documentation on libraries or frameworks
   - Call `mcp__context7__resolve-library-id` first to get the library ID
   - Then use `mcp__context7__query-docs` for specific questions

### Database Work

**CRITICAL**: Never use Supabase CLI commands. Always use Supabase MCP tools:

- `mcp__supabase__execute_sql` - Execute raw SQL queries
- `mcp__supabase__apply_migration` - Apply DDL migrations
- `mcp__supabase__list_tables` - List tables
- `mcp__supabase__list_migrations` - View migration history
- `mcp__supabase__get_advisors` - Check for security/performance issues

### UI Components

When you need UI components:

1. **Check existing components** in `components/` and `components/ui/` first
2. **Check UI documentation** in `docs/UI/` for patterns and reference:
   - [docs/UI/PageTable_Structure.md](docs/UI/PageTable_Structure.md) - List pages pattern
   - [docs/UI/PageDetail_Structure.md](docs/UI/PageDetail_Structure.md) - Detail pages pattern
   - [docs/UI/SIDEBAR.md](docs/UI/SIDEBAR.md) - Sidebar layout
   - [docs/UI/FORM_COMPONENTS.md](docs/UI/FORM_COMPONENTS.md) - Form patterns
3. **If not found**, use shadcn MCP Server to add components:
   - Use `mcp__shadcn__search_items_in_registries` to find components
   - Use `mcp__shadcn__get_add_command_for_items` to get installation command
   - Use `mcp__shadcn__get_item_examples_from_registries` for usage examples

## AI Agent Implementation

### Vercel AI SDK v6

**CRITICAL RULE**: The project uses **Vercel AI SDK v6** (the `ai` package) for all AI capabilities. This is the official SDK maintained by Vercel for building AI-powered applications.

- **Version**: Always use imports from `@ai-sdk/react` (React hooks) and `ai` (core utilities) - version 6.x or higher
- **Documentation**: [sdk.vercel.ai/docs](https://sdk.vercel.ai/docs)
- **Do NOT** use older patterns like `ai/rsc` or custom streaming implementations

### Official Vercel AI Components

**CRITICAL**: Always use official Vercel AI SDK components for chat and agent interfaces.

- **Installation**: `npx ai-elements@latest` (installs to `components/ai-elements/`)
- **Do NOT build custom chat UIs from scratch.**
- **Do NOT manually stream or parse message parts.**
- **Do NOT create your own message components unless absolutely necessary.**

**Standard Components** (located in `components/ai-elements/`):
- `<Conversation />` - Main chat container
- `<Message />` - Individual message display
- `<PromptInput />` - Input field (also called Composer)
- `<Reasoning />` - Chain-of-thought reasoning display
- `<ToolInvocation />` - Tool call results display
- `<ThreadList />` - Thread/conversation list

These are official Vercel components - treat them as library code and avoid heavy modifications.

### Architecture

1. **Shared UI Primitives**: `components/ai-elements/`
   - Contains official Vercel AI SDK components (Thread, Message, Tool, etc.)
   - Installed via `npx ai-elements@latest`
   - Treat as library code; do not modify heavily unless necessary for theming

2. **Feature Logic**: `features/ai-companion/`
   - Contains the actual implementation (e.g., `AIChatView`)
   - Uses `useChat` hook from `@ai-sdk/react` (Vercel AI SDK v6)
   - Handles tool execution and state management
   - Implements AI tools using the `tool` schema from the SDK

3. **Backend**: `app/api/chat/route.ts`
   - Must use `streamText` from `ai` package
   - Must return `toUIMessageStreamResponse()` for proper streaming
   - Ensure `sendReasoning: true` is enabled in the response for thinking models
   - Tool definitions should follow Vercel AI SDK `tool` schema

### Key SDK Imports

```typescript
// React hooks (client components)
import { useChat, useCompletion, useAssistant } from '@ai-sdk/react'

// Core utilities (server)
import { streamText, generateText, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { toUIMessageStreamResponse } from 'ai/react'

// Types
import type { CoreMessage, ToolInvocation } from 'ai'
```

### Tool Definition Pattern

```typescript
// Define tools using Vercel AI SDK tool schema
const myTool = tool({
  description: 'Tool description',
  parameters: z.object({
    // Zod schema for parameters
  }),
  execute: async ({ param }) => {
    // Tool implementation
  }
})
```

