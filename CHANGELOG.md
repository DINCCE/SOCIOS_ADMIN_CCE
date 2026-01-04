# Changelog

All notable changes documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Enhanced `obtener_relaciones_bp` RPC function with complete partner information
  - Returns full profile data for both origin and destination partners
  - New `p_tipo_relacion` parameter for filtering by relationship type
  - Eliminates N+1 query problem with single JOIN operation
  - ~90% reduction in database queries for relationship data
  - Updated parameter naming: `bp_id` → `p_bp_id`, `solo_vigentes` → `p_solo_actuales`
- Next.js 16 with App Router
- React 19 with latest features
- Supabase auth and database
- TanStack Query v5
- shadcn/ui components
- Tailwind CSS v4
- TypeScript strict mode
- Vitest testing setup
- Sentry error monitoring
- PostHog analytics
- Security headers
- RLS database policies
- PWA support with @ducanh2912/next-pwa
- Web manifest for app installation
- Service worker with Workbox
- Offline support and caching strategies

### Documentation

- Complete setup guide
- Architecture decisions
- Project structure
- React 19 migration guide
- Database migrations guide
- Testing guide
- Security guide
- Deployment guide
- Roadmap for planned features
- Contributing guidelines
- Troubleshooting guide
- PWA setup and customization guide

### Infrastructure

- GitHub Actions CI/CD
- ESLint and TypeScript checks
- Automated builds on PRs

## [0.1.0] - 2024-12-14

### Initial Release

- Project structure
- Core authentication
- Dashboard layout
- Supabase integration
