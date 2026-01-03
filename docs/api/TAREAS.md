# Tareas API

> **API reference for managing tasks**
> Module: [`app/actions/tareas.ts`](../app/actions/tareas.ts)

---

## Overview

The Tareas API provides CRUD operations for managing tasks. All functions integrate with RPC functions and enforce role-based authorization via RLS policies.

---

## Functions

### `crearTarea(data: TareaData)`

Create a new task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organizacion_id` | string | ✅ | UUID of the organization |
| `titulo` | string | ✅ | Task title |
| `descripcion` | string | ❌ | Optional task description |
| `prioridad` | enum | ❌ | Priority: `baja`, `media`, `alta`, `critica` (default: `media`) |
| `oportunidad_id` | string | ❌ | UUID of related opportunity |
| `asignado_a` | string | ❌ | UUID of assigned user |
| `relacionado_con_bp` | string | ❌ | UUID of related business partner |
| `fecha_vencimiento` | string | ❌ | Due date for the task |
| `atributos` | Record<string, unknown> | ❌ | Optional JSONB attributes |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  tarea_id?: string  // UUID of the created task
}
```

**Example:**

```typescript
import { crearTarea } from '@/app/actions/tareas'

const result = await crearTarea({
  organizacion_id: 'org-uuid',
  titulo: 'Review member application',
  descripcion: 'Review the new member application',
  prioridad: 'alta',
  oportunidad_id: 'op-uuid',
  asignado_a: 'user-uuid',
  fecha_vencimiento: '2026-01-15'
})

if (result.success) {
  console.log('Task created:', result.tarea_id)
}
```

---

### `actualizarTarea(tarea_id: string, data: Partial<TareaData>)`

Update an existing task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `tarea_id` | string | ✅ | UUID of the task |
| `titulo` | string | ❌ | New task title |
| `descripcion` | string | ❌ | New task description |
| `prioridad` | enum | ❌ | New priority: `baja`, `media`, `alta`, `critica` |
| `estado` | enum | ❌ | New state: `pendiente`, `en_progreso`, `bloqueada`, `hecha`, `cancelada` |
| `oportunidad_id` | string | ❌ | New related opportunity |
| `asignado_a` | string | ❌ | New assigned user |
| `fecha_vencimiento` | string | ❌ | New due date |
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
import { actualizarTarea } from '@/app/actions/tareas'

const result = await actualizarTarea('tarea-uuid', {
  estado: 'en_progreso',
  descripcion: 'Updated description'
})
```

---

### `softDeleteTarea(tarea_id: string)`

Soft delete a task by setting `eliminado_en` timestamp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `tarea_id` | string | ✅ | UUID of the task to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { softDeleteTarea } from '@/app/actions/tareas'

const result = await softDeleteTarea('tarea-uuid')
```

---

### `listTareas(organizacion_id: string, filters?: Filters)`

List all tasks for an organization with optional filtering.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organizacion_id` | string | ✅ | UUID of the organization |
| `filters` | Filters | ❌ | Optional filters object |

**Filters Object:**

| Property | Type | Description |
|----------|------|-------------|
| `estado` | enum | Filter by state: `pendiente`, `en_progreso`, `bloqueada`, `hecha`, `cancelada` |
| `prioridad` | enum | Filter by priority: `baja`, `media`, `alta`, `critica` |
| `asignado_a` | string | Filter by assigned user UUID |
| `oportunidad_id` | string | Filter by related opportunity UUID |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Tarea>  // Array of task objects with relationship data
}
```

**Example:**

```typescript
import { listTareas } from '@/app/actions/tareas'

// Get all tasks
const result = await listTareas('org-uuid')

// Filter by state
const pendingResult = await listTareas('org-uuid', {
  estado: 'pendiente'
})

// Filter by priority
const highPriorityResult = await listTareas('org-uuid', {
  prioridad: 'alta'
})

// Filter by assigned user
const myTasksResult = await listTareas('org-uuid', {
  asignado_a: 'user-uuid'
})
```

---

## Task Priorities

| Priority | Description |
|----------|-------------|
| `baja` | Low priority |
| `media` | Medium priority (default) |
| `alta` | High priority |
| `critica` | Critical priority |

## Task States

| State | Description |
|-------|-------------|
| `pendiente` | Pending, not yet started |
| `en_progreso` | In progress, currently being worked on |
| `bloqueada` | Blocked, waiting for something |
| `hecha` | Completed |
| `cancelada` | Cancelled |

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `tareas`
- **READ:** Requires `select` permission on `tareas`
- **UPDATE:** Requires `update` permission on `tareas`
- **DELETE:** Requires `delete` permission on `tareas`

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
- `/admin/tareas` - Tasks list page
- `/admin/tareas/${tarea_id}` - Task detail page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#tareas) - Database schema
- [`docs/database/FUNCTIONS.md`](../database/FUNCTIONS.md) - RPC function reference
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
