# Organizations API

> **API reference for managing organizations**
> Module: [`app/actions/admin/organizations.ts`](../app/actions/admin/organizations.ts)

---

## Overview

The Organizations API provides CRUD operations for managing organizations. All functions enforce role-based authorization via RLS policies.

---

## Functions

### `createOrganization(data: OrganizationData)`

Create a new organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `nombre` | string | ✅ | Organization name |
| `slug` | string | ✅ | URL-friendly identifier |
| `tipo` | string | ❌ | Organization type (default: `club`) |
| `organizacion_padre_id` | string | ❌ | UUID of parent organization |
| `email` | string | ❌ | Contact email |
| `telefono` | string | ❌ | Contact phone |
| `website` | string | ❌ | Website URL |
| `direccion` | Record<string, unknown> | ❌ | Address object |
| `configuracion` | Record<string, unknown> | ❌ | Configuration object |

**Returns:**

```typescript
{
  success: boolean,
  message: string,
  organization_id?: string  // UUID of the created organization
}
```

**Example:**

```typescript
import { createOrganization } from '@/app/actions/admin/organizations'

const result = await createOrganization({
  nombre: 'Club de Golf',
  slug: 'club-golf',
  tipo: 'club',
  email: 'contact@clubgolf.com'
})

if (result.success) {
  console.log('Organization created:', result.organization_id)
}
```

---

### `updateOrganization(organization_id: string, data: Partial<OrganizationData>)`

Update an existing organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organization_id` | string | ✅ | UUID of the organization |
| `nombre` | string | ❌ | New organization name |
| `slug` | string | ❌ | New slug |
| `tipo` | string | ❌ | New organization type |
| `organizacion_padre_id` | string | ❌ | New parent organization |
| `email` | string | ❌ | New email |
| `telefono` | string | ❌ | New phone |
| `website` | string | ❌ | New website |
| `direccion` | Record<string, unknown> | ❌ | New address |
| `configuracion` | Record<string, unknown> | ❌ | New configuration |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { updateOrganization } from '@/app/actions/admin/organizations'

const result = await updateOrganization('org-uuid', {
  nombre: 'Updated Name',
  email: 'newemail@club.com'
})
```

---

### `softDeleteOrganization(organization_id: string)`

Soft delete an organization by setting `eliminado_en` timestamp.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organization_id` | string | ✅ | UUID of the organization to delete |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { softDeleteOrganization } from '@/app/actions/admin/organizations'

const result = await softDeleteOrganization('org-uuid')
```

---

### `listOrganizations()`

List all organizations accessible to the current user.

**Parameters:**

None

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Organization>  // Array of organization objects
}
```

**Example:**

```typescript
import { listOrganizations } from '@/app/actions/admin/organizations'

const result = await listOrganizations()
if (result.success) {
  console.log('Organizations:', result.data)
}
```

---

## Organization Types

| Type | Description |
|-------|-------------|
| `club` | Sports or social club |
| `association` | Professional association |
| `fundacion` | Foundation or non-profit |
| `empresa` | Business entity |

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `organizations`
- **READ:** Requires `select` permission on `organizations`
- **UPDATE:** Requires `update` permission on `organizations`
- **DELETE:** Requires `delete` permission on `organizations`

**Note:** Only users with `owner` or `admin` role can create organizations. The creator is automatically assigned as `owner` via database trigger.

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
- `42501` - Permission denied
- `23505` - Duplicate entry (e.g., duplicate slug)
- `23503` - Foreign key violation

---

## Cache Revalidation

Functions automatically revalidate Next.js cache paths:
- `/admin/organizations` - Organizations list page
- `/admin/organizations/${organization_id}` - Organization detail page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#organizations) - Database schema
- [`docs/database/FUNCTIONS.md`](../database/FUNCTIONS.md) - RPC function reference
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
