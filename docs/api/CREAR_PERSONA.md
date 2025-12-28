# Create Persona API

> **Complete reference for `crear_persona` RPC function**
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
- [Complete Working Examples](#complete-working-examples)
- [Related Documentation](#related-documentation)

---

## Overview

The `crear_persona` RPC function creates a natural person (persona) using the Class Table Inheritance (CTI) pattern. It atomically inserts records into both `business_partners` (base table) and `personas` (specialization table).

### Key Features

- ✅ **Atomic Transaction** - Both tables updated or neither (all-or-nothing)
- ✅ **Auto-Generated Codes** - `codigo_bp` automatically created (BP-0000001 format)
- ✅ **Audit Trail** - Automatically sets `creado_por`, `creado_en`, `actualizado_por`, `actualizado_en`
- ✅ **RLS Enforcement** - Respects organization membership and permissions
- ✅ **JSONB Flexibility** - Custom metadata via `perfil_persona` and `atributos`
- ✅ **Email Validation** - RFC 5322 format enforced
- ✅ **Soft Delete Support** - Records can be soft-deleted instead of permanently removed

---

## Function Signature

```sql
CREATE FUNCTION crear_persona(
  organizacion_id UUID,
  nombres TEXT,
  apellidos TEXT,
  email_principal TEXT DEFAULT NULL,
  celular_principal TEXT DEFAULT NULL,
  tipo_documento TEXT DEFAULT NULL,
  numero_documento TEXT DEFAULT NULL,
  perfil_persona JSONB DEFAULT NULL,
  atributos JSONB DEFAULT NULL
) RETURNS business_partners
```

**Returns:** Complete `business_partners` record with auto-generated `codigo_bp`

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organizacion_id` | UUID | ✅ Yes | - | Organization ID (multi-tenancy) |
| `nombres` | TEXT | ✅ Yes | - | First names |
| `apellidos` | TEXT | ✅ Yes | - | Last names |
| `email_principal` | TEXT | ❌ No | NULL | Primary email (RFC 5322 format) |
| `celular_principal` | TEXT | ❌ No | NULL | Primary mobile phone |
| `tipo_documento` | TEXT | ❌ No | NULL | Document type (CC, CE, PA, etc.) |
| `numero_documento` | TEXT | ❌ No | NULL | Document number |
| `perfil_persona` | JSONB | ❌ No | NULL | Person profile metadata |
| `atributos` | JSONB | ❌ No | NULL | Custom attributes |

### Parameter Details

#### `organizacion_id` (Required)

The organization this persona belongs to. User must be a member of this organization with `business_partners.insert` permission.

**Example:**
```typescript
organizacion_id: '550e8400-e29b-41d4-a716-446655440000'
```

#### `nombres` & `apellidos` (Required)

Full first names and last names. Required for creating a persona.

**Examples:**
```typescript
nombres: 'Juan Carlos'
apellidos: 'García López'
```

#### `email_principal` (Optional)

Primary email address. Must conform to RFC 5322 format.

**Validation:** Regex pattern enforced at database level
```sql
CHECK (email_principal ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

**Examples:**
```typescript
email_principal: 'juan.garcia@example.com'
email_principal: 'jgarcia+club@gmail.com'  // Plus addressing supported
```

#### `celular_principal` (Optional)

Primary mobile phone number. No format validation enforced (flexible for international numbers).

**Examples:**
```typescript
celular_principal: '+57 300 123 4567'
celular_principal: '(300) 123-4567'
celular_principal: '3001234567'
```

#### `tipo_documento` (Optional)

Document type identifier. Common Colombian values:

| Code | Document Type |
|------|---------------|
| `CC` | Cédula de Ciudadanía |
| `CE` | Cédula de Extranjería |
| `PA` | Pasaporte |
| `TI` | Tarjeta de Identidad |
| `RC` | Registro Civil |

**Examples:**
```typescript
tipo_documento: 'CC'
tipo_documento: 'PA'
```

#### `numero_documento` (Optional)

Document number (no validation on format - organization-specific).

**Examples:**
```typescript
numero_documento: '1234567890'
numero_documento: 'AB123456'
```

#### `perfil_persona` (Optional)

JSONB field for person-specific metadata. Use for demographics, preferences, or custom fields.

**Common Fields:**
```typescript
perfil_persona: {
  fecha_nacimiento: '1990-05-15',
  ciudad: 'Bogotá',
  profesion: 'Ingeniero',
  estado_civil: 'soltero',
  genero: 'masculino',
  // Any custom fields your organization needs
}
```

#### `atributos` (Optional)

JSONB field for business partner-level custom attributes.

**Common Fields:**
```typescript
atributos: {
  categoria_socio: 'fundador',
  fecha_ingreso_club: '2024-01-15',
  estado_membresia: 'activo',
  notas: 'Socio destacado 2024',
  // Organization-specific fields
}
```

---

## Return Value

Returns a complete `business_partners` record with all fields:

```typescript
{
  id: 'uuid',                     // Auto-generated
  codigo_bp: 'BP-0000123',        // Auto-generated
  tipo_actor: 'persona',          // Set by function
  organizacion_id: 'uuid',
  email_principal: 'email@example.com',
  celular_principal: '+57 300 123 4567',
  telefono_principal: null,
  atributos: { ... },             // Your custom data
  creado_en: '2024-01-15T10:30:00Z',    // Auto-set
  actualizado_en: '2024-01-15T10:30:00Z', // Auto-set
  eliminado_en: null,
  creado_por: 'user-uuid',        // Auto-set (auth.uid())
  actualizado_por: 'user-uuid',   // Auto-set (auth.uid())
  eliminado_por: null
}
```

**Note:** To get persona-specific fields (nombres, apellidos, etc.), query the `personas` table or `v_personas_org` view using the returned `id`.

---

## Business Rules

### 1. Class Table Inheritance (CTI)

Creates records in TWO tables atomically:

1. **`business_partners`** (base table)
   - Common fields: email, phone, organization, atributos
   - Auto-generates `codigo_bp`
   - Sets `tipo_actor = 'persona'`

2. **`personas`** (specialization table)
   - Specific fields: nombres, apellidos, tipo_documento, etc.
   - `id` matches `business_partners.id` (1:1 relationship)

**Transaction ensures:**
- Both inserts succeed OR both fail
- No orphaned records in either table
- Referential integrity maintained

### 2. Auto-Generated Codes

`codigo_bp` is automatically generated in format `BP-0000001`:

- Finds MAX existing code
- Increments by 1
- Zero-pads to 7 digits
- Format: `BP-` + 7 digits

**Examples:**
- First BP: `BP-0000001`
- Second BP: `BP-0000002`
- 100th BP: `BP-0000100`

### 3. Audit Trail

Automatically sets audit fields:

```typescript
creado_por = auth.uid()       // Current authenticated user
actualizado_por = auth.uid()  // Same as creado_por on creation
creado_en = NOW()             // Current timestamp
actualizado_en = NOW()        // Same as creado_en on creation
```

**Cannot be overridden** - enforced by trigger functions.

### 4. Organization Membership

User must:
- Be a member of the target organization
- Have `business_partners.insert` permission in that organization

**Enforced by RLS policy:**
```sql
CREATE POLICY "bp_insert"
  ON business_partners FOR INSERT
  WITH CHECK (can_user_v2('business_partners', 'insert', organizacion_id));
```

---

## Validation Rules

### Database-Level Constraints

| Field | Validation | Error Code |
|-------|------------|------------|
| `organizacion_id` | Must exist in `organizations` | 23503 (FK violation) |
| `email_principal` | Must match RFC 5322 regex | 23514 (CHECK violation) |
| `codigo_bp` | Must be unique | 23505 (Unique violation) |
| `tipo_actor` | Must be 'persona' or 'empresa' | 23514 (CHECK violation) |
| `nombres`, `apellidos` | Must not be NULL | 23502 (NOT NULL violation) |

### Application-Level Recommendations

**Frontend validation:**
```typescript
import { z } from 'zod'

const personaSchema = z.object({
  organizacion_id: z.string().uuid(),
  nombres: z.string().min(1, 'Nombres required').max(100),
  apellidos: z.string().min(1, 'Apellidos required').max(100),
  email_principal: z.string().email().optional().or(z.literal('')),
  celular_principal: z.string().optional(),
  tipo_documento: z.enum(['CC', 'CE', 'PA', 'TI', 'RC']).optional(),
  numero_documento: z.string().max(20).optional(),
  perfil_persona: z.record(z.any()).optional(),
  atributos: z.record(z.any()).optional(),
})

type PersonaInput = z.infer<typeof personaSchema>
```

---

## Usage Examples

### Server Actions Pattern

**When to use:**
- Form submissions
- Server-side operations
- When you need to call from Server Components
- Simpler error handling without client state

**File Structure:**
```
app/
  actions/
    personas.ts          // Server actions
  admin/
    socios/
      personas/
        page.tsx         // Server component (initial data)
components/
  socios/
    personas/
      new-person-form.tsx // Client component (form)
```

#### Step 1: Create Server Action

```typescript
// app/actions/personas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreatePersonaInput {
  organizacion_id: string
  nombres: string
  apellidos: string
  email_principal?: string
  celular_principal?: string
  tipo_documento?: string
  numero_documento?: string
  perfil_persona?: Record<string, any>
  atributos?: Record<string, any>
}

export async function createPersona(input: CreatePersonaInput) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_persona', input)

  if (error) {
    console.error('Failed to create persona:', error)
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }

  // Revalidate the personas list page
  revalidatePath('/admin/socios/personas')

  return {
    success: true,
    data
  }
}
```

#### Step 2: Create Form Component

```typescript
// components/socios/personas/new-person-form.tsx
'use client'

import { useState } from 'react'
import { createPersona, type CreatePersonaInput } from '@/app/actions/personas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface NewPersonFormProps {
  organizacionId: string
  onSuccess?: () => void
}

export function NewPersonForm({ organizacionId, onSuccess }: NewPersonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    const input: CreatePersonaInput = {
      organizacion_id: organizacionId,
      nombres: formData.get('nombres') as string,
      apellidos: formData.get('apellidos') as string,
      email_principal: formData.get('email') as string || undefined,
      celular_principal: formData.get('celular') as string || undefined,
      tipo_documento: formData.get('tipo_documento') as string || undefined,
      numero_documento: formData.get('numero_documento') as string || undefined,
    }

    const result = await createPersona(input)

    setIsSubmitting(false)

    if (result.success) {
      toast.success('Persona created successfully', {
        description: `Code: ${result.data.codigo_bp}`
      })
      e.currentTarget.reset()
      onSuccess?.()
    } else {
      toast.error('Failed to create persona', {
        description: result.error
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombres">First Names *</Label>
          <Input
            id="nombres"
            name="nombres"
            required
            maxLength={100}
            placeholder="Juan Carlos"
          />
        </div>

        <div>
          <Label htmlFor="apellidos">Last Names *</Label>
          <Input
            id="apellidos"
            name="apellidos"
            required
            maxLength={100}
            placeholder="García López"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="juan.garcia@example.com"
        />
      </div>

      <div>
        <Label htmlFor="celular">Mobile Phone</Label>
        <Input
          id="celular"
          name="celular"
          type="tel"
          placeholder="+57 300 123 4567"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo_documento">Document Type</Label>
          <select
            id="tipo_documento"
            name="tipo_documento"
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="CC">CC - Cédula</option>
            <option value="CE">CE - Extranjería</option>
            <option value="PA">PA - Pasaporte</option>
          </select>
        </div>

        <div>
          <Label htmlFor="numero_documento">Document Number</Label>
          <Input
            id="numero_documento"
            name="numero_documento"
            maxLength={20}
            placeholder="1234567890"
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Persona'}
      </Button>
    </form>
  )
}
```

---

### TanStack Query Pattern

**When to use:**
- Complex client-side state management
- Optimistic updates
- Automatic cache invalidation
- Background refetching
- Loading/error states managed by library

#### Step 1: Create Hook

```typescript
// hooks/use-personas.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface CreatePersonaInput {
  organizacion_id: string
  nombres: string
  apellidos: string
  email_principal?: string
  celular_principal?: string
  tipo_documento?: string
  numero_documento?: string
  perfil_persona?: Record<string, any>
  atributos?: Record<string, any>
}

// Query: Get all personas
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

// Mutation: Create persona
export function useCreatePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePersonaInput) => {
      const { data, error} = await supabase.rpc('crear_persona', input)
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch personas list
      queryClient.invalidateQueries({
        queryKey: ['personas', variables.organizacion_id]
      })

      // Or optimistically update cache
      queryClient.setQueryData(
        ['personas', variables.organizacion_id],
        (old: any[]) => {
          if (!old) return [data]
          return [...old, data]
        }
      )
    },
  })
}
```

#### Step 2: Use Hook in Component

```typescript
// components/socios/personas/personas-page.tsx
'use client'

import { usePersonas, useCreatePersona, type CreatePersonaInput } from '@/hooks/use-personas'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PersonasPageProps {
  organizacionId: string
}

export function PersonasPage({ organizacionId }: PersonasPageProps) {
  const { data: personas, isLoading, error } = usePersonas(organizacionId)
  const createPersona = useCreatePersona()

  const handleCreate = (input: CreatePersonaInput) => {
    createPersona.mutate(input, {
      onSuccess: (data) => {
        toast.success('Persona created', {
          description: `Code: ${data.codigo_bp}`
        })
      },
      onError: (error: any) => {
        toast.error('Failed to create persona', {
          description: error.message
        })
      }
    })
  }

  if (isLoading) return <div>Loading personas...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Personas ({personas?.length})</h1>

      {/* Personas list */}
      <div className="space-y-2">
        {personas?.map(p => (
          <PersonaCard
            key={p.id}
            persona={p}
          />
        ))}
      </div>

      {/* Create form */}
      <NewPersonForm
        organizacionId={organizacionId}
        onSubmit={handleCreate}
        isPending={createPersona.isPending}
      />
    </div>
  )
}
```

---

## Error Handling

### Common Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| `42501` | Insufficient privilege (RLS) | User not member of organization or lacks insert permission |
| `23505` | Unique violation | Duplicate email or document number (if unique constraint exists) |
| `23503` | Foreign key violation | Organization ID doesn't exist |
| `23514` | Check constraint violation | Invalid email format |
| `23502` | NOT NULL violation | Missing required field (nombres, apellidos, organizacion_id) |

### Error Mapping

```typescript
function getErrorMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case '42501':
      return 'You do not have permission to create personas in this organization'
    case '23505':
      if (error.message.includes('email'))
        return 'Email address already registered'
      if (error.message.includes('numero_documento'))
        return 'Document number already registered'
      return 'This persona already exists'
    case '23503':
      return 'Organization not found'
    case '23514':
      if (error.message.includes('email'))
        return 'Invalid email format'
      return 'Invalid data format'
    case '23502':
      return 'Missing required field'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
```

---

## Complete Working Examples

### Minimal Example

```typescript
const { data, error } = await supabase.rpc('crear_persona', {
  organizacion_id: orgId,
  nombres: 'Juan',
  apellidos: 'García'
})
```

### Complete Example with All Fields

```typescript
const { data, error } = await supabase.rpc('crear_persona', {
  organizacion_id: '550e8400-e29b-41d4-a716-446655440000',
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  email_principal: 'juan.garcia@example.com',
  celular_principal: '+57 300 123 4567',
  tipo_documento: 'CC',
  numero_documento: '1234567890',
  perfil_persona: {
    fecha_nacimiento: '1990-05-15',
    ciudad: 'Bogotá',
    profesion: 'Ingeniero de Software',
    estado_civil: 'soltero',
    genero: 'masculino'
  },
  atributos: {
    categoria_socio: 'fundador',
    fecha_ingreso_club: '2024-01-15',
    estado_membresia: 'activo',
    cuota_pagada: true,
    notas: 'Socio fundador del club'
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Created persona:', data.codigo_bp)
}
```

---

## Related Documentation

### API Documentation
- **[README.md](./README.md)** - API overview and all RPC functions
- **[CREAR_EMPRESA.md](./CREAR_EMPRESA.md)** - Create companies
- **[BP_RELACIONES.md](./BP_RELACIONES.md)** - Relationship management
- **[ACCIONES.md](./ACCIONES.md)** - Club shares management

### Database Documentation
- **[../database/OVERVIEW.md](../database/OVERVIEW.md)** - Architecture and CTI pattern
- **[../database/TABLES.md](../database/TABLES.md)** - business_partners and personas tables
- **[../database/FUNCTIONS.md](../database/FUNCTIONS.md)** - crear_persona function details
- **[../database/RLS.md](../database/RLS.md)** - Permission policies
- **[../database/QUERIES.md](../database/QUERIES.md)** - Query examples

---

**Last Updated:** 2025-12-28
**Function:** `crear_persona`
**Database:** PostgreSQL 15 (Supabase)

