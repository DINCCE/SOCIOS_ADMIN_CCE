# SQL Cookbook & Query Patterns

> **Common query patterns and frontend integration examples**
>
> Last updated: 2025-12-28 | Auto-generated from live database schema

---

## Table of Contents

- [Introduction](#introduction)
- [Frontend Integration Patterns](#frontend-integration-patterns)
  - [Server Actions Pattern](#server-actions-pattern)
  - [TanStack Query Pattern](#tanstack-query-pattern)
- [Business Partner Queries](#business-partner-queries)
  - [Creating Business Partners](#creating-business-partners)
  - [Querying with CTI Pattern](#querying-with-cti-pattern)
  - [Unified Queries (Personas + Empresas)](#unified-queries-personas--empresas)
  - [Filtering and Search](#filtering-and-search)
- [Relationship Queries](#relationship-queries)
  - [Creating Relationships](#creating-relationships)
  - [Bidirectional Queries](#bidirectional-queries)
  - [Relationship History](#relationship-history)
- [Acciones Queries](#acciones-queries)
  - [Assignment Operations](#assignment-operations)
  - [Ownership Tracking](#ownership-tracking)
  - [Historical Queries](#historical-queries)
- [Soft Delete Patterns](#soft-delete-patterns)
- [JSONB Queries](#jsonb-queries)
- [Aggregation Queries](#aggregation-queries)
- [Transaction Patterns](#transaction-patterns)
- [Performance Tips](#performance-tips)
- [Related Documentation](#related-documentation)

---

## Introduction

This cookbook provides practical SQL examples and TypeScript integration patterns for common operations in the business partner management system.

### Key Concepts

- **CTI Pattern** - Class Table Inheritance requires JOINs between base and specialization tables
- **RLS Enforcement** - All queries automatically filtered by Row Level Security
- **Soft Delete** - Always filter by `eliminado_en IS NULL` for active records
- **JSONB Flexibility** - Use JSONB operators for custom metadata queries
- **Temporal Tracking** - Query historical data with `fecha_inicio` / `fecha_fin`

### Query Categories

| Category | Examples | Complexity |
|----------|----------|------------|
| Business Partners | Create, read, update personas/empresas | Medium (CTI) |
| Relationships | Bidirectional queries, history | Medium |
| Acciones | Assignment tracking, ownership transfer | High (temporal) |
| Soft Delete | Active/archived filtering | Low |
| JSONB | Metadata search and filtering | Medium |
| Aggregations | Counts, summaries, analytics | Medium-High |

---

## Frontend Integration Patterns

### Server Actions Pattern

**When to use:** Form submissions, authenticated operations, server-side data mutations

**Pattern:**
```typescript
// app/actions/personas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPersona(params: PersonaParams) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_persona', {
    organizacion_id: params.organizacionId,
    nombres: params.nombres,
    apellidos: params.apellidos,
    email_principal: params.email,
    // ... other fields
  })

  if (error) {
    console.error('Failed to create persona:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/socios/personas')
  return { success: true, data }
}
```

**Usage in component:**
```typescript
'use client'

import { createPersona } from '@/app/actions/personas'
import { toast } from 'sonner'

function PersonaForm() {
  const handleSubmit = async (formData: FormData) => {
    const result = await createPersona({
      organizacionId: formData.get('org_id') as string,
      nombres: formData.get('nombres') as string,
      apellidos: formData.get('apellidos') as string,
      email: formData.get('email') as string,
    })

    if (result.success) {
      toast.success('Persona created successfully')
    } else {
      toast.error(result.error)
    }
  }

  return <form action={handleSubmit}>...</form>
}
```

---

### TanStack Query Pattern

**When to use:** Complex client state, optimistic updates, background refetching

**Pattern:**
```typescript
// hooks/use-personas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Query hook
export function usePersonas(organizacionId: string) {
  return useQuery({
    queryKey: ['personas', organizacionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_personas_org')
        .select('*')
        .eq('organizacion_id', organizacionId)
        .order('apellidos', { ascending: true })

      if (error) throw error
      return data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

// Mutation hook
export function useCreatePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: PersonaParams) => {
      const { data, error } = await supabase.rpc('crear_persona', params)
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ['personas', variables.organizacion_id]
      })

      // Or optimistically update cache
      queryClient.setQueryData(
        ['personas', variables.organizacion_id],
        (old: any[]) => [...(old || []), data]
      )
    },
  })
}
```

**Usage in component:**
```typescript
'use client'

import { usePersonas, useCreatePersona } from '@/hooks/use-personas'

function PersonasPage({ organizacionId }: Props) {
  const { data: personas, isLoading, error } = usePersonas(organizacionId)
  const createPersona = useCreatePersona()

  const handleCreate = (params: PersonaParams) => {
    createPersona.mutate(params, {
      onSuccess: () => toast.success('Persona created'),
      onError: (error) => toast.error(error.message)
    })
  }

  if (isLoading) return <Spinner />
  if (error) return <Error error={error} />

  return (
    <div>
      {personas?.map(p => <PersonaCard key={p.id} persona={p} />)}
      <PersonaForm onSubmit={handleCreate} isPending={createPersona.isPending} />
    </div>
  )
}
```

---

## Business Partner Queries

### Creating Business Partners

#### Create Persona via RPC (Recommended)

**SQL:**
```sql
SELECT crear_persona(
  organizacion_id := '..org-uuid..',
  nombres := 'Juan Carlos',
  apellidos := 'García López',
  email_principal := 'juan.garcia@example.com',
  celular_principal := '+57 300 123 4567',
  tipo_documento := 'CC',
  numero_documento := '1234567890',
  perfil_persona := '{"fecha_nacimiento": "1990-05-15", "ciudad": "Bogotá"}'::jsonb,
  atributos := '{"categoria_socio": "fundador"}'::jsonb
);
```

**TypeScript (Server Action):**
```typescript
const { data, error } = await supabase.rpc('crear_persona', {
  organizacion_id: orgId,
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  email_principal: 'juan.garcia@example.com',
  celular_principal: '+57 300 123 4567',
  tipo_documento: 'CC',
  numero_documento: '1234567890',
  perfil_persona: {
    fecha_nacimiento: '1990-05-15',
    ciudad: 'Bogotá'
  },
  atributos: {
    categoria_socio: 'fundador'
  }
})
```

#### Create Empresa via RPC (Recommended)

**SQL:**
```sql
SELECT crear_empresa(
  organizacion_id := '..org-uuid..',
  razon_social := 'Tech Solutions SAS',
  nombre_comercial := 'TechSol',
  email_principal := 'info@techsol.com',
  telefono_principal := '+57 1 234 5678',
  nit := '900123456',
  digito_verificacion := NULL, -- Auto-calculated
  representante_legal_id := '..bp-uuid..',
  perfil_empresa := '{"industria": "tecnologia", "tamano": "mediana"}'::jsonb,
  atributos := '{"patrocinador": true}'::jsonb
);
```

**TypeScript (TanStack Query):**
```typescript
const createEmpresa = useMutation({
  mutationFn: async (params: EmpresaParams) => {
    const { data, error } = await supabase.rpc('crear_empresa', {
      organizacion_id: params.orgId,
      razon_social: params.razonSocial,
      nombre_comercial: params.nombreComercial,
      nit: params.nit,
      // digito_verificacion auto-calculated
      representante_legal_id: params.repLegalId,
      perfil_empresa: params.perfil,
      atributos: params.atributos
    })
    if (error) throw error
    return data
  }
})
```

---

### Querying with CTI Pattern

#### Get All Personas (with Base Table Data)

**SQL:**
```sql
SELECT
  bp.id,
  bp.codigo_bp,
  bp.organizacion_id,
  bp.email_principal,
  bp.celular_principal,
  p.nombres,
  p.apellidos,
  p.tipo_documento,
  p.numero_documento,
  p.perfil_persona,
  bp.atributos,
  bp.creado_en
FROM business_partners bp
JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'
  AND bp.eliminado_en IS NULL
  AND bp.organizacion_id = '..org-uuid..'
ORDER BY p.apellidos, p.nombres;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('business_partners')
  .select(`
    id,
    codigo_bp,
    organizacion_id,
    email_principal,
    celular_principal,
    atributos,
    creado_en,
    personas (
      nombres,
      apellidos,
      tipo_documento,
      numero_documento,
      perfil_persona
    )
  `)
  .eq('tipo_actor', 'persona')
  .is('eliminado_en', null)
  .eq('organizacion_id', orgId)
  .order('apellidos', { foreignTable: 'personas' })
```

#### Get All Empresas (with Base Table Data)

**SQL:**
```sql
SELECT
  bp.id,
  bp.codigo_bp,
  bp.email_principal,
  bp.telefono_principal,
  e.razon_social,
  e.nombre_comercial,
  e.nit,
  e.digito_verificacion,
  e.representante_legal_id,
  e.perfil_empresa,
  bp.atributos
FROM business_partners bp
JOIN empresas e ON bp.id = e.id
WHERE bp.tipo_actor = 'empresa'
  AND bp.eliminado_en IS NULL
  AND bp.organizacion_id = '..org-uuid..'
ORDER BY e.razon_social;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('business_partners')
  .select(`
    id,
    codigo_bp,
    email_principal,
    atributos,
    empresas (
      razon_social,
      nombre_comercial,
      nit,
      digito_verificacion,
      representante_legal_id,
      perfil_empresa
    )
  `)
  .eq('tipo_actor', 'empresa')
  .is('eliminado_en', null)
  .eq('organizacion_id', orgId)
```

---

### Unified Queries (Personas + Empresas)

#### Get All Business Partners (Combined)

**Using View (Recommended):**
```sql
SELECT *
FROM v_actores_unificados
WHERE organizacion_id = '..org-uuid..'
ORDER BY nombre_completo;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('v_actores_unificados')
  .select('*')
  .eq('organizacion_id', orgId)
  .order('nombre_completo')
```

**Manual UNION (Alternative):**
```sql
SELECT
  bp.id,
  bp.codigo_bp,
  bp.tipo_actor,
  p.nombres || ' ' || p.apellidos AS nombre_completo,
  bp.email_principal,
  bp.celular_principal AS telefono,
  p.numero_documento AS identificacion
FROM business_partners bp
JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'
  AND bp.eliminado_en IS NULL

UNION ALL

SELECT
  bp.id,
  bp.codigo_bp,
  bp.tipo_actor,
  e.razon_social AS nombre_completo,
  bp.email_principal,
  bp.telefono_principal AS telefono,
  e.nit || '-' || e.digito_verificacion AS identificacion
FROM business_partners bp
JOIN empresas e ON bp.id = e.id
WHERE bp.tipo_actor = 'empresa'
  AND bp.eliminado_en IS NULL

ORDER BY nombre_completo;
```

---

### Filtering and Search

#### Search by Name/Email

**Personas:**
```sql
SELECT bp.*, p.*
FROM business_partners bp
JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'
  AND bp.eliminado_en IS NULL
  AND bp.organizacion_id = '..org-uuid..'
  AND (
    p.nombres ILIKE '%juan%'
    OR p.apellidos ILIKE '%garcia%'
    OR bp.email_principal ILIKE '%juan%'
  );
```

**TypeScript:**
```typescript
const searchTerm = 'juan'

const { data, error } = await supabase
  .from('v_personas_org')
  .select('*')
  .eq('organizacion_id', orgId)
  .or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,email_principal.ilike.%${searchTerm}%`)
```

#### Filter by Document Type

```sql
SELECT bp.*, p.*
FROM business_partners bp
JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'
  AND bp.eliminado_en IS NULL
  AND p.tipo_documento = 'CC'
  AND bp.organizacion_id = '..org-uuid..';
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('business_partners')
  .select('*, personas(*)')
  .eq('tipo_actor', 'persona')
  .is('eliminado_en', null)
  .eq('personas.tipo_documento', 'CC')
  .eq('organizacion_id', orgId)
```

---

## Relationship Queries

### Creating Relationships

#### Create Relationship via RPC (Recommended)

**SQL:**
```sql
SELECT crear_relacion_bp(
  bp_origen_id := '..persona-uuid..',
  bp_destino_id := '..empresa-uuid..',
  tipo_relacion := 'laboral',
  descripcion := 'Gerente General',
  fecha_inicio := '2024-01-01',
  atributos := '{"salario_rango": "alto", "dedicacion": "tiempo_completo"}'::jsonb
);
```

**TypeScript:**
```typescript
const { data, error } = await supabase.rpc('crear_relacion_bp', {
  bp_origen_id: personaId,
  bp_destino_id: empresaId,
  tipo_relacion: 'laboral',
  descripcion: 'Gerente General',
  fecha_inicio: '2024-01-01',
  atributos: {
    salario_rango: 'alto',
    dedicacion: 'tiempo_completo'
  }
})
```

---

### Bidirectional Queries

#### Get All Relationships for a Business Partner

**Using RPC (Recommended):**
```sql
SELECT * FROM obtener_relaciones_bp(
  bp_id := '..bp-uuid..',
  solo_vigentes := TRUE
);
```

**TypeScript:**
```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  bp_id: bpId,
  solo_vigentes: true
})
```

**Manual Query (Alternative):**
```sql
SELECT
  r.*,
  CASE
    WHEN r.bp_origen_id = '..bp-uuid..' THEN r.bp_destino_id
    ELSE r.bp_origen_id
  END AS bp_relacionado_id
FROM bp_relaciones r
WHERE (r.bp_origen_id = '..bp-uuid..' OR r.bp_destino_id = '..bp-uuid..')
  AND r.eliminado_en IS NULL
  AND r.es_vigente = TRUE;
```

---

### Relationship History

#### Get All Historical Relationships (Including Finalized)

```sql
SELECT
  r.*,
  bp_origen.codigo_bp AS origen_codigo,
  bp_destino.codigo_bp AS destino_codigo,
  CASE
    WHEN r.fecha_fin IS NULL THEN 'Vigente'
    ELSE 'Finalizada'
  END AS estado
FROM bp_relaciones r
JOIN business_partners bp_origen ON r.bp_origen_id = bp_origen.id
JOIN business_partners bp_destino ON r.bp_destino_id = bp_destino.id
WHERE r.eliminado_en IS NULL
  AND (r.bp_origen_id = '..bp-uuid..' OR r.bp_destino_id = '..bp-uuid..')
ORDER BY r.fecha_inicio DESC;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('bp_relaciones')
  .select(`
    *,
    bp_origen:business_partners!bp_origen_id(codigo_bp),
    bp_destino:business_partners!bp_destino_id(codigo_bp)
  `)
  .is('eliminado_en', null)
  .or(`bp_origen_id.eq.${bpId},bp_destino_id.eq.${bpId}`)
  .order('fecha_inicio', { ascending: false })
```

---

## Acciones Queries

### Assignment Operations

#### Create Assignment via RPC (Recommended)

**SQL:**
```sql
SELECT crear_asignacion_accion(
  accion_id := '..accion-uuid..',
  persona_id := '..bp-uuid..',
  tipo_asignacion := 'dueño',
  subcodigo := NULL, -- Auto-generated
  fecha_inicio := CURRENT_DATE,
  atributos := '{"modo_adquisicion": "compra"}'::jsonb
);
```

**TypeScript:**
```typescript
const { data, error } = await supabase.rpc('crear_asignacion_accion', {
  accion_id: accionId,
  persona_id: personaId,
  tipo_asignacion: 'dueño',
  // subcodigo auto-generated
  fecha_inicio: new Date().toISOString().split('T')[0],
  atributos: { modo_adquisicion: 'compra' }
})
```

#### Transfer Ownership

**SQL:**
```sql
SELECT transferir_accion(
  accion_id := '..accion-uuid..',
  nuevo_dueno_id := '..new-bp-uuid..',
  fecha_transferencia := CURRENT_DATE,
  atributos := '{"tipo_transferencia": "venta", "precio": 50000000}'::jsonb
);
```

**TypeScript:**
```typescript
const { data, error } = await supabase.rpc('transferir_accion', {
  accion_id: accionId,
  nuevo_dueno_id: nuevoDuenoId,
  fecha_transferencia: new Date().toISOString().split('T')[0],
  atributos: {
    tipo_transferencia: 'venta',
    precio: 50000000
  }
})
```

---

### Ownership Tracking

#### Get Current Owner of Action

**Using View:**
```sql
SELECT *
FROM v_asignaciones_vigentes
WHERE accion_id = '..accion-uuid..'
  AND tipo_asignacion = 'dueño';
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('v_asignaciones_vigentes')
  .select('*')
  .eq('accion_id', accionId)
  .eq('tipo_asignacion', 'dueño')
  .single()
```

#### Get All Beneficiaries

**SQL:**
```sql
SELECT
  aa.*,
  bp.codigo_bp,
  COALESCE(p.nombres || ' ' || p.apellidos, e.razon_social) AS nombre_persona
FROM asignaciones_acciones aa
JOIN business_partners bp ON aa.persona_id = bp.id
LEFT JOIN personas p ON bp.id = p.id
LEFT JOIN empresas e ON bp.id = e.id
WHERE aa.accion_id = '..accion-uuid..'
  AND aa.tipo_asignacion = 'beneficiario'
  AND aa.es_vigente = TRUE
  AND aa.eliminado_en IS NULL;
```

---

### Historical Queries

#### Get Complete Ownership History

**Using View:**
```sql
SELECT *
FROM v_asignaciones_historial
WHERE accion_id = '..accion-uuid..'
ORDER BY fecha_inicio DESC;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('v_asignaciones_historial')
  .select('*')
  .eq('accion_id', accionId)
  .order('fecha_inicio', { ascending: false })
```

#### Get Assignments by Date Range

```sql
SELECT *
FROM asignaciones_acciones
WHERE accion_id = '..accion-uuid..'
  AND fecha_inicio >= '2024-01-01'
  AND (fecha_fin IS NULL OR fecha_fin <= '2024-12-31')
  AND eliminado_en IS NULL;
```

---

## Soft Delete Patterns

### Soft Delete Record

**Business Partner:**
```sql
UPDATE business_partners
SET eliminado_en = NOW() -- eliminado_por auto-set by trigger
WHERE id = '..bp-uuid..';
```

**TypeScript:**
```typescript
const { error } = await supabase
  .from('business_partners')
  .update({ eliminado_en: new Date().toISOString() })
  .eq('id', bpId)
```

### Query Only Active Records

**Always include:**
```sql
WHERE eliminado_en IS NULL
```

**TypeScript:**
```typescript
.is('eliminado_en', null)
```

### Query Archived Records

```sql
SELECT *
FROM business_partners
WHERE eliminado_en IS NOT NULL
ORDER BY eliminado_en DESC;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('business_partners')
  .select('*')
  .not('eliminado_en', 'is', null)
  .order('eliminado_en', { ascending: false })
```

### Restore Soft-Deleted Record

```sql
UPDATE business_partners
SET eliminado_en = NULL,
    eliminado_por = NULL
WHERE id = '..bp-uuid..';
```

---

## JSONB Queries

### Query by JSONB Field

**Check if field exists:**
```sql
SELECT *
FROM business_partners
WHERE atributos ? 'categoria_socio';
```

**TypeScript:**
```typescript
.contains('atributos', { categoria_socio: 'fundador' })
```

**Get specific value:**
```sql
SELECT *
FROM personas
WHERE perfil_persona->>'ciudad' = 'Bogotá';
```

**TypeScript:**
```typescript
.eq('perfil_persona->ciudad', 'Bogotá')
```

### Query by Nested JSONB

```sql
SELECT *
FROM empresas
WHERE perfil_empresa->'contacto'->>'email' = 'contacto@empresa.com';
```

### Update JSONB Field

**Merge new fields:**
```sql
UPDATE business_partners
SET atributos = atributos || '{"vip": true}'::jsonb
WHERE id = '..bp-uuid..';
```

**TypeScript:**
```typescript
const { data: current } = await supabase
  .from('business_partners')
  .select('atributos')
  .eq('id', bpId)
  .single()

const { error } = await supabase
  .from('business_partners')
  .update({
    atributos: {
      ...current.atributos,
      vip: true
    }
  })
  .eq('id', bpId)
```

---

## Aggregation Queries

### Count Business Partners by Type

```sql
SELECT
  tipo_actor,
  COUNT(*) AS total
FROM business_partners
WHERE eliminado_en IS NULL
  AND organizacion_id = '..org-uuid..'
GROUP BY tipo_actor;
```

**TypeScript:**
```typescript
const { data, error } = await supabase
  .from('business_partners')
  .select('tipo_actor')
  .is('eliminado_en', null)
  .eq('organizacion_id', orgId)

const counts = data?.reduce((acc, row) => {
  acc[row.tipo_actor] = (acc[row.tipo_actor] || 0) + 1
  return acc
}, {} as Record<string, number>)
```

### Count Active Relationships by Type

```sql
SELECT
  tipo_relacion,
  COUNT(*) AS total
FROM bp_relaciones
WHERE eliminado_en IS NULL
  AND es_vigente = TRUE
GROUP BY tipo_relacion
ORDER BY total DESC;
```

### Get Assignment Statistics

```sql
SELECT
  a.codigo AS accion,
  COUNT(*) FILTER (WHERE aa.tipo_asignacion = 'dueño') AS duenos,
  COUNT(*) FILTER (WHERE aa.tipo_asignacion = 'titular') AS titulares,
  COUNT(*) FILTER (WHERE aa.tipo_asignacion = 'beneficiario') AS beneficiarios
FROM acciones a
LEFT JOIN asignaciones_acciones aa ON a.id = aa.accion_id
  AND aa.es_vigente = TRUE
  AND aa.eliminado_en IS NULL
WHERE a.eliminado_en IS NULL
GROUP BY a.id, a.codigo;
```

---

## Transaction Patterns

### Multi-Table Insert (CTI Pattern)

**PostgreSQL Transaction:**
```sql
BEGIN;

-- Insert into base table
INSERT INTO business_partners (
  organizacion_id, tipo_actor, email_principal
) VALUES (
  '..org-uuid..', 'persona', 'example@email.com'
) RETURNING id;

-- Insert into specialization table
INSERT INTO personas (
  id, nombres, apellidos
) VALUES (
  '..bp-id-from-above..', 'John', 'Doe'
);

COMMIT;
```

**Note:** Use `crear_persona` RPC instead - it handles the transaction automatically.

### Conditional Update

```sql
-- Only update if not soft-deleted
UPDATE business_partners
SET email_principal = 'new@email.com'
WHERE id = '..bp-uuid..'
  AND eliminado_en IS NULL;
```

---

## Performance Tips

### 1. Use Views for Common Queries

**Instead of:**
```typescript
// Slow: Multiple JOINs every time
const { data } = await supabase
  .from('business_partners')
  .select('*, personas(*), empresas(*)')
```

**Use:**
```typescript
// Fast: Pre-optimized view
const { data } = await supabase
  .from('v_actores_unificados')
  .select('*')
```

### 2. Limit Results

```typescript
.select('*')
.limit(50)
.range(0, 49) // Pagination
```

### 3. Select Only Needed Fields

```typescript
// Instead of SELECT *
.select('id, codigo_bp, email_principal')
```

### 4. Use Indexes for Filters

The database has indexes on:
- `codigo_bp` (unique)
- `organizacion_id` (foreign key)
- `nit` (unique for empresas)
- `bp_origen_id`, `bp_destino_id` (relationships)

Always filter by indexed columns when possible.

### 5. Avoid N+1 Queries

**Instead of:**
```typescript
// N+1: One query per relationship
for (const bp of businessPartners) {
  const relations = await supabase.rpc('obtener_relaciones_bp', { bp_id: bp.id })
}
```

**Use:**
```typescript
// Single query with JOIN
const { data } = await supabase
  .from('bp_relaciones')
  .select('*, bp_origen:business_partners!bp_origen_id(*), bp_destino:business_partners!bp_destino_id(*)')
  .in('bp_origen_id', businessPartnerIds)
```

---

## Related Documentation

### Database Documentation
- **[OVERVIEW.md](./OVERVIEW.md)** - Architecture patterns and concepts
- **[SCHEMA.md](./SCHEMA.md)** - Complete schema with ERD diagrams
- **[TABLES.md](./TABLES.md)** - Data dictionary for all tables
- **[FUNCTIONS.md](./FUNCTIONS.md)** - All database functions
- **[VIEWS.md](./VIEWS.md)** - Pre-built views reference
- **[RLS.md](./RLS.md)** - Row Level Security policies

### API Documentation
- **[../api/README.md](../api/README.md)** - API overview and RPC index
- **[../api/CREAR_PERSONA.md](../api/CREAR_PERSONA.md)** - Create natural person API
- **[../api/CREAR_EMPRESA.md](../api/CREAR_EMPRESA.md)** - Create company API
- **[../api/BP_RELACIONES.md](../api/BP_RELACIONES.md)** - Relationship management API
- **[../api/ACCIONES.md](../api/ACCIONES.md)** - Club shares management API

---

**Last Generated:** 2025-12-28
**Total Query Examples:** 40+
**Frontend Patterns:** Server Actions + TanStack Query

