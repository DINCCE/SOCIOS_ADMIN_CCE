# Database Overview

> **Last Updated:** 2026-01-08
> **Architecture:** Multi-tenant SaaS with Row Level Security
> **Pattern:** Single Table Inheritance (STI) for Business Partners

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Core Concepts](#core-concepts)
3. [Design Patterns](#design-patterns)
4. [Security Model](#security-model)
5. [Performance Strategy](#performance-strategy)
6. [Data Lifecycle](#data-lifecycle)
7. [Roadmap](#roadmap)

---

## Architecture Principles

### 1. Multi-Tenancy by Organization

The database implements **shared schema, multi-tenancy** using organization-based isolation:

```sql
-- Every table has organization_id
CREATE TABLE dm_actores (
  id uuid PRIMARY KEY,
  organizacion_id uuid NOT NULL REFERENCES config_organizaciones(id),
  -- RLS ensures users only see their organization's data
);
```

**Benefits:**
- ✅ Single database instance serves all customers
- ✅ Strong tenant isolation via RLS
- ✅ Efficient resource utilization
- ✅ Easy tenant-specific backups

**Trade-offs:**
- ⚠️ No per-tenant customization at schema level
- ⚠️ Requires careful RLS policy design

---

### 2. Row Level Security (RLS) as Primary Security

**Security enforcement happens at the database layer**, not in application code.

```sql
-- Policy example
CREATE POLICY bp_select_filtered ON dm_actores
  FOR SELECT
  TO authenticated
  USING (
    organizacion_id IN (
      SELECT organization_id
      FROM config_organizacion_miembros
      WHERE user_id = auth.uid()
        AND eliminado_en IS NULL
    )
  );
```

**Key Principles:**

1. **Never trust the application** - RLS is the final authority
2. **Use `auth.uid()`** for user context in policies
3. **Combine with organization membership** for multi-tenancy
4. **Apply to all tables** - No exceptions

**RLS Policy Pattern:**

| Operation | Policy Pattern | Example |
|-----------|----------------|---------|
| SELECT | Filter by organization_id + soft delete | `WHERE organizacion_id = ... AND eliminado_en IS NULL` |
| INSERT | Check user is org member | `WHERE is_org_member(org_id)` |
| UPDATE | User can update if they could insert | Same as INSERT |
| DELETE | Soft delete preferred | `SET eliminado_en = NOW()` |

---

### 3. Soft Delete Pattern

**No physical DELETE** - mark records as deleted instead.

```sql
-- Every table has soft delete columns
CREATE TABLE dm_actores (
  -- ... other columns ...
  eliminado_en TIMESTAMPTZ,        -- NULL = active, NOT NULL = deleted
  eliminado_por UUID REFERENCES auth.users(id)
);

-- Query only active records
SELECT * FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL;  -- Only active
```

**Benefits:**
- ✅ Audit trail preserved
- ✅ Easy recovery (set `eliminado_en = NULL`)
- ✅ Referential integrity maintained
- ✅ Analytics include historical data

**Implementation:**

```sql
-- Soft delete function
CREATE FUNCTION soft_delete_bp(p_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE dm_actores
  SET eliminado_en = NOW(),
      eliminado_por = auth.uid()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage in application
SELECT soft_delete_bp('actor-uuid');
```

---

### 4. Audit Fields for Traceability

**All tables track who did what when:**

```sql
-- Standard audit columns
CREATE TABLE example (
  -- ... business columns ...

  -- Soft delete
  eliminado_en TIMESTAMPTZ,
  eliminado_por UUID REFERENCES auth.users(id),

  -- Audit trail
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID REFERENCES auth.users(id),
  actualizado_por UUID REFERENCES auth.users(id)
);
```

**Trigger for auto-update:**

```sql
CREATE TRIGGER trg_example_actualizado
  BEFORE UPDATE ON example
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_config();
-- Automatically sets:
-- NEW.actualizado_en = NOW()
-- NEW.actualizado_por = auth.uid()
```

---

## Core Concepts

### Single Table Inheritance (STI)

**Purpose:** Model different types of business partners (persons and companies) efficiently.

**Migration Note (January 2025):**

- Previously used Class Table Inheritance (CTI) with separate `dm_personas` and `dm_empresas` tables
- Migrated to Single Table Inheritance (STI) for simplicity and performance
- Migration `20250105_drop_personas_empresas.sql` dropped the separate specialization tables

**Pattern (Current):**

```
┌─────────────────────────────────────────────────────────┐
│                    dm_actores                          │
│              (Single Table for All Actors)              │
├─────────────────────────────────────────────────────────┤
│  Common Fields:                                        │
│  • id (PK)              • codigo_bp                     │
│  • organizacion_id      • tipo_actor (enum)             │
│  • email_principal      • telefono_principal            │
│  • estado_actor         • eliminado_en                  │
├─────────────────────────────────────────────────────────┤
│  Type-Specific Fields (NULL if not applicable):          │
│  • primer_nombre, primer_apellido (if persona)          │
│  • razon_social, nombre_comercial (if empresa)          │
│  • genero, fecha_nacimiento (if persona)                │
├─────────────────────────────────────────────────────────┤
│  JSONB Profiles (Flexible Attributes):                  │
│  • perfil_identidad      • perfil_profesional_corp      │
│  • perfil_salud          • perfil_contacto              │
│  • perfil_intereses      • perfil_preferencias          │
│  • perfil_redes          • perfil_compliance            │
│  • perfil_referencias                                   │
└─────────────────────────────────────────────────────────┘
```

**Current Implementation:**

The system uses **Single Table Inheritance (STI)** where all actor types are stored in `dm_actores`:

```sql
CREATE TABLE dm_actores (
  id uuid PRIMARY KEY,
  tipo_actor tipo_actor_enum NOT NULL, -- 'persona' or 'empresa'

  -- Common fields
  email text,
  telefono text,

  -- Person fields (NULL if tipo_actor='empresa')
  primer_nombre text,
  primer_apellido text,
  nombre_completo text,

  -- Company fields (NULL if tipo_actor='persona')
  razon_social text,
  nit text,

  -- Validation constraint
  CHECK (
    (tipo_actor = 'persona' AND razon_social IS NULL) OR
    (tipo_actor = 'empresa' AND primer_nombre IS NULL)
  )
);
```

**Benefits:**
- ✅ No JOINs needed for common queries
- ✅ Simple to query and understand
- ✅ Easy to add new shared fields
- ✅ Type safety with CHECK constraints

**Trade-offs:**
- ⚠️ Some NULL fields (person fields empty for companies, and vice versa)
- ⚠️ Table width increases with more specializations

---

### Role-Based Access Control (RBAC)

**Three-tier model:**

```
┌─────────────────────────────────────────────────────┐
│               config_organizaciones                 │
│              (Organizations)                        │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼─────────┐            ┌────────▼────────┐
│ config_roles    │            │ config_organiza-│
│                 │            │ cion_miembros   │
│ - owner         │◄───────────│ - user_id       │
│ - admin         │            │ - organization_id│
│ - member        │            │ - role          │
│ - viewer        │            └────────┬─────────┘
└───────┬─────────┘                     │
        │                               │
        │                  ┌────────────┴────────────┐
        │                  │                         │
┌───────▼──────────────────▼──────┐  ┌─────────────────────────┐
│    config_roles_permisos        │  │      auth.users         │
│                                 │  │                         │
│ - role          ├───────────────┘  │ - id (PK)              │
│ - resource      │                  │ - email                │
│ - action        │                  │ - encrypted_password   │
│ - allow         │                  └─────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

**Permission Matrix:**

| Role | config_* tables | dm_* tables | tr_* tables | vn_* tables |
|------|----------------|-------------|-------------|-------------|
| **owner** | Full access | Full access | Full access | Full access |
| **admin** | Read only | Full access | Full access | Full access |
| **member** | Read only | Read/Insert | Read/Insert | Read/Insert |
| **viewer** | Read only | Read only | Read only | Read only |

**Permission Check Function:**

```sql
-- Check if user has permission
SELECT has_org_permission(
  'org-uuid'::uuid,
  'tr_tareas:update'  -- resource:action format
);
```

---

### Temporal Data Patterns

**Time-based data** for assignments and relationships.

#### vn_asociados (Share Assignments)

```sql
CREATE TABLE vn_asociados (
  accion_id uuid NOT NULL,
  business_partner_id uuid NOT NULL,
  tipo_asignacion text NOT NULL, -- dueño/titular/beneficiario
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,                -- NULL = currently active
  es_actual boolean GENERATED ALWAYS AS (
    (fecha_fin IS NULL) OR (fecha_fin > CURRENT_DATE)
  ) STORED
);
```

**Query current owners:**

```sql
SELECT *
FROM vn_asociados
WHERE accion_id = 'accion-uuid'
  AND tipo_asignacion = 'dueño'
  AND es_actual = true;
```

**Business rules:**
- Only ONE active dueño (owner) per acción
- Only ONE active titular (holder) per acción
- Multiple beneficiaries allowed

---

## Design Patterns

### 1. Organization Scoping

**Every query** must be scoped to an organization:

```sql
-- Good: Explicit organization filter
SELECT * FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL;

-- Bad: No organization filter (security risk!)
SELECT * FROM dm_actores;
```

**Application helper:**

```typescript
// Supabase query with automatic org scoping
async function getActores(orgId: string) {
  const { data } = await supabase
    .from('dm_actores')
    .select('*')
    .eq('organizacion_id', orgId)  // Always include!
    .is('eliminado_en', null);
  return data;
}
```

---

### 2. Enum Type Safety

**Use PostgreSQL enums** for type-safe columns:

```sql
CREATE TYPE tipo_actor_enum AS ENUM ('persona', 'empresa');
CREATE TYPE tr_doc_comercial_estados AS ENUM (
  'lead', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'
);
CREATE TYPE tr_tr_tareas_prioridad AS ENUM (
  'Baja', 'Media', 'Alta', 'Urgente'
);

CREATE TABLE dm_actores (
  tipo_actor tipo_actor_enum NOT NULL
);

-- Type-safe in queries
SELECT * FROM dm_actores
WHERE tipo_actor = 'persona';  -- Compiler checks validity
```

**Benefits:**
- ✅ Type safety - invalid values rejected at database level
- ✅ Self-documenting - enum values define domain
- ✅ Efficient storage - stored as integers internally
- ✅ Easy to extend - add new enum values

---

### 3. JSONB for Flexible Metadata

**JSONB columns** for extensible attributes:

```sql
CREATE TABLE dm_actores (
  atributos jsonb DEFAULT '{}'::jsonb
);

-- Store flexible data
INSERT INTO dm_actores (atributos) VALUES (
  '{
    "preferencias_contacto": ["email", "whatsapp"],
    "horario_contacto": "9-18",
    "notas": "Cliente VIP"
  }'
);

-- Query JSONB fields
SELECT *
FROM dm_actores
WHERE atributos->>'notas' = 'Cliente VIP';

-- Index JSONB for performance
CREATE INDEX idx_atributos_gin ON dm_actores USING GIN (atributos);
```

**Use cases:**
- User preferences
- Feature flags per organization
- Temporary/custom fields
- Analytics metadata

---

### 4. Code Generation

**Auto-generate codes** using triggers:

```sql
-- Business partner code generation
CREATE FUNCTION generar_codigo_dm_actores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_bp IS NULL OR NEW.codigo_bp = '' THEN
    NEW.codigo_bp := (
      WITH last AS (
        SELECT max(codigo_bp) AS max_code
        FROM dm_actores
        WHERE codigo_bp ~ '^AC-[0-9]{8}$'
      )
      SELECT COALESCE(
        'AC-' || to_char(
          COALESCE(
            (regexp_match(max_code, '([0-9]{8})'))[1]::int, 0
          ) + 1,
          'FM00000000'
        ),
        'AC-00000001'
      ) FROM last
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_codigo_dm_actores
  BEFORE INSERT ON dm_actores
  FOR EACH ROW
  EXECUTE FUNCTION generar_codigo_dm_actores();
```

**Code formats:**
- Business Partners: `AC-00000001`, `AC-00000002`...
- Opportunities: `OP-0000000001`, `OP-0000000002`...
- Tasks: `TSK-00000001`, `TSK-00000002`...

---

## Security Model

### Defense in Depth

```
┌─────────────────────────────────────────────────────┐
│                   Application                       │
│  - Input validation                                │
│  - Authentication checks                           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Row Level Security (RLS)               │
│  - Organization isolation                          │
│  - Role-based permissions                          │
│  - Soft delete filtering                           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│               Database Constraints                  │
│  - Foreign keys                                    │
│  - CHECK constraints                               │
│  - UNIQUE constraints                              │
└─────────────────────────────────────────────────────┘
```

### SECURITY DEFINER Functions

**Functions with elevated privileges** for permission checks:

```sql
CREATE FUNCTION is_org_member(p_org_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'  -- Prevent SQL injection
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM config_organizacion_miembros om
    WHERE om.organization_id = p_org_id
      AND om.user_id = COALESCE(p_user_id, auth.uid())
      AND om.eliminado_en IS NULL
  );
END;
$$;
```

**Security considerations:**

1. **Always SET search_path** to prevent trojan horse attacks
2. **Use SECURITY DEFINER** for functions that need RLS bypass
3. **Default parameters** from `auth.uid()` for convenience
4. **Validate inputs** to prevent SQL injection

---

## Performance Strategy

### Partial Indexes for Soft Delete

**Index only active records** to save space and improve performance:

```sql
-- Bad: Indexes all records including deleted
CREATE INDEX idx_all_actores ON dm_actores(organizacion_id);

-- Good: Index only active records
CREATE INDEX idx_dm_actores_activos
  ON dm_actores(organizacion_id, eliminado_en, creado_en)
  WHERE eliminado_en IS NULL;  -- Partial index
```

**Benefits:**
- ✅ 50% smaller index (if ~50% soft-deleted)
- ✅ Faster queries on active data
- ✅ Less maintenance overhead

**Query planner automatically uses partial index when applicable:**

```sql
-- Uses partial index
SELECT * FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL;

-- Does NOT use partial index (deleted records)
SELECT * FROM dm_actores
WHERE eliminado_en IS NOT NULL;
```

---

### Composite Indexes for Common Queries

**Match your query patterns:**

```sql
-- Query: Get active tasks for a user ordered by priority
SELECT * FROM tr_tr_tareas
WHERE organizacion_id = 'org-uuid'
  AND asignado_a = 'user-uuid'
  AND estado = 'pendiente'
ORDER BY prioridad DESC, fecha_vencimiento ASC;

-- Matching index
CREATE INDEX idx_tr_tr_tareas_activas
  ON tr_tr_tareas(organizacion_id, asignado_a, estado, fecha_vencimiento)
  WHERE eliminado_en IS NULL;
```

**Index design principles:**
1. **Leading column**: Most selective filter (usually organizacion_id)
2. **Include columns**: Used in WHERE clause
3. **Covering index**: Include columns used in SELECT
4. **Partial condition**: `WHERE eliminado_en IS NULL`

---

### Foreign Key Indexing

**Always index foreign keys** for JOIN performance:

```sql
-- FK to dm_actores
CREATE INDEX idx_tr_tr_tareas_asignado_a
  ON tr_tr_tareas(asignado_a)
  WHERE asignado_a IS NOT NULL;

-- FK to config_organizaciones
CREATE INDEX idx_dm_actores_org
  ON dm_actores(organizacion_id);
```

**Why?**
- Speeds up JOINs
- Required for DELETE operations (cascading)
- Improves filtering on FK columns

---

## Data Lifecycle

### 1. Creation

```sql
INSERT INTO dm_actores (
  organizacion_id,
  tipo_actor,
  primer_nombre,
  email
) VALUES (
  'org-uuid',
  'persona',
  'Juan',
  'juan@example.com'
);
-- Trigger sets:
-- - codigo_bp = auto-generated
-- - creado_en = NOW()
-- - creado_por = auth.uid()
```

### 2. Updates

```sql
UPDATE dm_actores
SET email = 'newemail@example.com'
WHERE id = 'actor-uuid';
-- Trigger sets:
-- - actualizado_en = NOW()
-- - actualizado_por = auth.uid()
```

### 3. Soft Delete

```sql
-- Option 1: Direct UPDATE
UPDATE dm_actores
SET eliminado_en = NOW(),
    eliminado_por = auth.uid()
WHERE id = 'actor-uuid';

-- Option 2: Function (recommended)
SELECT soft_delete_bp('actor-uuid');
```

### 4. Hard Delete (rare)

```sql
-- Only for truly sensitive data that must be purged
-- Requires admin privileges
DELETE FROM dm_actores
WHERE id = 'actor-uuid';
```

---

## Roadmap

### Phase 1: Current ✅
- [x] Multi-tenancy with RLS
- [x] Soft delete pattern
- [x] Audit fields on all tables
- [x] Partial indexes for performance
- [x] Single Table Inheritance (STI) pattern for actors

### Phase 2: Next Quarter
- [ ] Materialized views for dashboards
- [ ] Full-text search implementation
- [ ] Data archival strategy
- [ ] Query performance monitoring
- [ ] Automated backup verification

### Phase 3: Future
- [ ] Read replicas for analytics
- [ ] Partitioning for high-volume tables
- [ ] Caching layer (Redis)
- [ ] Event sourcing for audit trail
- [ ] GraphQL API

---

## See Also

- [TABLES.md](TABLES.md) - Complete data dictionary
- [SCHEMA.md](SCHEMA.md) - ERD and relationships
- [VIEWS.md](VIEWS.md) - Database views
- [QUERIES.md](QUERIES.md) - Common SQL patterns
- [RLS.md](RLS.md) - Row Level Security policies

---

## Glossary

| Term | Definition |
|------|------------|
| **Actor** | Business partner: person (persona) or company (empresa) |
| **Organización** | Tenant in multi-tenant system |
| **Soft Delete** | Marking records as deleted without removing them |
| **RLS** | Row Level Security - PostgreSQL feature for row-level access control |
| **STI** | Single Table Inheritance - One table stores multiple entity types with a discriminator column |
| **RBAC** | Role-Based Access Control - Permission model using roles |
| **Enum** | PostgreSQL enumerated type for type-safe columns |
| **JSONB** | Binary JSON type for flexible schema storage |
| **Partial Index** | Index on subset of rows (e.g., WHERE eliminado_en IS NULL) |
| **SECURITY DEFINER** | Function that executes with owner privileges, not caller |
