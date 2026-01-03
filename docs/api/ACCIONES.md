# Acciones API

> **API reference for managing club shares/actions**
> Module: [`app/actions/acciones.ts`](../app/actions/acciones.ts)

---

## Overview

The Acciones API provides CRUD operations for managing club shares (acciones) and their assignments (asignaciones_acciones). All functions integrate with RPC functions and enforce role-based authorization via RLS policies.

---

## Acciones (Club Shares) Functions

### `crearAccion(data: AccionData)`

Create a new club share/action.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organizacion_id` | string | ✅ | UUID of the organization |
| `codigo_accion` | string | ✅ | 4-digit action code |
| `estado` | string | ❌ | Current status (default: `disponible`) |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  accion_id?: string  // UUID of the created action
}
```

**Example:**

```typescript
import { crearAccion } from '@/app/actions/acciones'

const result = await crearAccion({
  organizacion_id: 'org-uuid',
  codigo_accion: '0001',
  estado: 'disponible'
})

if (result.success) {
  console.log('Action created:', result.accion_id)
}
```

---

### `actualizarAccion(accion_id: string, data: { estado?: string })`

Update an existing action.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `accion_id` | string | ✅ | UUID of the action to update |
| `estado` | string | ❌ | New status for the action |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { actualizarAccion } from '@/app/actions/acciones'

const result = await actualizarAccion('accion-uuid', {
  estado: 'asignada'
})
```

---

### `softDeleteAccion(accion_id: string)`

Soft delete an action by setting `eliminado_en` timestamp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `accion_id` | string | ✅ | UUID of the action to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { softDeleteAccion } from '@/app/actions/acciones'

const result = await softDeleteAccion('accion-uuid')
```

---

### `listAcciones(organizacion_id: string)`

List all actions for an organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organizacion_id` | string | ✅ | UUID of the organization |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Accion>  // Array of action objects
}
```

**Example:**

```typescript
import { listAcciones } from '@/app/actions/acciones'

const result = await listAcciones('org-uuid')
if (result.success) {
  console.log('Actions:', result.data)
}
```

---

## Asignaciones (Action Assignments) Functions

### `crearAsignacion(data: AsignacionData)`

Create an action assignment.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `accion_id` | string | ✅ | UUID of the action |
| `persona_id` | string | ✅ | UUID of the person |
| `tipo_asignacion` | enum | ✅ | Assignment type: `dueño`, `titular`, `beneficiario` |
| `subcodigo` | string | ❌ | Optional sub-code |
| `fecha_inicio` | string | ❌ | Start date (defaults to today) |
| `atributos` | Record<string, unknown> | ❌ | Optional JSONB attributes |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  asignacion_id?: string  // UUID of the created assignment
}
```

**Example:**

```typescript
import { crearAsignacion } from '@/app/actions/acciones'

const result = await crearAsignacion({
  accion_id: 'accion-uuid',
  persona_id: 'persona-uuid',
  tipo_asignacion: 'dueño',
  fecha_inicio: '2026-01-01'
})
```

---

### `transferirAccion(data: TransferData)`

Transfer action ownership to a new owner.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `accion_id` | string | ✅ | UUID of the action |
| `nuevo_dueno_id` | string | ✅ | UUID of the new owner |
| `fecha_transferencia` | string | ❌ | Transfer date (defaults to today) |
| `atributos` | Record<string, unknown> | ❌ | Optional JSONB attributes |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { transferirAccion } from '@/app/actions/acciones'

const result = await transferirAccion({
  accion_id: 'accion-uuid',
  nuevo_dueno_id: 'new-owner-uuid',
  fecha_transferencia: '2026-01-15'
})
```

---

### `finalizarAsignacion(asignacion_id: string, fecha_fin?: string)`

End an action assignment by setting end date.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `asignacion_id` | string | ✅ | UUID of the assignment |
| `fecha_fin` | string | ❌ | End date (defaults to today) |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { finalizarAsignacion } from '@/app/actions/acciones'

const result = await finalizarAsignacion('asignacion-uuid', '2026-12-31')
```

---

### `listAsignaciones(accion_id: string, solo_vigentes?: boolean)`

List all assignments for an action.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `accion_id` | string | ✅ | UUID of the action |
| `solo_vigentes` | boolean | ❌ | Return only active assignments (default: true) |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Asignacion>  // Array of assignment objects with business_partners data
}
```

**Example:**

```typescript
import { listAsignaciones } from '@/app/actions/acciones'

// Get all active assignments
const result = await listAsignaciones('accion-uuid', true)

// Get all assignments including inactive
const allResult = await listAsignaciones('accion-uuid', false)
```

---

### `softDeleteAsignacion(asignacion_id: string)`

Soft delete an assignment by setting `eliminado_en` timestamp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `asignacion_id` | string | ✅ | UUID of the assignment to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { softDeleteAsignacion } from '@/app/actions/acciones'

const result = await softDeleteAsignacion('asignacion-uuid')
```

---

## Assignment Types

| Type | Description |
|-------|-------------|
| `dueño` | Primary owner of the action |
| `titular` | Primary holder of the action |
| `beneficiario` | Beneficiary of the action |

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE (acciones):** Requires `insert` permission on `acciones`
- **READ (acciones):** Requires `select` permission on `acciones`
- **UPDATE (acciones):** Requires `update` permission on `acciones`
- **DELETE (acciones):** Requires `delete` permission on `acciones`
- **CREATE (asignaciones):** Requires `insert` permission on `asignaciones_acciones`
- **READ (asignaciones):** Requires `select` permission on `asignaciones_acciones`
- **UPDATE (asignaciones):** Requires `update` permission on `asignaciones_acciones`
- **DELETE (asignaciones):** Requires `delete` permission on `asignaciones_acciones`

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
- `23505` - Duplicate entry (e.g., duplicate codigo_accion)
- `23503` - Foreign key violation

---

## Cache Revalidation

Functions automatically revalidate Next.js cache paths:
- `/admin/socios/acciones` - Actions list page
- `/admin/socios/acciones/${accion_id}` - Action detail page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#acciones) - Database schema for acciones
- [`docs/database/TABLES.md`](../database/TABLES.md#asignaciones_acciones) - Database schema for asignaciones_acciones
- [`docs/database/FUNCTIONS.md`](../database/FUNCTIONS.md) - RPC function reference
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
