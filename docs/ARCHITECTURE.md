# Architecture - Variant B

**Variant B** is designed for **SaaS / B2C Transactional Web Apps**. It prioritizes development speed, type safety, and a premium user experience via optimistic updates.

## Core Decisions

### 1. Next.js 16 (App Router)
We chose the App Router for its **React Server Components (RSC)** architecture.
- **Why**: Allows fetching data on the server (close to the DB) while keeping the client bundle small.
- **Usage**: All pages in `/app` are Server Components by default. We use `'use client'` strictly for interactive leaves (forms, buttons) or Context Providers.

### 2. Supabase (Auth + Postgres)
Supabase provides the backend-as-a-service.
- **Why**: It reduces backend boilerplate. We don't write API controllers for CRUD; we query the DB directly securely.
- **RLS (Row Level Security)**: This is our API security layer. Instead of checking permissions in an API route, we check them in the database engine.
  - *Benefit*: You can never accidentally expose data by forgetting a `where` clause in your code. The DB enforces `auth.uid() = user_id`.

### 3. TanStack Query
Although Next.js has server caching, we use **TanStack Query** on the client.
- **Why**: SaaS apps are highly interactive. Users verify emails, change settings, and expect immediate feedback.
- **Optimistic UI**: Query allows us to manually update the cache *before* the server responds, making the app feel instant.
- **Deduplication**: Prevents multiple components from fetching the same user profile simultaneously.

## Data Flow Pattern

1. **Fetch**: Server Components fetch initial data via `supabase-js` (SSR).
2. **Hydrate**: Pass this data to Client Components (Prop drilling or `initialData` in Query).
3. **Mutate**: Client Components call `supabase` directly or Server Actions.
4. **Invalidate**: On success, invalidating the Query Key refreshes the UI.

### 4. Testing Strategy
We use **Vitest** for unit and component testing.
- **Why**: Faster than Jest and native to the Vite ecosystem (compatible with Next.js).
- **Scope**: We test utility functions, hooks, and isolated UI components.
- **CI**: Tests run automatically on every PR via GitHub Actions.

### 5. Progressive Web App (PWA)
We use **@ducanh2912/next-pwa** for PWA capabilities.
- **Why**: Enables app installation, offline support, and native-like experience without platform-specific builds.
- **Workbox Integration**: Automatic service worker generation with intelligent caching strategies.
- **Benefits**:
  - Users can install the app on mobile/desktop
  - Works offline with cached content
  - Faster subsequent loads via aggressive caching
  - Push notification support (future capability)
- **Configuration**: Configured in `next.config.ts` with manifest in `public/manifest.json`.
- **Platform Support**: Works on Android, iOS (standalone mode), and desktop browsers.
