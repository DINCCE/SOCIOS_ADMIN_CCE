# SOCIOS_ADMIN

A Next.js 16 application for managing business partners, relationships, opportunities, tasks, and share ownership. Built with Supabase, TypeScript, and shadcn/ui.

## Features

- **Business Partner Management**: Complete CRM for personas (individuals) and empresas (companies)
- **Relationship Management**: Track relationships between actors (family, work, commercial, etc.)
- **Opportunities**: Sales pipeline and opportunity tracking
- **Task Management**: Assign and track tasks with priorities and due dates
- **Share Ownership**: Manage action/share assignments and ownership
- **Multi-tenant**: Organization-based data isolation with RBAC
- **PWA Support**: Offline-capable progressive web app

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + PostgREST)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query
- **Testing**: Vitest + React Testing Library
- **Analytics**: PostHog
- **Error Tracking**: Sentry
- **Auth**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your Supabase credentials in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Code Quality

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Run tests
npm run test

# Build for production
npm run build
```

## Project Structure

The project follows a **vertical slice architecture** where each major business domain is organized as a feature:

```
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions (mutations)
│   ├── admin/             # Admin pages
│   └── auth/              # Authentication pages
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── socios/            # Business partner components
│   ├── procesos/          # Opportunities & tasks components
│   └── shell/             # Page layout components
├── features/              # Feature-based architecture
│   ├── socios/           # Business Partners domain
│   ├── procesos/         # Opportunities & tasks domain
│   ├── billing/          # Billing domain
│   └── dashboard/        # Dashboard domain
├── lib/
│   ├── auth/             # Permission helpers
│   ├── schemas/          # Zod validation schemas
│   └── supabase/         # Supabase clients (server/client)
└── tests/                # Vitest tests
```

### Feature Organization

Each feature directory follows this structure:

```
features/{feature}/
├── components/    # Feature-specific React components
├── hooks/         # Custom React hooks
├── server/        # Server Actions
└── types/         # TypeScript types and Zod schemas
```

## Architecture

### CTI Data Model

The database follows a three-tier hierarchy:

1. **dm_actores** (Corporate tier) - Master table for all actors
   - Contains both personas and empresas
   - Unified by `tipo_actor` enum
   - Multi-tenant via `organizacion_id`
   - Soft deletes via `eliminado_en`

2. **tr_doc_comercial** (Trade tier) - Commercial documents
   - Opportunities, offers, orders
   - Status workflow: Nueva → En Progreso → Ganada/Pérdida/Descartada

3. **dm_acciones** (Item tier) - Individual shares/holdings
   - Action ownership tracking
   - Status workflow: disponible → asignada/arrendada/bloqueada/inactiva

### Server Actions Pattern

All database mutations use Server Actions in `app/actions/`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearPersona(data: PersonFormValues) {
  const supabase = await createClient()

  // Database operations...

  revalidatePath('/admin/socios/actores')
  return { success: true, message: '...' }
}
```

### Supabase Client Usage

**Critical**: Use the correct client for context:

- **Server Components/Actions**: `import { createClient } from '@/lib/supabase/server'`
- **Client Components**: `import { createClient } from '@/lib/supabase/client'`

The server client uses `@supabase/ssr` with cookie-based auth. The client uses browser localStorage.

### Server vs Client Components

- **Default**: Use Server Components (no `'use client'` directive)
- **Use Client Components** only for:
  - Interactive UI (forms, state, event handlers)
  - React hooks (useState, useEffect, etc.)
  - Context providers
  - TanStack Query

## Database

### Access Guidelines

- **Use Supabase MCP tools** for database operations, not CLI
- **Auto-generated CRUD**: Supabase provides REST endpoints via PostgREST - no need to create custom APIs for basic CRUD
- See [docs/database/API.md](docs/database/API.md) for complete API documentation

### RPC Functions

Complex operations use database RPCs:

- `can_user_v2()` - Permission checks
- `is_org_admin_v2()` - Admin verification
- `crear_persona()` - Person creation with BP generation
- `obtener_relaciones_bp()` - Relationship queries

### Permission System

Multi-tenant RBAC via `organization_members`:

```typescript
import { checkPermission, isAdmin } from '@/lib/auth/permissions'

// Check specific permission
const canEdit = await checkPermission('dm_actores', 'update', orgId)

// Check admin role
const isAdmin = await isAdmin(orgId)
```

## Key Patterns

### Colocation

Keep related code together. Feature-specific components belong in that feature's directory, not shared `components/`.

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

## Documentation

- [CLAUDE.md](CLAUDE.md) - Developer guidance for Claude Code
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [docs/database/API.md](docs/database/API.md) - Complete API documentation
- [features/README.md](features/README.md) - Feature architecture guide

## License

MIT
