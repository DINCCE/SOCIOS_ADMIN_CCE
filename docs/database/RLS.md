# Row Level Security (RLS) Documentation

This document describes the Row Level Security (RLS) policies implemented in the database to ensure data isolation, access control, and security.

## Table of Contents

- [Overview](#overview)
- [Security Architecture](#security-architecture)
- [Roles and Permissions](#roles-and-permissions)
- [RLS Policies by Table](#rls-policies-by-table)
- [Security Functions](#security-functions)
- [Best Practices](#best-practices)

---

## Overview

Row Level Security (RLS) is **enabled on all tables** across the `public`, `auth`, and `storage` schemas. This ensures that:

1. **Multi-tenancy isolation**: Users can only access data from their organization
2. **Role-based access control**: Users can only perform actions their role permits
3. **Soft delete enforcement**: Deleted records are automatically filtered out
4. **Audit trail**: All access is tracked through the security layer

### RLS Status Summary

| Schema | Tables with RLS | Tables without RLS |
|--------|-----------------|-------------------|
| `public` | 10/10 (100%) | 0 |
| `auth` | 18/22 (82%) | 4* (OAuth tables) |
| `storage` | 9/9 (100%) | 0 |

**Note**: OAuth tables (`oauth_clients`, `oauth_authorizations`, `oauth_consents`, `oauth_client_states`) have RLS disabled as they are managed internally by the authentication system.

---

## Security Architecture

### Three-Layer Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 1: Authentication                  │
│         User must be authenticated (auth.uid() required)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 2: Organization Membership         │
│  User must belong to organization (config_organizacion_     │
│  miembros.user_id = auth.uid() AND eliminado_en IS NULL)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 3: Permission Check                │
│   User's role must have permission (can_user_v2 checks      │
│   config_roles_permisos for resource + action + allow)      │
└─────────────────────────────────────────────────────────────┘
```

### Access Control Flow

1. **Authentication**: `auth.uid()` returns the current user's UUID
2. **Membership**: Query `config_organizacion_miembros` to find user's organizations and roles
3. **Permission**: Check `config_roles_permisos` for role's allowed resources and actions
4. **Isolation**: Filter data by `organizacion_id` and `eliminado_en IS NULL`

---

## Roles and Permissions

### Defined Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **owner** | Organization owner | Full access to all resources including config tables |
| **admin** | Organization administrator | Full access to business tables (dm_*, tr_*, vn_*) |
| **analyst** | Business analyst | Create, read, update business tables (no delete) |
| **auditor** | Auditor | Read-only access to business tables |

### Permission Matrix

#### Business Tables (dm_*, tr_*, vn_*)

| Resource | owner | admin | analyst | auditor |
|----------|-------|-------|---------|---------|
| `dm_actores` (Business Partners) | ✅ All | ✅ All | ✅ Insert, Select, Update | ✅ Select |
| `dm_acciones` (Shares/Actions) | ✅ All | ✅ All | ✅ Insert, Select, Update | ✅ Select |
| `tr_doc_comercial` (Commercial Documents) | ✅ All | ✅ All | ✅ Insert, Select, Update | ✅ Select |
| `tr_tareas` (Tasks) | ✅ All | ✅ All | ✅ Insert, Select, Update | ✅ Select |
| `vn_asociados` (Member Assignments) | ✅ All | ✅ All | ✅ Insert, Select, Update | ✅ Select |
| `vn_relaciones_actores` (Actor Relationships) | ✅ All | ✅ All | ✅ Insert, Select, Update | ✅ Select |

#### Configuration Tables (config_*)

| Resource | owner | admin | analyst | auditor |
|----------|-------|-------|---------|---------|
| `config_organizaciones` | ✅ All | ❌ | ❌ | ❌ |
| `config_organizacion_miembros` | ✅ All | ❌ | ❌ | ❌ |
| `config_roles` | ✅ All | ❌ | ❌ | ❌ |
| `config_roles_permisos` | ✅ All | ❌ | ❌ | ❌ |
| `config_ciudades` | ✅ All | ❌ | ❌ | ❌ |

**Legend:**
- ✅ All = SELECT, INSERT, UPDATE, DELETE
- ✅ Insert, Select, Update = Can create and modify, but not delete
- ✅ Select = Read-only access
- ❌ = No access

### Role Permission Details

#### Owner Role
**Full access** to all resources within their organization(s):
- All business tables: SELECT, INSERT, UPDATE, DELETE
- All configuration tables: SELECT, INSERT, UPDATE, DELETE
- Can manage organization members and roles
- Can modify organization settings

#### Admin Role
**Full access** to business resources only:
- All business tables: SELECT, INSERT, UPDATE, DELETE
- No access to configuration tables
- Cannot manage roles or permissions

#### Analyst Role
**Read and modify** business data, but cannot delete:
- All business tables: SELECT, INSERT, UPDATE
- Cannot DELETE any records
- No access to configuration tables

#### Auditor Role
**Read-only** access for audit and compliance:
- All business tables: SELECT only
- Cannot create, modify, or delete any data
- No access to configuration tables

---

## RLS Policies by Table

### Policy Naming Convention

All policies follow this naming pattern:
```
{table_name}_{action}
```

Example: `dm_actores_select`, `config_organizaciones_update`

### Policy Types

For each table, four policies are created:

| Policy | Command | Purpose |
|--------|---------|---------|
| `{table}_select` | SELECT | Controls read access |
| `{table}_insert` | INSERT | Controls create access |
| `{table}_update` | UPDATE | Controls modify access |
| `{table}_delete` | DELETE | Controls delete access |

---

### Public Schema Policies

#### Configuration Tables

##### `config_ciudades` (Cities Catalog)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `config_ciudades_select` | SELECT | `public` | `eliminado_en IS NULL` |
| `config_ciudades_insert` | INSERT | `authenticated` | Must be admin/owner of any org |
| `config_ciudades_update` | UPDATE | `authenticated` | Must be admin/owner AND `eliminado_en IS NULL` |
| `config_ciudades_delete` | DELETE | `authenticated` | Must be admin/owner |

**Special Note**: Public SELECT access allows unauthenticated users to read cities catalog for dropdowns, etc.

---

##### `config_organizaciones` (Organizations)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `config_organizaciones_select` | SELECT | `authenticated` | `can_user_v2('config_organizaciones', 'select', id)` |
| `config_organizaciones_insert` | INSERT | `authenticated` | `can_user_v2('config_organizaciones', 'insert', id)` |
| `config_organizaciones_update` | UPDATE | `authenticated` | `can_user_v2('config_organizaciones', 'update', id)` |
| `config_organizaciones_delete` | DELETE | `authenticated` | `can_user_v2('config_organizaciones', 'delete', id)` |

**Access**: Owners only (all operations)

---

##### `config_organizacion_miembros` (Organization Members)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `config_organizacion_miembros_select` | SELECT | `authenticated` | `can_user_v2('config_organizacion_miembros', 'select', organization_id)` |
| `config_organizacion_miembros_insert` | INSERT | `authenticated` | `can_user_v2('config_organizacion_miembros', 'insert', organization_id)` |
| `config_organizacion_miembros_update` | UPDATE | `authenticated` | `can_user_v2('config_organizacion_miembros', 'update', organization_id)` |
| `config_organizacion_miembros_delete` | DELETE | `authenticated` | `can_user_v2('config_organizacion_miembros', 'delete', organization_id)` |

**Access**: Owners only (all operations)

---

##### `config_roles` (Roles)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `config_roles_select` | SELECT | `authenticated` | Has permission via `config_roles_permisos` |
| `config_roles_insert` | INSERT | `authenticated` | Has permission via `config_roles_permisos` |
| `config_roles_update` | UPDATE | `authenticated` | Has permission via `config_roles_permisos` |
| `config_roles_delete` | DELETE | `authenticated` | Has permission via `config_roles_permisos` |

**Access**: Owners only (checked via `config_roles_permisos`)

---

##### `config_roles_permisos` (Role Permissions)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `config_roles_permisos_select` | SELECT | `authenticated` | Has permission via `config_roles_permisos` |
| `config_roles_permisos_insert` | INSERT | `authenticated` | Has permission via `config_roles_permisos` |
| `config_roles_permisos_update` | UPDATE | `authenticated` | Has permission via `config_roles_permisos` |
| `config_roles_permisos_delete` | DELETE | `authenticated` | Has permission via `config_roles_permisos` |

**Access**: Owners only (checked via `config_roles_permisos`)

---

#### Master Data Tables

##### `dm_actores` (Business Partners)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `dm_actores_select` | SELECT | `authenticated` | `eliminado_en IS NULL` AND `can_user_v2('dm_actores', 'select', organizacion_id)` |
| `dm_actores_insert` | INSERT | `authenticated` | `can_user_v2('dm_actores', 'insert', organizacion_id)` |
| `dm_actores_update` | UPDATE | `authenticated` | `can_user_v2('dm_actores', 'update', organizacion_id)` |
| `dm_actores_delete` | DELETE | `authenticated` | `can_user_v2('dm_actores', 'delete', organizacion_id)` |

**Access**:
- owner: All operations
- admin: All operations
- analyst: SELECT, INSERT, UPDATE (no DELETE)
- auditor: SELECT only

**Soft Delete**: SELECT policy filters out deleted records (`eliminado_en IS NULL`)

---

##### `dm_acciones` (Shares/Actions)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `dm_acciones_select` | SELECT | `authenticated` | `can_user_v2('dm_acciones', 'select', organizacion_id)` |
| `dm_acciones_insert` | INSERT | `authenticated` | `can_user_v2('dm_acciones', 'insert', organizacion_id)` |
| `dm_acciones_update` | UPDATE | `authenticated` | `can_user_v2('dm_acciones', 'update', organizacion_id)` |
| `dm_acciones_delete` | DELETE | `authenticated` | `can_user_v2('dm_acciones', 'delete', organizacion_id)` |

**Access**:
- owner: All operations
- admin: All operations
- analyst: SELECT, INSERT, UPDATE (no DELETE)
- auditor: SELECT only

---

#### Relationship Tables

##### `vn_asociados` (Member Assignments)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `vn_asociados_select` | SELECT | `authenticated` | `can_user_v2('asignaciones_acciones', 'select', organizacion_id)` |
| `vn_asociados_insert` | INSERT | `authenticated` | `can_user_v2('asignaciones_acciones', 'insert', organizacion_id)` |
| `vn_asociados_update` | UPDATE | `authenticated` | `can_user_v2('asignaciones_acciones', 'update', organizacion_id)` |
| `vn_asociados_delete` | DELETE | `authenticated` | `can_user_v2('asignaciones_acciones', 'delete', organizacion_id)` |

**Access**:
- owner: All operations
- admin: All operations
- analyst: SELECT, INSERT, UPDATE (no DELETE)
- auditor: SELECT only

**Resource Name**: Uses legacy name `asignaciones_acciones` for compatibility

---

##### `vn_relaciones_actores` (Actor Relationships)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `vn_relaciones_actores_select` | SELECT | `authenticated` | `eliminado_en IS NULL` AND `can_user_v2('vn_relaciones_actores', 'select', organizacion_id)` |
| `vn_relaciones_actores_insert` | INSERT | `authenticated` | `can_user_v2('vn_relaciones_actores', 'insert', organizacion_id)` |
| `vn_relaciones_actores_update` | UPDATE | `authenticated` | `can_user_v2('vn_relaciones_actores', 'update', organizacion_id)` |
| `vn_relaciones_actores_delete` | DELETE | `authenticated` | `can_user_v2('vn_relaciones_actores', 'delete', organizacion_id)` |

**Access**:
- owner: All operations
- admin: All operations
- analyst: SELECT, INSERT, UPDATE (no DELETE)
- auditor: SELECT only

**Soft Delete**: SELECT policy filters out deleted records

---

#### Transaction Tables

##### `tr_doc_comercial` (Commercial Documents)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `tr_doc_comercial_select` | SELECT | `authenticated` | `eliminado_en IS NULL` AND `can_user_v2('tr_doc_comercial', 'select', organizacion_id)` |
| `tr_doc_comercial_insert` | INSERT | `authenticated` | `can_user_v2('tr_doc_comercial', 'insert', organizacion_id)` |
| `tr_doc_comercial_update` | UPDATE | `authenticated` | `can_user_v2('tr_doc_comercial', 'update', organizacion_id)` |
| `tr_doc_comercial_delete` | DELETE | `authenticated` | `can_user_v2('tr_doc_comercial', 'delete', organizacion_id)` |

**Access**:
- owner: All operations
- admin: All operations
- analyst: SELECT, INSERT, UPDATE (no DELETE)
- auditor: SELECT only

**Soft Delete**: SELECT policy filters out deleted records

---

##### `tr_tareas` (Tasks)

| Policy | Type | Who | Condition |
|--------|------|-----|-----------|
| `tr_tareas_select` | SELECT | `authenticated` | `eliminado_en IS NULL` AND `can_user_v2('tr_tareas', 'select', organizacion_id)` |
| `tr_tareas_insert` | INSERT | `authenticated` | `can_user_v2('tr_tareas', 'insert', organizacion_id)` |
| `tr_tareas_update` | UPDATE | `authenticated` | `can_user_v2('tr_tareas', 'update', organizacion_id)` |
| `tr_tareas_delete` | DELETE | `authenticated` | `can_user_v2('tr_tareas', 'delete', organizacion_id)` |

**Access**:
- owner: All operations
- admin: All operations
- analyst: SELECT, INSERT, UPDATE (no DELETE)
- auditor: SELECT only

**Soft Delete**: SELECT policy filters out deleted records

---

### Auth Schema Policies

The `auth` schema tables have RLS managed by Supabase's authentication system. Key tables:

| Table | RLS | Purpose |
|-------|-----|---------|
| `auth.users` | ✅ Enabled | User accounts (managed by Supabase Auth) |
| `auth.sessions` | ✅ Enabled | User sessions |
| `auth.identities` | ✅ Enabled | OAuth/SSO identities |
| `auth.refresh_tokens` | ✅ Enabled | JWT refresh tokens |
| `auth.mfa_factors` | ✅ Enabled | Multi-factor authentication |
| `auth.mfa_challenges` | ✅ Enabled | MFA challenges |

**Note**: Direct access to `auth` schema tables is restricted. Use Supabase Auth APIs for user management.

---

### Storage Schema Policies

The `storage` schema manages file storage with RLS:

| Table | RLS | Purpose |
|-------|-----|---------|
| `storage.buckets` | ✅ Enabled | Storage buckets configuration |
| `storage.objects` | ✅ Enabled | Stored files/metadata |
| `storage.migrations` | ✅ Enabled | Storage schema migrations |

**Access**: Storage policies are typically managed through Supabase Storage APIs, not direct SQL.

---

## Security Functions

### `can_user_v2(p_resource, p_action, p_org)`

**Purpose**: Central authorization function that checks if a user has permission to perform an action on a resource within an organization.

**Signature**:
```sql
can_user_v2(p_resource text, p_action text, p_org uuid) RETURNS boolean
```

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.can_user_v2(p_resource text, p_action text, p_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE(EXISTS (
    SELECT 1
    FROM public.config_organizacion_miembros om
    JOIN public.config_roles_permisos rp ON rp.role = om.role
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = p_org
      AND om.eliminado_en IS NULL
      AND rp.resource = p_resource
      AND rp.action = p_action
      AND rp.eliminado_en IS NULL
      AND rp.allow = true
  ), false);
$function$;
```

**How it Works**:

1. **User Check**: Gets current user ID from `auth.uid()`
2. **Membership Check**: Finds user's role in `config_organizacion_miembros`
3. **Permission Check**: Looks up the (role, resource, action) combination in `config_roles_permisos`
4. **Soft Delete Filter**: Ensures neither membership nor permission is deleted
5. **Allow Check**: Only returns true if `rp.allow = true`

**Usage in RLS Policies**:

```sql
-- Example in SELECT policy
CREATE POLICY dm_actores_select ON dm_actores
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND can_user_v2('dm_actores', 'select', organizacion_id)
  );

-- Example in INSERT policy
CREATE POLICY dm_actores_insert ON dm_actores
  FOR INSERT TO authenticated
  WITH CHECK (
    can_user_v2('dm_actores', 'insert', organizacion_id)
  );
```

**Function Properties**:

- `STABLE`: Returns same result for same inputs within a transaction
- `SECURITY DEFINER`: Runs with the privileges of the function owner, not the caller
- `search_path` restricted to `pg_catalog, 'public'`: Prevents schema-based attacks

---

## Best Practices

### For Developers

#### 1. Always Use RLS

Never bypass RLS. Always access data through the normal query mechanisms:

```sql
-- ✅ GOOD - RLS automatically applies
SELECT * FROM dm_actores WHERE organizacion_id = '...';

-- ❌ BAD - Bypasses RLS (only for service roles)
SET LOCAL pg_cloud.skip_rlsv2 TO true;
SELECT * FROM dm_actores;
```

#### 2. Set Organization Context

Always ensure `organizacion_id` is set when inserting data:

```sql
-- ✅ GOOD - RLS checks permission
INSERT INTO dm_actores (organizacion_id, primer_nombre, ...)
VALUES (
  (SELECT organization_id FROM config_organizacion_miembros WHERE user_id = auth.uid()),
  'Juan',
  ...
);

-- ❌ BAD - Will fail if user lacks permission for this org
INSERT INTO dm_actores (organizacion_id, primer_nombre, ...)
VALUES ('some-uuid', 'Juan', ...);
```

#### 3. Use Soft Delete

Never hard delete records. Set `eliminado_en` instead:

```sql
-- ✅ GOOD - Soft delete
UPDATE dm_actores
SET eliminado_en = now(), eliminado_por = auth.uid()
WHERE id = '...';

-- ❌ BAD - Hard delete (may violate constraints)
DELETE FROM dm_actores WHERE id = '...';
```

#### 4. Check Permissions Before UI Actions

Query permissions to show/hide UI elements:

```sql
-- Check if user can delete actors
SELECT can_user_v2('dm_actores', 'delete', $1) as can_delete;
```

#### 5. Handle Permission Errors

Gracefully handle permission denied errors:

```typescript
try {
  const { data, error } = await supabase
    .from('dm_actores')
    .delete()
    .eq('id', actorId);

  if (error) {
    if (error.code === '42501') { // INSUFFICIENT_PRIVILEGE
      showErrorMessage('No tienes permiso para eliminar este registro');
    }
  }
} catch (err) {
  // Handle error
}
```

---

### For Database Administrators

#### 1. Grant RLS Privileges Carefully

Use `SECURITY DEFINER` functions sparingly and audit them regularly:

```sql
-- Review all SECURITY DEFINER functions
SELECT
  proname AS function_name,
  prosecdef AS is_security_definer,
  pg_get_userbyid(proowner) AS owner
FROM pg_proc
WHERE prosecdef = true
  AND pronamespace = 'public'::regnamespace;
```

#### 2. Monitor RLS Performance

RLS adds overhead. Monitor slow queries:

```sql
-- Check for slow RLS queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%can_user_v2%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 3. Test Role Permissions

Create test users for each role and verify access:

```sql
-- Test as different roles
SET ROLE postgres;
SELECT * FROM dm_actores; -- Should see all

SET ROLE app_user; -- With analyst role
SELECT * FROM dm_actores; -- Should only see organization's data
DELETE FROM dm_actores WHERE ...; -- Should fail
```

#### 4. Audit Policy Changes

Log changes to RLS policies:

```sql
-- Monitor policy changes
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### 5. Document Permission Requirements

Keep permission requirements in sync with code changes:

- Update `config_roles_permisos` when adding new tables
- Document permission requirements in API docs
- Review permissions after schema migrations

---

### Common Security Pitfalls

#### ❌ Pitfall 1: Forgetting `organizacion_id` in WHERE Clause

```sql
-- ❌ BAD - Returns all rows user has access to (potentially large result)
SELECT * FROM dm_actores;

-- ✅ GOOD - Explicitly filter by organization
SELECT * FROM dm_actores WHERE organizacion_id = '...';
```

#### ❌ Pitfall 2: Bypassing RLS with Functions

```sql
-- ❌ BAD - Function runs with definer rights, might bypass RLS
CREATE OR REPLACE FUNCTION get_all_actors()
RETURNS SETOF dm_actores
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT * FROM dm_actores; -- Bypasses RLS!
$$;

-- ✅ GOOD - Explicitly check organization
CREATE OR REPLACE FUNCTION get_org_actors(p_org uuid)
RETURNS SETOF dm_actores
LANGUAGE sql
SECURITY DEFINER AS $$
  SELECT * FROM dm_actores
  WHERE organizacion_id = p_org;
$$;
```

#### ❌ Pitfall 3: Hardcoding Role Checks

```sql
-- ❌ BAD - Fragile, hard to maintain
CREATE POLICY ... ON dm_actores
  USING (EXISTS (
    SELECT 1 FROM config_organizacion_miembros
    WHERE role = 'admin' -- Hardcoded!
  ));

-- ✅ GOOD - Flexible, uses permission system
CREATE POLICY ... ON dm_actores
  USING (can_user_v2('dm_actores', 'update', organizacion_id));
```

#### ❌ Pitfall 4: Exposing Soft Deleted Records

```sql
-- ❌ BAD - Includes soft deleted records
CREATE VIEW v_actores_all AS
SELECT * FROM dm_actores;

-- ✅ GOOD - Filters soft deletes
CREATE VIEW v_actores_active AS
SELECT * FROM dm_actores WHERE eliminado_en IS NULL;
```

---

## Troubleshooting

### Common Issues

#### Issue: "Permission denied" errors

**Symptoms**:
```
ERROR: 42501: new row violates row-level security policy
```

**Causes**:
1. User not member of organization
2. User's role lacks permission
3. `organizacion_id` doesn't match user's organization

**Solutions**:
```sql
-- Check user's organizations and roles
SELECT
  om.organization_id,
  o.nombre AS organization,
  om.role
FROM config_organizacion_miembros om
JOIN config_organizaciones o ON o.id = om.organization_id
WHERE om.user_id = auth.uid()
  AND om.eliminado_en IS NULL;

-- Check permissions for user's role
SELECT
  rp.resource,
  rp.action,
  rp.allow
FROM config_roles_permisos rp
WHERE rp.role = (
    SELECT role FROM config_organizacion_miembros
    WHERE user_id = auth.uid()
    LIMIT 1
  )
  AND rp.eliminado_en IS NULL;
```

---

#### Issue: Queries return no results

**Symptoms**: Queries succeed but return empty result sets

**Causes**:
1. RLS filtering out all rows
2. User has wrong `organizacion_id`
3. All records are soft deleted (`eliminado_en IS NOT NULL`)

**Solutions**:
```sql
-- Check if user has any access
SELECT can_user_v2('dm_actores', 'select', $1);

-- Check if records exist for organization
SELECT COUNT(*) FROM dm_actores WHERE organizacion_id = $1;

-- Check for soft deletes
SELECT COUNT(*)
FROM dm_actores
WHERE organizizacion_id = $1
  AND eliminado_en IS NOT NULL;
```

---

#### Issue: Slow queries with RLS

**Symptoms**: Queries are slower than expected

**Causes**:
1. Complex `can_user_v2` checks on every row
2. Missing indexes on `organizacion_id`, `eliminado_en`

**Solutions**:
```sql
-- Add indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_dm_actores_org_eliminado
  ON dm_actores(organizacion_id, eliminado_en);

-- Optimize can_user_v2 with composite index
CREATE INDEX IF NOT EXISTS idx_org_miembros_user_org_eliminado
  ON config_organizacion_miembros(user_id, organization_id, eliminado_en);

-- Add covering index for permission checks
CREATE INDEX IF NOT EXISTS idx_roles_permisos_role_resource_action_allow_eliminado
  ON config_roles_permisos(role, resource, action, allow, eliminado_en)
  WHERE eliminado_en IS NULL;
```

---

### Testing RLS Policies

```sql
-- Test script to verify RLS policies
DO $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid := '...'; -- Test organization ID
  v_has_access boolean;
BEGIN
  -- Test SELECT permission
  SELECT can_user_v2('dm_actores', 'select', v_org_id) INTO v_has_access;
  RAISE NOTICE 'SELECT access to dm_actores: %', v_has_access;

  -- Test INSERT permission
  SELECT can_user_v2('dm_actores', 'insert', v_org_id) INTO v_has_access;
  RAISE NOTICE 'INSERT access to dm_actores: %', v_has_access;

  -- Test UPDATE permission
  SELECT can_user_v2('dm_actores', 'update', v_org_id) INTO v_has_access;
  RAISE NOTICE 'UPDATE access to dm_actores: %', v_has_access;

  -- Test DELETE permission
  SELECT can_user_v2('dm_actores', 'delete', v_org_id) INTO v_has_access;
  RAISE NOTICE 'DELETE access to dm_actores: %', v_has_access;
END $$;
```

---

## Summary

The RLS implementation in this database provides:

1. **Multi-tenancy**: Complete data isolation between organizations
2. **Role-based access**: Four-tier permission model (owner/admin/analyst/auditor)
3. **Fine-grained control**: Permission checks per resource and action
4. **Soft delete protection**: Automatically filters deleted records
5. **Centralized authorization**: Single `can_user_v2()` function for all checks
6. **Audit-ready**: All access controlled and logged through security layer

### Key Takeaways

- ✅ All tables have RLS enabled
- ✅ Access is checked via `can_user_v2()` function
- ✅ Permissions are stored in `config_roles_permisos`
- ✅ Soft delete is enforced in SELECT policies
- ✅ Organization isolation is enforced via `organizacion_id`
- ✅ Only owners can access configuration tables
- ✅ Admins have full access to business tables
- ✅ Analysts can create and modify but not delete
- ✅ Auditors have read-only access

For questions or issues, refer to the [TABLES.md](TABLES.md) documentation for table details and [FUNCTIONS.md](FUNCTIONS.md) for available security functions.
