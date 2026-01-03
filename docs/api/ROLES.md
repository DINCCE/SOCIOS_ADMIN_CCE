# Roles API

> **API reference for managing roles**
> Module: [`app/actions/admin/roles.ts`](../app/actions/admin/roles.ts)

---

## Overview

The Roles API provides CRUD operations for managing role definitions. All functions enforce role-based authorization via RLS policies.

---

## Functions

### `createRole(data: RoleData)`

Create a new role definition.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `role` | string | ✅ | Role identifier (e.g., `custom_role`) |
| `description` | string | ❌ | Optional description of the role |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  role?: Role  // Created role object
}
```

**Example:**

```typescript
import { createRole } from '@/app/actions/admin/roles'

const result = await createRole({
  role: 'custom_manager',
  description: 'Custom manager role with limited permissions'
})

if (result.success) {
  console.log('Role created:', result.role)
}
```

---

### `updateRole(role: string, data: { description?: string })`

Update an existing role's description.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `role` | string | ✅ | Role identifier to update |
| `description` | string | ❌ | New description for the role |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { updateRole } from '@/app/actions/admin/roles'

const result = await updateRole('analyst', {
  description: 'Updated analyst role description'
})
```

---

### `deleteRole(role: string)`

Delete a role definition.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `role` | string | ✅ | Role identifier to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { deleteRole } from '@/app/actions/admin/roles'

const result = await deleteRole('custom_role')
```

**Important Notes:**
- System roles (`owner`, `admin`, `analyst`, `auditor`) cannot be deleted
- Attempting to delete a system role will return an error

---

### `listRoles()`

List all available roles.

**Parameters:**

None

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Role>  // Array of role objects
}
```

**Example:**

```typescript
import { listRoles } from '@/app/actions/admin/roles'

const result = await listRoles()
if (result.success) {
  console.log('Roles:', result.data)
}
```

---

## System Roles

| Role | Level | Capabilities |
|-------|-------|--------------|
| `owner` | 100 | Full access, manage members, delete organization |
| `admin` | 75 | Manage data, assign roles (except owner) |
| `analyst` | 50 | Read all data, limited write access |
| `auditor` | 25 | Read-only access to all data |

---

## Custom Roles

You can create custom roles for specialized use cases:

```typescript
// Example: Create a custom manager role
await createRole({
  role: 'department_manager',
  description: 'Manager with access to specific departments'
})

// Example: Create a custom editor role
await createRole({
  role: 'content_editor',
  description: 'Can edit content but not manage users'
})
```

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `roles`
- **READ:** Requires `select` permission on `roles`
- **UPDATE:** Requires `update` permission on `roles`
- **DELETE:** Requires `delete` permission on `roles`

**Important:**
- Only users with `owner` or `admin` role can manage roles
- System roles cannot be deleted
- Custom roles can be created and managed by admins

Use the [`isAdmin()`](../lib/auth/permissions.ts) helper to verify admin status before calling functions.

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
- `23505` - Duplicate entry (role already exists)

---

## Cache Revalidation

Functions automatically revalidate Next.js cache paths:
- `/admin/roles` - Roles list page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#roles) - Database schema
- [`docs/api/PERMISSIONS.md`](./PERMISSIONS.md) - Permissions API
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
