# SaaS Boilerplate (Variant B)

Production-ready SaaS starter for B2C transactional apps. Built with **Next.js 16**, **React 19**, **Supabase**, and **TanStack Query**.

## Features

- **Next.js 16 App Router** - React Server Components with optimistic updates
- **React 19** - Latest React features (see [React 19 Guide](docs/REACT19.md))
- **Supabase** - Backend-as-a-service (Auth + Postgres + RLS)
- **TanStack Query v5** - Client state management and caching
- **shadcn/ui** - Beautiful, accessible components
- **TypeScript** - Strict mode for type safety
- **Tailwind CSS v4** - Latest styling
- **Vitest** - Fast unit testing
- **Sentry** - Error monitoring
- **PostHog** - Product analytics
- **PWA Support** - Installable Progressive Web App with offline support

## Quick Start

```bash
git clone <repo-url>
cd boilerplate_varianteb_cce
npm install

cp .env.example .env.local
# Add Supabase credentials to .env.local

npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Documentation

| Guide | Purpose |
|-------|---------|
| [Getting Started](docs/GETTING_STARTED.md) | Complete setup |
| [Architecture](docs/ARCHITECTURE.md) | Why this stack |
| [Project Structure](docs/PROJECT_STRUCTURE.md) | Folder organization |
| [React 19 Guide](docs/REACT19.md) | React 19 migration notes |
| [Migrations](docs/MIGRATIONS.md) | Database management |
| [Testing](docs/TESTING.md) | Writing tests |
| [Security](docs/SECURITY.md) | Security verification |
| [Deployment](docs/DEPLOYMENT.md) | Production deploy |
| [PWA Setup](docs/PWA.md) | Progressive Web App config |
| [Roadmap](docs/ROADMAP.md) | Planned features |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues |

**For AI Assistants:** See [CLAUDE.md](CLAUDE.md) for technical reference.

## Tech Stack

- **next**: 16.0.10
- **react**: 19.2.3
- **@tanstack/react-query**: 5.90.12
- **@supabase/supabase-js**: 2.87.1
- **@ducanh2912/next-pwa**: 10.2.9
- **zod**: 4.1.13
- **tailwindcss**: 4.x

See [package.json](package.json) for complete list.

## Requirements

- **Node.js**: 22+ (see `.nvmrc`)
- **npm**: 10+
- **Supabase Account**: Free tier for dev

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm run test         # Test suite
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](LICENSE)
