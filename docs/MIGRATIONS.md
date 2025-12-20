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

## Current Migrations

### Initial Setup

`supabase/migrations/20240101000000_init.sql` mirrors `schema.sql`.

For new projects:

- **Option A:** Run `schema.sql` (simpler)
- **Option B:** Run init migration via CLI (formal)

Both produce identical results.

### Business Partners System

The following migrations implement the Business Partners system (organizations, business_partners, personas, empresas):

**Applied Migrations:**

All Business Partners migrations have been applied directly to the Supabase database. The schema includes:

1. **Organizations** - Multi-tenancy foundation
   - Table: `organizations`
   - Fields: id, nombre, descripcion, configuracion (JSONB)
   - RLS: Enabled
   - Soft delete: `eliminado_en`

2. **Business Partners Base** - Class Table Inheritance (CTI) pattern
   - Table: `business_partners`
   - Fields: id, organizacion_id, tipo_actor, codigo_interno, estado, atributos (JSONB)
   - ENUMs: `tipo_actor`, `estado_actor`
   - RLS: Enabled
   - Triggers: `actualizar_timestamp()`, `validar_consistencia_tipo_actor()`
   - Constraint: UNIQUE (organizacion_id, codigo_interno) WHERE eliminado_en IS NULL

3. **Personas** - Specialization for natural persons
   - Table: `personas`
   - Fields: nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, genero, etc.
   - ENUMs: `tipo_documento_persona`, `genero_persona`
   - Foreign Keys: business_partners(id), personas(id) for contacto_emergencia
   - RLS: Enabled
   - Constraint: UNIQUE (numero_documento) WHERE eliminado_en IS NULL
   - Índices: numero_documento, nombres, apellidos

4. **Empresas** - Specialization for companies
   - Table: `empresas`
   - Fields: razon_social, nombre_comercial, nit, digito_verificacion, tipo_empresa, etc.
   - ENUM: `tipo_empresa`
   - Foreign Keys: business_partners(id), personas(id) for representante_legal
   - RLS: Enabled
   - Function: `calcular_digito_verificacion_nit(nit TEXT)`
   - Constraint: UNIQUE (nit) WHERE eliminado_en IS NULL
   - Índices: nit, razon_social

5. **Views** - Simplified queries
   - `v_personas_completa` - Personas with BP and organization data
   - `v_empresas_completa` - Empresas with BP, organization, and representante legal
   - `v_actores_unificados` - Polymorphic view of all actors (personas + empresas)

**Documentation:**

For detailed schema information, see:

- [Database Overview](database/OVERVIEW.md) - Concepts and architecture
- [Schema Reference](database/SCHEMA.md) - ERD, tables, functions, triggers
- [Tables Dictionary](database/TABLES.md) - Complete data dictionary
- [Query Examples](database/QUERIES.md) - SQL patterns and examples
- [RLS Policies](database/RLS.md) - Security policies (to be implemented)

**Creating Migration Files (Optional):**

While the schema is already applied in Supabase, you can create migration files for version control:

```bash
# Example migration files structure:
supabase/migrations/
├── 20240101000000_init.sql           # Initial setup (existing)
├── 20241219000001_create_organizations.sql
├── 20241219000002_create_business_partners.sql
├── 20241219000003_create_personas.sql
├── 20241219000004_create_empresas.sql
├── 20241219000005_create_functions_triggers.sql
├── 20241219000006_create_views.sql
└── 20241219000007_create_rls_policies.sql
```

These migration files would document the changes but are not required to run since the schema is already applied.

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
