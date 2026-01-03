# Relationships API

> **API reference for managing business partner relationships**
>
> Module: [`app/actions/relaciones.ts`](../app/actions/relaciones.ts)

---

## Overview

The Relationships API provides CRUD operations for managing relationships between business partners (personas and empresas). All functions integrate with the existing RPC functions and enforce role-based authorization via RLS policies.

---

## Functions

### `crearRelacionFromForm(data: RelacionData)`

Create a relationship between two business partners.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `bp_origen_id` | string | ✅ | UUID of the source business partner |
| `bp_destino_id` | string | ✅ | UUID of the destination business partner |
| `tipo_relacion` | enum | ✅ | Type of relationship: `familiar`, `laboral`, `referencia`, `membresia`, `comercial`, `otra` |
| `descripcion` | string | ❌ | Optional description of the relationship |
| `fecha_inicio` | string | ❌ | Start date (defaults to today if not provided) |
| `atributos` | Record<string, unknown> | ❌ | Optional JSONB attributes |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  relacion_id?: string  // UUID of the created relationship
}
```

**Example:**

```typescript
import { crearRelacionFromForm } from '@/app/actions/relaciones'

const result = await crearRelacionFromForm({
  bp_origen_id: 'uuid-1',
  bp_destino_id: 'uuid-2',
  tipo_relacion: 'familiar',
  descripcion: 'Padre e hijo',
  fecha_inicio: '2026-01-01'
})

if (result.success) {
  console.log('Relationship created:', result.relacion_id)
}
```

---

### `actualizarRelacion(relacion_id: string, data: Partial<RelacionData>)`

Update an existing relationship.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `relacion_id` | string | ✅ | UUID of the relationship to update |
| `tipo_relacion` | enum | ❌ | New relationship type |
| `descripcion` | string | ❌ | New description |
| `atributos` | Record<string, unknown> | ❌ | New JSONB attributes |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { actualizarRelacion } from '@/app/actions/relaciones'

const result = await actualizarRelacion('relacion-uuid', {
  descripcion: 'Updated description'
})
```

---

### `finalizarRelacion(relacion_id: string, fecha_fin?: string)`

End a relationship by setting the end date.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `relacion_id` | string | ✅ | UUID of the relationship to end |
| `fecha_fin` | string | ❌ | End date (defaults to today if not provided) |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { finalizarRelacion } from '@/app/actions/relaciones'

const result = await finalizarRelacion('relacion-uuid', '2026-12-31')
```

---

### `eliminarRelacion(relacion_id: string)`

Soft delete a relationship.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `relacion_id` | string | ✅ | UUID of the relationship to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { eliminarRelacion } from '@/app/actions/relaciones'

const result = await eliminarRelacion('relacion-uuid')
```

---

### `obtenerRelaciones(bp_id: string, solo_vigentes?: boolean)`

Get all relationships for a business partner (bidirectional).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `bp_id` | string | ✅ | UUID of the business partner |
| `solo_vigentes` | boolean | ❌ | Return only active relationships (default: true) |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Relationship>  // Array of relationship objects
}
```

**Example:**

```typescript
import { obtenerRelaciones } from '@/app/actions/relaciones'

// Get all active relationships
const result = await obtenerRelaciones('bp-uuid', true)

// Get all relationships including inactive
const allResult = await obtenerRelaciones('bp-uuid', false)
```

---

## Relationship Types

| Type | Description |
|-------|-------------|
| `familiar` | Family relationships (parent, child, sibling, etc.) |
| `laboral` | Employment or work-related relationships |
| `referencia` | Reference relationships (referrals, recommendations) |
| `membresia` | Membership relationships |
| `comercial` | Business or commercial relationships |
| `otra` | Other types of relationships |

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `bp_relaciones`
- **READ:** Requires `select` permission on `bp_relaciones`
- **UPDATE:** Requires `update` permission on `bp_relaciones`
- **DELETE:** Requires `delete` permission on `bp_relaciones`

Use the [`checkPermission()`](../lib/auth/permissions.ts) helper to verify permissions before calling functions.

---

## Error Handling

All functions return consistent error responses:

```typescript
{
  success: false,
  message: string  // User-friendly Spanish error message
}
```

Common error codes:
- `42501` - Permission denied
- `23505` - Duplicate entry
- `23503` - Foreign key violation

---

## Cache Revalidation

Functions automatically revalidate Next.js cache paths:
- `/admin/socios/relaciones` - Relationships list page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#bp_relaciones) - Database schema
- [`docs/database/FUNCTIONS.md`](../database/FUNCTIONS.md) - RPC function reference
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
