# Security Guide

## Security Headers

Configured in `next.config.ts`:

1. **HSTS** - Forces HTTPS (max-age: 31536000s)
2. **X-Frame-Options: SAMEORIGIN** - Prevents clickjacking
3. **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
4. **Referrer-Policy: origin-when-cross-origin** - Controls referrer info
5. **DNS Prefetch Control** - Controls DNS prefetching

### Verifying Headers

**Manual Test:**

```bash
npm run build && npm start
curl -I http://localhost:3000
```

**Online Tools:**

- [securityheaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## Row Level Security (RLS)

Database security enforced at PostgreSQL level, not in app code.

**Pattern:**

```sql
alter table table_name enable row level security;

create policy "Users can view own data"
  on table_name for select
  using ( auth.uid() = user_id );
```

**Adding New Tables:**

1. Enable RLS: `alter table table_name enable row level security;`
2. Create policies for: select, insert, update, delete
3. Use `auth.uid()` for user ownership
4. Never check permissions in app code

## Environment Security

**Never commit:**

- `.env.local` (secrets)
- `.env.production` (production secrets)

**Safe to commit:**

- `.env.example` (placeholders)

## Authentication

**Middleware Protection:**

- All routes protected except: `/`, `/login`, `/register`, `/auth/*`
- Session refresh on every request
- Auto-redirect to `/login` for unauthenticated users

## Production Checklist

- [ ] Environment variables set in hosting
- [ ] Supabase Site URL matches production domain
- [ ] Sentry configured and source maps uploading
- [ ] Security headers verified
- [ ] RLS policies reviewed
- [ ] Test accounts filtered in PostHog

## Reporting Security Issues

Email: security@yourcompany.com

Do not create public GitHub issues for vulnerabilities.
