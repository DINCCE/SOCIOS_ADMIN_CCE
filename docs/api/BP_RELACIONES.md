# Business Partner Relationships API

> **Complete reference for BP relationship management RPC functions**
>
> Last updated: 2026-01-04

---

## Table of Contents

- [Overview](#overview)
- [Relationship Types](#relationship-types)
- [RPC Functions](#rpc-functions)
  - [crear_relacion_bp](#crear_relacion_bp)
  - [actualizar_relacion_bp](#actualizar_relacion_bp)
  - [finalizar_relacion_bp](#finalizar_relacion_bp)
  - [eliminar_relacion_bp](#eliminar_relacion_bp)
  - [obtener_relaciones_bp](#obtener_relaciones_bp)
- [Usage Examples](#usage-examples)
  - [Server Actions Pattern](#server-actions-pattern)
  - [TanStack Query Pattern](#tanstack-query-pattern)
- [Related Documentation](#related-documentation)

---

## Overview

Business partner relationships track connections between personas and empresas. Relationships are:

- **Bidirectional** - Query from either origen or destino
- **Temporal** - Track validity with `fecha_inicio` / `fecha_fin`
- **Typed** - 6 relationship types (familiar, laboral, etc.)
- **Flexible** - JSONB metadata for custom attributes

---

## Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| `familiar` | Family relationship | Parent-child, siblings |
| `laboral` | Employment | Employee works for company |
| `referencia` | Reference/referral | Person referred by another |
| `membresia` | Membership | Member of organization |
| `comercial` | Commercial | Business partnership |
| `otra` | Other | Custom relationship |

---

## RPC Functions

### crear_relacion_bp

Create a relationship between two business partners.

**Signature:**
```sql
CREATE FUNCTION crear_relacion_bp(
  bp_origen_id UUID,
  bp_destino_id UUID,
  tipo_relacion tipo_relacion_bp,
  descripcion TEXT DEFAULT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  atributos JSONB DEFAULT NULL
) RETURNS bp_relaciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bp_origen_id` | UUID | ✅ | Source business partner |
| `bp_destino_id` | UUID | ✅ | Target business partner |
| `tipo_relacion` | ENUM | ✅ | Relationship type |
| `descripcion` | TEXT | ❌ | Description |
| `fecha_inicio` | DATE | ❌ | Start date (default: today) |
| `atributos` | JSONB | ❌ | Custom metadata |

**Example:**
```typescript
const { data, error } = await supabase.rpc('crear_relacion_bp', {
  bp_origen_id: personaId,
  bp_destino_id: empresaId,
  tipo_relacion: 'laboral',
  descripcion: 'Gerente General',
  atributos: { cargo: 'CEO', departamento: 'Administración' }
})
```

---

### actualizar_relacion_bp

Update an existing relationship.

**Signature:**
```sql
CREATE FUNCTION actualizar_relacion_bp(
  relacion_id UUID,
  tipo_relacion tipo_relacion_bp DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  atributos JSONB DEFAULT NULL
) RETURNS bp_relaciones
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('actualizar_relacion_bp', {
  relacion_id: relationId,
  descripcion: 'Director General',
  atributos: { cargo: 'CEO', nivel: 'ejecutivo' }
})
```

---

### finalizar_relacion_bp

End a relationship by setting `fecha_fin`.

**Signature:**
```sql
CREATE FUNCTION finalizar_relacion_bp(
  relacion_id UUID,
  fecha_fin DATE DEFAULT CURRENT_DATE
) RETURNS bp_relaciones
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('finalizar_relacion_bp', {
  relacion_id: relationId,
  fecha_fin: '2024-12-31'
})
```

---

### eliminar_relacion_bp

Soft delete a relationship.

**Signature:**
```sql
CREATE FUNCTION eliminar_relacion_bp(
  relacion_id UUID
) RETURNS VOID
```

**Example:**
```typescript
const { error } = await supabase.rpc('eliminar_relacion_bp', {
  relacion_id: relationId
})
```

---

### obtener_relaciones_bp

Get all relationships for a business partner (bidirectional) with complete information about both origin and destination partners.

**Signature:**
```sql
CREATE FUNCTION obtener_relaciones_bp(
  p_bp_id UUID,
  p_solo_actuales BOOLEAN DEFAULT TRUE,
  p_tipo_relacion TEXT DEFAULT NULL
) RETURNS TABLE(
  -- Relationship fields
  id UUID,
  bp_origen_id UUID,
  bp_destino_id UUID,
  tipo_relacion TEXT,
  rol_origen TEXT,
  rol_destino TEXT,
  es_bidireccional BOOLEAN,
  fecha_inicio DATE,
  fecha_fin DATE,
  es_actual BOOLEAN,
  atributos JSONB,
  notas TEXT,
  creado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ,
  
  -- Origin partner fields
  origen_id UUID,
  origen_codigo_bp TEXT,
  origen_tipo_actor TEXT,
  origen_primer_nombre TEXT,
  origen_segundo_nombre TEXT,
  origen_primer_apellido TEXT,
  origen_segundo_apellido TEXT,
  origen_nombre_completo TEXT,
  origen_tipo_documento TEXT,
  origen_numero_documento TEXT,
  origen_identificacion TEXT,
  origen_fecha_nacimiento DATE,
  origen_foto_url TEXT,
  origen_whatsapp TEXT,
  
  -- Destination partner fields
  destino_id UUID,
  destino_codigo_bp TEXT,
  destino_tipo_actor TEXT,
  destino_primer_nombre TEXT,
  destino_segundo_nombre TEXT,
  destino_primer_apellido TEXT,
  destino_segundo_apellido TEXT,
  destino_nombre_completo TEXT,
  destino_tipo_documento TEXT,
  destino_numero_documento TEXT,
  destino_identificacion TEXT,
  destino_fecha_nacimiento DATE,
  destino_foto_url TEXT,
  destino_whatsapp TEXT
)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_bp_id` | UUID | ✅ | Business partner ID to query relationships for |
| `p_solo_actuales` | BOOLEAN | ❌ | Only return current/active relationships (default: true) |
| `p_tipo_relacion` | TEXT | ❌ | Filter by specific relationship type (e.g., 'familiar', 'laboral') |

**Returns:**

A table with complete relationship and partner information:

- **Relationship metadata**: ID, type, roles, bidirectional flag, dates, current status, attributes, notes
- **Origin partner details**: Full name, identification, contact info, actor type
- **Destination partner details**: Full name, identification, contact info, actor type

**Behavior:**

- Queries relationships bidirectionally (returns where BP is either origin OR destination)
- Filters out soft-deleted relationships (`eliminado_en IS NULL`)
- Orders by `fecha_inicio DESC`, then `creado_en DESC`
- Includes complete person information for both partners when `tipo_actor = 'persona'`

**Examples:**

Get all current relationships:
```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: true
})
```

Get all relationships including historical:
```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: false
})
```

Filter by relationship type:
```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  p_bp_id: businessPartnerId,
  p_solo_actuales: true,
  p_tipo_relacion: 'familiar'
})
```

**Response structure:**
```typescript
{
  id: 'uuid',
  bp_origen_id: 'uuid',
  bp_destino_id: 'uuid',
  tipo_relacion: 'familiar',
  rol_origen: 'Padre',
  rol_destino: 'Hijo/a',
  es_bidireccional: false,
  fecha_inicio: '2024-01-01',
  fecha_fin: null,
  es_actual: true,
  atributos: {},
  notas: 'Notas adicionales',
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z',
  
  // Origin partner info
  origen_id: 'uuid',
  origen_codigo_bp: 'BP-0000001',
  origen_tipo_actor: 'persona',
  origen_primer_nombre: 'Juan',
  origen_segundo_nombre: 'Carlos',
  origen_primer_apellido: 'Pérez',
  origen_segundo_apellido: 'García',
  origen_nombre_completo: 'Juan Carlos Pérez García',
  origen_tipo_documento: 'CC',
  origen_numero_documento: '12345678',
  origen_identificacion: 'CC 12345678',
  origen_fecha_nacimiento: '1980-01-01',
  origen_foto_url: 'https://...',
  origen_whatsapp: '573001234567',
  
  // Destination partner info
  destino_id: 'uuid',
  destino_codigo_bp: 'BP-0000002',
  destino_tipo_actor: 'persona',
  destino_primer_nombre: 'María',
  destino_segundo_nombre: 'Ana',
  destino_primer_apellido: 'López',
  destino_segundo_apellido: 'Martínez',
  destino_nombre_completo: 'María Ana López Martínez',
  destino_tipo_documento: 'CC',
  destino_numero_documento: '87654321',
  destino_identificacion: 'CC 87654321',
  destino_fecha_nacimiento: '2010-01-01',
  destino_foto_url: 'https://...',
  destino_whatsapp: '573009876543'
}
```

---

## Usage Examples

### Server Actions Pattern

```typescript
// app/actions/relaciones.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRelacion(input: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: string
  descripcion?: string
  atributos?: Record<string, any>
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_relacion_bp', input)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/socios/relaciones')
  return { success: true, data }
}

export async function finalizarRelacion(relacion_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('finalizar_relacion_bp', {
    relacion_id
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/socios/relaciones')
  return { success: true, data }
}
```

---

### TanStack Query Pattern

```typescript
// hooks/use-relaciones.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useRelaciones(bpId: string, soloActuales = true, tipoRelacion?: string) {
  return useQuery({
    queryKey: ['relaciones', bpId, soloActuales, tipoRelacion],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
        p_bp_id: bpId,
        p_solo_actuales: soloActuales,
        p_tipo_relacion: tipoRelacion || null
      })
      if (error) throw error
      return data
    }
  })
}

export function useCreateRelacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      bp_origen_id: string
      bp_destino_id: string
      tipo_relacion: string
      descripcion?: string
      atributos?: Record<string, any>
    }) => {
      const { data, error } = await supabase.rpc('crear_relacion_bp', input)
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relaciones'] })
    }
  })
}

export function useFinalizarRelacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (relacion_id: string) => {
      const { data, error } = await supabase.rpc('finalizar_relacion_bp', {
        relacion_id
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relaciones'] })
    }
  })
}
```

**Usage:**
```typescript
'use client'

import { useRelaciones, useCreateRelacion } from '@/hooks/use-relaciones'

function RelacionesPage({ bpId }: { bpId: string }) {
  // Get all current relationships
  const { data: relaciones, isLoading } = useRelaciones(bpId, true)
  
  // Get only family relationships
  const { data: familyRelations } = useRelaciones(bpId, true, 'familiar')
  
  // Get all relationships including historical
  const { data: allRelations } = useRelaciones(bpId, false)
  
  const createRelacion = useCreateRelacion()

  const handleCreate = () => {
    createRelacion.mutate({
      bp_origen_id: bpId,
      bp_destino_id: otherBpId,
      tipo_relacion: 'laboral',
      descripcion: 'Gerente'
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h2>Current Relationships</h2>
      {relaciones?.map(r => (
        <RelacionCard key={r.id} relacion={r} />
      ))}
      
      <h2>Family Only</h2>
      {familyRelations?.map(r => (
        <RelacionCard key={r.id} relacion={r} />
      ))}
    </div>
  )
}
```

---

## Related Documentation

- **[README.md](./README.md)** - API overview
- **[../database/TABLES.md](../database/TABLES.md)** - bp_relaciones table
- **[../database/QUERIES.md](../database/QUERIES.md)** - Relationship queries

---

**Last Updated:** 2026-01-04
