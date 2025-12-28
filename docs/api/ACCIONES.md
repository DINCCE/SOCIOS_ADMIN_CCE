# Acciones Management API

> **Complete reference for club shares (acciones) management RPC functions**
>
> Last updated: 2025-12-28

---

## Table of Contents

- [Overview](#overview)
- [Assignment Types](#assignment-types)
- [RPC Functions](#rpc-functions)
  - [crear_asignacion_accion](#crear_asignacion_accion)
  - [transferir_accion](#transferir_accion)
  - [finalizar_asignacion_accion](#finalizar_asignacion_accion)
  - [generar_siguiente_subcodigo](#generar_siguiente_subcodigo)
- [Usage Examples](#usage-examples)
  - [Server Actions Pattern](#server-actions-pattern)
  - [TanStack Query Pattern](#tanstack-query-pattern)
- [Related Documentation](#related-documentation)

---

## Overview

Acciones (club shares) management handles ownership and beneficiary assignments with:

- **Temporal Tracking** - `fecha_inicio` / `fecha_fin` for historical records
- **Unique Codes** - Auto-generated `codigo_completo` (e.g., 439800)
- **Assignment Types** - Owner, holder, beneficiary with subcode ranges
- **Transfer Logic** - Automatic beneficiary invalidation on ownership transfer

---

## Assignment Types

| Type | Subcode Range | Max Active | Description |
|------|---------------|------------|-------------|
| `dueño` | 00-09 | 1 per action | Owner (exclusive) |
| `titular` | 10-19 | Multiple | Holder |
| `beneficiario` | 20-99 | Multiple | Beneficiary |

**Business Rules:**
- Only ONE active `dueño` per action
- Transferring ownership auto-finalizes all beneficiaries
- Subcodes auto-generated if not provided

---

## RPC Functions

### crear_asignacion_accion

Assign an action to a business partner.

**Signature:**
```sql
CREATE FUNCTION crear_asignacion_accion(
  accion_id UUID,
  persona_id UUID,
  tipo_asignacion TEXT,
  subcodigo TEXT DEFAULT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  atributos JSONB DEFAULT NULL
) RETURNS asignaciones_acciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accion_id` | UUID | ✅ | Action ID |
| `persona_id` | UUID | ✅ | Business partner ID |
| `tipo_asignacion` | TEXT | ✅ | dueño, titular, or beneficiario |
| `subcodigo` | TEXT | ❌ | 2-digit code (auto-generated if null) |
| `fecha_inicio` | DATE | ❌ | Start date (default: today) |
| `atributos` | JSONB | ❌ | Custom metadata |

**Example:**
```typescript
const { data, error } = await supabase.rpc('crear_asignacion_accion', {
  accion_id: accionId,
  persona_id: personaId,
  tipo_asignacion: 'dueño',
  // subcodigo auto-generated as '00'
  atributos: { modo_adquisicion: 'compra', precio: 50000000 }
})
```

**Returns:** `asignaciones_acciones` record with `codigo_completo` (e.g., '439800')

---

### transferir_accion

Transfer action ownership to a new owner.

**Signature:**
```sql
CREATE FUNCTION transferir_accion(
  accion_id UUID,
  nuevo_dueno_id UUID,
  fecha_transferencia DATE DEFAULT CURRENT_DATE,
  atributos JSONB DEFAULT NULL
) RETURNS asignaciones_acciones
```

**Business Logic:**
1. Finalizes current owner's assignment (`fecha_fin` set)
2. Finalizes ALL beneficiary assignments
3. Creates new owner assignment with subcodigo '00'

**Example:**
```typescript
const { data, error } = await supabase.rpc('transferir_accion', {
  accion_id: accionId,
  nuevo_dueno_id: newOwnerId,
  fecha_transferencia: '2024-12-31',
  atributos: { tipo_transferencia: 'venta', precio: 75000000 }
})
```

---

### finalizar_asignacion_accion

End an assignment by setting `fecha_fin`.

**Signature:**
```sql
CREATE FUNCTION finalizar_asignacion_accion(
  asignacion_id UUID,
  fecha_fin DATE DEFAULT CURRENT_DATE
) RETURNS asignaciones_acciones
```

**Example:**
```typescript
const { data, error } = await supabase.rpc('finalizar_asignacion_accion', {
  asignacion_id: assignmentId,
  fecha_fin: '2024-12-31'
})
```

---

### generar_siguiente_subcodigo

Generate the next available subcode for an assignment type.

**Signature:**
```sql
CREATE FUNCTION generar_siguiente_subcodigo(
  p_accion_id UUID,
  p_tipo_asignacion TEXT
) RETURNS TEXT
```

**Returns:** 2-digit subcode (TEXT)

**Logic:**
- **dueño**: Returns first available from 00-09
- **titular**: Returns first available from 10-19
- **beneficiario**: Returns first available from 20-99

**Example:**
```typescript
const { data: subcodigo, error } = await supabase.rpc('generar_siguiente_subcodigo', {
  p_accion_id: accionId,
  p_tipo_asignacion: 'beneficiario'
})
// Returns: '20', '21', '22', etc.
```

---

## Usage Examples

### Server Actions Pattern

```typescript
// app/actions/acciones.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAsignacion(input: {
  accion_id: string
  persona_id: string
  tipo_asignacion: string
  atributos?: Record<string, any>
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_asignacion_accion', input)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/acciones')
  return { success: true, data }
}

export async function transferirAccion(input: {
  accion_id: string
  nuevo_dueno_id: string
  atributos?: Record<string, any>
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('transferir_accion', input)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/acciones')
  return { success: true, data }
}
```

---

### TanStack Query Pattern

```typescript
// hooks/use-acciones.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useAsignacionesVigentes(accionId: string) {
  return useQuery({
    queryKey: ['asignaciones', accionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_asignaciones_vigentes')
        .select('*')
        .eq('accion_id', accionId)
      if (error) throw error
      return data
    }
  })
}

export function useCreateAsignacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      accion_id: string
      persona_id: string
      tipo_asignacion: string
      atributos?: Record<string, any>
    }) => {
      const { data, error } = await supabase.rpc('crear_asignacion_accion', input)
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['asignaciones', data.accion_id]
      })
    }
  })
}

export function useTransferirAccion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      accion_id: string
      nuevo_dueno_id: string
      atributos?: Record<string, any>
    }) => {
      const { data, error } = await supabase.rpc('transferir_accion', input)
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['asignaciones', data.accion_id]
      })
    }
  })
}
```

**Usage:**
```typescript
'use client'

import { useAsignacionesVigentes, useTransferirAccion } from '@/hooks/use-acciones'
import { toast } from 'sonner'

function AccionDetail({ accionId }: { accionId: string }) {
  const { data: asignaciones } = useAsignacionesVigentes(accionId)
  const transferir = useTransferirAccion()

  const handleTransfer = (newOwnerId: string) => {
    transferir.mutate({
      accion_id: accionId,
      nuevo_dueno_id: newOwnerId,
      atributos: { tipo: 'venta' }
    }, {
      onSuccess: () => toast.success('Ownership transferred'),
      onError: (error: any) => toast.error(error.message)
    })
  }

  const owner = asignaciones?.find(a => a.tipo_asignacion === 'dueño')
  const beneficiarios = asignaciones?.filter(a => a.tipo_asignacion === 'beneficiario')

  return (
    <div>
      <h2>Current Owner: {owner?.persona_nombre}</h2>
      <h3>Beneficiaries ({beneficiarios?.length})</h3>
      {beneficiarios?.map(b => (
        <div key={b.id}>{b.persona_nombre}</div>
      ))}
    </div>
  )
}
```

---

## Related Documentation

- **[README.md](./README.md)** - API overview
- **[../database/TABLES.md](../database/TABLES.md)** - acciones & asignaciones_acciones tables
- **[../database/VIEWS.md](../database/VIEWS.md)** - v_asignaciones_vigentes view
- **[../database/QUERIES.md](../database/QUERIES.md)** - Acciones query patterns

---

**Last Updated:** 2025-12-28
