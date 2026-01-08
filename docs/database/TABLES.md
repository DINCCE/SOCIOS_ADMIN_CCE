# Database Tables - Complete Data Dictionary

> **Last Updated:** 2026-01-08
> **Schema Version:** Post-migration (Soft delete + Security fixes)
> **Total Tables:** 11

---

## Table of Contents

1. [Configuration Tables](#configuration-tables)
   - [config_organizaciones](#config_organizaciones)
   - [config_organizacion_miembros](#config_organizacion_miembros)
   - [config_roles](#config_roles)
   - [config_roles_permisos](#config_roles_permisos)
   - [config_ciudades](#config_ciudades)
2. [Master Data Tables](#master-data-tables)
   - [dm_actores](#dm_actores)
   - [dm_acciones](#dm_acciones)
3. [Transaction Tables](#transaction-tables)
   - [tr_doc_comercial](#tr_doc_comercial)
   - [tr_tr_tareas](#tr_tr_tareas)
4. [Visualization Tables](#visualization-tables)
   - [vn_asociados](#vn_asociados)
   - [vn_relaciones_actores](#vn_relaciones_actores)

---

## Configuration Tables

### config_organizaciones

**Purpose:** Multi-tenancy foundation and organizational hierarchy

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| nombre | text | NO | | Organization name |
| slug | text | YES | | URL-friendly identifier |
| tipo | text | YES | | Organization type |
| logo_url | text | YES | | Company logo URL |
| metadata | jsonb | YES | '{}'::jsonb | Flexible metadata storage |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted (FK: auth.users) |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator (FK: auth.users) |
| actualizado_por | uuid | YES | | Updater (FK: auth.users) |

**Indexes:**
- `idx_config_organizaciones_activas` (partial: WHERE eliminado_en IS NULL)
- `idx_config_organizaciones_nombre_activas` (partial: WHERE eliminado_en IS NULL)
- `idx_org_slug` (unique)
- `idx_org_padre`

**RLS Policies:**
- `config_organizaciones_select_filtered` - Members can view their org
- `config_organizaciones_insert_authenticated` - Authenticated users can create
- `config_organizaciones_update_members` - Members can update
- `config_organizaciones_delete_owners` - Only owners can delete

---

### config_organizacion_miembros

**Purpose:** Organization membership with role-based access control

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| user_id | uuid | NO | | Member (FK: auth.users) |
| organization_id | uuid | NO | | Organization (FK: config_organizaciones) |
| role | text | NO | | Role: owner/admin/member/viewer |
| nombres | text | YES | | Member's first names |
| apellidos | text | YES | | Member's last names |
| telefono | text | YES | | Contact phone |
| cargo | text | YES | | Job title |
| nombre_completo | text | YES | | Full name (computed) |
| atributos | jsonb | YES | | Custom attributes |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |
| created_at | timestamptz | YES | | Legacy timestamp |
| created_by | uuid | YES | | Legacy creator |

**Constraints:**
- PRIMARY KEY: (organization_id, user_id)
- UNIQUE: (organization_id, user_id) WHERE eliminado_en IS NULL

**Indexes:**
- `idx_config_organizacion_miembros_activos` (partial: WHERE eliminado_en IS NULL)
- `idx_om_org_user_unique`
- `idx_org_members_role`

**RLS Policies:**
- `om_select_visible` - Members can view org members
- `om_insert_admins` - Only admins can insert
- `om_update_roles` - Only admins can update roles
- `om_delete_members` - Members can delete themselves
- `om_update_own_preferences` - Users can update their own info

---

### config_roles

**Purpose:** System roles for RBAC (predefined only)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| role | text | NO | | Role name: owner/admin/member/viewer |
| metadata | jsonb | YES | '{}'::jsonb | Role metadata |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Constraints:**
- PRIMARY KEY: (role)
- CHECK: role IN ('owner', 'admin', 'member', 'viewer')

**Indexes:**
- `idx_config_roles_activos` (partial: WHERE eliminado_en IS NULL)

**RLS Policies:**
- `roles_read_org_filtered` - Authenticated users can read system roles only
- `roles_insert` - Only owners can insert
- `roles_update` - Only owners can update
- `roles_delete` - Only owners can delete

---

### config_roles_permisos

**Purpose:** Fine-grained permissions for each role

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| role | text | NO | | Role name (FK reference) |
| resource | text | NO | | Resource: dm_acciones, tr_tareas, etc. |
| action | text | NO | | Action: select, insert, update, delete |
| allow | boolean | NO | true | Permission granted/denied |
| metadata | jsonb | YES | | Permission metadata |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Constraints:**
- PRIMARY KEY: (role, resource, action)
- FOREIGN KEY: role references config_roles(role)

**Indexes:**
- `idx_config_roles_permisos_activos` (partial: WHERE eliminado_en IS NULL)
- `idx_role_permissions_resource_action`

**RLS Policies:**
- `role_permissions_read_org_filtered` - Read only for system roles
- `role_permissions_insert` - Only owners can insert
- `role_permissions_update` - Only owners can update
- `role_permissions_delete` - Only owners can delete

---

### config_ciudades

**Purpose:** Geographic locations catalog (cities, states, countries)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| country_code | text | YES | | ISO country code (e.g., "CO") |
| country_name | text | YES | | Country name |
| state_name | text | YES | | State/department name |
| city_name | text | YES | | City name |
| city_code | text | YES | | City code |
| search_text | text | YES | | Searchable text (unaccented) |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Indexes:**
- `idx_config_ciudades_activas` (partial: WHERE eliminado_en IS NULL) ON (country_code, state_name, city_name)
- `idx_config_ciudades_search` (partial: WHERE eliminado_en IS NULL) ON (search_text)

**RLS Policies:**
- `geo_locations_read` - All authenticated users can read (public geographic data)

---

## Master Data Tables

### dm_actores

**Purpose:** Unified table for all Business Partners using Single Table Inheritance (STI)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **Primary Key** ||||||
| id | uuid | NO | gen_random_uuid() | Primary key (shared with specializations) |
| **Identification** ||||||
| codigo_bp | text | NO | | Business partner code (e.g., "AC-00000001") |
| tipo_actor | tipo_actor_enum | NO | | Type: 'persona' or 'empresa' |
| tipo_documento | text | YES | | Document type (CC, NIT, CE, etc.) |
| num_documento | text | YES | | Document number |
| **Organization** ||||||
| organizacion_id | uuid | NO | | Organization (FK: config_organizaciones) |
| **Person Fields** (if tipo_actor='persona') ||||||
| primer_nombre | text | YES | | First name |
| segundo_nombre | text | YES | | Middle name |
| primer_apellido | text | YES | | First surname |
| segundo_apellido | text | YES | | Second surname |
| nombre_completo | text | YES | | Full name (computed) |
| fecha_nacimiento | date | YES | | Birth date |
| estado_civil | text | YES | | Civil status |
| genero | text | YES | | Gender |
| **Company Fields** (if tipo_actor='empresa') ||||||
| razon_social | text | YES | | Legal business name |
| nit | text | YES | | Tax ID (NIT in Colombia) |
| digito_verificacion | integer | YES | | NIT verification digit |
| **Contact** ||||||
| email | text | YES | | Email address |
| telefono | text | YES | | Phone number |
| whatsapp | text | YES | | WhatsApp number |
| foto_url | text | YES | | Profile photo URL |
| **Location** ||||||
| ciudad_id | uuid | YES | | City (FK: config_ciudades) |
| direccion | text | YES | | Street address |
| **Status** ||||||
| activo | boolean | NO | true | Active status |
| fecha_inactivacion | timestamptz | YES | | Inactivation date |
| motivo_inactivacion | text | YES | | Inactivation reason |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |
| **Metadata** ||||||
| atributos | jsonb | YES | '{}'::jsonb | Flexible custom attributes |

**Enums:**
- `tipo_actor_enum`: 'persona', 'empresa'

**Constraints:**
- PRIMARY KEY: (id)
- UNIQUE: (codigo_bp)
- UNIQUE: (organizacion_id, num_documento) WHERE eliminado_en IS NULL
- CHECK: (tipo_actor = 'persona' AND razon_social IS NULL) OR (tipo_actor = 'empresa' AND primer_nombre IS NULL)

**Indexes:**
- `idx_dm_actores_activos` (partial: WHERE eliminado_en IS NULL) ON (organizacion_id, eliminado_en, creado_en)
- `idx_dm_actores_tipo_actor_activos` (partial: WHERE eliminado_en IS NULL) ON (tipo_actor, organizacion_id)
- `idx_dm_actores_documento_activos` (partial: WHERE eliminado_en IS NULL) ON (tipo_documento, num_documento)
- `idx_dm_actores_ciudad_id` (partial: WHERE ciudad_id IS NOT NULL)
- `idx_bp_org`
- `idx_dm_actores_vigentes` (partial: WHERE activo = true AND eliminado_en IS NULL)

**RLS Policies:**
- `bp_select_filtered` - Members can view org's actors
- `bp_insert_members` - Members can insert
- `bp_update_members` - Members can update
- `bp_soft_delete_members` - Members can soft delete

**Triggers:**
- `trg_generar_codigo_dm_actores` - Auto-generate codigo_bp on insert
- `actualizar_timestamp` - Auto-update actualizado_en

**STI Pattern (Single Table Inheritance):**

- All actor types (personas and empresas) are stored in a single table
- Discriminator column: `tipo_actor` (enum: 'persona', 'empresa')
- Type-specific fields are in the same table (NULL when not applicable)
- Previous CTI pattern with separate `dm_personas` and `dm_empresas` tables was migrated to STI in January 2025
- Migration `20250105_drop_personas_empresas.sql` dropped the old specialization tables
- JSONB `perfil_*` columns provide flexible attributes for each type

---

### dm_acciones

**Purpose:** Master catalog of stock/share certificates (títulos de valor)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organizacion_id | uuid | NO | | Organization (FK: config_organizaciones) |
| codigo_accion | text | NO | | Share/stock code (e.g., "ACC-001") |
| tipo_accion | text | YES | | Share type (common, preferred, etc.) |
| valor_nominal | numeric | YES | | Nominal value |
| cantidad_total | integer | YES | | Total quantity issued |
| estado | text | YES | | Status: active/inactive/cancelled |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Indexes:**
- `idx_dm_acciones_activas` (partial: WHERE eliminado_en IS NULL) ON (organizacion_id, codigo_accion, estado)
- `idx_acciones_org`
- `idx_acciones_organizacion_id`

**RLS Policies:**
- `acciones_select_filtered` - Members can view org's actions
- `acciones_insert_members` - Members can insert
- `acciones_update_members` - Members can update
- `acciones_soft_delete_members` - Members can soft delete

---

## Transaction Tables

### tr_doc_comercial

**Purpose:** Business opportunities and commercial documents

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| **Identity** ||||||
| id | uuid | NO | gen_random_uuid() | Primary key |
| codigo | text | NO | | Opportunity code (auto-generated) |
| tipo | tr_doc_comercial_tipo | NO | | Document type |
| estado | tr_doc_comercial_estados | NO | | Status |
| **Dates** ||||||
| fecha_doc | date | YES | | Document date |
| fecha_venc_doc | date | YES | | Due date |
| **Organization** ||||||
| organizacion_id | uuid | NO | | Organization (FK: config_organizaciones) |
| asociado_id | uuid | YES | | Associated actor (FK: dm_actores) |
| **People** ||||||
| solicitante_id | uuid | YES | | Requester (FK: dm_actores) |
| responsable_id | uuid | YES | | Responsible person (FK: dm_actores) |
| pagador_id | uuid | YES | | Payer (FK: dm_actores) |
| **Financials** ||||||
| items | jsonb | YES | | Line items |
| moneda_iso | text | YES | 'COP' | Currency ISO code |
| valor_neto | numeric | YES | | Net value |
| valor_descuento | numeric | YES | | Discount amount |
| valor_impuestos | numeric | YES | | Tax amount |
| valor_total | numeric | YES | | Total value (computed) |
| monto_estimado | numeric | YES | | Estimated amount |
| **Related** ||||||
| documento_origen_id | uuid | YES | | Source document |
| **Metadata** ||||||
| notas | text | YES | | Notes |
| tags | text[] | YES | | Tags array |
| atributos | jsonb | YES | '{}'::jsonb | Custom attributes |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Enums:**
- `tr_doc_comercial_tipo`: 'cotizacion', 'orden_pedido', 'contrato', 'factura'
- `tr_doc_comercial_estados`: 'lead', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'

**Indexes:**
- `idx_tr_doc_comercial_activos` (partial: WHERE eliminado_en IS NULL) ON (organizacion_id, estado, creado_en)
- `idx_tr_doc_comercial_solicitante_activos` (partial: WHERE eliminado_en IS NULL) ON (solicitante_id, estado)
- `idx_tr_doc_comercial_responsable_activos` (partial: WHERE eliminado_en IS NULL) ON (responsable_id, estado)
- `idx_tr_doc_comercial_estado_fecha` (partial: WHERE eliminado_en IS NULL) ON (estado, fecha_venc_doc)

**RLS Policies:**
- `tr_doc_comercial_select_filtered` - Members can view org's opportunities
- `tr_doc_comercial_insert_members` - Members can insert
- `tr_doc_comercial_update_members` - Members can update
- `tr_doc_comercial_delete_members` - Members can delete

**Triggers:**
- `trg_gen_codigo_oportunidad` - Auto-generate codigo on insert
- `trg_calcular_valor_total_oportunidad` - Compute valor_total

---

### tr_tr_tareas

**Purpose:** Task and activity management

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| **Basic Info** ||||||
| titulo | text | NO | | Task title |
| descripcion | text | YES | | Task description |
| **Priorities & Status** ||||||
| prioridad | tr_tr_tareas_prioridad | NO | 'Media'::tr_tr_tareas_prioridad | Priority level |
| estado | tr_tr_tareas_estado | NO | 'pendiente'::tr_tr_tareas_estado | Task status |
| **Relationships** ||||||
| organizacion_id | uuid | NO | | Organization (FK: config_organizaciones) |
| oportunidad_id | uuid | YES | | Related opportunity (FK: tr_doc_comercial) |
| asignado_a | uuid | YES | | Assigned to (FK: dm_actores) |
| relacionado_con_bp | uuid | YES | | Related business partner (FK: dm_actores) |
| **Dates** ||||||
| fecha_vencimiento | date | YES | | Due date |
| **Metadata** ||||||
| atributos | jsonb | YES | '{}'::jsonb | Custom attributes |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Enums:**
- `tr_tr_tareas_prioridad`: 'Baja', 'Media', 'Alta', 'Urgente'
- `tr_tr_tareas_estado`: 'pendiente', 'en_progreso', 'completada', 'cancelada'

**Indexes:**
- `idx_tr_tr_tareas_activas` (partial: WHERE eliminado_en IS NULL) ON (organizacion_id, asignado_a, estado, fecha_vencimiento)
- `idx_tr_tr_tareas_oportunidad_activas` (partial: WHERE eliminado_en IS NULL) ON (oportunidad_id, estado)
- `idx_tr_tr_tareas_relacionado_bp_activas` (partial: WHERE eliminado_en IS NULL) ON (relacionado_con_bp, estado)
- `idx_tr_tr_tareas_estado_prioridad` (partial: WHERE eliminado_en IS NULL) ON (estado, prioridad, fecha_vencimiento)

**RLS Policies:**
- `tr_tareas_select_filtered` - Members can view org's tasks
- `tr_tareas_insert_members` - Members can insert
- `tr_tareas_update_members` - Members can update
- `tr_tareas_delete_members` - Members can delete

**Triggers:**
- `trg_generar_codigo_tarea` - Auto-generate codigo_tarea on insert

---

## Visualization Tables

### vn_asociados

**Purpose:** Share assignments (actors → shares) with temporal history

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| **Organization** ||||||
| organizacion_id | uuid | NO | | Organization (FK: config_organizaciones) |
| **Assignment** ||||||
| accion_id | uuid | NO | | Share/stock (FK: dm_acciones) |
| business_partner_id | uuid | NO | | Assigned actor (FK: dm_actores) |
| tipo_asignacion | text | NO | | Type: dueño/titular/beneficiario |
| subcodigo | text | NO | | Sub-code: 00/01/02+ |
| codigo_completo | text | YES | | Full code (accion_code + subcodigo) |
| **Temporal** ||||||
| fecha_inicio | date | NO | CURRENT_DATE | Start date |
| fecha_fin | date | YES | | End date (NULL = active) |
| es_actual | boolean | NO | true | Currently active? |
| **Financial** ||||||
| precio_transaccion | numeric | YES | | Transaction price |
| **Beneficiary Specific** ||||||
| subtipo_beneficiario | text | YES | | Beneficiary subtype |
| porcentaje | numeric | YES | | Percentage |
| **Metadata** ||||||
| notas | text | YES | | Notes |
| atributos | jsonb | YES | | Custom attributes |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Constraints:**
- UNIQUE: (accion_id, business_partner_id, tipo_asignacion) WHERE eliminado_en IS NULL AND fecha_fin IS NULL

**Validation Rules:**
- Only ONE active dueño (subcodigo='00') per acción
- Only ONE active titular (subcodigo='01') per acción
- Multiple beneficiaries allowed (subcodigo='02'+)
- Titulares and beneficiarios MUST be personas (not empresas)

**Indexes:**
- `idx_vn_asociados_activas` (partial: WHERE eliminado_en IS NULL) ON (organizacion_id, accion_id, tipo_asignacion)
- `idx_vn_asociados_bp_activas` (partial: WHERE eliminado_en IS NULL) ON (business_partner_id, fecha_fin)
- `idx_vn_asociados_accion_id`
- `idx_asignaciones_unico_vigente` (unique partial)

**RLS Policies:**
- `asignaciones_select_filtered` - Members can view org's assignments
- `asignaciones_insert_members` - Members can insert
- `asignaciones_update_members` - Members can update
- `asignaciones_delete_members` - Members can delete

**Triggers:**
- `trg_generar_codigo_completo_asignacion` - Build codigo_completo from accion code + subcodigo
- `trg_validar_asignacion_accion` - Validate assignment rules

---

### vn_relaciones_actores

**Purpose:** Relationships between business partners (family, work, commercial, etc.)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| **Organization** ||||||
| organizacion_id | uuid | NO | | Organization (FK: config_organizaciones) |
| **Relationship** ||||||
| bp_origen_id | uuid | NO | | Source actor (FK: dm_actores) |
| bp_destino_id | uuid | NO | | Target actor (FK: dm_actores) |
| tipo_relacion | dm_actores_tipo_relacion | NO | | Relationship type |
| **Roles** ||||||
| rol_origen | text | YES | | Source's role in relationship |
| rol_destino | text | YES | | Target's role in relationship |
| es_bidireccional | boolean | NO | false | Bidirectional? |
| **Temporal** ||||||
| fecha_inicio | date | NO | CURRENT_DATE | Start date |
| fecha_fin | date | YES | | End date (NULL = current) |
| es_actual | boolean | NO | true | Currently active? |
| **Metadata** ||||||
| notas | text | YES | | Notes |
| atributos | jsonb | YES | | Custom attributes |
| **Soft Delete** ||||||
| eliminado_en | timestamptz | YES | | Soft delete timestamp |
| eliminado_por | uuid | YES | | User who deleted |
| **Audit Fields** ||||||
| creado_en | timestamptz | NO | NOW() | Creation timestamp |
| actualizado_en | timestamptz | NO | NOW() | Last update timestamp |
| creado_por | uuid | YES | | Creator |
| actualizado_por | uuid | YES | | Updater |

**Enums:**
- `dm_actores_tipo_relacion`: 'familiar', 'laboral', 'referencia', 'membresia', 'comercial', 'otra'

**Constraints:**
- CHECK: bp_origen_id != bp_destino_id (no self-relationships)
- UNIQUE: (bp_origen_id, bp_destino_id, tipo_relacion) WHERE eliminado_en IS NULL AND es_actual = true

**Validation Rules:**
- `familiar`: Both must be personas
- `laboral`: origen=persona, destino=empresa
- No duplicate active relationships of same type between same actors

**Indexes:**
- `idx_vn_relaciones_actores_activas` (partial: WHERE eliminado_en IS NULL) ON (organizacion_id, bp_origen_id, bp_destino_id)
- `idx_vn_relaciones_actores_tipo_activas` (partial: WHERE eliminado_en IS NULL) ON (tipo_relacion, es_actual)
- `idx_bp_relaciones_bidireccional` (partial: WHERE es_bidireccional = true AND eliminado_en IS NULL)
- `idx_bp_relaciones_unique_activa` (unique partial)

**RLS Policies:**
- `bp_relaciones_select_filtered` - Members can view org's relationships
- `bp_relaciones_insert_members` - Members can insert
- `bp_relaciones_update_members` - Members can update
- `bp_relaciones_delete_members` - Members can delete

**Functions:**
- `crear_relacion_bp()` - Create with validation
- `actualizar_relacion_bp()` - Update relationship
- `finalizar_relacion_bp()` - End relationship (set fecha_fin)
- `eliminar_relacion_bp()` - Soft delete
- `obtener_relaciones_bp()` - Get all relationships for an actor

---

## Common Patterns

### Soft Delete Columns
All tables use these columns for soft delete:
- `eliminado_en TIMESTAMPTZ` - Deletion timestamp (NULL = active)
- `eliminado_por UUID` - User who performed deletion (FK: auth.users)

### Audit Columns
All tables have these audit fields:
- `creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `creado_por UUID` - Creator (FK: auth.users)
- `actualizado_por UUID` - Last updater (FK: auth.users)

### Partial Indexes
For performance, indexes are partial on active records:
- `WHERE eliminado_en IS NULL` - For soft delete pattern
- `WHERE <column> IS NOT NULL` - For optional foreign keys

### Organization Filtering
All multi-tenant tables include:
- `organizacion_id UUID NOT NULL` - Foreign key to config_organizaciones
- RLS policies filter by this column automatically

---

## Type Definitions

### Enums

```sql
-- Actor types
CREATE TYPE tipo_actor_enum AS ENUM ('persona', 'empresa');

-- Document types for business opportunities
CREATE TYPE tr_doc_comercial_tipo AS ENUM (
  'cotizacion', 'orden_pedido', 'contrato', 'factura'
);

-- Opportunity status
CREATE TYPE tr_doc_comercial_estados AS ENUM (
  'lead', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido'
);

-- Task priorities
CREATE TYPE tr_tr_tareas_prioridad AS ENUM (
  'Baja', 'Media', 'Alta', 'Urgente'
);

-- Task status
CREATE TYPE tr_tr_tareas_estado AS ENUM (
  'pendiente', 'en_progreso', 'completada', 'cancelada'
);

-- Relationship types between business partners
CREATE TYPE dm_actores_tipo_relacion AS ENUM (
  'familiar', 'laboral', 'referencia', 'membresia', 'comercial', 'otra'
);
```

---

## Foreign Key References

| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| config_organizacion_miembros | organization_id | config_organizaciones(id) | CASCADE |
| config_organizacion_miembros | user_id | auth.users(id) | CASCADE |
| config_organizacion_miembros | eliminado_por | auth.users(id) | SET NULL |
| config_roles_permisos | role | config_roles(role) | CASCADE |
| dm_actores | organizacion_id | config_organizaciones(id) | CASCADE |
| dm_actores | ciudad_id | config_ciudades(id) | SET NULL |
| dm_actores | eliminado_por | auth.users(id) | SET NULL |
| dm_acciones | organizacion_id | config_organizaciones(id) | CASCADE |
| tr_doc_comercial | organizacion_id | config_organizaciones(id) | CASCADE |
| tr_doc_comercial | solicitante_id | dm_actores(id) | SET NULL |
| tr_doc_comercial | responsable_id | dm_actores(id) | SET NULL |
| tr_doc_comercial | pagador_id | dm_actores(id) | SET NULL |
| tr_tr_tareas | organizacion_id | config_organizaciones(id) | CASCADE |
| tr_tr_tareas | oportunidad_id | tr_doc_comercial(id) | SET NULL |
| tr_tr_tareas | asignado_a | dm_actores(id) | SET NULL |
| tr_tr_tareas | relacionado_con_bp | dm_actores(id) | SET NULL |
| vn_asociados | organizacion_id | config_organizaciones(id) | CASCADE |
| vn_asociados | accion_id | dm_acciones(id) | CASCADE |
| vn_asociados | business_partner_id | dm_actores(id) | CASCADE |
| vn_relaciones_actores | organizacion_id | config_organizaciones(id) | CASCADE |
| vn_relaciones_actores | bp_origen_id | dm_actores(id) | CASCADE |
| vn_relaciones_actores | bp_destino_id | dm_actores(id) | CASCADE |

---

## Audit Triggers

All tables with audit columns have these triggers:

```sql
-- Auto-update actualizado_en and actualizado_por on UPDATE
CREATE TRIGGER trg_<table>_actualizado
  BEFORE UPDATE ON <table>
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_config();
```

---

## Full Text Search

### config_ciudades
The `search_text` column contains unaccented, searchable text:
```sql
search_text = unaccent(country_name || ' ' || state_name || ' ' || city_name)
```

Search function available:
```sql
SELECT * FROM search_locations('bogota', 20);
```

---

## Data Integrity Constraints

### Business Rules

1. **Uniqueness of Active Assignments** (vn_asociados):
   - Only ONE active dueño per acción
   - Only ONE active titular per acción
   - Multiple beneficiaries allowed

2. **Actor Type Constraints** (vn_asociados):
   - Titulares must be personas
   - Beneficiarios must be personas
   - Dueños can be personas OR empresas

3. **Relationship Type Validation** (vn_relaciones_actores):
   - familiar: both personas
   - laboral: origen=persona, destino=empresa
   - No duplicate active relationships

4. **Organization Isolation**:
   - All data filtered by organizacion_id
   - RLS enforces tenant separation
   - No cross-organization data leakage

---

## Performance Considerations

### Index Strategy

1. **Partial indexes for soft delete**:
   - All indexes on active records only (`WHERE eliminado_en IS NULL`)
   - Reduces index size by ~50% if soft deletes are common

2. **Composite indexes for common queries**:
   - (organizacion_id, estado, creado_en) for filtering
   - (asignado_a, estado) for user task lists
   - (estado, fecha_vencimiento) for due date queries

3. **Foreign key indexes**:
   - All FKs indexed for JOIN performance
   - Especially important for soft delete pattern

### Query Performance

Expected query times with current indexes:
- Filter by organization + soft delete: ~5-10ms
- Join actors with relationships: ~10-20ms
- Full-text search locations: ~20-50ms

---

## Maintenance

### Vacuum Strategy
- Autovacuum: Default PostgreSQL settings
- Manual vacuum: Monthly for high-churn tables (tr_tr_tareas, vn_asociados)

### Index Maintenance
- Reindex: Quarterly or if index bloat > 30%
- Analyze: Weekly to update statistics

### Archive Strategy (Future)
- Consider partitioning tr_doc_comercial by year
- Archive soft-deleted records after 2 years
- Move to cold storage after 5 years

---

## See Also

- [OVERVIEW.md](OVERVIEW.md) - Architecture concepts
- [SCHEMA.md](SCHEMA.md) - ERD and relationships
- [VIEWS.md](VIEWS.md) - Database views
- [QUERIES.md](QUERIES.md) - Common SQL patterns
