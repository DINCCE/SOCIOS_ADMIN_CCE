# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note:** This file is the authoritative technical reference for AI coding assistants. For human-readable guides, see the `/docs` folder.

## Project Overview

This is a **SaaS Boilerplate (Variant B)** designed for B2C transactional web apps. The stack prioritizes development speed, type safety, and premium UX through optimistic updates.

**Core Stack:**
- Next.js 16 (App Router with React Server Components) - currently 16.0.10
- React 19 (19.2.3 - see [React 19 Guide](docs/REACT19.md) for breaking changes)
- Supabase (Auth + Postgres with Row Level Security)
- TanStack Query v5 (5.90.12 - client-side state management)
- shadcn/ui + Tailwind CSS v4
- TypeScript (strict mode)
- Zod v4 (4.1.13 - breaking changes from v3)
- Vitest v4 for testing
- Sentry for error monitoring
- PostHog for analytics
- PWA Support (@ducanh2912/next-pwa 10.2.9 - Progressive Web App with Workbox)

**Important:** See [docs/REACT19.md](docs/REACT19.md) for React 19 migration notes and new features.

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                    # Start dev server on localhost:3000

# Build & Production
npm run build                  # Production build
npm start                      # Start production server

# Code Quality
npm run lint                   # Run ESLint
npx tsc --noEmit              # Type check without emitting files

# Testing
npm run test                   # Run Vitest test suite
npm run test -- --watch       # Run tests in watch mode
npm run test -- path/to/file  # Run specific test file
```

### First-Time Setup
```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Architecture Principles

### 1. Server vs Client Components
- **Default**: All components in `/app` are Server Components (RSC)
- **Use `'use client'` only for:**
  - Interactive components (forms, buttons with state)
  - React Context Providers
  - Components using hooks (useState, useEffect, useRouter)
  - TanStack Query hooks

### 2. Supabase Client Usage
**Critical: Use the correct client for the context**

- **Server Components & Server Actions**: Import from `@/lib/supabase/server`
  ```typescript
  import { createClient } from '@/lib/supabase/server'
  const supabase = await createClient()
  ```

- **Client Components**: Import from `@/lib/supabase/client`
  ```typescript
  import { createClient } from '@/lib/supabase/client'
  const supabase = createClient()
  ```

- **Middleware**: Already configured in `middleware.ts` using `@/lib/supabase/middleware`

### 3. Authentication & Route Protection
- Middleware (`middleware.ts`) handles session refresh on every request
- Unauthenticated users are redirected to `/login` (except for `/`, `/login`, `/register`, `/auth/*`)
- Protected routes are in the `(dashboard)` route group

### 4. Row Level Security (RLS) Pattern
All database security happens at the database layer via RLS policies, not in application code.

**Example pattern from `supabase/schema.sql`:**
```sql
-- Policy pattern: Users can only access their own data
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );
```

**When adding new tables:**
1. Always enable RLS: `alter table table_name enable row level security;`
2. Create policies for select, insert, update, delete operations
3. Use `auth.uid()` to enforce user ownership
4. Never check permissions in application code—trust the database

### 5. Data Fetching Pattern
**Server-side (RSC) → Client-side (TanStack Query)**

1. Fetch initial data in Server Components
2. Pass to Client Components via props or `initialData`
3. Client Components use TanStack Query for mutations and refetching
4. Invalidate query cache after mutations for optimistic UI

**Example:**
```typescript
// Server Component (page.tsx)
const data = await supabase.from('todos').select()

// Client Component
'use client'
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: async () => { /* fetch */ },
  initialData: serverData
})
```

### 6. TanStack Query Configuration
- Default `staleTime`: 60 seconds (set in `components/providers/query-provider.tsx`)
- Server-side: Always creates new QueryClient
- Client-side: Reuses singleton to prevent recreation on suspense

## Feature-First Structure

```
features/
├── auth/
│   ├── components/      # Auth-specific UI (LoginForm, UserAuthForm)
│   ├── hooks/           # Auth-related hooks
│   └── types/           # Zod schemas (auth-schema.ts)
├── billing/
└── dashboard/
```

**Rule:** If a component is used across multiple features → move to `/components`. If feature-specific → keep in `/features/{feature}/components`.

## Styling & Components

- **UI Components**: All from shadcn/ui in `components/ui/`
- **Utility Function**: Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- **Styling**: Tailwind CSS v4 with custom configuration

## Forms & Validation

Standard pattern using react-hook-form + zod:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })
const form = useForm({
  resolver: zodResolver(schema),
})
```

Forms use shadcn/ui Form components with FormField, FormItem, FormLabel, FormControl, FormMessage.

## Error Handling & Monitoring

- **Sentry**: Configured via `sentry.{client,server,edge}.config.ts`
- **Source maps**: Automatically uploaded and deleted in production builds
- **Tunnel route**: `/monitoring` (bypasses ad-blockers)
- **Toast notifications**: Use `sonner` for user-facing error messages

## Testing Strategy

**Framework:** Vitest v4 with jsdom environment
**React Testing:** @testing-library/react configured
**Current Status:** Minimal test coverage (setup test only)
**Scope:** Utility functions, hooks, isolated UI components

**Note:** Test suite in early stages. CI/CD has tests commented out until coverage improves.

See [docs/TESTING.md](docs/TESTING.md) for writing and running tests.

## Environment Variables

### Required for Build
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Optional (Development)
```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Required for Production
```bash
NEXT_PUBLIC_SENTRY_DSN=          # Error monitoring
SENTRY_AUTH_TOKEN=                # Source map uploads
```

See `.env.example` for detailed setup instructions.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on PRs:
1. Lint
2. Type check (`tsc --noEmit`)
3. Build
4. Tests (currently commented out)

## Important Conventions

1. **Strict TypeScript**: Always use strict mode, no implicit any
2. **No API routes for CRUD**: Query Supabase directly from Server/Client Components
3. **Security via RLS**: Database enforces permissions, not application code
4. **Optimistic UI**: Use TanStack Query's mutation hooks with cache invalidation
5. **Route Groups**: Use `(auth)` and `(dashboard)` for layout organization
6. **Middleware**: Handles all auth session management—don't duplicate auth logic elsewhere
7. **Context7 for Documentation**: Always use Context7 MCP tools (`mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs`) when you need code generation, setup/configuration steps, or library/API documentation. This should be done automatically without the user having to explicitly ask. Use it for all libraries in the stack (Next.js, Supabase, TanStack Query, shadcn/ui, Zod, Vitest, etc.)

## Database Schema & Patterns

### Business Partners System

The project implements a Class Table Inheritance (CTI) pattern for managing different types of business partners:

**Core Tables:**

- `organizations` - Multi-tenancy foundation
- `business_partners` - Base table for all partners (CTI pattern)
- `personas` - Natural persons specialization
- `empresas` - Companies specialization

**Key Patterns:**

- **Class Table Inheritance (CTI):** `business_partners` is the base table, `personas` and `empresas` are specializations with 1:1 PK relationship
- **Multi-Tenancy:** All data filtered by `organizacion_id` via RLS policies
- **Soft Delete:** Use `eliminado_en` timestamp instead of DELETE operations
- **JSONB Metadata:** Flexible `atributos` field for custom data per organization

**Database Functions:**

- `calcular_digito_verificacion_nit(nit TEXT)` - Calculate NIT verification digit for Colombian tax IDs
- `actualizar_timestamp()` - Trigger function to auto-update `actualizado_en`
- `validar_consistencia_tipo_actor()` - Ensures each business_partner has exactly one specialization

**Comprehensive Documentation:**

- [Database Overview](docs/database/OVERVIEW.md) - Concepts, architecture, roadmap
- [Schema Reference](docs/database/SCHEMA.md) - ERD, tables, functions, triggers, views
- [Tables Dictionary](docs/database/TABLES.md) - Complete data dictionary with all fields
- [Query Examples](docs/database/QUERIES.md) - SQL patterns for common operations
- [RLS Policies](docs/database/RLS.md) - Row Level Security implementation

### Database Migrations

**Initial Setup:** Use `supabase/schema.sql` for first-time database setup.

**Schema Changes:** Add timestamped migrations to `supabase/migrations/` (format: `YYYYMMDDHHMMSS_description.sql`).

**Running Migrations:**
- Local: Supabase CLI (`supabase db push`)
- Production: Supabase Dashboard SQL Editor

**See [docs/MIGRATIONS.md](docs/MIGRATIONS.md) for detailed workflow and Business Partners migration history.**

## Security Headers

Configured in `next.config.ts`:
- HSTS (Strict-Transport-Security)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- DNS Prefetch Control

**Verification:** See [docs/SECURITY.md](docs/SECURITY.md) for testing and best practices.

## Progressive Web App (PWA)

**Package:** `@ducanh2912/next-pwa` v10.2.9

**Configuration** (`next.config.ts`):
```typescript
withPWA({
  dest: "public",                          // Service worker output
  cacheOnFrontEndNav: true,                // Cache client-side navigation
  aggressiveFrontEndNavCaching: true,      // Aggressive caching strategy
  reloadOnOnline: true,                    // Auto-reload when back online
  workboxOptions: {
    disableDevLogs: true,                  // Clean dev console
  },
})
```

**Features:**
- Automatic service worker generation with Workbox
- Offline support with intelligent caching
- Install prompt for mobile devices
- iOS Web App support (standalone mode)
- Manifest configuration in `public/manifest.json`

**Requirements:**
- App icons: 192x192 and 512x512 PNG files (referenced in manifest)
- HTTPS in production (for service worker registration)

**Metadata** (configured in `app/layout.tsx`):
- Web manifest linked
- Apple Web App capable
- Theme color configured
- Viewport optimized for mobile

**See [docs/PWA.md](docs/PWA.md) for setup, testing, and customization.**

## Key Files Reference

- Auth logic: [features/auth/components/user-auth-form.tsx](features/auth/components/user-auth-form.tsx)
- Middleware auth: [lib/supabase/middleware.ts](lib/supabase/middleware.ts)
- Query setup: [components/providers/query-provider.tsx](components/providers/query-provider.tsx)
- RLS policies: [supabase/schema.sql](supabase/schema.sql)
- Route protection: [middleware.ts](middleware.ts)
