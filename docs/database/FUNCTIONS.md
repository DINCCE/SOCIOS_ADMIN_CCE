# Database Functions

This document describes all the custom functions stored in the Supabase database.

## Table of Contents

- [Auth Functions](#auth-functions)
- [Permission & Authorization Functions](#permission--authorization-functions)
- [Organization Functions](#organization-functions)
- [Actor Functions](#actor-functions)
- [Soft Delete Functions](#soft-delete-functions)
- [Action Assignment Functions](#action-assignment-functions)
- [Utility Functions](#utility-functions)
- [Trigger Functions](#trigger-functions)

---

## Auth Functions

### `auth.email()`
**Deprecated.** Use `auth.jwt() -> 'email'` instead.

Returns the email from the JWT token.

**Returns:** `text`

**Security:** `STABLE`

---

### `auth.jwt()`
Returns the full JWT claims as JSONB.

**Returns:** `jsonb`

**Security:** `STABLE`

**Usage:**
```sql
SELECT auth.jwt() -> 'email' as email;
SELECT auth.jwt() -> 'sub' as user_id;
```

---

### `auth.role()`
**Deprecated.** Use `auth.jwt() -> 'role'` instead.

Returns the role from the JWT token.

**Returns:** `text`

**Security:** `STABLE`

---

### `auth.uid()`
**Deprecated.** Use `auth.jwt() -> 'sub'` instead.

Returns the user ID (UUID) from the JWT token.

**Returns:** `uuid`

**Security:** `STABLE`

---

## Permission & Authorization Functions

### `can_user_v2(p_resource text, p_action text, p_org uuid)`
Checks if the current user has permission to perform an action on a resource within an organization.

**Parameters:**
- `p_resource`: The resource identifier (e.g., 'dm_actores', 'asignaciones_acciones')
- `p_action`: The action to check (e.g., 'insert', 'update', 'delete', 'select')
- `p_org`: The organization UUID

**Returns:** `boolean`

**Security:** `SECURITY DEFINER`, `STABLE`

**Permission Logic:**
1. **Owners**: Automatic access to ALL resources and actions
2. **Admins**: Automatic access to ALL resources except `config_organizaciones` and `config_organizacion_miembros`
3. **Other roles**: Must have explicit permission in `config_roles_permisos`

**Usage:**
```sql
SELECT can_user_v2('dm_actores', 'update', 'org-uuid');
-- Returns true for owners/admins, or checks explicit permissions for other roles
```

---

### `is_org_member(p_org_id uuid, p_user_id uuid DEFAULT NULL)`
Checks if a user is a member of an organization.

**Parameters:**
- `p_org_id`: Organization UUID
- `p_user_id`: User UUID (defaults to current user if NULL)

**Returns:** `boolean`

**Security:** `SECURITY DEFINER`

---

### `is_org_owner_v2(org_id uuid)`
Checks if the current user is an owner of an organization.

**Parameters:**
- `org_id`: Organization UUID

**Returns:** `boolean`

**Security:** `SECURITY DEFINER`

---

### `is_org_admin_v2(p_org_id uuid, p_user_id uuid DEFAULT NULL)`
Checks if a user has admin or owner role in an organization.

**Parameters:**
- `p_org_id`: Organization UUID
- `p_user_id`: User UUID (defaults to current user if NULL)

**Returns:** `boolean`

**Security:** `SECURITY DEFINER`, `STABLE`

---

### `user_role_in_org_v2(p_org uuid)`
Returns the user's role within an organization.

**Parameters:**
- `p_org`: Organization UUID

**Returns:** `text` (role name or NULL)

**Security:** `SECURITY DEFINER`, `STABLE`

---

### `can_view_org_membership_v2(p_org uuid)`
Checks if the current user can view organization memberships.

**Parameters:**
- `p_org`: Organization UUID

**Returns:** `boolean`

**Security:** `SECURITY DEFINER`, `STABLE`

---

### `org_has_other_owner_v2(p_org_id uuid, p_excluded_user_id uuid DEFAULT NULL)`
Checks if there are other owners besides the specified user.

**Parameters:**
- `p_org_id`: Organization UUID
- `p_excluded_user_id`: User UUID to exclude (defaults to current user)

**Returns:** `boolean`

**Security:** `SECURITY DEFINER`, `STABLE`

**Use case:** Prevent removing the last owner of an organization.

---

## Organization Functions

### `get_user_orgs()`
Returns an array of organization IDs that the current user belongs to.

**Returns:** `uuid[]`

**Security:** `STABLE`

**Usage:**
```sql
SELECT get_user_orgs();
```

---

### `assign_owner_on_org_create()`
**Trigger function** that automatically assigns the creator as owner when an organization is created.

**Returns:** `trigger`

**Security:** `SECURITY DEFINER`

**Usage:** Attached to BEFORE INSERT trigger on `config_organizaciones` table.

---

## Actor Functions

### `dm_actores_documento_existe(p_organizacion_id uuid, p_tipo_documento dm_actor_tipo_documento, p_num_documento text, p_excluir_id uuid DEFAULT NULL)`
Checks if a document number already exists for an actor within an organization.

**Parameters:**
- `p_organizacion_id`: Organization UUID
- `p_tipo_documento`: Document type enum
- `p_num_documento`: Document number
- `p_excluir_id`: Actor UUID to exclude (for updates)

**Returns:** `TABLE(doc_exists boolean, actor_id uuid, codigo_bp text, nombre_completo text)`

**Security:** `STABLE`

**Usage:**
```sql
SELECT * FROM dm_actores_documento_existe('org-uuid', 'cedula', '12345678');
```

---

### `dm_actores_email_existe(p_organizacion_id uuid, p_email text, p_excluir_id uuid DEFAULT NULL)`
Checks if an email already exists for an actor within an organization.

**Parameters:**
- `p_organizacion_id`: Organization UUID
- `p_email`: Email address
- `p_excluir_id`: Actor UUID to exclude

**Returns:** `TABLE(email_exists boolean, actor_id uuid, codigo_bp text, nombre_completo text, email_encontrado text)`

**Security:** `STABLE`

---

### `dm_actores_telefono_existe(p_organizacion_id uuid, p_telefono text, p_excluir_id uuid DEFAULT NULL)`
Checks if a phone number already exists for an actor within an organization.

**Parameters:**
- `p_organizacion_id`: Organization UUID
- `p_telefono`: Phone number
- `p_excluir_id`: Actor UUID to exclude

**Returns:** `TABLE(phone_exists boolean, actor_id uuid, codigo_bp text, nombre_completo text, telefono_encontrado text)`

**Security:** `STABLE`

---

## Soft Delete Functions

Soft delete functions use `SECURITY DEFINER` to bypass RLS and perform explicit permission checks. They accept `p_user_id` as a parameter to work around Supabase SSR + RLS authentication context issues.

### `soft_delete_actor(p_actor_id uuid, p_user_id uuid)`
Performs soft delete on an actor (person or company) with permission verification.

**Parameters:**
- `p_actor_id`: Actor UUID to delete
- `p_user_id`: User UUID performing the action

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only `owner` and `admin` roles can soft delete actors

**Usage:**
```sql
SELECT soft_delete_actor('actor-uuid', 'user-uuid');
-- Returns: {"success": true, "message": "Actor eliminado correctamente"}
```

**Used by:**
- [app/actions/personas.ts](app/actions/personas.ts) - `softDeletePersona()`
- [app/actions/empresas.ts](app/actions/empresas.ts) - `softDeleteEmpresa()`

---

### `soft_delete_tarea_rpc(p_tarea_id uuid, p_user_id uuid)`
Performs soft delete on a task with permission verification.

**Parameters:**
- `p_tarea_id`: Task UUID to delete
- `p_user_id`: User UUID performing the action

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only `owner` and `admin` roles can soft delete tasks

**Usage:**
```sql
SELECT soft_delete_tarea_rpc('tarea-uuid', 'user-uuid');
-- Returns: {"success": true, "message": "Tarea eliminada correctamente"}
```

**Used by:**
- [app/actions/tareas.ts](app/actions/tareas.ts) - `softDeleteTarea()`

---

### `soft_delete_dm_acciones_rpc(p_accion_id uuid, p_user_id uuid)`
Performs soft delete on an action (share/holding) with permission verification.

**Parameters:**
- `p_accion_id`: Action UUID to delete
- `p_user_id`: User UUID performing the action

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only `owner` and `admin` roles can soft delete actions

**Usage:**
```sql
SELECT soft_delete_dm_acciones_rpc('accion-uuid', 'user-uuid');
-- Returns: {"success": true, "message": "Acción eliminada correctamente"}
```

**Used by:**
- [app/actions/acciones.ts](app/actions/acciones.ts) - `softDeleteAccion()`

---

### `soft_delete_doc_comercial_rpc(p_doc_id uuid, p_user_id uuid)`
Performs soft delete on a commercial document with permission verification.

**Parameters:**
- `p_doc_id`: Commercial document UUID to delete
- `p_user_id`: User UUID performing the action

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only `owner` and `admin` roles can soft delete documents

**Usage:**
```sql
SELECT soft_delete_doc_comercial_rpc('doc-uuid', 'user-uuid');
-- Returns: {"success": true, "message": "Documento eliminado correctamente"}
```

**Used by:**
- [app/actions/doc-comerciales.ts](app/actions/doc-comerciales.ts) - `softDeleteDocComercial()`

---

### `soft_delete_asignacion_rpc(p_asignacion_id uuid, p_user_id uuid)`
Performs soft delete on an action assignment with permission verification.

**Parameters:**
- `p_asignacion_id`: Assignment UUID to delete
- `p_user_id`: User UUID performing the action

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only `owner` and `admin` roles can soft delete assignments

**Usage:**
```sql
SELECT soft_delete_asignacion_rpc('asignacion-uuid', 'user-uuid');
-- Returns: {"success": true, "message": "Asignación eliminada correctamente"}
```

**Used by:**
- [app/actions/acciones.ts](app/actions/acciones.ts) - `softDeleteAsignacion()`

---

### `eliminar_relacion_bp(p_relacion_id uuid)`
Performs soft delete on an actor relationship with permission verification.

**Parameters:**
- `p_relacion_id`: Relationship UUID to delete

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only `owner` and `admin` roles can soft delete relationships

**Note:** Uses `auth.uid()` internally (not the new pattern) - may need updating

**Usage:**
```sql
SELECT eliminar_relacion_bp('relacion-uuid');
-- Returns: {"success": true, "message": "Relación eliminada correctamente"}
```

**Used by:**
- [app/actions/relaciones.ts](app/actions/relaciones.ts) - `eliminarRelacion()`

---

### `soft_delete_comentario(p_comentario_id uuid)`
Performs soft delete on a comment with ownership verification.

**Parameters:**
- `p_comentario_id`: Comment UUID to delete

**Returns:** `jsonb` with success status and message

**Security:** `SECURITY DEFINER` (bypasses RLS)

**Permission Check:** Only the comment creator can delete their own comments

**Note:** Uses `auth.uid()` internally (not the new pattern) - may need updating

**Usage:**
```sql
SELECT soft_delete_comentario('comentario-uuid');
-- Returns: {"success": true, "message": "Comentario eliminado correctamente"}
```

**Used by:**
- [app/actions/comentarios.ts](app/actions/comentarios.ts) - `eliminarComentario()`

---

## Action Assignment Functions

### `vn_asociados_crear_asignacion(...)`
Creates a new action assignment with strict business validations.

**Parameters:**
- `p_accion_id uuid`: Action UUID
- `p_asociado_id uuid`: Associate/Actor UUID
- `p_organizacion_id uuid`: Organization UUID
- `p_tipo_vinculo vn_asociados_tipo_vinculo`: Link type ('propietario', 'titular', 'beneficiario')
- `p_modalidad vn_asociados_modalidad`: Modality
- `p_plan_comercial vn_asociados_plan_comercial`: Commercial plan
- `p_asignacion_padre_id uuid DEFAULT NULL`: Parent assignment ID (required for beneficiaries)
- `p_notas text DEFAULT NULL`: Notes
- `p_atributos jsonb DEFAULT '{}'`: Additional attributes

**Returns:** `jsonb` with the created record

**Security:** `SECURITY DEFINER`

**Validations:**
- User authenticated
- Permissions via `can_user_v2()`
- Action state valid (not blocked/inactive)
- Uniqueness for owner/titular
- Hierarchy: beneficiary requires parent from SAME action
- Concurrency lock (FOR UPDATE)

**Usage:**
```sql
SELECT vn_asociados_crear_asignacion(
  'accion-uuid',
  'asociado-uuid',
  'org-uuid',
  'propietario'::vn_asociados_tipo_vinculo,
  'directa'::vn_asociados_modalidad,
  'plan-a'::vn_asociados_plan_comercial
);
```

---

### `vn_asociados_finalizar_asignacion(p_asignacion_id uuid, p_motivo text DEFAULT NULL)`
Finalizes an assignment by setting fecha_fin to current date.

**Parameters:**
- `p_asignacion_id`: Assignment UUID
- `p_motivo`: Optional reason for finalization

**Returns:** `jsonb` with the updated record

**Security:** `SECURITY DEFINER`

**Validations:**
- User authenticated
- Assignment exists and not deleted
- Not already finalized
- Permissions via `can_user_v2()`

---

### `vn_asociados_validar_accion(p_accion_id uuid)`
Validates if an action is available for assignment (has no current active assignments).

**Parameters:**
- `p_accion_id`: Action UUID

**Returns:** `jsonb` with availability status and current occupants

**Security:** `SECURITY DEFINER`

**Requires:** JWT with `org_id` claim

**Usage:**
```sql
SELECT vn_asociados_validar_accion('accion-uuid');
-- Returns: {"disponible": true, "mensaje": "Disponible", "ocupantes": []}
```

---

### `vn_asociados_validar_asociado(p_asociado_id uuid)`
Validates if an associate is available (has no current active actions).

**Parameters:**
- `p_asociado_id`: Associate UUID

**Returns:** `jsonb` with availability status and current actions

**Security:** `SECURITY DEFINER`

**Requires:** JWT with `org_id` claim

---

### `rpc_accion_disponibilidad(p_accion_id uuid, p_organizacion_id uuid)`
Alternative function to check action availability.

**Parameters:**
- `p_accion_id`: Action UUID
- `p_organizacion_id`: Organization UUID

**Returns:** `jsonb` with availability status

**Security:** `SECURITY DEFINER`

---

### `generar_siguiente_subcodigo(p_accion_id uuid, p_tipo_asignacion text)`
Generates the next subcode for an action assignment.

**Parameters:**
- `p_accion_id`: Action UUID
- `p_tipo_asignacion`: Assignment type ('dueño', 'titular', 'beneficiario')

**Returns:** `text` (2-digit subcode)

**Logic:**
- 'dueño' → '00'
- 'titular' → '01'
- 'beneficiario' → next sequential number starting from '02'

---

## Utility Functions

### `get_user_email(user_id uuid)`
Securely returns a user's email by ID.

**Parameters:**
- `user_id`: User UUID

**Returns:** `text` (email or NULL)

**Security:** `SECURITY DEFINER` (accesses auth.users)

**Usage:**
```sql
SELECT get_user_email('user-uuid');
```

---

### `get_enum_values(p_enum_name text)`
Returns all values from an enum type.

**Parameters:**
- `p_enum_name`: Enum type name

**Returns:** `SETOF text`

**Security:** `SECURITY DEFINER`, `STABLE`

**Usage:**
```sql
SELECT get_enum_values('dm_actor_tipo_documento');
```

---

### `search_locations(q text, max_results integer DEFAULT 20)`
Searches cities/locations by normalized text.

**Parameters:**
- `q`: Search query
- `max_results`: Maximum results (default: 20)

**Returns:** `SETOF config_ciudades`

**Security:** `STABLE`

**Usage:**
```sql
SELECT * FROM search_locations('bogota', 10);
```

---

### `trim_null(text)`
Trims whitespace and returns NULL if empty.

**Parameters:** `text`

**Returns:** `text`

**Security:** `IMMUTABLE`, `STRICT`

---

### `concat_ws_immutable(sep text, VARIADIC args text[])`
Immutable version of concat_ws for use in indexes.

**Parameters:**
- `sep`: Separator
- `args`: Variable number of text arguments

**Returns:** `text`

**Security:** `IMMUTABLE`

---

### `unaccent(text)`
Removes accents from text (requires unaccent extension).

**Parameters:** `text`

**Returns:** `text`

**Security:** `STABLE`, `PARALLEL SAFE`

---

### `unaccent_lower(text)`
Combines unaccent and lower for normalized text search.

**Parameters:** `text`

**Returns:** `text` (lowercase, unaccented)

**Security:** `IMMUTABLE`, `PARALLEL SAFE`

**Usage:** Used in search text generation for cities.

---

### `calcular_digito_verificacion_nit(nit text)`
Calculates the verification digit for a Colombian NIT.

**Parameters:** `nit` - NIT number (digits only)

**Returns:** `integer` - Verification digit

**Security:** `IMMUTABLE`

**Algorithm:** Uses modulo 11 with specific factors [3,7,13,17,19,23,29,37,41,43,47,53,59,67,71]

---

## Trigger Functions

### `set_actualizado_por_en()`
Automatically sets `actualizado_en` and `actualizado_por` on INSERT/UPDATE.

**Returns:** `trigger`

**Security:** `SECURITY DEFINER`

**Usage:** Attach to BEFORE INSERT/UPDATE triggers.

---

### `set_deleted_by_on_soft_delete()`
Sets `eliminado_por` when `eliminado_en` is set (soft delete).

**Returns:** `trigger`

**Security:** Check if transitioning from not deleted to deleted.

---

### `om_prevent_key_change()`
Prevents changing `organization_id` or `user_id` in organization memberships.

**Returns:** `trigger`

**Usage:** Attached to BEFORE UPDATE trigger on `config_organizacion_miembros`.

---

### `dm_actores_prevent_dup_doc_trg()`
Prevents duplicate documents within an organization.

**Returns:** `trigger`

**Usage:** Attach to BEFORE INSERT/UPDATE on `dm_actores`.

---

### `config_ciudades_build_search_text()`
Builds normalized search text for cities.

**Returns:** `trigger`

**Security:** `SECURITY DEFINER`

**Usage:** Attach to BEFORE INSERT/UPDATE on `config_ciudades`.

---

### `tr_doc_comercial_calcular_total()`
Automatically calculates `valor_total` based on net, discount, and tax values.

**Returns:** `trigger`

**Security:** `SECURITY DEFINER`

**Formula:** `valor_total = valor_neto - valor_descuento + valor_impuestos`

---

### `fn_tr_tareas_registrar_cambio_estado()`
Automatically records state changes for tasks in the unified state history table.

**Returns:** `trigger`

**Security:** `SECURITY DEFINER`

**Triggered on:** AFTER UPDATE OF `estado` on `tr_tareas`

**Behavior:**
- Only fires when `estado` column actually changes
- Calculates duration of previous state using last history record or `creado_en` as baseline
- Inserts record into `tr_estados_historial` with:
  - `entidad_tipo = 'tarea'`
  - `entidad_id = NEW.id`
  - `estado_anterior = OLD.estado`
  - `estado_nuevo = NEW.estado`
  - `duracion_segundos = time in previous state`
  - `usuario_id = COALESCE(NEW.actualizado_por, NEW.creado_por)`
  - `organizacion_id = NEW.organizacion_id`

**Attached to:** `trg_tareas_estado_historial` trigger

---

### `fn_tr_doc_comercial_registrar_cambio_estado()`
Automatically records state changes for commercial documents in the unified state history table.

**Returns:** `trigger`

**Security:** `SECURITY DEFINER`

**Triggered on:** AFTER UPDATE OF `estado` on `tr_doc_comercial`

**Behavior:** Same as `fn_tr_tareas_registrar_cambio_estado()` but for commercial documents:
- `entidad_tipo = 'doc_comercial'`

**Attached to:** `trg_doc_comercial_estado_historial` trigger

---

### `rls_auto_enable()`
**Event trigger** that automatically enables RLS on new tables in public schema.

**Returns:** `event_trigger`

**Security:** `SECURITY DEFINER`

**Triggered on:** `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO`

---

### `_policy_exists(tbl regclass, pol_name text)`
Helper function to check if a policy exists on a table.

**Parameters:**
- `tbl`: Table regclass
- `pol_name`: Policy name

**Returns:** `boolean`

**Security:** `STABLE`

---

## Security Notes

### Functions with `SECURITY DEFINER`
These functions run with the privileges of the function owner, not the caller:
- All permission/authorization functions
- Action assignment functions (`vn_asociados_*`)
- All soft delete functions (`soft_delete_*`, `eliminar_*`)
- `get_user_email`
- Most trigger functions

### RLS Bypass
Some `SECURITY DEFINER` functions intentionally bypass Row Level Security:
- **Soft delete functions**: To bypass RLS policies that would block soft delete operations
- `vn_asociados_*`: To manage assignments across organization boundaries

### Supabase SSR + RLS Pattern
When using Supabase SSR with Next.js Server Actions, `auth.uid()` returns `NULL` in database RLS context. To work around this:

1. **Server Action**: Get user context via `supabase.auth.getUser()`
2. **RPC Function**: Accept `p_user_id` as explicit parameter
3. **Permission Check**: Verify role in `config_organizacion_miembros` table
4. **SECURITY DEFINER**: Bypass RLS and perform operation with elevated privileges

**Example:**
```typescript
// Server Action
const { data: { user } } = await supabase.auth.getUser()
const { data } = await supabase.rpc('soft_delete_tarea_rpc', {
  p_tarea_id: tareaId,
  p_user_id: user.id  // Explicit parameter
})
```

### JWT Requirements
Functions like `vn_asociados_validar_accion` and `vn_asociados_validar_asociado` require:
- JWT with `org_id` claim
- User must be member of specified organization

---

## Type Definitions

### Enum Types Used

**`dm_actor_tipo_documento`**
- Values: (Check with `SELECT get_enum_values('dm_actor_tipo_documento')`)

**`vn_asociados_tipo_vinculo`**
- `propietario`: Owner
- `titular`: Title holder
- `beneficiario`: Beneficiary

**`vn_asociados_modalidad`**
- Check with `SELECT get_enum_values('vn_asociados_modalidad')`

**`vn_asociados_plan_comercial`**
- Check with `SELECT get_enum_values('vn_asociados_plan_comercial')`

**`dm_accion_estado`**
- `disponible`: Available
- `asignada`: Assigned
- `bloqueada`: Blocked
- `inactiva`: Inactive

---

## Best Practices

1. **Use `can_user_v2()`** in RLS policies for permission checks

2. **Use `auth.uid()`** or `auth.jwt()` to get current user in database functions

3. **Use `SECURITY DEFINER`** carefully - only when needed to bypass RLS

4. **Use `vn_asociados_crear_asignacion`** instead of direct INSERTs for business logic

5. **Use soft delete RPC functions** instead of direct UPDATE/DELETE operations

6. **Follow the SSR + RLS pattern** for Server Actions that modify data:
   - Get user via `supabase.auth.getUser()` in Server Action
   - Pass `user.id` explicitly to RPC function
   - RPC function performs permission check internally
   - Never rely on `auth.uid()` in RLS policies with Supabase SSR

7. **Always check organization membership** before granting access

8. **For soft delete operations**, use the appropriate RPC function:
   - `soft_delete_actor(p_actor_id, p_user_id)` - For persons and companies
   - `soft_delete_tarea_rpc(p_tarea_id, p_user_id)` - For tasks
   - `soft_delete_dm_acciones_rpc(p_accion_id, p_user_id)` - For actions/shares
   - `soft_delete_doc_comercial_rpc(p_doc_id, p_user_id)` - For commercial documents
   - `soft_delete_asignacion_rpc(p_asignacion_id, p_user_id)` - For assignments
   - `eliminar_relacion_bp(p_relacion_id)` - For relationships
   - `soft_delete_comentario(p_comentario_id)` - For comments (ownership-based)

---

## Error Codes

Functions use PostgreSQL ERRCODE for proper HTTP status mapping:
- `22023`: Invalid parameter value (e.g., missing auth)
- `23503`: Foreign key violation (e.g., record doesn't exist)
- `23505`: Unique violation (e.g., duplicate)
- `23514`: Check violation (e.g., invalid state)
- `42501`: Insufficient privilege (e.g., no permission)
- `42704`: Undefined object (e.g., not found)
