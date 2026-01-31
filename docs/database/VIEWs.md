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

**Purpose:** Provides a denormalized view of actions/shares (`dm_acciones`) with organization, owner (propietario) information, and audit details.

**Use Cases:**
- Display action information in UI tables
- Query actions without manual JOINs
- Show human-readable organization slugs instead of UUIDs
- Track audit information with user names
- Display owner assignment details (codigo_completo, fecha_inicio, etc.)

**Structure:** 25 fields organized logically:

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
| **Información del propietario (vinculado)** | | | |
| 6 | `propietario_codigo_completo` | text | Owner's full code (action + subcode) |
| 7 | `propietario_subcodigo` | text | Owner's subcode (typically "00") |
| 8 | `propietario_fecha_inicio` | date | Owner's assignment start date |
| 9 | `propietario_tipo_vinculo` | enum | Owner's link type (always "propietario") |
| 10 | `propietario_modalidad` | enum | Owner's modality: propiedad, comodato, asignacion_corp, convenio |
| 11 | `propietario_plan_comercial` | enum | Owner's plan: regular, plan dorado, joven ejecutivo, honorifico |
| 12 | `propietario_codigo_bp` | text | Owner's actor BP code (ACT-XXXXXXXX) |
| 13 | `propietario_nombre_completo` | text | Owner's full name |
| 14 | `propietario_tipo_actor` | enum | Owner's actor type: persona, empresa |
| 15 | `propietario_tipo_documento` | enum | Owner's document type: CC, CE, PA, TI, RC, PEP, PPT, NIT |
| 16 | `propietario_num_documento` | text | Owner's document number |
| 17 | `propietario_email_principal` | text | Owner's primary email |
| 18 | `propietario_telefono_principal` | text | Owner's primary phone |
| **Auditoría** | | | |
| 19 | `creado_en` | timestamptz | Creation timestamp |
| 20 | `creado_por_email` | text | Creator user email |
| 21 | `creado_por_nombre` | text | Creator user name |
| 22 | `actualizado_en` | timestamptz | Last update timestamp |
| 23 | `actualizado_por_email` | text | Updater user email |
| 24 | `actualizado_por_nombre` | text | Updater user name |
| 25 | `eliminado_en` | timestamptz | Soft delete timestamp |
| 26 | `eliminado_por_email` | text | Deleter user email |
| 27 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**
- `dm_acciones` (main table)
- `config_organizaciones` (organization information)
- `vn_asociados` (owner assignment information, filtered by tipo_vinculo='propietario' and es_vigente=true)
- `dm_actores` (owner actor information)
- `auth.users` (audit information: creator, updater, deleter)

**Filter:** `WHERE eliminado_en IS NULL` (excludes soft-deleted records)

**SQL Definition:**

```sql
CREATE VIEW public.v_acciones_org AS
SELECT
  a.id,
  a.codigo_accion,
  a.estado,
  org.slug AS organizacion_slug,
  org.nombre AS organizacion_nombre,
  prop.codigo_completo AS propietario_codigo_completo,
  prop.subcodigo AS propietario_subcodigo,
  prop.fecha_inicio AS propietario_fecha_inicio,
  prop.tipo_vinculo AS propietario_tipo_vinculo,
  prop.modalidad AS propietario_modalidad,
  prop.plan_comercial AS propietario_plan_comercial,
  prop_actor.codigo_bp AS propietario_codigo_bp,
  prop_actor.nombre_completo AS propietario_nombre_completo,
  prop_actor.tipo_actor AS propietario_tipo_actor,
  prop_actor.tipo_documento AS propietario_tipo_documento,
  prop_actor.num_documento AS propietario_num_documento,
  prop_actor.email_principal AS propietario_email_principal,
  prop_actor.telefono_principal AS propietario_telefono_principal,
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
  LEFT JOIN vn_asociados prop ON prop.accion_id = a.id
    AND prop.tipo_vinculo = 'propietario'::vn_asociados_tipo_vinculo
    AND prop.es_vigente = true
    AND prop.eliminado_en IS NULL
  LEFT JOIN dm_actores prop_actor ON prop_actor.id = prop.asociado_id
  LEFT JOIN auth.users uc ON uc.id = a.creado_por
  LEFT JOIN auth.users ua ON ua.id = a.actualizado_por
  LEFT JOIN auth.users ue ON ue.id = a.eliminado_por
WHERE a.eliminado_en IS NULL;
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

**Structure:** 57 fields organized logically:

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
| 18 | `es_socio` | boolean | **Calculated**: TRUE if has active association in vn_asociados |
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
| 42 | `tags` | text[] | Search tags |
| 43 | `organizacion_slug` | text | Organization slug |
| 44 | `organizacion_nombre` | text | Organization name |
| 45 | `asociado_desde` | date | Earliest start date of active associations (NULL if not a partner) |
| 46 | `asociado_tipo_socio` | text | Active link type(s) concatenated: "propietario, titular, beneficiario" (NULL if not a partner) |
| 47 | `asociado_modalidad` | text | Active modality/modalities concatenated: "propiedad, comodato, asignacion_corp, convenio" (NULL if not a partner) |
| 48 | `asociado_plan_comercial` | text | Active commercial plan(s) concatenated: "regular, plan dorado, joven ejecutivo, honorifico" (NULL if not a partner) |
| 49 | `creado_en` | timestamptz | Creation timestamp |
| 50 | `creado_por_email` | text | Creator user email |
| 51 | `creado_por_nombre` | text | Creator user name |
| 52 | `actualizado_en` | timestamptz | Last update timestamp |
| 53 | `actualizado_por_email` | text | Updater user email |
| 54 | `actualizado_por_nombre` | text | Updater user name |
| 55 | `eliminado_en` | timestamptz | Soft delete timestamp (filtered in WHERE) |
| 56 | `eliminado_por_email` | text | Deleter user email |
| 57 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**

- `dm_actores` (main table)
- `config_ciudades` (city information for address)
- `config_organizaciones` (organization information)
- `vn_asociados` (association information via LATERAL JOIN for `asociado_*` fields and `es_socio` calculation)
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
  -- es_socio is calculated from active associations in vn_asociados
  COALESCE(
    EXISTS (
      SELECT 1
      FROM vn_asociados assoc
      WHERE assoc.asociado_id = a.id
        AND assoc.es_vigente = TRUE
        AND assoc.fecha_inicio <= CURRENT_DATE
        AND (assoc.fecha_fin IS NULL OR assoc.fecha_fin >= CURRENT_DATE)
        AND assoc.eliminado_en IS NULL
    ),
    FALSE
  ) AS es_socio,
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
  -- Association fields from vn_asociados (via LATERAL JOIN)
  assoc_info.asociado_desde,
  assoc_info.asociado_tipo_socio,
  assoc_info.asociado_modalidad,
  assoc_info.asociado_plan_comercial,
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
  -- LATERAL JOIN to get association information (aggregates multiple active links)
  LEFT JOIN LATERAL (
    SELECT
      MIN(assoc.fecha_inicio) AS asociado_desde,
      string_agg(DISTINCT assoc.tipo_vinculo, ', ' ORDER BY assoc.tipo_vinculo) AS asociado_tipo_socio,
      string_agg(DISTINCT assoc.modalidad, ', ' ORDER BY assoc.modalidad) AS asociado_modalidad,
      string_agg(DISTINCT assoc.plan_comercial, ', ' ORDER BY assoc.plan_comercial) AS asociado_plan_comercial
    FROM vn_asociados assoc
    WHERE assoc.asociado_id = a.id
      AND assoc.es_vigente = TRUE
      AND assoc.fecha_inicio <= CURRENT_DATE
      AND (assoc.fecha_fin IS NULL OR assoc.fecha_fin >= CURRENT_DATE)
      AND assoc.eliminado_en IS NULL
  ) assoc_info ON TRUE
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

### `v_doc_comercial_org`

**Purpose:** Provides a complete, denormalized view of commercial documents (`tr_doc_comercial`) with all related information including organization, actors (solicitante, pagador, asociado), responsible user, and audit details. Filters out soft-deleted records.

**Use Cases:**
- Display commercial document information in UI tables
- Query opportunities/offers/orders without manual JOINs
- Show human-readable codes and names instead of UUIDs
- Track audit information with user emails and names
- Filter out soft-deleted records automatically

**Structure:** 50 fields organized logically:

| # | Field | Type | Description |
|---|-------|------|-------------|
| **ID Principal** |
| 1 | `id` | uuid | Document ID (only UUID from main table) |
| **Identificación** |
| 2 | `codigo` | text | Document code (DOC-XXXXXXXX) |
| 3 | `tipo` | enum | Document type: oportunidad, oferta, pedido_venta, reserva |
| 4 | `sub_tipo` | enum | Subtype: sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos |
| 5 | `estado` | enum | State: Nueva, En Progreso, Ganada, Pérdida, Descartada |
| 6 | `titulo` | text | Document title |
| 7 | `fecha_doc` | date | Document date |
| 8 | `fecha_venc_doc` | date | Due date |
| **Información de la organización** |
| 9 | `organizacion_slug` | text | Organization slug |
| 10 | `organizacion_nombre` | text | Organization name |
| **Información del asociado** |
| 11 | `asociado_id` | uuid | Associated member ID (vn_asociados) |
| 12 | `asociado_codigo_completo` | text | Associated member full code |
| 13 | `asociado_tipo_vinculo` | enum | Link type: propietario, titular, beneficiario, intermediario |
| 14 | `asociado_nombre_completo` | text | Associated member full name |
| **Información del solicitante** |
| 15 | `solicitante_id` | uuid | Applicant ID |
| 16 | `solicitante_codigo_bp` | text | Applicant BP code |
| 17 | `solicitante_nombre_completo` | text | Applicant full name |
| 18 | `solicitante_tipo_actor` | enum | Applicant actor type: persona, empresa |
| 19 | `solicitante_email_principal` | text | Applicant primary email |
| **Información del pagador** |
| 20 | `pagador_id` | uuid | Payer ID |
| 21 | `pagador_codigo_bp` | text | Payer BP code |
| 22 | `pagador_nombre_completo` | text | Payer full name |
| 23 | `pagador_tipo_actor` | enum | Payer actor type: persona, empresa |
| 24 | `pagador_email_principal` | text | Payer primary email |
| **Información del responsable** |
| 25 | `responsable_id` | uuid | Responsible user ID |
| 26 | `responsable_nombre_completo` | text | Responsible user full name |
| 27 | `responsable_email` | text | Responsible user email from auth.users |
| **Valores financieros** |
| 28 | `moneda_iso` | enum | Currency ISO code |
| 29 | `valor_neto` | numeric | Subtotal before taxes/discounts |
| 30 | `valor_descuento` | numeric | Total discounts |
| 31 | `valor_impuestos` | numeric | Total taxes |
| 32 | `valor_total` | numeric | Final amount |
| 33 | `monto_estimado` | numeric | Estimated amount (legacy) |
| **Campos adicionales** |
| 34 | `notas` | text | Notes |
| 35 | `atributos` | jsonb | Custom attributes |
| 36 | `tags` | text[] | Search tags |
| 37 | `items` | jsonb | Line items (JSONB) |
| 38 | `documento_origen_id` | uuid | Origin document ID (self-reference) |
| **Auditoría** |
| 39 | `creado_en` | timestamptz | Creation timestamp |
| 40 | `creado_por_email` | text | Creator user email |
| 41 | `creado_por_nombre` | text | Creator user name |
| 42 | `actualizado_en` | timestamptz | Last update timestamp |
| 43 | `actualizado_por_email` | text | Updater user email |
| 44 | `actualizado_por_nombre` | text | Updater user name |
| 45 | `eliminado_en` | timestamptz | Soft delete timestamp (filtered in WHERE) |
| 46 | `eliminado_por_email` | text | Deleter user email |
| 47 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**
- `tr_doc_comercial` (main table)
- `config_organizaciones` (organization information)
- `vn_asociados` (associated member information)
- `dm_actores` (solicitante, pagador, and asociado actor information - 3 JOINs)
- `config_organizacion_miembros` (responsible user information)
- `auth.users` (responsible user email information)
- `auth.users` (audit information: creator, updater, deleter)

**Filter:** `WHERE eliminado_en IS NULL` (excludes soft-deleted records)

**SQL Definition:**

```sql
CREATE VIEW public.v_doc_comercial_org AS
SELECT
  t.id,
  t.codigo,
  t.tipo,
  t.sub_tipo,
  t.estado,
  t.titulo,
  t.fecha_doc,
  t.fecha_venc_doc,
  org.slug AS organizacion_slug,
  org.nombre AS organizacion_nombre,
  t.asociado_id,
  va.codigo_completo AS asociado_codigo_completo,
  va.tipo_vinculo AS asociado_tipo_vinculo,
  daso.nombre_completo AS asociado_nombre_completo,
  t.solicitante_id,
  daso1.codigo_bp AS solicitante_codigo_bp,
  daso1.nombre_completo AS solicitante_nombre_completo,
  daso1.tipo_actor AS solicitante_tipo_actor,
  daso1.email_principal AS solicitante_email_principal,
  t.pagador_id,
  daso2.codigo_bp AS pagador_codigo_bp,
  daso2.nombre_completo AS pagador_nombre_completo,
  daso2.tipo_actor AS pagador_tipo_actor,
  daso2.email_principal AS pagador_email_principal,
  t.responsable_id,
  m_responsable.nombre_completo AS responsable_nombre_completo,
  au_responsable.email AS responsable_email,
  t.moneda_iso,
  t.valor_neto,
  t.valor_descuento,
  t.valor_impuestos,
  t.valor_total,
  t.monto_estimado,
  t.notas,
  t.atributos,
  t.tags,
  t.items,
  t.documento_origen_id,
  t.creado_en,
  uc.email AS creado_por_email,
  uc.raw_user_meta_data->>'name' AS creado_por_nombre,
  t.actualizado_en,
  ua.email AS actualizado_por_email,
  ua.raw_user_meta_data->>'name' AS actualizado_por_nombre,
  t.eliminado_en,
  ue.email AS eliminado_por_email,
  ue.raw_user_meta_data->>'name' AS eliminado_por_nombre
FROM tr_doc_comercial t
  LEFT JOIN config_organizaciones org ON org.id = t.organizacion_id
  LEFT JOIN vn_asociados va ON va.id = t.asociado_id
  LEFT JOIN dm_actores daso ON daso.id = va.asociado_id
  LEFT JOIN dm_actores daso1 ON daso1.id = t.solicitante_id
  LEFT JOIN dm_actores daso2 ON daso2.id = t.pagador_id
  LEFT JOIN config_organizacion_miembros m_responsable ON m_responsable.user_id = t.responsable_id
    AND m_responsable.organization_id = t.organizacion_id
    AND m_responsable.eliminado_en IS NULL
  LEFT JOIN auth.users au_responsable ON au_responsable.id = m_responsable.user_id
  LEFT JOIN auth.users uc ON uc.id = t.creado_por
  LEFT JOIN auth.users ua ON ua.id = t.actualizado_por
  LEFT JOIN auth.users ue ON ue.id = t.eliminado_por
WHERE t.eliminado_en IS NULL;
```

**Example Query:**

```sql
-- Get all open opportunities with key relationships
SELECT
  codigo,
  titulo,
  estado,
  organizacion_nombre,
  solicitante_nombre_completo,
  asociado_codigo_completo,
  valor_total
FROM v_doc_comercial_org
WHERE tipo = 'oportunidad'
  AND estado IN ('Nueva', 'En Progreso')
ORDER BY fecha_doc DESC;
```

**Example Output:**

| codigo | titulo | estado | organizacion_nombre | solicitante_nombre_completo | asociado_codigo_completo | valor_total |
|---------|--------|--------|---------------------|----------------------------|---------------------------|-------------|
| DOC-000001 | Venta de acción 1234 | Nueva | Club de Golf | Juan Pérez González | 123800 | 15000000 |
| DOC-000002 | Oferta especial eventos | En Progreso | Club de Golf | Empresa XYZ S.A.S. | 123801 | 8500000 |

---

### `v_tareas_org`

**Purpose:** Provides a complete, denormalized view of tasks (`tr_tareas`) with all related information including organization, related commercial document, related actor, assigned user, and audit details. Filters out soft-deleted records.

**Use Cases:**
- Display task information in UI tables
- Query tasks without manual JOINs
- Show human-readable codes and names instead of UUIDs
- Track audit information with user emails and names
- Filter out soft-deleted records automatically

**Structure:** 35 fields organized logically:

| # | Field | Type | Description |
|---|-------|------|-------------|
| **ID Principal** |
| 1 | `id` | uuid | Task ID (only UUID from main table) |
| **Identificación** |
| 2 | `codigo_tarea` | text | Task code (TAR-XXXXXXXX) |
| 3 | `titulo` | text | Task title |
| 4 | `descripcion` | text | Task description |
| 5 | `prioridad` | enum | Priority: Baja, Media, Alta, Urgente |
| 6 | `estado` | enum | State: Pendiente, En Progreso, Terminada, Pausada, Cancelada |
| 7 | `fecha_vencimiento` | date | Due date |
| **Información de la organización** |
| 8 | `organizacion_slug` | text | Organization slug |
| 9 | `organizacion_nombre` | text | Organization name |
| **Información del documento comercial** |
| 10 | `doc_comercial_id` | uuid | Related commercial document ID |
| 11 | `doc_comercial_codigo` | text | Document code |
| 12 | `doc_comercial_tipo` | enum | Document type |
| 13 | `doc_comercial_sub_tipo` | enum | Document subtype |
| 14 | `doc_comercial_titulo` | text | Document title |
| 15 | `doc_comercial_estado` | enum | Document state |
| **Información del actor relacionado** |
| 16 | `actor_relacionado_id` | uuid | Related actor ID |
| 17 | `actor_relacionado_codigo_bp` | text | Actor BP code |
| 18 | `actor_relacionado_nombre_completo` | text | Actor full name |
| 19 | `actor_relacionado_tipo_actor` | enum | Actor type: persona, empresa |
| **Información del usuario asignado** |
| 20 | `asignado_id` | uuid | Assigned user ID |
| 21 | `asignado_nombre_completo` | text | Assigned user full name |
| 22 | `asignado_email` | text | Assigned user email from auth.users |
| **Campos adicionales** |
| 23 | `tags` | text[] | Search tags |
| **Auditoría** |
| 24 | `creado_en` | timestamptz | Creation timestamp |
| 25 | `creado_por_email` | text | Creator user email |
| 26 | `creado_por_nombre` | text | Creator user name |
| 27 | `actualizado_en` | timestamptz | Last update timestamp |
| 28 | `actualizado_por_email` | text | Updater user email |
| 29 | `actualizado_por_nombre` | text | Updater user name |
| 30 | `eliminado_en` | timestamptz | Soft delete timestamp (filtered in WHERE) |
| 31 | `eliminado_por_email` | text | Deleter user email |
| 32 | `eliminado_por_nombre` | text | Deleter user name |

**Joined Tables:**
- `tr_tareas` (main table)
- `config_organizaciones` (organization information)
- `tr_doc_comercial` (related commercial document information)
- `dm_actores` (related actor information)
- `config_organizacion_miembros` (assigned user information)
- `auth.users` (assigned user email information)
- `auth.users` (audit information: creator, updater, deleter)

**Filter:** `WHERE eliminado_en IS NULL` (excludes soft-deleted records)

**SQL Definition:**

```sql
CREATE VIEW public.v_tareas_org AS
SELECT
  t.id,
  t.codigo_tarea,
  t.titulo,
  t.descripcion,
  t.prioridad,
  t.estado,
  t.fecha_vencimiento,
  t.posicion_orden,
  org.slug AS organizacion_slug,
  org.nombre AS organizacion_nombre,
  t.doc_comercial_id,
  dc.codigo AS doc_comercial_codigo,
  dc.tipo AS doc_comercial_tipo,
  dc.sub_tipo AS doc_comercial_sub_tipo,
  dc.titulo AS doc_comercial_titulo,
  dc.estado AS doc_comercial_estado,
  t.actor_relacionado_id,
  a.codigo_bp AS actor_relacionado_codigo_bp,
  a.nombre_completo AS actor_relacionado_nombre_completo,
  a.tipo_actor AS actor_relacionado_tipo_actor,
  t.asignado_id,
  om.nombre_completo AS asignado_nombre_completo,
  au.email AS asignado_email,
  t.tags,
  t.creado_en,
  uc.email AS creado_por_email,
  uc.raw_user_meta_data->>'name' AS creado_por_nombre,
  t.actualizado_en,
  ua.email AS actualizado_por_email,
  ua.raw_user_meta_data->>'name' AS actualizado_por_nombre,
  t.eliminado_en,
  ue.email AS eliminado_por_email,
  ue.raw_user_meta_data->>'name' AS eliminado_por_nombre
FROM tr_tareas t
  LEFT JOIN config_organizaciones org ON org.id = t.organizacion_id
  LEFT JOIN tr_doc_comercial dc ON dc.id = t.doc_comercial_id AND dc.eliminado_en IS NULL
  LEFT JOIN dm_actores a ON a.id = t.actor_relacionado_id AND a.eliminado_en IS NULL
  LEFT JOIN config_organizacion_miembros om ON om.user_id = t.asignado_id
    AND om.organization_id = t.organizacion_id
    AND om.eliminado_en IS NULL
  LEFT JOIN auth.users au ON au.id = om.user_id
  LEFT JOIN auth.users uc ON uc.id = t.creado_por
  LEFT JOIN auth.users ua ON ua.id = t.actualizado_por
  LEFT JOIN auth.users ue ON ue.id = t.eliminado_por
WHERE t.eliminado_en IS NULL;
```

**Example Query:**

```sql
-- Get all pending tasks with their assignments
SELECT
  codigo_tarea,
  titulo,
  prioridad,
  estado,
  asignado_nombre_completo,
  actor_relacionado_nombre_completo,
  fecha_vencimiento
FROM v_tareas_org
WHERE estado IN ('Pendiente', 'En Progreso')
ORDER BY prioridad DESC, fecha_vencimiento ASC;
```

**Example Output:**

| codigo_tarea | titulo | prioridad | estado | asignado_nombre_completo | actor_relacionado_nombre_completo | fecha_vencimiento |
|--------------|--------|-----------|--------|-------------------------|----------------------------------|-------------------|
| TAR-000001 | Contactar cliente | Alta | Pendiente | Admin Usuario | Juan Pérez González | 2025-01-25 |
| TAR-000002 | Preparar documentación | Media | En Progreso | Admin Usuario | María Rodríguez | 2025-01-28 |

---

### `v_tareas_tiempo_por_estado`

**Purpose:** Provides statistics on how long tasks spend in each state, grouped by organization. Useful for analytics and performance tracking.

**Use Cases:**
- Analyze average time tasks spend in each state
- Identify bottlenecks in workflow
- Track team performance metrics
- Generate SLA reports

**Structure:**

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | `organizacion_id` | uuid | Organization ID |
| 2 | `estado_nuevo` | text | State name (e.g., "Terminada", "En Progreso") |
| 3 | `numero_cambios` | integer | Number of times this state was entered |
| 4 | `avg_horas` | numeric | Average hours spent in this state |
| 5 | `avg_dias` | numeric | Average days spent in this state |
| 6 | `min_horas` | numeric | Minimum hours spent in this state |
| 7 | `max_horas` | numeric | Maximum hours spent in this state |
| 8 | `median_horas` | numeric | Median hours spent in this state |

**SQL Definition:**

```sql
CREATE VIEW v_tareas_tiempo_por_estado AS
SELECT
  h.organizacion_id,
  h.estado_nuevo,
  COUNT(*) as numero_cambios,
  AVG(h.duracion_segundos) / 3600 as avg_horas,
  AVG(h.duracion_segundos) / 86400 as avg_dias,
  MIN(h.duracion_segundos) / 3600 as min_horas,
  MAX(h.duracion_segundos) / 3600 as max_horas,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.duracion_segundos) / 3600 as median_horas
FROM tr_estados_historial h
WHERE h.entidad_tipo = 'tarea'
  AND h.duracion_segundos IS NOT NULL
GROUP BY h.organizacion_id, h.estado_nuevo;
```

**Example Query:**

```sql
-- Get average time per state for an organization
SELECT
  estado_nuevo,
  ROUND(avg_horas::numeric, 2) as avg_horas,
  ROUND(avg_dias::numeric, 2) as avg_dias,
  numero_cambios
FROM v_tareas_tiempo_por_estado
WHERE organizacion_id = 'org-uuid'
ORDER BY avg_dias DESC;
```

---

### `v_doc_comercial_tiempo_por_estado`

**Purpose:** Provides statistics on how long commercial documents spend in each state, grouped by organization. Useful for sales pipeline analysis.

**Use Cases:**
- Analyze sales cycle duration
- Track opportunity conversion time
- Identify slow stages in sales process
- Generate sales performance reports

**Structure:** Same as `v_tareas_tiempo_por_estado`

**SQL Definition:**

```sql
CREATE VIEW v_doc_comercial_tiempo_por_estado AS
SELECT
  h.organizacion_id,
  h.estado_nuevo,
  COUNT(*) as numero_cambios,
  AVG(h.duracion_segundos) / 3600 as avg_horas,
  AVG(h.duracion_segundos) / 86400 as avg_dias,
  MIN(h.duracion_segundos) / 3600 as min_horas,
  MAX(h.duracion_segundos) / 3600 as max_horas,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.duracion_segundos) / 3600 as median_horas
FROM tr_estados_historial h
WHERE h.entidad_tipo = 'doc_comercial'
  AND h.duracion_segundos IS NOT NULL
GROUP BY h.organizacion_id, h.estado_nuevo;
```

---

### `v_tarea_historial_detalle`

**Purpose:** Provides detailed state change history for individual tasks with user information and formatted duration. Ideal for displaying task history in UI.

**Use Cases:**
- Show task history timeline in UI
- Audit trail for task state changes
- Performance analysis per task
- User accountability tracking

**Structure:**

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | `id` | uuid | History record ID |
| 2 | `tarea_id` | uuid | Task ID |
| 3 | `cambio_estado` | text | Formatted change: "Estado Anterior → Estado Nuevo" |
| 4 | `horas_en_estado` | numeric | Hours spent in previous state |
| 5 | `dias_en_estado` | numeric | Days spent in previous state |
| 6 | `cambiado_en` | timestamptz | When the change occurred |
| 7 | `cambiado_por_email` | text | Email of user who made the change |
| 8 | `tarea_titulo` | text | Task title |
| 9 | `codigo_tarea` | text | Task code |

**SQL Definition:**

```sql
CREATE VIEW v_tarea_historial_detalle AS
SELECT
  h.id,
  h.entidad_id as tarea_id,
  h.estado_anterior || ' → ' || h.estado_nuevo as cambio_estado,
  h.duracion_segundos / 3600 as horas_en_estado,
  h.duracion_segundos / 86400 as dias_en_estado,
  h.cambiado_en,
  u.email as cambiado_por_email,
  t.titulo as tarea_titulo,
  t.codigo_tarea
FROM tr_estados_historial h
LEFT JOIN auth.users u ON h.usuario_id = u.id
LEFT JOIN tr_tareas t ON h.entidad_id = t.id
WHERE h.entidad_tipo = 'tarea'
ORDER BY h.cambiado_en DESC;
```

**Example Query:**

```sql
-- Get complete history for a specific task
SELECT
  codigo_tarea,
  tarea_titulo,
  cambio_estado,
  ROUND(horas_en_estado::numeric, 2) as horas,
  ROUND(dias_en_estado::numeric, 2) as dias,
  cambiado_en,
  cambiado_por_email
FROM v_tarea_historial_detalle
WHERE tarea_id = 'tarea-uuid'
ORDER BY cambiado_en;
```

**Example Output:**

| codigo_tarea | tarea_titulo | cambio_estado | horas | dias | cambiado_en | cambiado_por_email |
|--------------|--------------|---------------|-------|------|-------------|---------------------|
| TAR-000001 | Revisar documentación | Pendiente → En Progreso | 24.5 | 1.02 | 2025-01-20 10:00:00 | admin@ejemplo.com |
| TAR-000001 | Revisar documentación | En Progreso → Terminada | 16.0 | 0.67 | 2025-01-26 18:00:00 | admin@ejemplo.com |

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
