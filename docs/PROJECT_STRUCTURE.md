# Project Structure

We follow a **Feature-First** architecture. Instead of grouping files by type (controllers, views), we group them by domain feature.

```
/
├── app/                  # Next.js App Router (Routes & Layouts)
│   ├── (auth)/           # Route Group: Auth pages (Login/Register)
│   ├── (dashboard)/      # Route Group: Protected app pages
│   │   ├── dashboard/    # Dashboard landing
│   │   └── billing/      # Billing page
│   ├── layout.tsx        # Root layout (QueryProvider, PostHog, Fonts)
│   └── page.tsx          # Landing page
├── components/           # Shared UI Components
│   ├── ui/               # shadcn/ui primitives (Button, Input, Card, Sidebar)
│   ├── layout/           # App shells (DashboardShell, Sidebar)
│   └── providers/        # React Context Providers
├── features/             # Domain Logic
│   ├── auth/             # Auth Feature
│   │   ├── components/   # Auth-specific UI (LoginForm)
│   │   ├── hooks/        # Auth logic (useUser)
│   │   └── types/        # Zod schemas (AuthSchema)
│   ├── billing/          # [NEW] Billing Feature
│   └── dashboard/        # [NEW] Dashboard Feature
├── lib/                  # Utilities
│   ├── supabase/         # Supabase Clients (Server/Client)
│   └── utils.ts          # Tailwind helper (cn)
├── supabase/             # Database Setup
│   ├── migrations/       # [NEW] SQL Migrations
│   └── schema.sql        # SQL Schema & RLS Policies (Legacy)
├── tests/                # [NEW] Testing
│   └── setup.test.ts     # Sample tests
├── types/                # Global Types
└── .github/              # [NEW] CI/CD Workflows
```

## Key Directories

### `/features`
Each folder here represents a slice of business logic.
- **Rule**: If a component is reused across features, move it to `/components`. If it's specific to one feature, keep it here.

### `/lib/supabase`
Contains the strict instantiation of the Supabase Client.
- `client.ts`: For Client Components (Browser).
- `server.ts`: For Server Components & Server Actions (Node.js/Edge).

## Related Documentation

- **Feature Architecture Details:** [features/README.md](/features/README.md)
- **Complete Technical Reference:** [CLAUDE.md](/CLAUDE.md)
