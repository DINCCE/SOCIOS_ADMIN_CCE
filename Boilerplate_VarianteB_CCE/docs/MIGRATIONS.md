# Database Migration Guide

## Overview

Two-file approach:

- **`supabase/schema.sql`**: Initial schema for first-time setup
- **`supabase/migrations/`**: Timestamped files for schema changes

## Initial Setup (New Projects)

Run `schema.sql` in Supabase Dashboard SQL Editor:

1. Dashboard → SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Run query

Creates:

- `profiles` table with RLS
- `todos` table with RLS
- Realtime publication

## Adding Schema Changes

**Never modify schema.sql directly.** Create new migration:

### 1. Create Migration File

Format: `YYYYMMDDHHMMSS_description.sql`

Example: `supabase/migrations/20240315120000_add_billing_table.sql`

```sql
-- Migration: Add billing table
-- Created: 2024-03-15

create table billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subscription_tier text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table billing enable row level security;

create policy "Users can view own billing"
  on billing for select
  using ( auth.uid() = user_id );
```

### 2. Apply Migration

**Local (Supabase CLI):**

```bash
supabase db push
```

**Production:**

1. Supabase Dashboard → SQL Editor
2. Copy migration file contents
3. Run query
4. Verify in Table Editor

### 3. Document in schema.sql (Optional)

For new developers, append migration to `schema.sql` with comment:

```sql
-- Migration: 20240315120000_add_billing_table.sql
-- (migration content)
```

## Best Practices

1. **Always use migrations for changes** - Never manual DB edits
2. **One migration per feature** - Keep focused
3. **Always include RLS policies** - Never create tables without RLS
4. **Test locally first** - Use Supabase CLI before production
5. **Never delete old migrations** - Migrations are append-only
6. **Descriptive names** - Future you will thank you

## Rollback Strategy

Create "down" migration to reverse changes:

```sql
-- 20240315130000_remove_billing_table.sql
drop table if exists billing;
```

## Current Migration

`supabase/migrations/20240101000000_init.sql` mirrors `schema.sql`.

For new projects:

- **Option A:** Run `schema.sql` (simpler)
- **Option B:** Run init migration via CLI (formal)

Both produce identical results.

## Troubleshooting

**"Policy already exists"?**

- Ran schema.sql then tried migration
- Solution: Drop policies or use fresh database

**Changes not appearing locally?**

- Ensure CLI running: `supabase start`
- Check applied: `supabase db status`

**Production/local DB out of sync?**

- Run missing migrations in order
- Generate diff: `supabase db diff`
