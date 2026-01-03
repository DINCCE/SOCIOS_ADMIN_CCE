# Members API

> **API reference for managing organization members**
> Module: [`app/actions/admin/members.ts`](../app/actions/admin/members.ts)

---

## Overview

The Members API provides CRUD operations for managing users within organizations. All functions enforce role-based authorization via RLS policies.

---

## Functions

### `addMember(data: MemberData)`

Add a user to an organization with a specific role.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `user_id` | string | ✅ | UUID of the user to add |
| `organization_id` | string | ✅ | UUID of the organization |
| `role` | enum | ✅ | Role to assign: `owner`, `admin`, `analyst`, `auditor` |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { addMember } from '@/app/actions/admin/members'

const result = await addMember({
  user_id: 'user-uuid',
  organization_id: 'org-uuid',
  role: 'admin'
})

if (result.success) {
  console.log('Member added successfully')
}
```

---

### `updateMemberRole(user_id: string, organization_id: string, role: Role)`

Update a member's role within an organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `user_id` | string | ✅ | UUID of the user |
| `organization_id` | string | ✅ | UUID of the organization |
| `role` | enum | ✅ | New role: `owner`, `admin`, `analyst`, `auditor` |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { updateMemberRole } from '@/app/actions/admin/members'

const result = await updateMemberRole('user-uuid', 'org-uuid', 'analyst')
```

---

### `removeMember(user_id: string, organization_id: string)`

Remove a user from an organization.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `user_id` | string | ✅ | UUID of the user to remove |
| `organization_id` | string | ✅ | UUID of the organization |

**Returns:**

```typescript
{
  success: boolean,
  message: string
}
```

**Example:**

```typescript
import { removeMember } from '@/app/actions/admin/members'

const result = await removeMember('user-uuid', 'org-uuid')
```

---

### `listMembers(organization_id: string)`

List all members of an organization with user details.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `organization_id` | string | ✅ | UUID of the organization |

**Returns:**

```typescript
{
  success: boolean,
  data?: Array<Member>  // Array of member objects with user data
}
```

**Example:**

```typescript
import { listMembers } from '@/app/actions/admin/members'

const result = await listMembers('org-uuid')
if (result.success) {
  console.log('Members:', result.data)
}
```

---

## Role Definitions

| Role | Level | Capabilities |
|-------|-------|--------------|
| `owner` | 100 | Full access, manage members, delete organization |
| `admin` | 75 | Manage data, assign roles (except owner) |
| `analyst` | 50 | Read all data, limited write access |
| `auditor` | 25 | Read-only access to all data |

---

## Authorization

All functions enforce role-based authorization via RLS policies:

- **CREATE:** Requires `insert` permission on `organization_members`
- **READ:** Requires `select` permission on `organization_members`
- **UPDATE:** Requires `update` permission on `organization_members`
- **DELETE:** Requires `delete` permission on `organization_members`

**Important Notes:**
- Only users with `owner` or `admin` role can add/remove members
- Only `owner` can assign the `owner` role to others
- Users cannot remove themselves from an organization where they are the only `owner`

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
- `23505` - Duplicate entry (user already in organization)
- `23503` - Foreign key violation

---

## Cache Revalidation

Functions automatically revalidate Next.js cache paths:
- `/admin/organizations` - Organizations list page
- `/admin/organizations/${organization_id}/members` - Members list page

---

## Related Documentation

- [`IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md`](./IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md) - Implementation plan
- [`docs/database/TABLES.md`](../database/TABLES.md#organization_members) - Database schema
- [`docs/api/ORGANIZATIONS.md`](./ORGANIZATIONS.md) - Organizations API
- [`lib/auth/permissions.ts`](../lib/auth/permissions.ts) - Authorization helpers
