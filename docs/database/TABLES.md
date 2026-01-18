# Database Tables Documentation

This document provides a comprehensive overview of all tables in the database, their structure, relationships, and purpose.

## Table of Contents

- [Public Schema Tables](#public-schema)
- [Auth Schema Tables](#auth-schema)
- [Storage Schema Tables](#storage-schema)

---

## Public Schema

### Configuration Tables (`config_*`)

#### `config_organizaciones`

**Purpose:** Implements multi-tenancy and hierarchical organization structure.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique identifier of the organization |
| `nombre` | text | NOT NULL | Legal or descriptive name of the organization |
| `slug` | text | UNIQUE | Unique identifier for URLs and quick selection |
| `tipo` | enum | Default: 'club' | Classification: club, asociacion, federacion, fundacion, otro |
| `organizacion_padre_id` | uuid | FK → `config_organizaciones.id` | Reference to parent organization in hierarchy |
| `email` | text | Nullable, Email validation | Institutional email of the organization |
| `telefono` | text | Nullable | Main contact phone |
| `website` | text | Nullable | Official website |
| `direccion` | jsonb | Default: '{}' | JSONB object with country, city, address_linea1, etc. |
| `configuracion` | jsonb | Default: '{}' | Technical and functional configuration (JSONB) |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | User who created the record |
| `actualizado_por` | uuid | FK → `auth.users.id` | User who last updated the record |
| `eliminado_por` | uuid | FK → `auth.users.id` | User who soft deleted the record |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |

**Enums:**
- `config_organizacion_tipo`: 'club', 'asociacion', 'federacion', 'fundacion', 'otro'

**RLS:** Enabled
**Row Count:** 1

---

#### `config_organizacion_miembros`

**Purpose:** Manages organization members and their roles.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `user_id` | uuid | PK, FK → `auth.users.id` | User identifier |
| `organization_id` | uuid | PK, FK → `config_organizaciones.id` | Organization identifier |
| `role` | text | NOT NULL | User role within the organization |
| `created_at` | timestamptz | Default: `now()` | Creation timestamp |
| `created_by` | uuid | FK → `auth.users.id` | User who created the membership |
| `atributos` | jsonb | Default: '{"ui": {"theme": "system"}}' | User preferences (UI theme, etc.) |
| `nombres` | text | Nullable | Member's first names |
| `apellidos` | text | Nullable | Member's last names |
| `telefono` | text | Nullable | Contact phone number |
| `cargo` | text | Nullable | Job title |
| `nombre_completo` | text | Nullable | Full name (calculated in application) |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | User who soft deleted |
| `creado_en` | timestamptz | Default: `now()` | Membership creation timestamp |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | User who created membership |
| `actualizado_por` | uuid | FK → `auth.users.id` | User who updated membership |

**Primary Key:** (`user_id`, `organization_id`)
**RLS:** Enabled
**Row Count:** 1

---

#### `config_roles`

**Purpose:** Defines available roles in the system.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `role` | text | PK | Role name/identifier |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | User who soft deleted |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | User who created the role |
| `actualizado_por` | uuid | FK → `auth.users.id` | User who updated the role |

**RLS:** Enabled
**Row Count:** 4

**Roles:** owner, admin, analyst, auditor

---

#### `config_roles_permisos`

**Purpose:** Defines permissions for each role on resources and actions.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `role` | text | PK, FK → `config_roles.role` | Role name |
| `resource` | text | PK | Resource being accessed |
| `action` | text | PK | Action being performed |
| `allow` | boolean | Default: `true` | Whether to allow the action |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | User who soft deleted |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | User who created permission |
| `actualizado_por` | uuid | FK → `auth.users.id` | User who updated permission |

**Primary Key:** (`role`, `resource`, `action`)
**RLS:** Enabled
**Row Count:** 92

**Note:** Only owners have access to `config_*` tables. Admin/Analyst/Auditor only access business tables (`dm_*`, `tr_*`, `vn_*`).

---

#### `config_ciudades`

**Purpose:** Geographic catalog of cities and locations.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique city identifier |
| `country_code` | text | NOT NULL | ISO country code |
| `country_name` | text | NOT NULL | Country name |
| `state_name` | text | NOT NULL | State/province name |
| `city_name` | text | NOT NULL | City name |
| `city_code` | text | Nullable | City code |
| `search_text` | text | NOT NULL | Search-friendly text |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | User who soft deleted |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | User who created record |
| `actualizado_por` | uuid | FK → `auth.users.id` | User who updated record |

**RLS:** Enabled
**Row Count:** 1367

---

### Master Data Tables (`dm_*`)

#### `dm_actores`

**Purpose:** Base entity for Business Partners implementing Class Table Inheritance (CTI). Supports both persons and companies.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Shared business identifier |
| `codigo_bp` | text | UNIQUE, Auto: `ACT-XXXXXXXX` | Unique auto-generated code |
| `organizacion_id` | uuid | FK → `config_organizaciones.id` | Organization ID |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | Creator user ID |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `actualizado_por` | uuid | FK → `auth.users.id` | Updater user ID |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | Deleter user ID |
| **Identity** | | | |
| `tipo_actor` | enum | Default: 'persona' | Actor type: persona, empresa |
| `nat_fiscal` | enum | Nullable | Fiscal nature: natural, jurídica |
| `tipo_documento` | enum | Nullable | Document type: CC, CE, PA, TI, RC, PEP, PPT, NIT |
| `regimen_tributario` | enum | Nullable | Tax regime |
| `num_documento` | text | Nullable | Identification number |
| `digito_verificacion` | smallint | Nullable | Verification digit for NITs |
| `email_facturacion` | text | Nullable, Email validation | Billing email |
| **Company Data** | | | |
| `razon_social` | text | Nullable | Legal name for companies |
| `nombre_comercial` | text | Nullable | Trade/brand name |
| **Person Data** | | | |
| `primer_nombre` | text | Nullable | First name |
| `segundo_nombre` | text | Nullable | Second name |
| `primer_apellido` | text | Nullable | First surname |
| `segundo_apellido` | text | Nullable | Second surname |
| **Contact** | | | |
| `email_principal` | text | Nullable, Email validation | Primary email |
| `email_secundario` | text | Nullable, Email validation | Secondary email |
| `telefono_principal` | text | Nullable, Phone regex | Main phone |
| `telefono_secundario` | text | Nullable, Phone regex | Secondary phone |
| `direccion_fisica` | text | Nullable | Physical address |
| `ciudad_id` | uuid | FK → `config_ciudades.id` | City reference |
| **Classifications** | | | |
| `es_socio` | boolean | Default: `false` | Is a partner/member |
| `es_cliente` | boolean | Default: `false` | Is a customer |
| `es_proveedor` | boolean | Default: `false` | Is a supplier |
| `estado_actor` | enum | Default: 'activo' | Status: activo, inactivo, bloqueado |
| **Person Attributes** | | | |
| `genero_actor` | enum | Nullable | Gender: masculino, femenino, otro, no aplica |
| `fecha_nacimiento` | date | Nullable | Birth date |
| `estado_civil` | enum | Nullable | Civil status |
| **Profiles (JSONB)** | | | |
| `perfil_identidad` | jsonb | Default: '{}' | Identity info (expedition dates, nationality) |
| `perfil_profesional_corporativo` | jsonb | Default: '{}' | Professional/corporate data |
| `perfil_salud` | jsonb | Default: '{}' | Health and safety information |
| `perfil_contacto` | jsonb | Default: '{}' | Emergency and administrative contacts |
| `perfil_intereses` | jsonb | Default: '{}' | Interests and preferences |
| `perfil_preferencias` | jsonb | Default: '{}' | Service preferences |
| `perfil_redes` | jsonb | Default: '{}' | Social media and digital presence |
| `perfil_compliance` | jsonb | Default: '{}' | Compliance and risk assessment |
| `perfil_referencias` | jsonb | Default: '{}' | References and validations |
| **Other** | | | |
| `tags` | text[] | Nullable | Search tags |
| `nombre_completo` | text | Generated | Computed full name |

**Enums:**
- `tipo_actor_enum`: 'persona', 'empresa'
- `dm_actor_naturaleza_fiscal`: 'natural', 'jurídica'
- `dm_actor_tipo_documento`: 'CC', 'CE', 'PA', 'TI', 'RC', 'PEP', 'PPT', 'NIT'
- `dm_actor_regimen_tributario`: 'responsable de iva', 'no responsable de iva', 'regimen simple tributacion', 'gran contribuyente', 'no sujeta a impuesto'
- `dm_actor_estado`: 'activo', 'inactivo', 'bloqueado'
- `dm_actor_genero`: 'masculino', 'femenino', 'otro', 'no aplica'
- `dm_actor_estado_civil`: 'soltero', 'casado', 'union libre', 'divorciado', 'viudo'

**RLS:** Enabled
**Row Count:** 17

**Relationships:**
- Referenced by: `vn_relaciones_actores` (bp_origen_id, bp_destino_id)
- Referenced by: `vn_asociados` (asociado_id)
- Referenced by: `tr_tareas` (actor_relacionado_id)
- Referenced by: `tr_doc_comercial` (solicitante_id, pagador_id)

---

#### `dm_acciones`

**Purpose:** Master table for club shares/shares (financial titles). Does not contain owner information directly.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique identifier |
| `organizacion_id` | uuid | FK → `config_organizaciones.id` | Organization ID |
| `codigo_accion` | text | UNIQUE, 4 digits | Unique 4-digit numeric code |
| `estado` | enum | Default: 'disponible' | Status: disponible, asignada, arrendada, bloqueada, inactiva |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | Creator user ID |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `actualizado_por` | uuid | FK → `auth.users.id` | Updater user ID |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | Deleter user ID |

**Enums:**
- `dm_accion_estado`: 'disponible', 'asignada', 'arrendada', 'bloqueada', 'inactiva'

**RLS:** Enabled
**Row Count:** 25

**Relationships:**
- Referenced by: `vn_asociados` (accion_id)

---

### Relationship Tables (`vn_*`)

#### `vn_relaciones_actores`

**Purpose:** Manages relationships (laboral, family, commercial) between business partners.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique identifier |
| `organizacion_id` | uuid | FK → `config_organizaciones.id` | Organization ID |
| `bp_origen_id` | uuid | FK → `dm_actores.id` | Origin actor (Child, Employee, etc.) |
| `bp_destino_id` | uuid | FK → `dm_actores.id` | Destination actor (Parent, Company, etc.) |
| `tipo_relacion` | enum | NOT NULL | Type: familiar, laboral, referencia, membresía, comercial, otra |
| `rol_origen` | enum | NOT NULL | Origin role: cónyuge, padre, madre, hijo/a, suegro, suegra, hermano/a, otro, yerno, nuera |
| `rol_destino` | enum | NOT NULL | Destination role (same enum as rol_origen) |
| `atributos` | jsonb | Default: '{}' | Additional attributes |
| `fecha_inicio` | date | Nullable | Relationship start date |
| `fecha_fin` | date | Nullable | Relationship end date |
| `es_actual` | boolean | Generated | Computed: true if fecha_fin IS NULL |
| `es_bidireccional` | boolean | Default: `false` | Query from both directions |
| `notas` | text | Nullable | Notes |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | Creator user ID |
| `actualizado_por` | uuid | FK → `auth.users.id` | Updater user ID |
| `eliminado_por` | uuid | FK → `auth.users.id` | Deleter user ID |

**Enums:**
- `dm_actores_tipo_relacion`: 'familiar', 'laboral', 'referencia', 'membresía', 'comercial', 'otra'
- `vn_relacion_actores_rol`: 'cónyuge', 'padre', 'madre', 'hijo/a', 'suegro', 'suegra', 'hermano/a', 'otro', 'yerno', 'nuera'

**RLS:** Enabled
**Row Count:** 1

---

#### `vn_asociados`

**Purpose:** Assignments of shares to business partners with temporal history. Supports owners, holders, and beneficiaries.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique assignment identifier |
| `accion_id` | uuid | FK → `dm_acciones.id` | Share (title) reference |
| `asociado_id` | uuid | FK → `dm_actores.id` | Business partner reference |
| `subcodigo` | text | 2 digits | Subcode: 00=owner, 01=holder, 02+=beneficiaries |
| `codigo_completo` | text | NOT NULL | Full code: codigo_accion + subcode (e.g., 439801) |
| `fecha_inicio` | date | Default: `CURRENT_DATE` | Start date |
| `fecha_fin` | date | Nullable | End date (NULL = active) |
| `es_vigente` | boolean | Generated | Computed: true if fecha_fin IS NULL |
| `organizacion_id` | uuid | FK → `config_organizaciones.id` | Organization ID |
| `notas` | text | Nullable | Notes |
| `atributos` | jsonb | Default: '{}' | Custom metadata |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | Creator user ID |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `actualizado_por` | uuid | FK → `auth.users.id` | Updater user ID |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | Deleter user ID |
| `tipo_vinculo` | enum | Nullable | Link type: propietario, titular, beneficiario, intermediario |
| `modalidad` | enum | Nullable | Modality: propiedad, comodato, asignacion_corp, convenio |
| `plan_comercial` | enum | Nullable | Plan: regular, plan dorado, joven ejecutivo, honorifico |
| `asignacion_padre_id` | uuid | FK → `vn_asociados.id` | Parent assignment ID |

**Enums:**
- `vn_asociados_tipo_vinculo`: 'propietario', 'titular', 'beneficiario', 'intermediario'
- `vn_asociados_modalidad`: 'propiedad', 'comodato', 'asignacion_corp', 'convenio'
- `vn_asociados_plan_comercial`: 'regular', 'plan dorado', 'joven ejecutivo', 'honorifico'

**RLS:** Enabled
**Row Count:** 1

**Relationships:**
- Referenced by: `tr_doc_comercial` (asociado_id)

---

### Transaction Tables (`tr_*`)

#### `tr_doc_comercial`

**Purpose:** Commercial opportunities and documents (sales opportunities, offers, sales orders, reservations).

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique identifier |
| `codigo` | text | UNIQUE, Auto: `DOC-XXXXXXXX` | Auto-generated code |
| **Identity & Classification** | | | |
| `tipo` | enum | Default: 'oportunidad' | Type: oportunidad, oferta, pedido_venta, reserva |
| `sub_tipo` | enum | Nullable | Subtype: sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos |
| `estado` | enum | Default: 'Nueva' | State: Nueva, En Progreso, Ganada, Pérdida, Descartada |
| `titulo` | text | Nullable | Document title |
| `fecha_doc` | date | Default: `CURRENT_DATE` | Document date |
| `fecha_venc_doc` | date | Nullable | Due date |
| **Actors & Responsibilities** | | | |
| `organizacion_id` | uuid | FK → `config_organizaciones.id` | Organization ID |
| `asociado_id` | uuid | FK → `vn_asociados.id` | Associated member ID |
| `solicitante_id` | uuid | FK → `dm_actores.id` | Applicant ID |
| `pagador_id` | uuid | FK → `dm_actores.id` | Payer ID |
| `responsable_id` | uuid | FK → `auth.users.id` | Responsible user ID |
| **Financial Content** | | | |
| `items` | jsonb | Default: '[]' | Line items (JSONB persistence) |
| `moneda_iso` | enum | Default: 'COP' | Currency ISO code |
| `valor_neto` | numeric | Default: `0` | Subtotal before taxes/discounts |
| `valor_descuento` | numeric | Default: `0` | Total discounts |
| `valor_impuestos` | numeric | Default: `0` | Total taxes |
| `valor_total` | numeric | Default: `0` | Final amount |
| `monto_estimado` | numeric | Nullable | Estimated amount (legacy) |
| **Context & Extensions** | | | |
| `documento_origen_id` | uuid | FK → `tr_doc_comercial.id` | Source document ID (self-reference) |
| `notas` | text | Nullable | Notes |
| `tags` | text[] | Default: `ARRAY[]::text[]` | Tags |
| `atributos` | jsonb | Default: '{}' | Custom attributes |
| **Audit** | | | |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | Creator user ID |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `actualizado_por` | uuid | FK → `auth.users.id` | Updater user ID |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | Deleter user ID |

**Enums:**
- `tr_doc_comercial_tipo`: 'oportunidad', 'oferta', 'pedido_venta', 'reserva'
- `tr_doc_comercial_subtipo`: 'sol_ingreso', 'sol_retiro', 'oferta_eventos', 'pedido_eventos'
- `tr_doc_comercial_estados`: 'Nueva', 'En Progreso', 'Ganada', 'Pérdida', 'Descartada'
- `config_moneda`: 'COP', 'MXN', 'ARS', 'BRL', 'CLP', 'PEN', 'USD', 'EUR', 'GBP', 'CAD', 'JPY', 'CHF', 'AUD', 'NZD', 'CNY', 'INR', 'KRW', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'PLN', 'TRY', 'ZAR', 'RUB', 'AED', 'SAR', 'ILS', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'MYR', 'THB', 'IDR', 'PHP', 'VND', 'TWD', 'ISK'

**RLS:** Enabled
**Row Count:** 24

**Logical Structure:**
1. **Identity & Classification**: id, codigo, tipo, estado, fecha_doc, fecha_venc_doc
2. **Actors & Responsibilities**: organizacion_id, asociado_id, solicitante_id, pagador_id, responsable_id
3. **Financial Content**: items, moneda_iso, valor_neto, valor_descuento, valor_impuestos, valor_total
4. **Context & Extensions**: documento_origen_id, notas, tags, atributos, monto_estimado
5. **Audit & Control**: creado_en, creado_por, actualizado_en, actualizado_por, eliminado_en, eliminado_por

---

#### `tr_tareas`

**Purpose:** Task management with assignments and relationships to opportunities.

**Columns:**

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | uuid | PK, Default: `gen_random_uuid()` | Unique identifier |
| `titulo` | text | NOT NULL | Task title |
| `descripcion` | text | Nullable | Task description |
| `prioridad` | enum | Default: 'Media' | Priority: Baja, Media, Alta, Urgente |
| `estado` | enum | Default: 'Pendiente' | State: Pendiente, En Progreso, Terminada, Pausada, Cancelada |
| `fecha_vencimiento` | date | Nullable | Due date |
| `doc_comercial_id` | uuid | FK → `tr_doc_comercial.id` | Related opportunity ID |
| `asignado_id` | uuid | FK → `auth.users.id` | Assigned user ID |
| `organizacion_id` | uuid | FK → `config_organizaciones.id` | Organization ID |
| `actor_relacionado_id` | uuid | FK → `dm_actores.id` | Related actor ID |
| `tags` | text[] | Default: `ARRAY[]::text[]` | Tags |
| `codigo_tarea` | text | UNIQUE, Auto: `TAR-XXXXXXXX` | Auto-generated task code |
| `creado_en` | timestamptz | Default: `now()` | Creation timestamp |
| `creado_por` | uuid | FK → `auth.users.id` | Creator user ID |
| `actualizado_en` | timestamptz | Default: `now()` | Last update timestamp |
| `actualizado_por` | uuid | FK → `auth.users.id` | Updater user ID |
| `eliminado_en` | timestamptz | Nullable | Soft delete timestamp |
| `eliminado_por` | uuid | FK → `auth.users.id` | Deleter user ID |

**Enums:**
- `tr_tareas_prioridad`: 'Baja', 'Media', 'Alta', 'Urgente'
- `tr_tareas_estado`: 'Pendiente', 'En Progreso', 'Terminada', 'Pausada', 'Cancelada'

**RLS:** Enabled
**Row Count:** 36

---

## Auth Schema

### Core Tables

#### `auth.users`

**Purpose:** Stores user login data within a secure schema.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK, User identifier |
| `email` | varchar | User email |
| `encrypted_password` | varchar | Encrypted password |
| `email_confirmed_at` | timestamptz | Email confirmation timestamp |
| `phone` | text | Phone number (unique) |
| `phone_confirmed_at` | timestamptz | Phone confirmation timestamp |
| `last_sign_in_at` | timestamptz | Last login timestamp |
| `raw_app_meta_data` | jsonb | Application metadata |
| `raw_user_meta_data` | jsonb | User metadata |
| `is_super_admin` | boolean | Super admin flag |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |
| `deleted_at` | timestamptz | Soft delete timestamp |
| `is_anonymous` | boolean | Anonymous user flag |
| `is_sso_user` | boolean | SSO account flag |

**RLS:** Enabled
**Row Count:** 2

**Relationships:** Referenced by all public schema tables with audit fields (`creado_por`, `actualizado_por`, `eliminado_por`).

---

#### `auth.identities`

**Purpose:** Stores identities associated to a user (OAuth, SSO, etc.).

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `provider_id` | text | Provider-specific user ID |
| `user_id` | uuid | FK → `auth.users.id` |
| `identity_data` | jsonb | Provider identity data |
| `provider` | text | Provider name |
| `last_sign_in_at` | timestamptz | Last sign in timestamp |
| `email` | text | Generated from identity_data |

**RLS:** Enabled
**Row Count:** 2

---

#### `auth.sessions`

**Purpose:** Stores session data associated to a user.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users.id` |
| `factor_id` | uuid | MFA factor ID |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |
| `not_after` | timestamptz | Session expiration |
| `aal` | aal_level | Authentication assurance level |
| `user_agent` | text | User agent string |
| `ip` | inet | IP address |

**RLS:** Enabled
**Row Count:** 94

---

#### `auth.refresh_tokens`

**Purpose:** Store of tokens used to refresh JWT tokens once they expire.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | PK |
| `token` | varchar | UNIQUE |
| `user_id` | varchar | User reference |
| `session_id` | uuid | FK → `auth.sessions.id` |
| `revoked` | boolean | Revocation status |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |

**RLS:** Enabled
**Row Count:** 300

---

### MFA Tables

#### `auth.mfa_factors`

**Purpose:** Stores metadata about multi-factor authentication factors.

**Enums:**
- `factor_type`: 'totp', 'webauthn', 'phone'
- `factor_status`: 'unverified', 'verified'

---

#### `auth.mfa_challenges`

**Purpose:** Stores metadata about challenge requests made.

---

### SSO Tables

#### `auth.sso_providers`

**Purpose:** Manages SSO identity provider information.

---

#### `auth.sso_domains`

**Purpose:** Manages SSO email address domain mapping to providers.

---

#### `auth.saml_providers`

**Purpose:** Manages SAML Identity Provider connections.

---

### OAuth Tables

#### `auth.oauth_clients`

**Purpose:** OAuth client configuration.

**Enums:**
- `oauth_registration_type`: 'dynamic', 'manual'
- `oauth_client_type`: 'public', 'confidential'

---

#### `auth.oauth_authorizations`

**Purpose:** OAuth authorization codes.

**Enums:**
- `oauth_response_type`: 'code'
- `oauth_authorization_status`: 'pending', 'approved', 'denied', 'expired'

---

#### `auth.oauth_consents`

**Purpose:** OAuth consent grants.

---

### Other Auth Tables

#### `auth.instances`
Manages users across multiple sites.

#### `auth.flow_state`
Stores metadata for PKCE logins.

#### `auth.one_time_tokens`
Stores one-time tokens for email/phone changes, password recovery, etc.

---

## Storage Schema

### Core Storage Tables

#### `storage.buckets`

**Purpose:** Storage buckets configuration.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | PK |
| `name` | text | Bucket name |
| `public` | boolean | Public access flag |
| `file_size_limit` | bigint | Max file size |
| `allowed_mime_types` | text[] | Allowed MIME types |
| `owner_id` | text | Bucket owner |
| `type` | buckettype | Type: STANDARD, ANALYTICS, VECTOR |

**Enums:**
- `buckettype`: 'STANDARD', 'ANALYTICS', 'VECTOR'

**RLS:** Enabled
**Row Count:** 0

---

#### `storage.objects`

**Purpose:** Storage objects (files) metadata.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `bucket_id` | text | FK → `storage.buckets.id` |
| `name` | text | Object path/name |
| `metadata` | jsonb | Object metadata |
| `owner_id` | text | Object owner |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Update timestamp |
| `last_accessed_at` | timestamptz | Last access timestamp |

**RLS:** Enabled
**Row Count:** 0

---

#### `storage.migrations`

**Purpose:** Storage schema migrations.

**Row Count:** 50

---

### Multipart Upload Tables

#### `storage.s3_multipart_uploads`

**Purpose:** Manages multipart uploads for large files.

---

#### `storage.s3_multipart_uploads_parts`

**Purpose:** Parts of multipart uploads.

---

### Other Storage Tables

#### `storage.prefixes`
Folder prefixes for organization.

#### `storage.buckets_analytics`
Analytics bucket configuration.

#### `storage.buckets_vectors`
Vector bucket configuration.

#### `storage.vector_indexes`
Vector index configuration.

---

## Migrations

Total migrations: **72**

Latest migration: `20260115185337` - "add_tags_to_dm_actores"

Key migration groups:
- Initial schema setup
- Business partner (dm_actores) creation
- Actions (dm_acciones) and assignments (vn_asociados)
- Commercial documents (tr_doc_comercial)
- Tasks (tr_tareas)
- Relationships (vn_relaciones_actores)
- Organization management
- Role-based access control
- Soft delete implementation
- Audit triggers

---

## Common Patterns

### Audit Fields

Most tables in the public schema include these audit fields:

| Field | Type | Description |
|-------|------|-------------|
| `creado_en` | timestamptz | Creation timestamp |
| `creado_por` | uuid → `auth.users.id` | Creator user |
| `actualizado_en` | timestamptz | Last update timestamp |
| `actualizado_por` | uuid → `auth.users.id` | Last updater user |
| `eliminado_en` | timestamptz | Soft delete timestamp |
| `eliminado_por` | uuid → `auth.users.id` | Deleter user |

### Naming Conventions

- **config_**: Configuration/reference tables (roles, permissions, organizations, cities)
- **dm_**: Master data/domain model tables (actors, actions)
- **vn_**: Relationship/assignment tables (relaciones, asociados)
- **tr_**: Transaction tables (doc_comercial, tareas)

### Soft Delete

All main business tables implement soft delete using `eliminado_en` timestamp. Records with non-null `eliminado_en` are filtered out by default.

### Multi-Tenancy

All business tables include `organizacion_id` for data isolation between organizations.

---

## RLS Policies

Row Level Security is enabled on all tables. Policies restrict access based on:
1. Organization membership (`config_organizacion_miembros`)
2. User role (`config_roles_permisos`)
3. Data ownership (organization_id, creado_por)

Only table owners can modify `config_*` tables.
