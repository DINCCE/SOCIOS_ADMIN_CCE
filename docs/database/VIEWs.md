# Database Views Documentation

This document provides a comprehensive overview of all views in the database, their structure, and purpose.

---

## Views Overview

Views provide a denormalized, business-friendly representation of data by joining related tables and displaying readable codes instead of UUIDs.

### Naming Convention

View fields follow the pattern: `{prefix}_{field_name}` where:
- **No prefix**: Fields from the main table
- `{entity}_*`: Fields from related entity tables (FKs)
- `{entity}_{subentity}_*`: Nested relationships (e.g., `padre_asociado_*`)

---

## Public Schema Views

### `v_asociados_org`

**Purpose:** Provides a complete, denormalized view of share assignments (`vn_asociados`) with all related information including actors, actions, organization, parent assignments, and audit details.

**Use Cases:**
- Display complete assignment information in UI tables
- Export assignment data for reports
- Query assignments without manual JOINs
- Show human-readable codes instead of UUIDs

**Structure:** 37 fields organized logically:

| # | Field | Type | Description |
|---|-------|------|-------------|
| **ID Principal** |
| 1 | `id` | uuid | Assignment ID (only UUID from main table) |
| **Identificación** |
| 2 | `codigo_completo` | text | Full code (action + subcode, e.g., "439800") |
| 3 | `subcodigo` | text | Subcode (00=owner, 01=holder, 02+=beneficiaries) |
| **Clasificación** |
| 4 | `tipo_vinculo` | enum | Link type: propietario, titular, beneficiario, intermediario |
| 5 | `modalidad` | enum | Modality: propiedad, comodato, asignacion_corp, convenio |
| 6 | `plan_comercial` | enum | Plan: regular, plan dorado, joven ejecutivo, honorifico |
| **Información de la acción** |
| 7 | `accion_codigo` | text | Action code (4 digits) |
| 8 | `accion_estado` | enum | Action state: disponible, asignada, arrendada, bloqueada, inactiva |
| **Información del asociado** |
| 9 | `asociado_codigo` | text | Actor BP code (ACT-XXXXXXXX) |
| 10 | `asociado_tipo_actor` | enum | Actor type: persona, empresa |
| 11 | `asociado_nombre_completo` | text | Full name |
| 12 | `asociado_tipo_documento` | enum | Document type: CC, CE, PA, TI, RC, PEP, PPT, NIT |
| 13 | `asociado_num_documento` | text | Document number |
| 14 | `asociado_email_principal` | text | Primary email |
| 15 | `asociado_telefono_principal` | text | Primary phone |
| **Fechas** |
| 16 | `fecha_inicio` | date | Start date |
| 17 | `fecha_fin` | date | End date (NULL = active) |
| 18 | `es_vigente` | boolean | Is currently active? |
| **Información de la asignación padre** |
| 19 | `padre_codigo_completo` | text | Parent assignment full code |
| 20 | `padre_subcodigo` | text | Parent assignment subcode |
| 21 | `padre_accion_codigo` | text | Parent action code |
| 22 | `padre_asociado_codigo` | text | Parent actor BP code |
| 23 | `padre_asociado_nombre_completo` | text | Parent actor full name |
| 24 | `padre_tipo_vinculo` | enum | Parent link type |
| **Información de la organización** |
| 25 | `organizacion_slug` | text | Organization slug |
| 26 | `organizacion_nombre` | text | Organization name |
| **Campos adicionales** |
| 27 | `notas` | text | Notes |
| 28 | `atributos` | jsonb | Custom attributes |
| **Auditoría** |
| 29 | `creado_en` | timestamptz | Creation timestamp |
| 30 | `creado_por_email` | text | Creator user email |
| 31 | `creado_por_nombre` | text | Creator user name |
| 32 | `actualizado_en` | timestamptz | Last update timestamp |
| 33 | `actualizado_por_email` | text | Updater user email |
| 34 | `actualizado_por_nombre` | text | Updater user name |
| 35 | `eliminado_en` | timestamptz | Soft delete timestamp |
| 36 | `eliminado_por_email` | text | Deleter user email |
| 37 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**
- `vn_asociados` (main table)
- `dm_actores` (actor information)
- `dm_acciones` (action information)
- `config_organizaciones` (organization information)
- `vn_asociados` (self-reference for parent assignment)
- `dm_acciones` (parent action information)
- `dm_actores` (parent actor information)
- `auth.users` (audit information: creator, updater, deleter)

**SQL Definition:**

```sql
CREATE VIEW public.v_asociados_org AS
SELECT
  a.id,
  a.codigo_completo,
  a.subcodigo,
  a.tipo_vinculo,
  a.modalidad,
  a.plan_comercial,
  dac.codigo_accion AS accion_codigo,
  dac.estado AS accion_estado,
  da.codigo_bp AS asociado_codigo,
  da.tipo_actor AS asociado_tipo_actor,
  da.nombre_completo AS asociado_nombre_completo,
  da.tipo_documento AS asociado_tipo_documento,
  da.num_documento AS asociado_num_documento,
  da.email_principal AS asociado_email_principal,
  da.telefono_principal AS asociado_telefono_principal,
  a.fecha_inicio,
  a.fecha_fin,
  a.es_vigente,
  ap.codigo_completo AS padre_codigo_completo,
  ap.subcodigo AS padre_subcodigo,
  dacp.codigo_accion AS padre_accion_codigo,
  dap.codigo_bp AS padre_asociado_codigo,
  dap.nombre_completo AS padre_asociado_nombre_completo,
  ap.tipo_vinculo AS padre_tipo_vinculo,
  org.slug AS organizacion_slug,
  org.nombre AS organizacion_nombre,
  a.notas,
  a.atributos,
  a.creado_en,
  uc.email AS creado_por_email,
  uc.raw_user_meta_data->>'name' AS creado_por_nombre,
  a.actualizado_en,
  ua.email AS actualizado_por_email,
  ua.raw_user_meta_data->>'name' AS actualizado_por_nombre,
  a.eliminado_en,
  ue.email AS eliminado_por_email,
  ue.raw_user_meta_data->>'name' AS eliminado_por_nombre
FROM vn_asociados a
  LEFT JOIN dm_actores da ON da.id = a.asociado_id
  LEFT JOIN dm_acciones dac ON dac.id = a.accion_id
  LEFT JOIN config_organizaciones org ON org.id = a.organizacion_id
  LEFT JOIN vn_asociados ap ON ap.id = a.asignacion_padre_id
  LEFT JOIN dm_acciones dacp ON dacp.id = ap.accion_id
  LEFT JOIN dm_actores dap ON dap.id = ap.asociado_id
  LEFT JOIN auth.users uc ON uc.id = a.creado_por
  LEFT JOIN auth.users ua ON ua.id = a.actualizado_por
  LEFT JOIN auth.users ue ON ue.id = a.eliminado_por;
```

**Example Query:**

```sql
-- Get all active assignments with actor and action info
SELECT
  codigo_completo,
  asociado_nombre_completo,
  accion_codigo,
  tipo_vinculo,
  organizacion_nombre
FROM v_asociados_org
WHERE es_vigente = true
ORDER BY accion_codigo, subcodigo;
```

**Example Output:**

| codigo_completo | asociado_nombre_completo | accion_codigo | tipo_vinculo | organizacion_nombre |
|-----------------|-------------------------|---------------|--------------|---------------------|
| 439800 | Juan Pérez González | 4398 | propietario | Club de Golf |
| 439801 | María Pérez González | 4398 | titular | Club de Golf |
| 439802 | Carlos Pérez González | 4398 | beneficiario | Club de Golf |

---

### `v_acciones_org`

**Purpose:** Provides a denormalized view of actions/shares (`dm_acciones`) with organization and audit information.

**Use Cases:**
- Display action information in UI tables
- Query actions without manual JOINs
- Show human-readable organization slugs instead of UUIDs
- Track audit information with user names

**Structure:** 14 fields organized logically:

| # | Field | Type | Description |
|---|-------|------|-------------|
| **ID Principal** |
| 1 | `id` | uuid | Action ID (only UUID from main table) |
| **Identificación** |
| 2 | `codigo_accion` | text | Action code (4 digits) |
| 3 | `estado` | enum | Action state: disponible, asignada, arrendada, bloqueada, inactiva |
| **Información de la organización** |
| 4 | `organizacion_slug` | text | Organization slug |
| 5 | `organizacion_nombre` | text | Organization name |
| **Auditoría** |
| 6 | `creado_en` | timestamptz | Creation timestamp |
| 7 | `creado_por_email` | text | Creator user email |
| 8 | `creado_por_nombre` | text | Creator user name |
| 9 | `actualizado_en` | timestamptz | Last update timestamp |
| 10 | `actualizado_por_email` | text | Updater user email |
| 11 | `actualizado_por_nombre` | text | Updater user name |
| 12 | `eliminado_en` | timestamptz | Soft delete timestamp |
| 13 | `eliminado_por_email` | text | Deleter user email |
| 14 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**
- `dm_acciones` (main table)
- `config_organizaciones` (organization information)
- `auth.users` (audit information: creator, updater, deleter)

**SQL Definition:**

```sql
CREATE VIEW public.v_acciones_org AS
SELECT
  a.id,
  a.codigo_accion,
  a.estado,
  org.slug AS organizacion_slug,
  org.nombre AS organizacion_nombre,
  a.creado_en,
  uc.email AS creado_por_email,
  uc.raw_user_meta_data->>'name' AS creado_por_nombre,
  a.actualizado_en,
  ua.email AS actualizado_por_email,
  ua.raw_user_meta_data->>'name' AS actualizado_por_nombre,
  a.eliminado_en,
  ue.email AS eliminado_por_email,
  ue.raw_user_meta_data->>'name' AS eliminado_por_nombre
FROM dm_acciones a
  LEFT JOIN config_organizaciones org ON org.id = a.organizacion_id
  LEFT JOIN auth.users uc ON uc.id = a.creado_por
  LEFT JOIN auth.users ua ON ua.id = a.actualizado_por
  LEFT JOIN auth.users ue ON ue.id = a.eliminado_por;
```

**Example Query:**

```sql
-- Get all available actions with organization info
SELECT
  codigo_accion,
  estado,
  organizacion_nombre,
  creado_por_nombre
FROM v_acciones_org
WHERE eliminado_en IS NULL
ORDER BY codigo_accion;
```

**Example Output:**

| codigo_accion | estado | organizacion_nombre | creado_por_nombre |
|---------------|--------|---------------------|-------------------|
| 0001 | disponible | Club de Golf | Admin Usuario |
| 0002 | asignada | Club de Golf | Admin Usuario |
| 0003 | disponible | Club de Golf | Juan Pérez |

---

### `v_actores_org`

**Purpose:** Provides a complete, denormalized view of business partners/actors (`dm_actores`) with all related information including organization, city, and audit details. Filters out soft-deleted records.

**Use Cases:**
- Display actor information in UI tables (persons and companies)
- Query actors without manual JOINs
- Show human-readable codes instead of UUIDs
- Track audit information with user names
- Filter out soft-deleted records automatically

**Structure:** 59 fields organized logically:

| # | Field | Type | Description |
|---|-------|------|-------------|
| **ID Principal** |
| 1 | `id` | uuid | Actor ID (only UUID from main table) |
| **Identificación** |
| 2 | `codigo_bp` | text | BP code (ACT-XXXXXXXX) |
| 3 | `tipo_actor` | enum | Actor type: persona, empresa |
| 4 | `nat_fiscal` | enum | Fiscal nature: natural, jurídica |
| 5 | `tipo_documento` | enum | Document type: CC, CE, PA, TI, RC, PEP, PPT, NIT |
| 6 | `num_documento` | text | Document number |
| 7 | `digito_verificacion` | smallint | Verification digit for NITs |
| 8 | `nombre_completo` | text | Full name (computed) |
| **Información de empresa** |
| 9 | `razon_social` | text | Legal name for companies |
| 10 | `nombre_comercial` | text | Trade/brand name |
| **Información de persona** |
| 11 | `primer_nombre` | text | First name |
| 12 | `segundo_nombre` | text | Second name |
| 13 | `primer_apellido` | text | First surname |
| 14 | `segundo_apellido` | text | Second surname |
| **Clasificación y estado** |
| 15 | `genero_actor` | enum | Gender: masculino, femenino, otro, no aplica |
| 16 | `fecha_nacimiento` | date | Birth date |
| 17 | `estado_civil` | enum | Civil status: soltero, casado, union libre, divorciado, viudo |
| 18 | `es_socio` | boolean | Is a partner/member |
| 19 | `es_cliente` | boolean | Is a customer |
| 20 | `es_proveedor` | boolean | Is a supplier |
| 21 | `estado_actor` | enum | Status: activo, inactivo, bloqueado |
| 22 | `regimen_tributario` | enum | Tax regime |
| **Contacto** |
| 23 | `email_principal` | text | Primary email |
| 24 | `email_secundario` | text | Secondary email |
| 25 | `email_facturacion` | text | Billing email |
| 26 | `telefono_principal` | text | Main phone |
| 27 | `telefono_secundario` | text | Secondary phone |
| 28 | `direccion_fisica` | text | Physical address |
| **Información de la ciudad (dirección)** |
| 29 | `direccion_ciudad_id` | uuid | City ID reference |
| 30 | `direccion_ciudad_nombre` | text | City name |
| 31 | `direccion_ciudad_estado` | text | State/province name |
| 32 | `direccion_ciudad_pais` | text | Country name |
| **Perfiles JSONB** |
| 33 | `perfil_identidad` | jsonb | Identity information |
| 34 | `perfil_profesional_corporativo` | jsonb | Professional/corporate data |
| 35 | `perfil_salud` | jsonb | Health information |
| 36 | `perfil_contacto` | jsonb | Emergency contacts |
| 37 | `perfil_intereses` | jsonb | Interests and preferences |
| 38 | `perfil_preferencias` | jsonb | Service preferences |
| 39 | `perfil_redes` | jsonb | Social media presence |
| 40 | `perfil_compliance` | jsonb | Compliance and risk |
| 41 | `perfil_referencias` | jsonb | References |
| **Tags** |
| 42 | `tags` | text[] | Search tags |
| **Información de la organización** |
| 43 | `organizacion_slug` | text | Organization slug |
| 44 | `organizacion_nombre` | text | Organization name |
| **Auditoría** |
| 45 | `creado_en` | timestamptz | Creation timestamp |
| 46 | `creado_por_email` | text | Creator user email |
| 47 | `creado_por_nombre` | text | Creator user name |
| 48 | `actualizado_en` | timestamptz | Last update timestamp |
| 49 | `actualizado_por_email` | text | Updater user email |
| 50 | `actualizado_por_nombre` | text | Updater user name |
| 51 | `eliminado_en` | timestamptz | Soft delete timestamp (filtered in WHERE) |
| 52 | `eliminado_por_email` | text | Deleter user email |
| 53 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**
- `dm_actores` (main table)
- `config_ciudades` (city information for address)
- `config_organizaciones` (organization information)
- `auth.users` (audit information: creator, updater, deleter)

**Filter:** `WHERE eliminado_en IS NULL` (excludes soft-deleted records)

**SQL Definition:**

```sql
CREATE VIEW public.v_actores_org AS
SELECT
  a.id,
  a.codigo_bp,
  a.tipo_actor,
  a.nat_fiscal,
  a.tipo_documento,
  a.num_documento,
  a.digito_verificacion,
  a.nombre_completo,
  a.razon_social,
  a.nombre_comercial,
  a.primer_nombre,
  a.segundo_nombre,
  a.primer_apellido,
  a.segundo_apellido,
  a.genero_actor,
  a.fecha_nacimiento,
  a.estado_civil,
  a.es_socio,
  a.es_cliente,
  a.es_proveedor,
  a.estado_actor,
  a.regimen_tributario,
  a.email_principal,
  a.email_secundario,
  a.email_facturacion,
  a.telefono_principal,
  a.telefono_secundario,
  a.direccion_fisica,
  a.ciudad_id AS direccion_ciudad_id,
  c.city_name AS direccion_ciudad_nombre,
  c.state_name AS direccion_ciudad_estado,
  c.country_name AS direccion_ciudad_pais,
  a.perfil_identidad,
  a.perfil_profesional_corporativo,
  a.perfil_salud,
  a.perfil_contacto,
  a.perfil_intereses,
  a.perfil_preferencias,
  a.perfil_redes,
  a.perfil_compliance,
  a.perfil_referencias,
  a.tags,
  org.slug AS organizacion_slug,
  org.nombre AS organizacion_nombre,
  a.creado_en,
  uc.email AS creado_por_email,
  uc.raw_user_meta_data->>'name' AS creado_por_nombre,
  a.actualizado_en,
  ua.email AS actualizado_por_email,
  ua.raw_user_meta_data->>'name' AS actualizado_por_nombre,
  a.eliminado_en,
  ue.email AS eliminado_por_email,
  ue.raw_user_meta_data->>'name' AS eliminado_por_nombre
FROM dm_actores a
  LEFT JOIN config_ciudades c ON c.id = a.ciudad_id
  LEFT JOIN config_organizaciones org ON org.id = a.organizacion_id
  LEFT JOIN auth.users uc ON uc.id = a.creado_por
  LEFT JOIN auth.users ua ON ua.id = a.actualizado_por
  LEFT JOIN auth.users ue ON ue.id = a.eliminado_por
WHERE a.eliminado_en IS NULL;
```

**Example Query:**

```sql
-- Get all active partners with organization info
SELECT
  codigo_bp,
  nombre_completo,
  tipo_actor,
  estado_actor,
  organizacion_nombre
FROM v_actores_org
ORDER BY nombre_completo;
```

**Example Output:**

| codigo_bp | nombre_completo | tipo_actor | estado_actor | organizacion_nombre |
|-----------|-----------------|------------|--------------|---------------------|
| ACT-000001 | Juan Pérez González | persona | activo | Club de Golf |
| ACT-000002 | Empresa XYZ S.A.S. | empresa | activo | Club de Golf |
| ACT-000003 | María Rodríguez | persona | inactivo | Club de Golf |

---

## Design Principles

When creating or updating views, follow these principles:

### 1. Include FK Information

All views should include basic information from foreign key relationships:
- **Codes** instead of UUIDs (e.g., `codigo_bp`, `codigo_accion`, `slug`)
- **Readable names** (e.g., `nombre_completo`, `nombre`)

### 2. Use Consistent Naming

Field names should follow the pattern: `{prefix}_{field_name}`
- No prefix for main table fields
- `{entity}_*` for related entity fields
- `{entity}_{subentity}_*` for nested relationships

### 3. Logical Field Order

Organize fields in this order:
1. ID (only UUID from main table if needed)
2. Identification codes
3. Classification fields
4. Related entity information (grouped by entity)
5. Dates
6. Additional fields (notes, attributes)
7. Audit fields (always last)

### 4. Audit Information

Include human-readable audit information:
- User emails instead of UUIDs
- User names from `raw_user_meta_data`

### 5. No UUIDs (Exception)

Only include the main table's UUID if needed for joins or application logic. All other UUIDs should be replaced with readable codes.
