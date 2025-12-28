# Create Empresa API

> **Complete reference for `crear_empresa` RPC function**
>
> Last updated: 2025-12-28

---

## Table of Contents

- [Overview](#overview)
- [Function Signature](#function-signature)
- [Parameters](#parameters)
- [Return Value](#return-value)
- [Business Rules](#business-rules)
- [Validation Rules](#validation-rules)
- [Usage Examples](#usage-examples)
  - [Server Actions Pattern](#server-actions-pattern)
  - [TanStack Query Pattern](#tanstack-query-pattern)
- [Error Handling](#error-handling)
- [Related Documentation](#related-documentation)

---

## Overview

The `crear_empresa` RPC function creates a company (empresa) using the Class Table Inheritance (CTI) pattern. It atomically inserts records into both `business_partners` (base table) and `empresas` (specialization table).

### Key Features

- ✅ **Atomic Transaction** - Both tables updated or neither
- ✅ **Auto-Generated Codes** - `codigo_bp` automatically created (BP-0000001)
- ✅ **NIT Validation** - Colombian tax ID validation with auto-calculated verification digit
- ✅ **Audit Trail** - Automatic `creado_por`, `creado_en` tracking
- ✅ **RLS Enforcement** - Organization membership and permissions
- ✅ **Legal Representative** - Optional link to another business partner

---

## Function Signature

```sql
CREATE FUNCTION crear_empresa(
  organizacion_id UUID,
  razon_social TEXT,
  nombre_comercial TEXT DEFAULT NULL,
  email_principal TEXT DEFAULT NULL,
  telefono_principal TEXT DEFAULT NULL,
  nit TEXT,
  digito_verificacion TEXT DEFAULT NULL,
  representante_legal_id UUID DEFAULT NULL,
  perfil_empresa JSONB DEFAULT NULL,
  atributos JSONB DEFAULT NULL
) RETURNS business_partners
```

**Returns:** Complete `business_partners` record with auto-generated `codigo_bp`

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organizacion_id` | UUID | ✅ Yes | - | Organization ID |
| `razon_social` | TEXT | ✅ Yes | - | Legal name |
| `nombre_comercial` | TEXT | ❌ No | NULL | Trade name |
| `email_principal` | TEXT | ❌ No | NULL | Primary email |
| `telefono_principal` | TEXT | ❌ No | NULL | Primary phone |
| `nit` | TEXT | ✅ Yes | - | Tax ID (9 digits) |
| `digito_verificacion` | TEXT | ❌ No | NULL | Verification digit (auto-calculated) |
| `representante_legal_id` | UUID | ❌ No | NULL | Legal representative BP ID |
| `perfil_empresa` | JSONB | ❌ No | NULL | Company profile metadata |
| `atributos` | JSONB | ❌ No | NULL | Custom attributes |

### Key Parameter Details

#### `nit` (Required)

Colombian tax identification number (NIT). Must be 9 digits.

**Format:** 9-digit string without verification digit
**Example:** `'900123456'`

#### `digito_verificacion` (Auto-calculated)

If not provided, automatically calculated using Colombian NIT algorithm.

**Algorithm:**
```typescript
// Weights: [41, 37, 29, 23, 19, 17, 13, 7, 3]
function calculateDV(nit: string): string {
  const weights = [41, 37, 29, 23, 19, 17, 13, 7, 3]
  const sum = nit.split('').reduce((acc, digit, i) =>
    acc + parseInt(digit) * weights[i], 0
  )
  const remainder = sum % 11
  return remainder <= 1 ? '0' : String(11 - remainder)
}
```

**Example:**
```typescript
nit: '900123456'
digito_verificacion: null  // Auto-calculated as '3'
```

#### `representante_legal_id` (Optional)

Links to another business partner (persona or empresa) as legal representative.

**Example:**
```typescript
representante_legal_id: '550e8400-e29b-41d4-a716-446655440000'
```

---

## Business Rules

### 1. NIT Uniqueness

NIT must be unique across all empresas in the database.

**Constraint:**
```sql
UNIQUE (nit)
```

### 2. Auto-Generated Verification Digit

If `digito_verificacion` is NULL, the function automatically calculates it using `calcular_digito_verificacion_nit()`.

### 3. Legal Representative Validation

If `representante_legal_id` is provided:
- Must reference an existing business partner
- Can be either persona or empresa
- Must belong to the same organization

---

## Validation Rules

| Field | Validation | Error Code |
|-------|------------|------------|
| `organizacion_id` | Must exist | 23503 (FK violation) |
| `nit` | Must be unique | 23505 (Unique violation) |
| `nit` | Must be 9 digits | P0001 (Custom exception) |
| `email_principal` | RFC 5322 format | 23514 (CHECK violation) |
| `representante_legal_id` | Must exist if provided | 23503 (FK violation) |

---

## Usage Examples

### Server Actions Pattern

```typescript
// app/actions/empresas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateEmpresaInput {
  organizacion_id: string
  razon_social: string
  nombre_comercial?: string
  email_principal?: string
  telefono_principal?: string
  nit: string
  digito_verificacion?: string
  representante_legal_id?: string
  perfil_empresa?: Record<string, any>
  atributos?: Record<string, any>
}

export async function createEmpresa(input: CreateEmpresaInput) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_empresa', input)

  if (error) {
    return { success: false, error: error.message, code: error.code }
  }

  revalidatePath('/admin/socios/empresas')
  return { success: true, data }
}
```

**Usage in component:**
```typescript
'use client'

import { createEmpresa } from '@/app/actions/empresas'
import { toast } from 'sonner'

function EmpresaForm() {
  const handleSubmit = async (formData: FormData) => {
    const result = await createEmpresa({
      organizacion_id: orgId,
      razon_social: formData.get('razon_social') as string,
      nit: formData.get('nit') as string,
      // digito_verificacion auto-calculated
      email_principal: formData.get('email') as string,
    })

    if (result.success) {
      toast.success(`Empresa created: ${result.data.codigo_bp}`)
    } else {
      toast.error(result.error)
    }
  }

  return <form action={handleSubmit}>...</form>
}
```

---

### TanStack Query Pattern

```typescript
// hooks/use-empresas.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useCreateEmpresa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEmpresaInput) => {
      const { data, error } = await supabase.rpc('crear_empresa', input)
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['empresas', variables.organizacion_id]
      })
    },
  })
}
```

**Usage:**
```typescript
'use client'

import { useCreateEmpresa } from '@/hooks/use-empresas'

function EmpresaPage() {
  const createEmpresa = useCreateEmpresa()

  const handleCreate = () => {
    createEmpresa.mutate({
      organizacion_id: orgId,
      razon_social: 'Tech Solutions SAS',
      nit: '900123456',
      nombre_comercial: 'TechSol',
      perfil_empresa: {
        industria: 'tecnologia',
        tamano: 'mediana'
      }
    }, {
      onSuccess: (data) => toast.success(`Created: ${data.codigo_bp}`),
      onError: (error: any) => toast.error(error.message)
    })
  }

  return (
    <button onClick={handleCreate} disabled={createEmpresa.isPending}>
      {createEmpresa.isPending ? 'Creating...' : 'Create Empresa'}
    </button>
  )
}
```

---

## Error Handling

### Common Errors

```typescript
function getErrorMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case '42501':
      return 'No permission to create empresas in this organization'
    case '23505':
      if (error.message.includes('nit'))
        return 'NIT already registered'
      return 'This empresa already exists'
    case '23503':
      if (error.message.includes('representante'))
        return 'Legal representative not found'
      return 'Organization not found'
    case 'P0001':
      if (error.message.includes('NIT'))
        return 'Invalid NIT format (must be 9 digits)'
      return error.message
    default:
      return 'An unexpected error occurred'
  }
}
```

---

## Complete Example

```typescript
const { data, error } = await supabase.rpc('crear_empresa', {
  organizacion_id: '550e8400-e29b-41d4-a716-446655440000',
  razon_social: 'Tech Solutions SAS',
  nombre_comercial: 'TechSol',
  email_principal: 'info@techsol.com',
  telefono_principal: '+57 1 234 5678',
  nit: '900123456',
  // digito_verificacion auto-calculated as '3'
  representante_legal_id: 'rep-bp-uuid',
  perfil_empresa: {
    industria: 'tecnologia',
    tamano: 'mediana',
    empleados: 50,
    fundacion: '2020-01-15'
  },
  atributos: {
    patrocinador: true,
    categoria: 'corporativo',
    cuota_pagada: true
  }
})
```

---

## Related Documentation

- **[README.md](./README.md)** - API overview
- **[CREAR_PERSONA.md](./CREAR_PERSONA.md)** - Create personas
- **[../database/TABLES.md](../database/TABLES.md)** - empresas table
- **[../database/FUNCTIONS.md](../database/FUNCTIONS.md)** - crear_empresa function

---

**Last Updated:** 2025-12-28
