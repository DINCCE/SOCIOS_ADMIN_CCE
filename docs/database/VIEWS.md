# Database Views Reference

> **Complete reference for all pre-built database views**
>
> Last updated: 2025-12-28 | Auto-generated from live database schema

---

## Table of Contents

- [Overview](#overview)
- [Business Partner Views](#business-partner-views)
  - [v_actores_unificados](#v_actores_unificados)
  - [v_personas_org](#v_personas_org)
  - [v_empresas_org](#v_empresas_org)
  - [v_empresas_completa](#v_empresas_completa)
- [Acciones Views](#acciones-views)
  - [v_asignaciones_vigentes](#v_asignaciones_vigentes)
  - [v_asignaciones_historial](#v_asignaciones_historial)
  - [v_acciones_asignadas](#v_acciones_asignadas)
- [View Usage Patterns](#view-usage-patterns)
- [Performance Considerations](#performance-considerations)
- [Related Documentation](#related-documentation)

---

## Overview

The database provides **7 pre-built views** that simplify common queries and encapsulate business logic. All views use `SECURITY INVOKER` to respect Row Level Security (RLS) policies.

### View Categories

| Category | Views | Purpose |
|----------|-------|---------|
| **Business Partners** | 4 | Unified queries for personas + empresas |
| **Acciones** | 3 | Assignment tracking and history |

### Key Features

- ✅ **SECURITY INVOKER** - Views execute with caller's permissions (respects RLS)
- ✅ **Soft Delete Filtering** - Automatically excludes deleted records
- ✅ **Optimized JOINs** - Pre-optimized for common query patterns
- ✅ **Normalized Fields** - Consistent field names across views

**Total:** 7 views

---

## Business Partner Views

### v_actores_unificados

**Purpose:** Combined view of personas + empresas with unified field names for polymorphic queries.

**Use Cases:**
- Displaying all business partners in a single list
- Search across both personas and empresas
- Dropdown/select components that need all BP types

**Definition:**
```sql
CREATE VIEW v_actores_unificados
WITH (security_invoker = true) AS
SELECT
  bp.id,
  bp.codigo_bp,
  bp.tipo_actor,
  bp.organizacion_id,
  -- Unified name field
  COALESCE(
    p.nombres || ' ' || p.apellidos,
    e.razon_social
  ) AS nombre_completo,
  -- Unified identification
  COALESCE(
    p.numero_documento,
    e.nit || '-' || e.digito_verificacion
  ) AS identificacion,
  -- Contact fields
  bp.email_principal,
  COALESCE(bp.celular_principal, bp.telefono_principal) AS telefono,
  -- Metadata
  bp.atributos,
  COALESCE(p.perfil_persona, e.perfil_empresa) AS perfil,
  -- Audit fields
  bp.creado_en,
  bp.actualizado_en,
  bp.creado_por,
  bp.actualizado_por
FROM business_partners bp
LEFT JOIN personas p ON bp.id = p.id AND bp.tipo_actor = 'persona'
LEFT JOIN empresas e ON bp.id = e.id AND bp.tipo_actor = 'empresa'
WHERE bp.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get all business partners
const { data, error } = await supabase
  .from('v_actores_unificados')
  .select('*')
  .eq('organizacion_id', orgId)
  .order('nombre_completo')

// Search by name
const { data, error } = await supabase
  .from('v_actores_unificados')
  .select('*')
  .ilike('nombre_completo', `%${searchTerm}%`)
  .eq('organizacion_id', orgId)

// Filter by type
const { data, error } = await supabase
  .from('v_actores_unificados')
  .select('*')
  .eq('tipo_actor', 'persona')
  .eq('organizacion_id', orgId)
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Business partner ID |
| `codigo_bp` | TEXT | BP code (BP-0000001) |
| `tipo_actor` | TEXT | 'persona' or 'empresa' |
| `organizacion_id` | UUID | Organization ID |
| `nombre_completo` | TEXT | Unified name (nombres + apellidos OR razon_social) |
| `identificacion` | TEXT | Unified ID (numero_documento OR nit-dv) |
| `email_principal` | TEXT | Primary email |
| `telefono` | TEXT | Primary phone (celular OR telefono) |
| `atributos` | JSONB | Custom metadata |
| `perfil` | JSONB | Unified profile (perfil_persona OR perfil_empresa) |
| `creado_en` | TIMESTAMPTZ | Creation timestamp |

---

### v_personas_org

**Purpose:** Filtered view of active personas per organization with base table data.

**Use Cases:**
- List all natural persons in organization
- Persona-specific queries
- Member directories

**Definition:**
```sql
CREATE VIEW v_personas_org
WITH (security_invoker = true) AS
SELECT
  p.*,
  bp.codigo_bp,
  bp.organizacion_id,
  bp.email_principal,
  bp.celular_principal,
  bp.atributos,
  bp.creado_en,
  bp.actualizado_en,
  bp.creado_por,
  bp.actualizado_por
FROM personas p
JOIN business_partners bp ON p.id = bp.id
WHERE bp.tipo_actor = 'persona'
  AND bp.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get all personas in organization
const { data, error } = await supabase
  .from('v_personas_org')
  .select('*')
  .eq('organizacion_id', orgId)
  .order('apellidos', { ascending: true })

// Get by document number
const { data, error } = await supabase
  .from('v_personas_org')
  .select('*')
  .eq('numero_documento', '1234567890')
  .single()
```

**Fields:** All fields from `personas` + selected `business_partners` fields

---

### v_empresas_org

**Purpose:** Filtered view of active empresas per organization with base table data.

**Use Cases:**
- List all companies in organization
- Company directories
- Corporate member lists

**Definition:**
```sql
CREATE VIEW v_empresas_org
WITH (security_invoker = true) AS
SELECT
  e.*,
  bp.codigo_bp,
  bp.organizacion_id,
  bp.email_principal,
  bp.telefono_principal,
  bp.atributos,
  bp.creado_en,
  bp.actualizado_en,
  bp.creado_por,
  bp.actualizado_por
FROM empresas e
JOIN business_partners bp ON e.id = bp.id
WHERE bp.tipo_actor = 'empresa'
  AND bp.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get all empresas
const { data, error } = await supabase
  .from('v_empresas_org')
  .select('*')
  .eq('organizacion_id', orgId)
  .order('razon_social')

// Get by NIT
const { data, error } = await supabase
  .from('v_empresas_org')
  .select('*')
  .eq('nit', '900123456')
  .single()
```

---

### v_empresas_completa

**Purpose:** Complete empresa data with joins to organization and legal representative.

**Use Cases:**
- Detailed company view
- Company profile pages
- Reports requiring full company data

**Definition:**
```sql
CREATE VIEW v_empresas_completa
WITH (security_invoker = true) AS
SELECT
  e.*,
  bp.codigo_bp,
  bp.organizacion_id,
  bp.email_principal,
  bp.telefono_principal,
  bp.atributos,
  bp.creado_en,
  bp.actualizado_en,
  -- Organization data
  o.nombre AS organizacion_nombre,
  -- Legal representative data
  rep.codigo_bp AS rep_legal_codigo,
  COALESCE(
    rep_p.nombres || ' ' || rep_p.apellidos,
    rep_e.razon_social
  ) AS rep_legal_nombre
FROM empresas e
JOIN business_partners bp ON e.id = bp.id
JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN business_partners rep ON e.representante_legal_id = rep.id
LEFT JOIN personas rep_p ON rep.id = rep_p.id
LEFT JOIN empresas rep_e ON rep.id = rep_e.id
WHERE bp.tipo_actor = 'empresa'
  AND bp.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get complete empresa data
const { data, error } = await supabase
  .from('v_empresas_completa')
  .select('*')
  .eq('id', empresaId)
  .single()
```

**Additional Fields:**
- `organizacion_nombre` - Organization name
- `rep_legal_codigo` - Legal representative BP code
- `rep_legal_nombre` - Legal representative full name

---

## Acciones Views

### v_asignaciones_vigentes

**Purpose:** Current active assignments with business partner details (only valid assignments where `es_vigente = TRUE`).

**Use Cases:**
- List current action owners
- Active beneficiaries display
- "Who owns this action?" queries

**Definition:**
```sql
CREATE VIEW v_asignaciones_vigentes
WITH (security_invoker = true) AS
SELECT
  aa.id,
  aa.accion_id,
  aa.persona_id,
  aa.tipo_asignacion,
  aa.subcodigo,
  aa.codigo_completo,
  aa.fecha_inicio,
  aa.atributos,
  aa.creado_en,
  aa.creado_por,
  -- Accion data
  a.codigo AS accion_codigo,
  a.nombre AS accion_nombre,
  -- Business partner data
  bp.codigo_bp AS persona_codigo,
  bp.tipo_actor AS persona_tipo,
  COALESCE(
    p.nombres || ' ' || p.apellidos,
    e.razon_social
  ) AS persona_nombre
FROM asignaciones_acciones aa
JOIN acciones a ON aa.accion_id = a.id
JOIN business_partners bp ON aa.persona_id = bp.id
LEFT JOIN personas p ON bp.id = p.id
LEFT JOIN empresas e ON bp.id = e.id
WHERE aa.es_vigente = TRUE
  AND aa.eliminado_en IS NULL
  AND a.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get current owner of action
const { data, error } = await supabase
  .from('v_asignaciones_vigentes')
  .select('*')
  .eq('accion_id', accionId)
  .eq('tipo_asignacion', 'dueño')
  .single()

// Get all beneficiaries
const { data, error } = await supabase
  .from('v_asignaciones_vigentes')
  .select('*')
  .eq('accion_id', accionId)
  .eq('tipo_asignacion', 'beneficiario')

// Get all assignments for a person
const { data, error } = await supabase
  .from('v_asignaciones_vigentes')
  .select('*')
  .eq('persona_id', personaId)
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Assignment ID |
| `accion_id` | UUID | Action ID |
| `persona_id` | UUID | Business partner ID |
| `tipo_asignacion` | TEXT | dueño, titular, or beneficiario |
| `subcodigo` | TEXT | Assignment subcode (00-99) |
| `codigo_completo` | TEXT | Complete code (accion + subcodigo) |
| `fecha_inicio` | DATE | Assignment start date |
| `atributos` | JSONB | Assignment metadata |
| `accion_codigo` | TEXT | Action code (4398) |
| `accion_nombre` | TEXT | Action name |
| `persona_codigo` | TEXT | BP code (BP-0000001) |
| `persona_tipo` | TEXT | 'persona' or 'empresa' |
| `persona_nombre` | TEXT | BP full name |

---

### v_asignaciones_historial

**Purpose:** Complete assignment history including finalized assignments (all assignments regardless of `es_vigente` status).

**Use Cases:**
- Historical ownership tracking
- Audit trails
- "Who owned this action in 2020?" queries
- Transfer history

**Definition:**
```sql
CREATE VIEW v_asignaciones_historial
WITH (security_invoker = true) AS
SELECT
  aa.id,
  aa.accion_id,
  aa.persona_id,
  aa.tipo_asignacion,
  aa.subcodigo,
  aa.codigo_completo,
  aa.fecha_inicio,
  aa.fecha_fin,
  aa.es_vigente,
  aa.atributos,
  aa.creado_en,
  aa.creado_por,
  -- Accion data
  a.codigo AS accion_codigo,
  a.nombre AS accion_nombre,
  -- Business partner data
  bp.codigo_bp AS persona_codigo,
  COALESCE(
    p.nombres || ' ' || p.apellidos,
    e.razon_social
  ) AS persona_nombre,
  -- Status
  CASE
    WHEN aa.fecha_fin IS NULL THEN 'Vigente'
    WHEN aa.fecha_fin <= CURRENT_DATE THEN 'Finalizada'
    ELSE 'Por Finalizar'
  END AS estado
FROM asignaciones_acciones aa
JOIN acciones a ON aa.accion_id = a.id
JOIN business_partners bp ON aa.persona_id = bp.id
LEFT JOIN personas p ON bp.id = p.id
LEFT JOIN empresas e ON bp.id = e.id
WHERE aa.eliminado_en IS NULL
  AND a.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get complete ownership history
const { data, error } = await supabase
  .from('v_asignaciones_historial')
  .select('*')
  .eq('accion_id', accionId)
  .eq('tipo_asignacion', 'dueño')
  .order('fecha_inicio', { ascending: false })

// Get assignments in date range
const { data, error } = await supabase
  .from('v_asignaciones_historial')
  .select('*')
  .eq('accion_id', accionId)
  .gte('fecha_inicio', '2024-01-01')
  .lte('fecha_inicio', '2024-12-31')
```

**Additional Fields:**
- `fecha_fin` - Assignment end date (NULL if active)
- `es_vigente` - Boolean (TRUE if active)
- `estado` - Status text ('Vigente', 'Finalizada', 'Por Finalizar')

---

### v_acciones_asignadas

**Purpose:** Summary view showing owner (dueño), holder (titular), and beneficiaries per action.

**Use Cases:**
- Action ownership dashboard
- Quick "who's associated with this action?" queries
- Assignment summaries

**Definition:**
```sql
CREATE VIEW v_acciones_asignadas
WITH (security_invoker = true) AS
SELECT
  a.id AS accion_id,
  a.codigo AS accion_codigo,
  a.nombre AS accion_nombre,
  a.organizacion_id,
  -- Owner
  (
    SELECT persona_codigo
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'dueño'
    LIMIT 1
  ) AS dueno_codigo,
  (
    SELECT persona_nombre
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'dueño'
    LIMIT 1
  ) AS dueno_nombre,
  -- Titular
  (
    SELECT persona_codigo
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'titular'
    LIMIT 1
  ) AS titular_codigo,
  (
    SELECT persona_nombre
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'titular'
    LIMIT 1
  ) AS titular_nombre,
  -- Beneficiaries (array)
  (
    SELECT array_agg(persona_codigo ORDER BY codigo_completo)
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'beneficiario'
  ) AS beneficiarios_codigos,
  (
    SELECT array_agg(persona_nombre ORDER BY codigo_completo)
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'beneficiario'
  ) AS beneficiarios_nombres,
  -- Counts
  (
    SELECT COUNT(*)
    FROM v_asignaciones_vigentes
    WHERE accion_id = a.id
      AND tipo_asignacion = 'beneficiario'
  ) AS total_beneficiarios
FROM acciones a
WHERE a.eliminado_en IS NULL;
```

**TypeScript Usage:**
```typescript
// Get all actions with assignments summary
const { data, error } = await supabase
  .from('v_acciones_asignadas')
  .select('*')
  .eq('organizacion_id', orgId)
  .order('accion_codigo')

// Get specific action summary
const { data, error } = await supabase
  .from('v_acciones_asignadas')
  .select('*')
  .eq('accion_codigo', '4398')
  .single()
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `accion_id` | UUID | Action ID |
| `accion_codigo` | TEXT | Action code (4398) |
| `accion_nombre` | TEXT | Action name |
| `organizacion_id` | UUID | Organization ID |
| `dueno_codigo` | TEXT | Owner BP code (or NULL) |
| `dueno_nombre` | TEXT | Owner full name (or NULL) |
| `titular_codigo` | TEXT | Holder BP code (or NULL) |
| `titular_nombre` | TEXT | Holder full name (or NULL) |
| `beneficiarios_codigos` | TEXT[] | Array of beneficiary BP codes |
| `beneficiarios_nombres` | TEXT[] | Array of beneficiary names |
| `total_beneficiarios` | BIGINT | Count of beneficiaries |

---

## View Usage Patterns

### Prefer Views Over Manual JOINs

**❌ Don't:**
```typescript
// Manual JOIN - verbose and error-prone
const { data, error } = await supabase
  .from('business_partners')
  .select(`
    *,
    personas(*),
    empresas(*)
  `)
  .is('eliminado_en', null)
  .eq('organizacion_id', orgId)
```

**✅ Do:**
```typescript
// Use pre-built view - simpler and optimized
const { data, error } = await supabase
  .from('v_actores_unificados')
  .select('*')
  .eq('organizacion_id', orgId)
```

### Combine Views with Filters

```typescript
// Get all active owners
const { data, error } = await supabase
  .from('v_asignaciones_vigentes')
  .select('*')
  .eq('tipo_asignacion', 'dueño')
  .eq('organizacion_id', orgId) // Filtered via RLS

// Get personas created this year
const { data, error } = await supabase
  .from('v_personas_org')
  .select('*')
  .gte('creado_en', '2024-01-01')
  .eq('organizacion_id', orgId)
```

### Use Views for Reporting

```typescript
// Monthly assignment report
const { data, error } = await supabase
  .from('v_asignaciones_historial')
  .select('*')
  .gte('fecha_inicio', '2024-01-01')
  .lt('fecha_inicio', '2024-02-01')
  .order('fecha_inicio')

// Combine multiple views for complex reports
const [personas, empresas, asignaciones] = await Promise.all([
  supabase.from('v_personas_org').select('*'),
  supabase.from('v_empresas_org').select('*'),
  supabase.from('v_asignaciones_vigentes').select('*')
])
```

---

## Performance Considerations

### 1. Views Respect RLS

All views use `SECURITY INVOKER`, meaning:
- ✅ RLS policies are enforced on underlying tables
- ✅ User sees only data they have permission to access
- ✅ No security bypass risks

### 2. No Materialization

Views are **NOT materialized** - they execute the query every time:
- Data is always fresh (no cache staleness)
- Performance depends on underlying table indexes
- Consider caching view results in TanStack Query

**Example caching:**
```typescript
const { data } = useQuery({
  queryKey: ['actores', orgId],
  queryFn: async () => {
    const { data } = await supabase
      .from('v_actores_unificados')
      .select('*')
      .eq('organizacion_id', orgId)
    return data
  },
  staleTime: 60 * 1000, // Cache for 1 minute
})
```

### 3. Index Optimization

Views benefit from indexes on:
- `business_partners.organizacion_id` (organization filter)
- `business_partners.codigo_bp` (unique lookup)
- `acciones.codigo` (action lookup)
- `asignaciones_acciones.accion_id` (assignment queries)

### 4. Limit Results

Always limit results for large datasets:
```typescript
.select('*')
.limit(100)
.order('creado_en', { ascending: false })
```

---

## Related Documentation

### Database Documentation
- **[OVERVIEW.md](./OVERVIEW.md)** - Architecture patterns and concepts
- **[SCHEMA.md](./SCHEMA.md)** - Complete schema with ERD diagrams
- **[TABLES.md](./TABLES.md)** - Data dictionary for all tables
- **[FUNCTIONS.md](./FUNCTIONS.md)** - All database functions
- **[RLS.md](./RLS.md)** - Row Level Security policies
- **[QUERIES.md](./QUERIES.md)** - SQL cookbook and patterns

### API Documentation
- **[../api/README.md](../api/README.md)** - API overview and RPC index
- **[../api/CREAR_PERSONA.md](../api/CREAR_PERSONA.md)** - Create natural person API
- **[../api/CREAR_EMPRESA.md](../api/CREAR_EMPRESA.md)** - Create company API
- **[../api/BP_RELACIONES.md](../api/BP_RELACIONES.md)** - Relationship management API
- **[../api/ACCIONES.md](../api/ACCIONES.md)** - Club shares management API

---

**Last Generated:** 2025-12-28
**Total Views:** 7 (4 Business Partners + 3 Acciones)
**Security:** All views use SECURITY INVOKER

