# Troubleshooting

Common issues and solutions.

## Setup Issues

### Build Fails with Type Errors

**Solutions:**

1. Type check: `npx tsc --noEmit`
2. Check for `any` types (strict mode)
3. Reinstall: `rm -rf node_modules package-lock.json && npm install`

### Supabase 401 Unauthorized

**Cause:** RLS policies blocking access

**Solutions:**

1. Check RLS enabled (Supabase Dashboard → Table Editor)
2. Verify policies exist (Authentication → Policies)
3. Check user authenticated:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user)
   ```
4. Run `schema.sql` if new database

### Environment Variables Not Loading

**Solutions:**

1. File must be `.env.local` (not `.env`)
2. Restart dev server
3. Client vars need `NEXT_PUBLIC_` prefix
4. Ensure `.env.local` in `.gitignore`

## Authentication

### Redirect Loop After Login

**Solutions:**

1. Clear browser cookies (DevTools → Application → Cookies)
2. Check Supabase redirect URL includes `http://localhost:3000/auth/callback`
3. Verify middleware.ts has public paths configured

### Email Confirmation Not Working

**Solutions:**

1. Disable for dev: Dashboard → Authentication → Providers → Email → Disable "Confirm email"
2. Check spam folder
3. Verify email template has correct link

## Development

### Hot Reload Not Working

**Solutions:**

1. Restart: `killall node && npm run dev`
2. Linux file watchers: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`

### TanStack Query Stale Data

**Solution:**

```typescript
const mutation = useMutation({
  mutationFn: updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  }
})
```

### "use client" Directive Error

**Solutions:**

1. Add `'use client'` to file top
2. Or separate into client component

## Database

### Migration Already Applied

**Cause:** Ran `schema.sql` then tried migration

**Solutions:**

1. Drop all tables and run again
2. Comment out duplicate policies

### RLS Blocking Admin Actions

**Debug:**

```sql
select auth.uid();
select * from profiles where auth.uid() = id;
```

## Build/Production

### Build Fails - "Module not found"

**Solutions:**

1. Use `@/` prefix for imports
2. Check tsconfig.json paths

### Sentry Source Maps Not Uploading

**Cause:** Missing `SENTRY_AUTH_TOKEN`

**Solution:**

1. Create token: Sentry.io → Settings → Auth Tokens
2. Add to `.env.local`: `SENTRY_AUTH_TOKEN=your-token`

## Performance

### Slow Page Load

**Solutions:**

1. Optimize images: Use Next.js `<Image>`
2. Code split: `const Heavy = dynamic(() => import('./heavy'))`

## Testing

### "document is not defined"

**Solution:** Verify `vitest.config.mts` has `environment: 'jsdom'`

### Mock Not Working

**Solution:** Mock before importing:

```typescript
vi.mock('@/lib/supabase/client', () => ({ ... }))
import { Component } from './component'
```

## Getting Help

1. Search [GitHub Issues](https://github.com/yourorg/yourrepo/issues)
2. Ask [GitHub Discussions](https://github.com/yourorg/yourrepo/discussions)
3. Check official docs:
   - [Next.js](https://nextjs.org/docs)
   - [Supabase](https://supabase.com/docs)
   - [TanStack Query](https://tanstack.com/query/latest)
