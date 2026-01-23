# Role-Based Access Control (RBAC)

## Overview

The app now has **3 layers of security**:

1. **Database RLS** ✅ (you already had this) - Blocks unauthorized CRUD operations
2. **Middleware** ✅ (new) - Redirects unauthorized users away from protected routes
3. **UI Hiding** ✅ (new) - Hides buttons/menus based on user role

---

## Quick Usage

### 1. Hide/Show UI Elements by Role

```tsx
'use client'

import { useRolePermissions, RequireOwner, RequireAdmin } from '@/lib/auth/use-permissions'

type User = {
  role: 'owner' | 'admin' | 'analyst' | 'auditor' | null
}

export function MyComponent({ user }: { user: User }) {
  const { canDelete, canUpdateConfig } = useRolePermissions(user.role)

  return (
    <div>
      {/* Only show delete button to admins/owners */}
      {canDelete && (
        <Button variant="destructive">Delete</Button>
      )}

      {/* Only owners can see config section */}
      <RequireOwner role={user.role} fallback={<p>Access denied</p>}>
        <ConfigurationPanel />
      </RequireOwner>

      {/* Admins and owners can see this */}
      <RequireAdmin role={user.role}>
        <AdminPanel />
      </RequireAdmin>
    </div>
  )
}
```

### 2. Server Component Check (Before Rendering)

```tsx
import { getCurrentUserRole } from '@/lib/auth/rbac'
import { AccessDenied } from '@/components/auth/access-denied'
import type { UserRole } from '@/lib/auth/page-permissions'

export default async function ConfigPage() {
  const orgId = '...' // get from cookies/session
  const role = await getCurrentUserRole(orgId)

  // Only owners can access config
  if (role !== 'owner') {
    return <AccessDenied message="Solo los propietarios pueden acceder a la configuración" />
  }

  return <ConfigPanel />
}
```

### 3. Protected Route (Automatic via Middleware)

Routes are automatically protected based on `lib/auth/page-permissions.ts`:

```typescript
// These routes are already configured:
/admin/configuracion      → Only owners
/admin/configuracion/*    → Only owners
/admin/socios             → All roles (owner, admin, analyst, auditor)
```

To add a new protected route, edit [lib/auth/page-permissions.ts](lib/auth/page-permissions.ts):

```typescript
export const PAGE_PERMISSIONS: PagePermission[] = [
  // Add your route here:
  {
    path: '/admin/my-new-page',
    roles: ['owner', 'admin'], // Who can access
  },
]
```

---

## Role Permissions Summary

| Action | Owner | Admin | Analyst | Auditor |
|--------|-------|-------|---------|---------|
| View data | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ❌ |
| Edit | ✅ | ✅ | ✅ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Change config | ✅ | ❌ | ❌ | ❌ |

---

## Files Added

| File | Purpose |
|------|---------|
| [lib/auth/page-permissions.ts](lib/auth/page-permissions.ts) | Route → role mapping |
| [lib/auth/rbac.ts](lib/auth/rbac.ts) | Server-side permission helpers |
| [lib/auth/use-permissions.ts](lib/auth/use-permissions.ts) | Client-side UI helpers |
| [components/auth/access-denied.tsx](components/auth/access-denied.tsx) | Access denied component |
| [app/admin/access-denied/page.tsx](app/admin/access-denied/page.tsx) | Access denied page |
| [lib/supabase/middleware.ts](lib/supabase/middleware.ts) | Updated with route checks |

---

## Common Patterns

### Pattern 1: Delete Button (Owner/Admin only)

```tsx
'use client'

import { canDelete } from '@/lib/auth/use-permissions'

export function DeleteButton({ role, onDelete }: { role: UserRole; onDelete: () => void }) {
  if (!canDelete(role)) return null

  return (
    <Button variant="destructive" onClick={onDelete}>
      Eliminar
    </Button>
  )
}
```

### Pattern 2: Entire Section for Owners Only

```tsx
'use client'

import { RequireOwner } from '@/lib/auth/use-permissions'

export function SettingsSection({ role }: { role: UserRole }) {
  return (
    <RequireOwner role={role}>
      <Section title="Configuración">
        {/* Settings content */}
      </Section>
    </RequireOwner>
  )
}
```

### Pattern 3: Server Action Permission Check

```typescript
'use server'

import { checkPermission } from '@/lib/auth/permissions'

export async function deleteActor(actorId: string, orgId: string) {
  // Check permission first
  const canDelete = await checkPermission('dm_actores', 'delete', orgId)
  if (!canDelete) {
    return { success: false, message: 'No tienes permiso para eliminar' }
  }

  // Proceed with deletion...
}
```

---

## Security Notes

1. **UI hiding is for UX, not security** - Always validate on server
2. **Database RLS is the final layer** - Even if UI/Server checks fail, RLS blocks data access
3. **Middleware checks are fast** - They prevent unnecessary page loads
4. **Fail open on errors** - If permission check fails, allow access (RLS will still protect data)

---

## Need More Granular Permissions?

For per-resource permissions (beyond role-based), use:

```typescript
import { hasPermission } from '@/lib/auth/rbac'

// Check if user can delete actors
const canDeleteActors = await hasPermission(orgId, 'dm_actores', 'delete')
```

This queries the database and respects your `config_roles_permisos` table.
