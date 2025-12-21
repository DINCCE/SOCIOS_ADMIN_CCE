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

### BP Relaciones System

The following components implement the Business Partners Relationships system with temporal tracking, bidirectional support, and type validations:

**Applied Components:**

All BP Relaciones components have been applied directly to the Supabase database. The system includes:

1. **ENUM tipo_relacion_bp** - Relationship types
   - Values: `familiar`, `laboral`, `referencia`, `membresia`, `comercial`, `otra`
   - Defines the 6 supported relationship categories

2. **Table bp_relaciones** - Core relationships table
   - Fields: 16 columns including origen, destino, tipo, roles, atributos (JSONB), fechas
   - Primary Key: `id UUID`
   - Foreign Keys: `organizacion_id`, `bp_origen_id`, `bp_destino_id`
   - Generated Column: `es_actual` (computed from `fecha_fin IS NULL`)
   - Check Constraints: no self-relations, valid date ranges
   - Unique Constraint: prevents duplicate active relationships
   - RLS: Enabled with basic authenticated user policies

3. **Indexes (7 total)** - Performance optimization
   - 5 partial indexes for common queries (origen, destino, tipo, org, actual)
   - 1 compound index for bidirectional queries
   - 1 unique index to prevent duplicates
   - All use `WHERE eliminado_en IS NULL` for efficiency

4. **Function invertir_rol()** - Role inversion mapping
   - Maps 20+ role pairs (e.g., Padre↔Hijo, Empleado↔Empleador)
   - IMMUTABLE function for performance
   - Used by bidirectional view to auto-generate inverse relationships

5. **Function validar_tipo_relacion_compatible()** - Type validation
   - Trigger function enforcing business rules:
     - Familiar: Both BP must be personas
     - Laboral: Origin persona, destination empresa
   - RAISES EXCEPTION on violation

6. **Triggers (2 total)** - Automatic validation and updates
   - `actualizar_bp_relaciones_timestamp` - Updates `actualizado_en` on changes
   - `validar_relacion_compatible` - Validates relationship types before INSERT/UPDATE

7. **View v_relaciones_bidireccionales** - Bidirectional query support
   - UNION of direct records + auto-generated inverse records
   - Uses `invertir_rol()` for inverse role mapping
   - Adds `direccion` column ('directo' | 'inverso')
   - Eliminates need to query both directions manually

8. **Migration: contacto_emergencia_id** - Data migration
   - Migrated existing `personas.contacto_emergencia_id` references to `bp_relaciones`
   - Type: `referencia`, Rol destino: 'Contacto de Emergencia'
   - JSONB metadata includes `migrado_desde` field for traceability
   - Result: 0 records migrated (no existing data in this project)
   - Original field preserved for backwards compatibility

**Design Decision:** Uses `rol_origen` + `rol_destino` fields (instead of single `subtipo`) for maximum clarity and long-term maintainability.

**Documentation:**

For detailed schema information, see:

- [Database Overview](database/OVERVIEW.md) - Concepts and system architecture
- [Schema Reference](database/SCHEMA.md) - ERD, complete table definitions, functions, triggers
- [Tables Dictionary](database/TABLES.md) - Complete data dictionary with all 16 fields
- [Query Examples](database/QUERIES.md) - SQL patterns: 3 INSERT, 5 SELECT, 2 UPDATE examples
- [RLS Policies](database/RLS.md) - Security policies (basic policies implemented, production refinement pending)
- [Design Document](../TEMP_DOC/06-RELACIONES-BP-DESIGN.md) - Complete design rationale and decisions

**SQL Execution Order:**

While already applied in Supabase, the components were created in this order:

```sql
-- 1. ENUM
CREATE TYPE tipo_relacion_bp AS ENUM (...);

-- 2. Table
CREATE TABLE bp_relaciones (...);

-- 3. Indexes (7 total)
CREATE INDEX idx_bp_relaciones_origen ON bp_relaciones (...);
-- ... 6 more indexes

-- 4. Helper Functions
CREATE FUNCTION invertir_rol(rol TEXT) RETURNS TEXT ...;
CREATE FUNCTION validar_tipo_relacion_compatible() RETURNS TRIGGER ...;

-- 5. Triggers
CREATE TRIGGER actualizar_bp_relaciones_timestamp ...;
CREATE TRIGGER validar_relacion_compatible ...;

-- 6. View
CREATE VIEW v_relaciones_bidireccionales AS ...;

-- 7. RLS Policies
ALTER TABLE bp_relaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON bp_relaciones ...;

-- 8. Data Migration
INSERT INTO bp_relaciones (...) SELECT ... FROM personas ...;
```

**Note:** All components are already active in the Supabase database and do not need to be re-executed.

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
