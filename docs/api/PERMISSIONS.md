# Permissions API

> **API reference for managing role permissions**
> Module: [`app/actions/admin/permissions.ts`](../app/actions/admin/permissions.ts)

---

## Overview

The Permissions API provides CRUD operations for managing role-based access control. All functions enforce role-based authorization via RLS policies.

---

## Functions

### `grantPermission(data: PermissionData)`

Grant a permission to a role for a specific resource and action.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `role` | string | ✅ | Role identifier (e.g., `admin`, `analyst`) |
| `resource` | string | ✅ | Resource name (table name, e.g., `business_partners`) |
| `action` | enum | ✅ | CRUD action: `select`, `insert`, `update`, `delete` |
| `allow` | boolean | ❌ | Allow/deny permission (default: `true`) |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { grantPermission } from '@/app/actions/admin/permissions'

const result = await grantPermission({
  role: 'analyst',
  resource: 'business_partners',
  action: 'select',
  allow: true
})

if (result.success) {
  console.log('Permission granted')
}
```

---

### `revokePermission(role: string, resource: string, action: Action)`

Revoke a permission from a role.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `role` | string | ✅ | Role identifier |
| `resource` | string | ✅ | Resource name (table name) |
| `action` | enum | ✅ | CRUD action: `select`, `insert`, `update`, `delete` |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { revokePermission } from '@/app/actions/admin/permissions'

const result = await revokePermission('analyst', 'business_partners', 'delete')
```

---

### `listPermissions(role: string)`

List all permissions for a specific role.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `role` | string | ✅ | Role identifier |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Permission>  // Array of permission objects
}
```

**Example:**

```typescript
import { listPermissions } from '@/app/actions/admin/permissions'

const result = await listPermissions('admin')
if (result.success) {
  console.log('Admin permissions:', result.data)
}
```

---

### `listAllPermissions()`

List all permissions across all roles.

**Parameters:**

None

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Permission>  // Array of all permission objects
}
```

**Example:**

```typescript
import { listAllPermissions } from '@/app/actions/admin/permissions'

const result = await listAllPermissions()
if (result.success) {
  console.log('All permissions:', result.data)
}
```

---

## Permission Model

### Resource-Action Pattern

Permissions follow a resource-action pattern:

- **Resource:** Table name (e.g., `business_partners`, `acciones`, `oportunidades`)
- **Action:** CRUD operation (`select`, `insert`, `update`, `delete`)
- **Allow:** Boolean flag indicating permission granted/denied

### Example Permissions

```typescript
// Grant read access to business_partners for analysts
{
  role: 'analyst',
  resource: 'business_partners',
  action: 'select',
  allow: true
}

// Deny delete access to organizations for auditors
{
  role: 'auditor',
  resource: 'organizations',
  action: 'delete',
  allow: false
}
```

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `role_permissions`
- **READ:** Requires `select` permission on `role_permissions`
- **UPDATE:** Requires `update` permission on `role_permissions`
- **DELETE:** Requires `delete` permission on `role_permissions`

**Important Notes:**
- Only users with `owner` or `admin` role can manage permissions
- Custom roles can have custom permission sets
- System roles have predefined permissions

Use the [`checkPermission()`](../lib/auth/permissions.ts) helper to verify specific permissions before operations.

---

## Permission Matrix

| Role | Level | business_partners | acciones | oportunidades | tareas | organizations |
|-------|-------|----------------|---------|--------------|--------------|----------------|-----------------|
| **owner** | 100 | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ |
| **admin** | 75 | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ |
| **analyst** | 50 | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ |
| **auditor** | 25 | ✅✅❌❌ | ✅✅❌❌ | ✅✅❌❌ | ✅✅❌❌ | ✅✅❌❌ |

**Legend:**
- ✅ = Permission granted
- ❌ = Permission denied

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
- `42501` - Permission denied (user not admin)
- `23505` - Duplicate entry (permission already exists)
- `23503` - Foreign key violation

---

## Cache Revalidation

Functions automatically revalidate Next.js cache paths:
- `/admin/roles` - Roles list page
- `/admin/roles/${role}/permissions` - Role permissions page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#role_permissions) - Database schema
- [`docs/api/ROLES.md`](./ROLES.md) - Roles API
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
