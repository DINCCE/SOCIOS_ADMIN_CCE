# Database Functions Reference

> **Complete reference for all database functions**
>
> Last updated: 2025-12-28 | Auto-generated from live Supabase backend

---

## Table of Contents

- [Overview](#overview)
- [Function Categories](#function-categories)
- [User-Facing RPC Functions](#user-facing-rpc-functions)
  - [Business Partner Management](#business-partner-management)
  - [Relationship Management](#relationship-management)
  - [Acciones Management](#acciones-management)
- [Helper Functions](#helper-functions)
  - [Validation Functions](#validation-functions)
  - [Code Generation](#code-generation)
- [Trigger Functions](#trigger-functions)
  - [Audit Trail Functions](#audit-trail-functions)
  - [Code Generation Triggers](#code-generation-triggers)
  - [Validation Triggers](#validation-triggers)
- [Permission Functions](#permission-functions)
  - [Core Permission Checks](#core-permission-checks)
  - [Organization Role Checks](#organization-role-checks)
  - [Safety Checks](#safety-checks)
- [Related Documentation](#related-documentation)

---

## Overview

The database implements **36 PostgreSQL functions** organized into 4 main categories:

1. **User-Facing RPC (11 functions)** - Frontend-callable business logic
2. **Helper Functions (9 functions)** - Internal utilities and validation
3. **Trigger Functions (5 functions)** - Automatic data management
4. **Permission Functions (11 functions)** - RLS policy helpers

### Function Distribution

| Category | Count | Callable from Frontend | Purpose |
|----------|-------|------------------------|---------|
| User-Facing RPC | 11 | ✅ Yes | Business operations (crear, actualizar, eliminar) |
| Helper Functions | 9 | ❌ No | Validation, code generation, consistency checks |
| Trigger Functions | 5 | ❌ No | Automatic timestamp updates, audit logging |
| Permission Functions | 11 | ❌ No | RLS policy evaluation |

**Total:** 36 functions

---

## Function Categories

### Quick Reference

**User-Facing RPC:**
- `crear_persona` - Create natural person
- `crear_empresa` - Create company
- `crear_relacion_bp` - Create BP relationship
- `actualizar_relacion_bp` - Update BP relationship
- `finalizar_relacion_bp` - End BP relationship
- `eliminar_relacion_bp` - Soft delete relationship
- `obtener_relaciones_bp` - Get BP relationships
- `crear_asignacion_accion` - Create action assignment
- `transferir_accion` - Transfer action ownership
- `finalizar_asignacion_accion` - End assignment
- `generar_siguiente_subcodigo` - Generate next subcode

**Helper Functions:**
- `calcular_digito_verificacion_nit` - NIT verification digit
- `validar_consistencia_tipo_actor` - CTI pattern validation
- `validar_asignacion_accion` - Assignment validation
- `validar_tipo_relacion_compatible` - Relationship compatibility
- `generar_codigo_bp` - Auto-generate BP code
- `generar_codigo_completo_asignacion` - Generate assignment code
- `enforce_created_by` - Protect creado_por field
- `om_prevent_key_change` - Prevent key changes
- `assign_owner_on_org_create` - Auto-assign owner

**Trigger Functions:**
- `set_audit_user_columns` - Set creado_por / actualizado_por
- `set_deleted_by_on_soft_delete` - Set eliminado_por
- `actualizar_timestamp` - Update actualizado_en timestamp
- `audit.log_change` - Audit logging (Supabase extension)
- `audit.fn_row_change` - Row change logging

**Permission Functions:**
- `can_user_v2` - Primary permission check
- `is_org_admin_v2` - Check admin/owner status
- `is_org_owner_v2` - Check owner status
- `can_view_org_membership_v2` - View membership permission
- `org_has_other_owner_v2` - Safety check for last owner
- (6 additional helper functions)

---

## User-Facing RPC Functions

These functions are **callable from the frontend** via Supabase client's `.rpc()` method.

### Business Partner Management

#### `crear_persona`

Create a natural person using the Class Table Inheritance (CTI) pattern.

**Signature:**
```sql
CREATE FUNCTION crear_persona(
  organizacion_id UUID,
  nombres TEXT,
  apellidos TEXT,
  email_principal TEXT DEFAULT NULL,
  celular_principal TEXT DEFAULT NULL,
  tipo_documento TEXT DEFAULT NULL,
  numero_documento TEXT DEFAULT NULL,
  perfil_persona JSONB DEFAULT NULL,
  atributos JSONB DEFAULT NULL
) RETURNS business_partners
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizacion_id` | UUID | ✅ | Organization ID (multi-tenancy) |
| `nombres` | TEXT | ✅ | First names |
| `apellidos` | TEXT | ✅ | Last names |
| `email_principal` | TEXT | ❌ | Primary email (RFC 5322 format) |
| `celular_principal` | TEXT | ❌ | Primary mobile phone |
| `tipo_documento` | TEXT | ❌ | Document type (CC, CE, PA, etc.) |
| `numero_documento` | TEXT | ❌ | Document number |
| `perfil_persona` | JSONB | ❌ | Person profile metadata |
| `atributos` | JSONB | ❌ | Custom attributes |

**Returns:** Complete `business_partners` record with auto-generated `codigo_bp`

**Business Rules:**
- Atomically creates records in `business_partners` + `personas` tables
- Auto-generates `codigo_bp` (format: BP-0000001)
- Sets `tipo_actor` to 'persona'
- Auto-sets `creado_por` to `auth.uid()`
- Enforces organization membership via RLS

**Example Usage:** See [../api/CREAR_PERSONA.md](../api/CREAR_PERSONA.md)

**Errors:**
- `42501` - No permission to insert into organization
- `23505` - Duplicate email or document number
- `23503` - Organization not found

---

#### `crear_empresa`

Create a company using the Class Table Inheritance (CTI) pattern.

**Signature:**
```sql
CREATE FUNCTION crear_empresa(
  organizacion_id UUID,
  razon_social TEXT,
  nombre_comercial TEXT DEFAULT NULL,
  email_principal TEXT DEFAULT NULL,
  telefono_principal TEXT DEFAULT NULL,
  nit TEXT,
  digito_verificacion TEXT DEFAULT NULL,
  representante_legal_id UUID DEFAULT NULL,
  perfil_empresa JSONB DEFAULT NULL,
  atributos JSONB DEFAULT NULL
) RETURNS business_partners
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizacion_id` | UUID | ✅ | Organization ID |
| `razon_social` | TEXT | ✅ | Legal name |
| `nombre_comercial` | TEXT | ❌ | Trade name |
| `email_principal` | TEXT | ❌ | Primary email |
| `telefono_principal` | TEXT | ❌ | Primary phone |
| `nit` | TEXT | ✅ | Tax ID (9 digits) |
| `digito_verificacion` | TEXT | ❌ | Verification digit (auto-calculated if null) |
| `representante_legal_id` | UUID | ❌ | FK to business_partners (legal rep) |
| `perfil_empresa` | JSONB | ❌ | Company profile metadata |
| `atributos` | JSONB | ❌ | Custom attributes |

**Returns:** Complete `business_partners` record with auto-generated `codigo_bp`

**Business Rules:**
- Atomically creates records in `business_partners` + `empresas` tables
- Auto-generates `codigo_bp` (format: BP-0000001)
- Sets `tipo_actor` to 'empresa'
- Auto-calculates `digito_verificacion` if not provided
- Validates NIT format (must be 9 digits)
- Auto-sets `creado_por` to `auth.uid()`

**Example Usage:** See [../api/CREAR_EMPRESA.md](../api/CREAR_EMPRESA.md)

**Errors:**
- `42501` - No permission to insert
- `23505` - Duplicate NIT
- `23503` - Organization or representante_legal not found
- `P0001` - Invalid NIT format

---

### Relationship Management

#### `crear_relacion_bp`

Create a relationship between two business partners.

**Signature:**
```sql
CREATE FUNCTION crear_relacion_bp(
  bp_origen_id UUID,
  bp_destino_id UUID,
  tipo_relacion tipo_relacion_bp,
  descripcion TEXT DEFAULT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  atributos JSONB DEFAULT NULL
) RETURNS bp_relaciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bp_origen_id` | UUID | ✅ | Source business partner |
| `bp_destino_id` | UUID | ✅ | Target business partner |
| `tipo_relacion` | ENUM | ✅ | Relationship type |
| `descripcion` | TEXT | ❌ | Relationship description |
| `fecha_inicio` | DATE | ❌ | Start date (default: today) |
| `atributos` | JSONB | ❌ | Relationship metadata |

**Relationship Types:**
- `familiar` - Family relationship
- `laboral` - Employment relationship
- `referencia` - Reference/referral
- `membresia` - Membership relationship
- `comercial` - Commercial relationship
- `otra` - Other relationship type

**Returns:** Created `bp_relaciones` record

**Business Rules:**
- Both BPs must exist in the same organization
- Cannot create self-referencing relationship (origen ≠ destino)
- `es_vigente` generated column defaults to TRUE
- Auto-sets `creado_por` to `auth.uid()`

**Example Usage:** See [../api/BP_RELACIONES.md](../api/BP_RELACIONES.md#crear_relacion_bp)

---

#### `actualizar_relacion_bp`

Update an existing BP relationship.

**Signature:**
```sql
CREATE FUNCTION actualizar_relacion_bp(
  relacion_id UUID,
  tipo_relacion tipo_relacion_bp DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  atributos JSONB DEFAULT NULL
) RETURNS bp_relaciones
```

**Returns:** Updated `bp_relaciones` record

**Business Rules:**
- Can only update own organization's relationships
- Cannot change `bp_origen_id` or `bp_destino_id` (create new instead)
- Auto-updates `actualizado_por` and `actualizado_en`

---

#### `finalizar_relacion_bp`

End a relationship by setting `fecha_fin`.

**Signature:**
```sql
CREATE FUNCTION finalizar_relacion_bp(
  relacion_id UUID,
  fecha_fin DATE DEFAULT CURRENT_DATE
) RETURNS bp_relaciones
```

**Returns:** Updated `bp_relaciones` record with `es_vigente = FALSE`

**Business Rules:**
- Sets `fecha_fin` to provided date (default: today)
- `es_vigente` generated column becomes FALSE
- Relationship preserved in database (soft finalize, not delete)

---

#### `eliminar_relacion_bp`

Soft delete a relationship.

**Signature:**
```sql
CREATE FUNCTION eliminar_relacion_bp(
  relacion_id UUID
) RETURNS VOID
```

**Returns:** VOID

**Business Rules:**
- Sets `eliminado_en` to NOW()
- Auto-sets `eliminado_por` to `auth.uid()`
- Relationship hidden from default queries but preserved in database

---

#### `obtener_relaciones_bp`

Get all relationships for a business partner (bidirectional).

**Signature:**
```sql
CREATE FUNCTION obtener_relaciones_bp(
  bp_id UUID,
  solo_vigentes BOOLEAN DEFAULT TRUE
) RETURNS SETOF bp_relaciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bp_id` | UUID | ✅ | Business partner ID |
| `solo_vigentes` | BOOLEAN | ❌ | Return only active relationships (default: TRUE) |

**Returns:** Array of `bp_relaciones` records

**Business Rules:**
- Returns relationships where BP is origen OR destino (bidirectional)
- Filters by `es_vigente` if `solo_vigentes = TRUE`
- Excludes soft-deleted relationships (`eliminado_en IS NULL`)

**Example Usage:** See [../api/BP_RELACIONES.md](../api/BP_RELACIONES.md#obtener_relaciones_bp)

---

### Acciones Management

#### `crear_asignacion_accion`

Assign an action to a business partner.

**Signature:**
```sql
CREATE FUNCTION crear_asignacion_accion(
  accion_id UUID,
  persona_id UUID,
  tipo_asignacion TEXT,
  subcodigo TEXT DEFAULT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  atributos JSONB DEFAULT NULL
) RETURNS asignaciones_acciones
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accion_id` | UUID | ✅ | Action ID |
| `persona_id` | UUID | ✅ | Business partner ID |
| `tipo_asignacion` | TEXT | ✅ | dueño, titular, or beneficiario |
| `subcodigo` | TEXT | ❌ | 2-digit subcode (auto-generated if null) |
| `fecha_inicio` | DATE | ❌ | Assignment start date (default: today) |
| `atributos` | JSONB | ❌ | Assignment metadata |

**Assignment Types & Subcode Ranges:**

| Type | Subcode Range | Max Active | Description |
|------|---------------|------------|-------------|
| `dueño` | 00-09 | 1 | Owner (only ONE per action) |
| `titular` | 10-19 | Multiple | Holder |
| `beneficiario` | 20-99 | Multiple | Beneficiary |

**Returns:** Created `asignaciones_acciones` record with auto-generated `codigo_completo`

**Business Rules:**
- Only ONE active `dueño` per action
- Subcode auto-generated if not provided (uses `generar_siguiente_subcodigo`)
- `codigo_completo` = accion.codigo + subcodigo (e.g., 439800)
- Validates subcode matches `tipo_asignacion`
- Auto-sets `creado_por` to `auth.uid()`

**Example Usage:** See [../api/ACCIONES.md](../api/ACCIONES.md#crear_asignacion_accion)

---

#### `transferir_accion`

Transfer action ownership to a new owner.

**Signature:**
```sql
CREATE FUNCTION transferir_accion(
  accion_id UUID,
  nuevo_dueno_id UUID,
  fecha_transferencia DATE DEFAULT CURRENT_DATE,
  atributos JSONB DEFAULT NULL
) RETURNS asignaciones_acciones
```

**Returns:** New `asignaciones_acciones` record for new owner

**Business Rules:**
- Finalizes current owner's assignment (sets `fecha_fin`)
- Finalizes ALL beneficiary assignments
- Creates new owner assignment with subcodigo 00
- Atomic operation (all or nothing)

**Example Usage:** See [../api/ACCIONES.md](../api/ACCIONES.md#transferir_accion)

---

#### `finalizar_asignacion_accion`

End an action assignment.

**Signature:**
```sql
CREATE FUNCTION finalizar_asignacion_accion(
  asignacion_id UUID,
  fecha_fin DATE DEFAULT CURRENT_DATE
) RETURNS asignaciones_acciones
```

**Returns:** Updated `asignaciones_acciones` record with `es_vigente = FALSE`

**Business Rules:**
- Sets `fecha_fin` to provided date
- `es_vigente` generated column becomes FALSE
- Assignment preserved in database for historical tracking

---

#### `generar_siguiente_subcodigo`

Generate the next available subcode for an assignment type.

**Signature:**
```sql
CREATE FUNCTION generar_siguiente_subcodigo(
  p_accion_id UUID,
  p_tipo_asignacion TEXT
) RETURNS TEXT
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_accion_id` | UUID | ✅ | Action ID |
| `p_tipo_asignacion` | TEXT | ✅ | dueño, titular, or beneficiario |

**Returns:** 2-digit subcode (TEXT)

**Logic:**
- **dueño**: Returns first available from 00-09
- **titular**: Returns first available from 10-19
- **beneficiario**: Returns first available from 20-99
- Checks existing assignments to avoid conflicts
- Raises exception if range exhausted

**Example Usage:** See [../api/ACCIONES.md](../api/ACCIONES.md#generar_siguiente_subcodigo)

---

## Helper Functions

These functions are **internal** and cannot be called directly from the frontend.

### Validation Functions

#### `calcular_digito_verificacion_nit`

Calculate the verification digit for a Colombian NIT (tax ID).

**Signature:**
```sql
CREATE FUNCTION calcular_digito_verificacion_nit(nit TEXT)
RETURNS TEXT
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nit` | TEXT | 9-digit NIT without verification digit |

**Returns:** Single digit as TEXT (0-9)

**Algorithm:**
```
1. Multiply each digit by its weight (41, 37, 29, 23, 19, 17, 13, 7, 3)
2. Sum all products
3. Divide by 11 and get remainder
4. If remainder = 0 or 1, return 0
5. Otherwise, return 11 - remainder
```

**Example:**
```sql
SELECT calcular_digito_verificacion_nit('900123456');
-- Returns: '3'
```

**Usage:**
- Called automatically by `crear_empresa` if `digito_verificacion` not provided
- Used for NIT validation in empresas table

---

#### `validar_consistencia_tipo_actor`

Ensure each business_partner has exactly one specialization (CTI pattern).

**Signature:**
```sql
CREATE FUNCTION validar_consistencia_tipo_actor()
RETURNS TRIGGER
```

**Trigger:** AFTER INSERT OR UPDATE ON `business_partners`

**Validation Rules:**
- If `tipo_actor = 'persona'`, must have matching row in `personas` table
- If `tipo_actor = 'empresa'`, must have matching row in `empresas` table
- Cannot have rows in both `personas` AND `empresas` for same ID

**Raises Exception:**
- `P0001` - "Business partner must have exactly one specialization (persona or empresa)"

---

#### `validar_asignacion_accion`

Validate assignment type and subcode correspondence.

**Signature:**
```sql
CREATE FUNCTION validar_asignacion_accion()
RETURNS TRIGGER
```

**Trigger:** BEFORE INSERT OR UPDATE ON `asignaciones_acciones`

**Validation Rules:**

| tipo_asignacion | Valid Subcode Range |
|----------------|---------------------|
| `dueño` | 00-09 |
| `titular` | 10-19 |
| `beneficiario` | 20-99 |

**Raises Exception:**
- `P0001` - "Subcode XX is invalid for assignment type 'tipo_asignacion'. Expected range: YY-ZZ"

---

#### `validar_tipo_relacion_compatible`

Validate relationship type compatibility (placeholder for future logic).

**Signature:**
```sql
CREATE FUNCTION validar_tipo_relacion_compatible()
RETURNS TRIGGER
```

**Trigger:** BEFORE INSERT OR UPDATE ON `bp_relaciones`

**Current Logic:**
- Validates `tipo_relacion` is valid enum value
- Future: Could validate relationship type based on BP types (e.g., 'laboral' only between persona and empresa)

---

### Code Generation

#### `generar_codigo_bp`

Auto-generate unique BP code on INSERT.

**Signature:**
```sql
CREATE FUNCTION generar_codigo_bp()
RETURNS TRIGGER
```

**Trigger:** BEFORE INSERT ON `business_partners`

**Logic:**
1. Find MAX existing `codigo_bp` numeric part
2. Increment by 1
3. Format as `BP-0000001` (7 digits, zero-padded)

**Example:**
- Last BP: `BP-0000123`
- New BP: `BP-0000124`

---

#### `generar_codigo_completo_asignacion`

Generate complete assignment code from accion + subcodigo.

**Signature:**
```sql
CREATE FUNCTION generar_codigo_completo_asignacion()
RETURNS TRIGGER
```

**Trigger:** BEFORE INSERT OR UPDATE ON `asignaciones_acciones`

**Logic:**
1. Get `codigo` from `acciones` table (e.g., '4398')
2. Concatenate with `subcodigo` (e.g., '00')
3. Set `codigo_completo` to result (e.g., '439800')

**Example:**
- Accion codigo: `4398`
- Subcodigo: `00`
- Codigo completo: `439800`

---

#### `enforce_created_by`

Prevent modification of `creado_por` field after creation.

**Signature:**
```sql
CREATE FUNCTION enforce_created_by()
RETURNS TRIGGER
```

**Trigger:** BEFORE UPDATE ON all tables with `creado_por`

**Logic:**
- If `creado_por` differs between OLD and NEW, restore OLD value
- Ensures audit trail integrity

---

#### `om_prevent_key_change`

Prevent changes to key fields in `organization_members`.

**Signature:**
```sql
CREATE FUNCTION om_prevent_key_change()
RETURNS TRIGGER
```

**Trigger:** BEFORE UPDATE ON `organization_members`

**Logic:**
- Prevents changing `organization_id` or `user_id`
- Delete and recreate instead of updating these fields

---

#### `assign_owner_on_org_create`

Automatically assign creator as owner of new organization.

**Signature:**
```sql
CREATE FUNCTION assign_owner_on_org_create()
RETURNS TRIGGER
```

**Trigger:** AFTER INSERT ON `organizations`

**Logic:**
1. Get 'owner' role ID
2. Insert into `organization_members` with `user_id = auth.uid()`
3. Ensures every organization has an initial owner

---

## Trigger Functions

These functions are **triggered automatically** by database operations.

### Audit Trail Functions

#### `set_audit_user_columns`

Auto-set `creado_por` and `actualizado_por` on INSERT/UPDATE.

**Signature:**
```sql
CREATE FUNCTION set_audit_user_columns()
RETURNS TRIGGER
```

**Triggers:**
- BEFORE INSERT on all tables → Sets `creado_por = auth.uid()`
- BEFORE UPDATE on all tables → Sets `actualizado_por = auth.uid()`

**Execution:**
```sql
-- INSERT
NEW.creado_por = auth.uid();
NEW.actualizado_por = auth.uid();

-- UPDATE
NEW.actualizado_por = auth.uid();
-- creado_por is protected by enforce_created_by()
```

---

#### `set_deleted_by_on_soft_delete`

Auto-set `eliminado_por` when soft deleting.

**Signature:**
```sql
CREATE FUNCTION set_deleted_by_on_soft_delete()
RETURNS TRIGGER
```

**Trigger:** BEFORE UPDATE on all tables with `eliminado_en`

**Logic:**
- If `eliminado_en` changed from NULL to timestamp
- Set `eliminado_por = auth.uid()`

**Example:**
```sql
-- Soft delete query
UPDATE business_partners
SET eliminado_en = NOW()
WHERE id = 'xxx';

-- Trigger automatically sets:
-- eliminado_por = auth.uid()
```

---

#### `actualizar_timestamp`

Auto-update `actualizado_en` on UPDATE (not currently active in schema).

**Signature:**
```sql
CREATE FUNCTION actualizar_timestamp()
RETURNS TRIGGER
```

**Note:** Function exists but no active triggers use it. `set_audit_user_columns` handles timestamp updates.

---

#### `audit.log_change` (Supabase Extension)

Log all changes to `audit.record_version` table.

**Trigger:** AFTER INSERT/UPDATE/DELETE on all tables

**Provided by:** Supabase Audit extension

**Captures:**
- Old and new record values
- Operation type (INSERT/UPDATE/DELETE)
- Timestamp and user ID

---

#### `audit.fn_row_change` (Supabase Extension)

Alternative audit logging function.

**Trigger:** AFTER INSERT/UPDATE/DELETE on all tables

**Note:** Both `audit.log_change` and `audit.fn_row_change` are active, providing redundant audit logging.

---

## Permission Functions

These functions are used by RLS policies to check permissions.

### Core Permission Checks

#### `can_user_v2`

**Primary permission check** used by all RLS policies.

**Signature:**
```sql
CREATE FUNCTION can_user_v2(
  resource TEXT,
  action TEXT,
  org_id UUID
) RETURNS BOOLEAN
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resource` | TEXT | Table name (e.g., 'business_partners', 'acciones') |
| `action` | TEXT | Operation (select, insert, update, delete) |
| `org_id` | UUID | Organization ID |

**Returns:** TRUE if user has permission, FALSE otherwise

**Logic:**
1. Check if user is member of organization
2. Get user's role in that organization
3. Check if role has permission for resource + action in `role_permissions` table

**Example:**
```sql
-- Check if current user can insert into business_partners
SELECT can_user_v2('business_partners', 'insert', '..org-id..');
```

**See [RLS.md](./RLS.md) for usage in policies.**

---

### Organization Role Checks

#### `is_org_admin_v2`

Check if user is admin or owner of organization.

**Signature:**
```sql
CREATE FUNCTION is_org_admin_v2(org_id UUID)
RETURNS BOOLEAN
```

**Returns:** TRUE if user role is 'admin' or 'owner'

**Usage:**
- Restrict admin-only operations
- Used in organization_members policies

---

#### `is_org_owner_v2`

Check if user is owner of organization.

**Signature:**
```sql
CREATE FUNCTION is_org_owner_v2(org_id UUID)
RETURNS BOOLEAN
```

**Returns:** TRUE if user role is 'owner'

**Usage:**
- Owner-only operations (delete organization, assign owner role)

---

#### `can_view_org_membership_v2`

Check if user can view organization membership.

**Signature:**
```sql
CREATE FUNCTION can_view_org_membership_v2(org_id UUID)
RETURNS BOOLEAN
```

**Returns:** TRUE if user is member of organization (any role)

**Usage:**
- SELECT policy on `organization_members`

---

### Safety Checks

#### `org_has_other_owner_v2`

Check if organization has another owner besides specified user.

**Signature:**
```sql
CREATE FUNCTION org_has_other_owner_v2(
  org_id UUID,
  excluded_user_id UUID
) RETURNS BOOLEAN
```

**Returns:** TRUE if there's at least one other owner

**Usage:**
- Prevent deleting or demoting the last owner
- Used in organization_members DELETE/UPDATE policies

**Example:**
```sql
-- Cannot remove member if they are the last owner
DELETE FROM organization_members
WHERE id = 'xxx'
  AND org_has_other_owner_v2(organization_id, user_id);
```

---

## Related Documentation

### Database Documentation
- **[OVERVIEW.md](./OVERVIEW.md)** - Architecture patterns and quick reference
- **[SCHEMA.md](./SCHEMA.md)** - Complete schema with ERD diagrams
- **[TABLES.md](./TABLES.md)** - Data dictionary for all tables
- **[VIEWS.md](./VIEWS.md)** - Pre-built views reference
- **[RLS.md](./RLS.md)** - Row Level Security policies
- **[QUERIES.md](./QUERIES.md)** - SQL cookbook with patterns

### API Documentation
- **[../api/README.md](../api/README.md)** - API overview and RPC index
- **[../api/CREAR_PERSONA.md](../api/CREAR_PERSONA.md)** - Create natural person API
- **[../api/CREAR_EMPRESA.md](../api/CREAR_EMPRESA.md)** - Create company API
- **[../api/BP_RELACIONES.md](../api/BP_RELACIONES.md)** - Relationship management API
- **[../api/ACCIONES.md](../api/ACCIONES.md)** - Club shares management API

---

**Last Generated:** 2025-12-28
**Total Functions:** 36 (11 user-facing RPC + 25 internal)
**Database Version:** PostgreSQL 15 (Supabase)

