# Contributing

Thank you for contributing!

## Getting Started

1. Fork repository
2. Clone: `git clone https://github.com/YOUR_USERNAME/boilerplate-variant-b.git`
3. Install: `npm install`
4. Branch: `git checkout -b feature/your-feature`

## Development

- Read [CLAUDE.md](CLAUDE.md) for architecture
- Read [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for organization
- Check [existing issues](https://github.com/yourorg/yourrepo/issues)
- For major changes, open issue first

## Making Changes

**Commit messages:**

```
feat: add user profile management
fix: resolve auth redirect loop
docs: update migration guide
test: add billing tests
```

**Code style:**

- TypeScript strict mode (no `any`)
- ESLint rules enforced
- Run `npm run lint` before PR

**Testing:**

```bash
npm run lint          # Style check
npx tsc --noEmit      # Type check
npm run test          # Tests
npm run build         # Build verification
```

**Documentation:**

- Update relevant docs for new features
- Update CLAUDE.md for architecture changes
- Add dependencies explanation in PR

## Pull Request

**PR Checklist:**

- [ ] Code follows project style
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Documentation updated
- [ ] No console.log/debugger
- [ ] .env.example updated if needed

**CI must pass:**

- Lint check
- Type check
- Build verification

## Architecture Guidelines

### Server vs Client Components

- Default: Server Components
- Use `'use client'` only for:
  - Interactive UI (forms, state)
  - React hooks
  - Context Providers
  - TanStack Query

### Supabase Clients

**CRITICAL:** Use correct client:

- Server: `import { createClient } from '@/lib/supabase/server'`
- Client: `import { createClient } from '@/lib/supabase/client'`

### Database Changes

- Never modify `schema.sql`
- Create migration in `supabase/migrations/`
- Always include RLS policies
- See [docs/MIGRATIONS.md](docs/MIGRATIONS.md)

### Feature Organization

- Feature-specific → `/features/{feature}/`
- Shared UI → `/components/`
- See [features/README.md](features/README.md)

## Questions?

- **Bugs/Features:** [Open issue](https://github.com/yourorg/yourrepo/issues/new)
- **Discussions:** [GitHub Discussions](https://github.com/yourorg/yourrepo/discussions)

## License

By contributing, you agree your contributions will be licensed under MIT.
