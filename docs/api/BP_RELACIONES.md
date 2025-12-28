# Business Partner Relationships API

> **Complete reference for BP relationship management RPC functions**
>
> Last updated: 2025-12-28

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

Get all relationships for a business partner (bidirectional).

**Signature:**
```sql
CREATE FUNCTION obtener_relaciones_bp(
  bp_id UUID,
  solo_vigentes BOOLEAN DEFAULT TRUE
) RETURNS SETOF bp_relaciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bp_id` | UUID | ✅ | Business partner ID |
| `solo_vigentes` | BOOLEAN | ❌ | Only active relationships (default: true) |

**Example:**
```typescript
const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
  bp_id: businessPartnerId,
  solo_vigentes: true
})
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

export function useRelaciones(bpId: string, soloVigentes = true) {
  return useQuery({
    queryKey: ['relaciones', bpId, soloVigentes],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
        bp_id: bpId,
        solo_vigentes: soloVigentes
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
  const { data: relaciones, isLoading } = useRelaciones(bpId)
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
      {relaciones?.map(r => (
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

**Last Updated:** 2025-12-28
