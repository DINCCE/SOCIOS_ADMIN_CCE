# API Reference

> **Complete reference for all user-facing RPC functions**
>
> Last updated: 2025-12-28 | Auto-generated from live Supabase backend

---

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [Standard Response Format](#standard-response-format)
- [Error Handling](#error-handling)
- [RPC Functions by Category](#rpc-functions-by-category)
  - [Business Partner Management](#business-partner-management)
  - [Relationship Management](#relationship-management)
  - [Acciones Management](#acciones-management)
- [Code Pattern Examples](#code-pattern-examples)
- [Related Documentation](#related-documentation)

---

## Introduction

This API reference documents all **user-facing RPC (Remote Procedure Call) functions** exposed by the Supabase backend. These functions encapsulate business logic, validation, and database operations for the business partner management system.

### What are RPC Functions?

RPC functions are PostgreSQL functions exposed through Supabase's REST API. They provide:

- ✅ **Encapsulated Business Logic** - Complex operations in single function calls
- ✅ **Server-Side Validation** - Type checking and constraint enforcement at database level
- ✅ **Atomic Transactions** - All-or-nothing operations with automatic rollback
- ✅ **Row Level Security** - Database-enforced permissions on all operations
- ✅ **Type Safety** - Strong typing via PostgreSQL and TypeScript integration

### Function Categories

| Category | Functions | Purpose |
|----------|-----------|---------|
| **Business Partner Management** | 2 | Create personas and empresas |
| **Relationship Management** | 5 | Manage connections between business partners |
| **Acciones Management** | 4 | Handle club share assignments and transfers |

**Total:** 11 user-facing RPC functions

---

## Authentication

All RPC functions require authenticated requests. The Supabase client automatically includes the JWT token from the current session.

**Server Actions Pattern:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function myServerAction() {
  'use server'
  const supabase = await createClient() // Auto-authenticated
  const { data, error } = await supabase.rpc('function_name', { params })
}
```

**TanStack Query Pattern:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient() // Uses browser session
const { data, error } = await supabase.rpc('function_name', { params })
```

### Permission Model

RPC functions enforce permissions via Row Level Security (RLS) policies and the `can_user_v2()` helper function:

- **Organization Membership** - User must belong to the target organization
- **Role-Based Permissions** - Actions require specific permissions (e.g., 'business_partners.insert')
- **Resource-Level Access** - Policies filter data by `organizacion_id`

See [../database/RLS.md](../database/RLS.md) for complete RLS documentation.

---

## Standard Response Format

All RPC functions follow Supabase's standard response pattern:

```typescript
type SupabaseResponse<T> = {
  data: T | null
  error: PostgrestError | null
}
```

### Success Response

```typescript
{
  data: {
    id: "uuid-here",
    codigo_bp: "BP-0000123",
    // ... function-specific fields
  },
  error: null
}
```

### Error Response

```typescript
{
  data: null,
  error: {
    message: "new row violates row-level security policy",
    details: "Policy: bp_insert on table business_partners",
    hint: null,
    code: "42501" // PostgreSQL error code
  }
}
```

**Common Error Codes:**

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| `42501` | Insufficient privilege | RLS policy violation, missing permissions |
| `23505` | Unique violation | Duplicate codigo_bp, email, NIT, etc. |
| `23503` | Foreign key violation | Referenced organization/business partner not found |
| `23514` | Check constraint violation | Invalid tipo_actor, email format, NIT format |
| `P0001` | RAISE EXCEPTION | Custom validation error from function |

---

## Error Handling

### Recommended Pattern

**Server Actions:**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function createPersonaAction(params: PersonaParams) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_persona', params)

  if (error) {
    console.error('Failed to create persona:', error)
    throw new Error(error.message) // Or return { success: false, error }
  }

  return { success: true, data }
}
```

**TanStack Query:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreatePersona() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (params: PersonaParams) => {
      const { data, error } = await supabase.rpc('crear_persona', params)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
    },
    onError: (error) => {
      console.error('Failed to create persona:', error)
      // Show toast notification
    }
  })
}
```

### User-Friendly Error Messages

Map PostgreSQL error codes to user-friendly messages:

```typescript
function getErrorMessage(error: PostgrestError): string {
  if (error.code === '23505') {
    if (error.message.includes('email')) return 'Email already registered'
    if (error.message.includes('nit')) return 'NIT already registered'
    return 'This record already exists'
  }

  if (error.code === '42501') {
    return 'You do not have permission to perform this action'
  }

  if (error.code === 'P0001') {
    return error.message // Custom validation error
  }

  return 'An unexpected error occurred. Please try again.'
}
```

---

## RPC Functions by Category

### Business Partner Management

Create and manage business partners (natural persons and companies).

| Function | Purpose | Returns | Detailed Docs |
|----------|---------|---------|---------------|
| `crear_persona` | Create natural person (CTI pattern) | `business_partners` record | [CREAR_PERSONA.md](./CREAR_PERSONA.md) |
| `crear_empresa` | Create company (CTI pattern) | `business_partners` record | [CREAR_EMPRESA.md](./CREAR_EMPRESA.md) |

**Key Features:**
- Atomic creation across `business_partners` + specialization table (`personas` or `empresas`)
- Auto-generates `codigo_bp` (e.g., BP-0000123)
- Enforces organization membership and permissions via RLS
- Supports JSONB metadata via `atributos` field
- NIT validation and verification digit calculation for empresas

---

### Relationship Management

Manage relationships between business partners (employment, family, membership, etc.).

| Function | Purpose | Returns | Detailed Docs |
|----------|---------|---------|---------------|
| `crear_relacion_bp` | Create relationship between two BPs | `bp_relaciones` record | [BP_RELACIONES.md](./BP_RELACIONES.md#crear_relacion_bp) |
| `actualizar_relacion_bp` | Update existing relationship | `bp_relaciones` record | [BP_RELACIONES.md](./BP_RELACIONES.md#actualizar_relacion_bp) |
| `finalizar_relacion_bp` | End relationship (set `fecha_fin`) | `bp_relaciones` record | [BP_RELACIONES.md](./BP_RELACIONES.md#finalizar_relacion_bp) |
| `eliminar_relacion_bp` | Soft delete relationship | `void` | [BP_RELACIONES.md](./BP_RELACIONES.md#eliminar_relacion_bp) |
| `obtener_relaciones_bp` | Get all relationships for a BP | `bp_relaciones[]` | [BP_RELACIONES.md](./BP_RELACIONES.md#obtener_relaciones_bp) |

**Supported Relationship Types:**
- `familiar` - Family relationship
- `laboral` - Employment relationship
- `referencia` - Reference/referral
- `membresia` - Membership relationship
- `comercial` - Commercial relationship
- `otra` - Other relationship type

**Key Features:**
- Bidirectional relationship tracking (`bp_origen_id` ↔ `bp_destino_id`)
- Temporal validity via `fecha_inicio` and `fecha_fin`
- Generated column `es_vigente` for active relationships
- JSONB `atributos` for relationship-specific metadata
- Soft delete pattern with `eliminado_en` timestamp

---

### Acciones Management

Manage club share (acciones) ownership and beneficiary assignments.

| Function | Purpose | Returns | Detailed Docs |
|----------|---------|---------|---------------|
| `crear_asignacion_accion` | Assign action to BP (owner/beneficiary) | `asignaciones_acciones` record | [ACCIONES.md](./ACCIONES.md#crear_asignacion_accion) |
| `transferir_accion` | Transfer action ownership | `asignaciones_acciones` record | [ACCIONES.md](./ACCIONES.md#transferir_accion) |
| `finalizar_asignacion_accion` | End assignment (set `fecha_fin`) | `asignaciones_acciones` record | [ACCIONES.md](./ACCIONES.md#finalizar_asignacion_accion) |
| `generar_siguiente_subcodigo` | Generate next subcode for action | `text` (4-digit subcode) | [ACCIONES.md](./ACCIONES.md#generar_siguiente_subcodigo) |

**Assignment Types:**
- `dueño` - Owner (subcodes 00-09)
- `titular` - Holder (subcodes 10-19)
- `beneficiario` - Beneficiary (subcodes 20-99)

**Key Features:**
- Auto-generates `codigo_completo` (e.g., 439800 = accion 4398 + subcodigo 00)
- Enforces uniqueness: Only one active `dueño` per action
- Temporal tracking with `fecha_inicio` and `fecha_fin`
- Automatic beneficiary invalidation on ownership transfer
- Subcode validation per assignment type

---

## Code Pattern Examples

All API documentation provides **both** frontend integration patterns:

### Pattern 1: Server Actions (Next.js App Router)

**When to use:**
- Form submissions
- Authenticated backend operations
- When you need to call from Server Components
- When you want simplified error handling

**Example:**
```typescript
// app/actions/personas.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPersona(params: PersonaParams) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('crear_persona', params)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/socios/personas')
  return { success: true, data }
}
```

```typescript
// components/persona-form.tsx
'use client'

import { createPersona } from '@/app/actions/personas'

function PersonaForm() {
  const handleSubmit = async (formData: FormData) => {
    const result = await createPersona({
      nombres: formData.get('nombres') as string,
      // ... other fields
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

### Pattern 2: TanStack Query (React Query)

**When to use:**
- Complex client-side state management
- Optimistic updates
- Automatic cache invalidation
- Background refetching
- When you need loading/error states managed

**Example:**
```typescript
// hooks/use-personas.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreatePersona() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (params: PersonaParams) => {
      const { data, error } = await supabase.rpc('crear_persona', params)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
    }
  })
}
```

```typescript
// components/persona-form.tsx
'use client'

import { useCreatePersona } from '@/hooks/use-personas'

function PersonaForm() {
  const createPersona = useCreatePersona()

  const handleSubmit = (formData: PersonaFormData) => {
    createPersona.mutate(formData, {
      onSuccess: () => toast.success('Persona created'),
      onError: (error) => toast.error(error.message)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button disabled={createPersona.isPending}>
        {createPersona.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

**See individual function docs for complete examples with validation, error handling, and best practices.**

---

## Related Documentation

### API Documentation
- **[CREAR_PERSONA.md](./CREAR_PERSONA.md)** - Create natural persons with full validation
- **[CREAR_EMPRESA.md](./CREAR_EMPRESA.md)** - Create companies with NIT validation
- **[BP_RELACIONES.md](./BP_RELACIONES.md)** - Manage all BP relationships (5 functions)
- **[ACCIONES.md](./ACCIONES.md)** - Club share assignment and transfer (4 functions)

### Database Documentation
- **[../database/OVERVIEW.md](../database/OVERVIEW.md)** - Architecture patterns and concepts
- **[../database/SCHEMA.md](../database/SCHEMA.md)** - Complete schema with ERD diagrams
- **[../database/TABLES.md](../database/TABLES.md)** - Data dictionary for all tables
- **[../database/FUNCTIONS.md](../database/FUNCTIONS.md)** - All database functions (including internal)
- **[../database/RLS.md](../database/RLS.md)** - Row Level Security policies
- **[../database/QUERIES.md](../database/QUERIES.md)** - SQL cookbook and patterns

---

## Quick Reference

### Function Signatures (TypeScript)

```typescript
// Business Partner Management
type crear_persona = (params: {
  organizacion_id: string
  nombres: string
  apellidos: string
  email_principal?: string
  celular_principal?: string
  tipo_documento?: string
  numero_documento?: string
  perfil_persona?: Record<string, any>
  atributos?: Record<string, any>
}) => Promise<BusinessPartner>

type crear_empresa = (params: {
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
}) => Promise<BusinessPartner>

// Relationship Management
type crear_relacion_bp = (params: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
  descripcion?: string
  fecha_inicio?: string
  atributos?: Record<string, any>
}) => Promise<BPRelacion>

// Acciones Management
type crear_asignacion_accion = (params: {
  accion_id: string
  persona_id: string
  tipo_asignacion: 'dueño' | 'titular' | 'beneficiario'
  subcodigo?: string
  fecha_inicio?: string
  atributos?: Record<string, any>
}) => Promise<AsignacionAccion>
```

### Common Validation Rules

- **Email:** Must match RFC 5322 format
- **NIT:** 9 digits + verification digit (auto-calculated)
- **Codigo BP:** Auto-generated (BP-0000001 format)
- **Tipo Relacion:** Must be valid enum value
- **Tipo Asignacion:** Must be valid enum value with corresponding subcode range

---

**Last Generated:** 2025-12-28
**Total User-Facing Functions:** 11
**Backend:** Supabase PostgreSQL 15

