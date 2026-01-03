# Oportunidades API

> **API reference for managing opportunities**
> Module: [`app/actions/oportunidades.ts`](../app/actions/oportunidades.ts)

---

## Overview

The Oportunidades API provides CRUD operations for managing opportunities (solicitudes de retiro/ingreso). All functions integrate with RPC functions and enforce role-based authorization via RLS policies.

---

## Functions

### `crearOportunidad(data: OportunidadData)`

Create a new opportunity.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organizacion_id` | string | ✅ | UUID of the organization |
| `codigo` | string | ✅ | Opportunity code/identifier |
| `tipo` | enum | ✅ | Type: `Solicitud Retiro` or `Solicitud Ingreso` |
| `solicitante_id` | string | ✅ | UUID of the requesting business partner |
| `responsable_id` | string | ❌ | UUID of the responsible user |
| `monto_estimado` | number | ❌ | Estimated amount |
| `notas` | string | ❌ | Notes about the opportunity |
| `atributos` | Record<string, unknown> | ❌ | Optional JSONB attributes |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  oportunidad_id?: string  // UUID of the created opportunity
}
```

**Example:**

```typescript
import { crearOportunidad } from '@/app/actions/oportunidades'

const result = await crearOportunidad({
  organizacion_id: 'org-uuid',
  codigo: 'OP-2026-001',
  tipo: 'Solicitud Ingreso',
  solicitante_id: 'bp-uuid',
  monto_estimado: 1000000,
  notas: 'New member application'
})

if (result.success) {
  console.log('Opportunity created:', result.oportunidad_id)
}
```

---

### `actualizarOportunidad(oportunidad_id: string, data: Partial<OportunidadData>)`

Update an existing opportunity.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `oportunidad_id` | string | ✅ | UUID of the opportunity |
| `estado` | enum | ❌ | New state: `abierta`, `en_proceso`, `ganada`, `perdida`, `cancelada` |
| `responsable_id` | string | ❌ | New responsible user |
| `monto_estimado` | number | ❌ | New estimated amount |
| `notas` | string | ❌ | New notes |
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
import { actualizarOportunidad } from '@/app/actions/oportunidades'

const result = await actualizarOportunidad('op-uuid', {
  estado: 'en_proceso',
  responsable_id: 'user-uuid',
  notas: 'Processing application'
})
```

---

### `softDeleteOportunidad(oportunidad_id: string)`

Soft delete an opportunity by setting `eliminado_en` timestamp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `oportunidad_id` | string | ✅ | UUID of the opportunity to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { softDeleteOportunidad } from '@/app/actions/oportunidades'

const result = await softDeleteOportunidad('op-uuid')
```

---

### `listOportunidades(organizacion_id: string, filters?: Filters)`

List all opportunities for an organization with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organizacion_id` | string | ✅ | UUID of the organization |
| `filters` | Filters | ❌ | Optional filters object |

**Filters Object:**

| Property | Type | Description |
|----------|------|-------------|
| `estado` | enum | Filter by state: `abierta`, `en_proceso`, `ganada`, `perdida`, `cancelada` |
| `tipo` | enum | Filter by type: `Solicitud Retiro`, `Solicitud Ingreso` |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Oportunidad>  // Array of opportunity objects with relationship data
}
```

**Example:**

```typescript
import { listOportunidades } from '@/app/actions/oportunidades'

// Get all opportunities
const result = await listOportunidades('org-uuid')

// Filter by state
const openResult = await listOportunidades('org-uuid', {
  estado: 'abierta'
})

// Filter by type
const ingresoResult = await listOportunidades('org-uuid', {
  tipo: 'Solicitud Ingreso'
})
```

---

## Opportunity Types

| Type | Description |
|-------|-------------|
| `Solicitud Retiro` | Request to withdraw from membership |
| `Solicitud Ingreso` | Request to join as a member |

## Opportunity States

| State | Description |
|-------|-------------|
| `abierta` | New opportunity, not yet processed |
| `en_proceso` | Currently being processed |
| `ganada` | Successfully completed |
| `perdida` | Not successful |
| `cancelada` | Cancelled by user or system |

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `oportunidades`
- **READ:** Requires `select` permission on `oportunidades`
- **UPDATE:** Requires `update` permission on `oportunidades`
- **DELETE:** Requires `delete` permission on `oportunidades`

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
- `/admin/oportunidades` - Opportunities list page
- `/admin/oportunidades/${oportunidad_id}` - Opportunity detail page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#oportunidades) - Database schema
- [`docs/database/FUNCTIONS.md`](../database/FUNCTIONS.md) - RPC function reference
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
