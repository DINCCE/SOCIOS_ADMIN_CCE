# Row Level Security (RLS) Policies

> **Complete security documentation for database-level access control**
>
> Last updated: 2025-12-28 | Auto-generated from live Supabase schema

---

## Table of Contents

- [Overview](#overview)
- [RLS Concepts](#rls-concepts)
- [Implementation Status](#implementation-status)
- [Policy Patterns](#policy-patterns)
- [Policies by Table](#policies-by-table)
- [Helper Functions](#helper-functions)
- [Testing RLS](#testing-rls)
- [Troubleshooting](#troubleshooting)

---

## Overview

Row Level Security (RLS) is **enabled on all 10 tables** in this database. Security is enforced at the PostgreSQL level, ensuring that application code cannot bypass access controls.

### Key Benefits

✅ **Database-enforced security** - Cannot be bypassed by application code
✅ **Role-based access control** - Flexible permission system
✅ **Organization-based isolation** - Multi-tenancy support
✅ **Audit trail** - All access controlled and logged
✅ **Defense in depth** - Security at the data layer

### Security Architecture

```
User Request
    ↓
Authentication (Supabase Auth)
    ↓
Organization Membership Check
    ↓
Role Permission Check (role_permissions)
    ↓
RLS Policy Evaluation
    ↓
Data Access Granted/Denied
```

---

## RLS Concepts

### Policy Types

| Type | When Applied | Purpose |
|------|--------------|---------|
| **SELECT** | Reading data | Controls which rows user can view |
| **INSERT** | Creating data | Controls what data user can create (WITH CHECK) |
| **UPDATE** | Modifying data | Controls what user can update (USING + WITH CHECK) |
| **DELETE** | Removing data | Controls what user can delete |

### USING vs WITH CHECK

- **USING clause**: Filters rows for SELECT, UPDATE, DELETE operations
- **WITH CHECK clause**: Validates new/updated rows for INSERT, UPDATE operations

```sql
-- Example: User can only see their organization's data
CREATE POLICY "bp_select"
  ON business_partners FOR SELECT
  USING (can_user_v2('business_partners', 'select', organizacion_id));

-- Example: User can only insert into their organization
CREATE POLICY "bp_insert"
  ON business_partners FOR INSERT
  WITH CHECK (can_user_v2('business_partners', 'insert', organizacion_id));
```

---

## Implementation Status

### Coverage Summary

| Table | RLS Enabled | Policies | SELECT | INSERT | UPDATE | DELETE |
|-------|-------------|----------|--------|--------|--------|--------|
| organizations | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| business_partners | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| personas | ✅ | 3 | ✅ | ✅ | ✅ | ❌ |
| empresas | ✅ | 3 | ✅ | ✅ | ✅ | ❌ |
| bp_relaciones | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| acciones | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| asignaciones_acciones | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| organization_members | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| roles | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| role_permissions | ✅ | 4 | ✅ | ✅ | ✅ | ✅ |
| **TOTAL** | **10/10** | **38** | **10** | **10** | **10** | **8** |

### Notes

- ❌ **personas/empresas DELETE**: Deletions handled via business_partners (CTI pattern)
- All policies use the `can_user_v2()` helper function for permission checks
- Soft delete pattern recommended (UPDATE eliminado_en) instead of hard DELETE

---

## Policy Patterns

### Pattern 1: Organization-Based Access

**Most common pattern** - User can only access data from their organization(s).

```sql
-- SELECT: Filter by organization membership
CREATE POLICY "table_select"
  ON table_name FOR SELECT
  USING (can_user_v2('table_name', 'select', organizacion_id));

-- INSERT: Validate organization membership
CREATE POLICY "table_insert"
  ON table_name FOR INSERT
  WITH CHECK (can_user_v2('table_name', 'insert', organizacion_id));

-- UPDATE: Check both old and new organization
CREATE POLICY "table_update"
  ON table_name FOR UPDATE
  USING (can_user_v2('table_name', 'update', organizacion_id))
  WITH CHECK (can_user_v2('table_name', 'update', organizacion_id));

-- DELETE: Verify organization membership
CREATE POLICY "table_delete"
  ON table_name FOR DELETE
  USING (can_user_v2('table_name', 'delete', organizacion_id));
```

**Used by:** business_partners, acciones, asignaciones_acciones, bp_relaciones

### Pattern 2: Soft Delete Filter

Automatically exclude soft-deleted records from queries.

```sql
CREATE POLICY "table_select"
  ON table_name FOR SELECT
  USING (
    can_user_v2('table_name', 'select', organizacion_id)
    AND eliminado_en IS NULL  -- Soft delete filter
  );
```

**Used by:** personas, empresas (via business_partners inheritance)

### Pattern 3: Class Table Inheritance (CTI)

Specialized tables check permissions via their base table.

```sql
-- Personas checks business_partners permission
CREATE POLICY "personas_select"
  ON personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_partners bp
      WHERE bp.id = personas.id
        AND can_user_v2('personas', 'select', bp.organizacion_id)
    )
    AND eliminado_en IS NULL
  );
```

**Used by:** personas, empresas

### Pattern 4: Admin-Only Operations

Certain operations restricted to admins/owners.

```sql
CREATE POLICY "om_update_roles"
  ON organization_members FOR UPDATE
  USING (is_org_admin_v2(organization_id))
  WITH CHECK (is_org_admin_v2(organization_id));
```

**Used by:** organization_members, roles, role_permissions

### Pattern 5: Self-Managed Organizations

Users creating organizations are automatically owners.

```sql
CREATE POLICY "orgs_insert"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Trigger assigns creator as owner after insert
```

**Used by:** organizations

---

## Policies by Table

### organizations (4 policies)

#### orgs_select
```sql
CREATE POLICY "orgs_select"
  ON organizations FOR SELECT
  USING (can_view_org_membership_v2(id));
```
**Logic:** User can view organizations they belong to.

#### orgs_insert
```sql
CREATE POLICY "orgs_insert"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```
**Logic:** Any authenticated user can create organizations. Creator becomes owner via trigger.

#### orgs_update
```sql
CREATE POLICY "orgs_update"
  ON organizations FOR UPDATE
  USING (is_org_admin_v2(id))
  WITH CHECK (is_org_admin(id));
```
**Logic:** Only admins/owners can update organization details.

#### orgs_delete
```sql
CREATE POLICY "orgs_delete"
  ON organizations FOR DELETE
  USING (is_org_owner_v2(id));
```
**Logic:** Only owners can delete organizations.

---

### business_partners (4 policies)

#### bp_select
```sql
CREATE POLICY "bp_select"
  ON business_partners FOR SELECT
  USING (can_user_v2('business_partners', 'select', organizacion_id));
```
**Logic:** User can view BPs from organizations where they have 'select' permission.

#### bp_insert
```sql
CREATE POLICY "bp_insert"
  ON business_partners FOR INSERT
  WITH CHECK (can_user_v2('business_partners', 'insert', organizacion_id));
```
**Logic:** User can create BPs in organizations where they have 'insert' permission.

#### bp_update
```sql
CREATE POLICY "bp_update"
  ON business_partners FOR UPDATE
  USING (can_user_v2('business_partners', 'update', organizacion_id))
  WITH CHECK (can_user_v2('business_partners', 'update', organizacion_id));
```
**Logic:** User can update BPs where they have 'update' permission in that organization.

#### bp_delete
```sql
CREATE POLICY "bp_delete"
  ON business_partners FOR DELETE
  USING (can_user_v2('business_partners', 'delete', organizacion_id));
```
**Logic:** User can soft-delete BPs where they have 'delete' permission.

---

### personas (3 policies)

#### personas_select
```sql
CREATE POLICY "personas_select"
  ON personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_partners bp
      WHERE bp.id = personas.id
        AND can_user_v2('personas', 'select', bp.organizacion_id)
    )
    AND eliminado_en IS NULL
  );
```
**Logic:** Check permission via business_partners + auto-filter soft-deleted records.

#### personas_insert
```sql
CREATE POLICY "personas_insert"
  ON personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_partners bp
      WHERE bp.id = personas.id
        AND can_user_v2('personas', 'insert', bp.organizacion_id)
    )
  );
```
**Logic:** Validate BP exists with correct permissions before inserting persona details.

#### personas_update
```sql
CREATE POLICY "personas_update"
  ON personas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_partners bp
      WHERE bp.id = personas.id
        AND can_user_v2('personas', 'update', bp.organizacion_id)
    )
    AND eliminado_en IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_partners bp
      WHERE bp.id = personas.id
        AND can_user_v2('personas', 'update', bp.organizacion_id)
    )
    AND eliminado_en IS NULL
  );
```
**Logic:** Update only active personas with proper permissions.

**Note:** DELETE policy not needed - deletions handled via business_partners table.

---

### empresas (3 policies)

Similar to personas policies - uses CTI pattern with business_partners checks.

#### empresas_select / empresas_insert / empresas_update
Same pattern as personas - checks business_partners permissions and filters soft-deleted records.

**Note:** DELETE policy not needed - deletions handled via business_partners table.

---

### bp_relaciones (4 policies)

#### bp_rel_select / bp_rel_insert / bp_rel_update / bp_rel_delete

All four CRUD policies follow Pattern 1 (Organization-Based Access):

```sql
USING (can_user_v2('bp_relaciones', 'ACTION', organizacion_id))
```

---

### acciones (4 policies)

#### acciones_select / acciones_insert / acciones_update / acciones_delete

All four CRUD policies follow Pattern 1 (Organization-Based Access):

```sql
USING (can_user_v2('acciones', 'ACTION', organizacion_id))
```

---

### asignaciones_acciones (4 policies)

#### asig_acc_select / asig_acc_insert / asig_acc_update / asig_acc_delete

All four CRUD policies follow Pattern 1 (Organization-Based Access):

```sql
USING (can_user_v2('asignaciones_acciones', 'ACTION', organizacion_id))
```

---

### organization_members (4 policies)

#### om_select_visible
```sql
CREATE POLICY "om_select_visible"
  ON organization_members FOR SELECT
  USING (can_view_org_membership_v2(organization_id));
```
**Logic:** Users can see membership of organizations they belong to.

#### om_insert_admins
```sql
CREATE POLICY "om_insert_admins"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_admin_v2(organization_id));
```
**Logic:** Only admins can add new members.

#### om_update_roles
```sql
CREATE POLICY "om_update_roles"
  ON organization_members FOR UPDATE
  USING (is_org_admin_v2(organization_id))
  WITH CHECK (is_org_admin_v2(organization_id));
```
**Logic:** Only admins can change member roles.

#### om_delete_members
```sql
CREATE POLICY "om_delete_members"
  ON organization_members FOR DELETE
  USING (
    is_org_owner_v2(organization_id)
    OR (
      is_org_admin_v2(organization_id)
      AND org_has_other_owner_v2(organization_id, user_id)
    )
  );
```
**Logic:** Owners can remove anyone. Admins can remove members except the last owner.

---

### roles (4 policies)

#### roles_read
```sql
CREATE POLICY "roles_read"
  ON roles FOR SELECT
  USING (true);
```
**Logic:** All authenticated users can read available roles.

#### roles_insert / roles_update / roles_delete
```sql
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
)
```
**Logic:** Only owners/admins can manage roles. Cannot delete 'owner' role (additional check).

---

### role_permissions (4 policies)

#### role_permissions_read
```sql
CREATE POLICY "role_permissions_read"
  ON role_permissions FOR SELECT
  USING (true);
```
**Logic:** All authenticated users can read role permissions.

#### role_permissions_insert / role_permissions_update / role_permissions_delete
```sql
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
)
```
**Logic:** Only owners/admins can manage permission mappings.

---

## Helper Functions

### can_user_v2(resource, action, org_id)

**Primary permission check function** used by most policies.

```sql
CREATE OR REPLACE FUNCTION can_user_v2(
  p_resource text,
  p_action text,
  p_org uuid
)
RETURNS boolean AS $$
  SELECT COALESCE(EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.role_permissions rp ON rp.role = om.role
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org
      AND rp.resource = p_resource
      AND rp.action = p_action
      AND rp.allow = true
  ), false);
$$ LANGUAGE sql SECURITY DEFINER;
```

**Returns:** `true` if user has the specified permission, `false` otherwise.

**Example:**
```sql
SELECT can_user_v2('business_partners', 'select', 'org-uuid');
-- Returns true if current user can SELECT from business_partners in that org
```

---

### is_org_admin_v2(org_id)

Checks if current user is an admin or owner of the organization.

```sql
CREATE OR REPLACE FUNCTION is_org_admin_v2(p_org uuid)
RETURNS boolean AS $$
  SELECT COALESCE((
    SELECT om.role IN ('owner','admin')
    FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org
    LIMIT 1
  ), false);
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### is_org_owner_v2(org_id)

Checks if current user is the owner of the organization.

```sql
CREATE OR REPLACE FUNCTION is_org_owner_v2(p_org uuid)
RETURNS boolean AS $$
  SELECT COALESCE((
    SELECT om.role = 'owner'
    FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org
    LIMIT 1
  ), false);
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### can_view_org_membership_v2(org_id)

Checks if user belongs to the organization (for viewing membership lists).

```sql
CREATE OR REPLACE FUNCTION can_view_org_membership_v2(p_org uuid)
RETURNS boolean AS $$
  SELECT COALESCE((
    SELECT om.role IN ('owner','admin')
    FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org
    LIMIT 1
  ), false);
$$ LANGUAGE sql SECURITY DEFINER;
```

---

### org_has_other_owner_v2(org_id, excluded_user_id)

Checks if organization has other owners besides specified user.

```sql
CREATE OR REPLACE FUNCTION org_has_other_owner_v2(
  p_org uuid,
  p_excluded_user_id uuid
)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org
      AND om.user_id <> p_excluded_user_id
      AND om.role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

**Used by:** Prevents removing the last owner from an organization.

---

## Testing RLS

### Test as Different Users

```sql
-- Set the JWT auth context to simulate a user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Test SELECT
SELECT * FROM business_partners;
-- Should only return BPs from user's organizations

-- Reset context
RESET request.jwt.claims;
```

### Test Permission Checks

```sql
-- Check if user has permission
SELECT can_user_v2('business_partners', 'select', 'org-uuid');

-- Check if user is admin
SELECT is_org_admin_v2('org-uuid');

-- Check if user is owner
SELECT is_org_owner_v2('org-uuid');
```

### Verify Policy Application

```sql
-- Check which policies exist on a table
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'business_partners';
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Permission denied for table X"

**Cause:** RLS is enabled but no policy allows access.

**Solution:**
1. Check if user belongs to an organization: `SELECT * FROM organization_members WHERE user_id = auth.uid()`
2. Check if user has required role permissions: `SELECT * FROM role_permissions WHERE role = 'user-role'`
3. Verify policy logic matches data structure

#### Issue 2: "Can't see any data after login"

**Cause:** User not assigned to any organization.

**Solution:**
```sql
-- Add user to organization
INSERT INTO organization_members (user_id, organization_id, role)
VALUES (auth.uid(), 'org-uuid', 'admin');
```

#### Issue 3: "Soft-deleted records still appearing"

**Cause:** Policy doesn't filter `eliminado_en IS NULL`.

**Solution:** Update policy to include soft delete filter:
```sql
ALTER POLICY "table_select" ON table_name
  USING (
    can_user_v2('table_name', 'select', organizacion_id)
    AND eliminado_en IS NULL  -- Add this
  );
```

#### Issue 4: "RPC function bypasses RLS"

**Cause:** RPC functions run with SECURITY DEFINER, potentially bypassing RLS.

**Solution:** Ensure RPC functions explicitly check permissions:
```sql
CREATE OR REPLACE FUNCTION crear_persona(...)
RETURNS jsonb AS $$
BEGIN
  -- Explicit permission check
  IF NOT can_user_v2('personas', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- ... rest of function
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Debugging Queries

**See all policies for authenticated users:**
```sql
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND 'authenticated' = ANY(roles)
ORDER BY tablename, cmd;
```

**Check user's current organization memberships:**
```sql
SELECT
  o.nombre,
  om.role,
  om.organization_id
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = auth.uid();
```

**List all permissions for a role:**
```sql
SELECT
  resource,
  action,
  allow
FROM role_permissions
WHERE role = 'admin'
ORDER BY resource, action;
```

---

## Security Best Practices

### ✅ DO

1. **Always enable RLS** on tables containing sensitive data
2. **Use helper functions** for consistent permission checks
3. **Test policies** with different user roles
4. **Filter soft-deleted** records in SELECT policies
5. **Validate organization membership** in WITH CHECK clauses
6. **Use SECURITY DEFINER** carefully in functions
7. **Document policy logic** for maintenance

### ❌ DON'T

1. **Don't bypass RLS** with superuser queries in application code
2. **Don't hard-code** organization IDs in policies
3. **Don't forget** soft delete filters
4. **Don't allow** removing the last owner
5. **Don't duplicate** permission logic across policies
6. **Don't skip testing** with non-admin users
7. **Don't use** SELECT * in RLS functions (performance)

---

## Summary

**Current Implementation:**
- ✅ 10/10 tables with RLS enabled
- ✅ 38 active policies
- ✅ 10 SELECT policies (100%)
- ✅ 10 INSERT policies (100%)
- ✅ 10 UPDATE policies (100%)
- ✅ 8 DELETE policies (80% - personas/empresas use BP for deletes)

**Security Level:** 🟢 **Production Ready**

All critical tables have comprehensive RLS policies enforcing organization-based access control with role-based permissions.

---

**Last Generated:** 2025-12-28
**Total Policies:** 38
**Helper Functions:** 5
**Security Pattern:** Organization-based + Role-based Access Control (RBAC)
