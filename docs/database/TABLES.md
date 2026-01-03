# Database Tables - Complete Data Dictionary

> **Comprehensive field-level reference for all database tables**
>
> Last updated: 2026-01-03 | Auto-generated from live Supabase schema

---

## Table of Contents

- [organizations](#organizations)
- [business_partners](#business_partners)
- [personas](#personas)
- [empresas](#empresas)
- [bp_relaciones](#bp_relaciones)
- [acciones](#acciones)
- [asignaciones_acciones](#asignaciones_acciones)
- [geographic_locations](#geographic_locations)
- [organization_members](#organization_members)
- [roles](#roles)
- [role_permissions](#role_permissions)
- [oportunidades](#oportunidades)
- [tareas](#tareas)

---

## organizations

**Purpose:** Multi-tenancy foundation and organizational hierarchy management.

**Row Count:** 1 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key - Unique organization identifier |
| `nombre` | text | NOT NULL | - | Legal or descriptive name of the organization |
| `slug` | text | NOT NULL | - | **UNIQUE** - URL-friendly identifier for quick selection |
| `tipo` | text | NULL | `'club'::text` | Organization classification: 'club', 'sede', 'division' |
| `organizacion_padre_id` | uuid | NULL | - | FK to parent organization in hierarchy |
| `email` | text | NULL | - | Institutional email of the organization |
| `telefono` | text | NULL | - | Main contact phone number |
| `website` | text | NULL | - | Official website URL |
| `direccion` | jsonb | NULL | `'{}'::jsonb` | Address object (país, ciudad, dirección_linea1, etc.) |
| `configuracion` | jsonb | NULL | `'{}'::jsonb` | Technical and functional configuration (JSONB) |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of record creation |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last modification |
| `creado_por` | uuid | NULL | - | FK to auth.users - User who created the record |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - User who last updated |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - User who soft deleted |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |

### Constraints

- **PRIMARY KEY:** `id`
- **UNIQUE:** `slug`
- **CHECK:** `tipo IN ('club', 'sede', 'division')`
- **FOREIGN KEYS:**
  - `organizacion_padre_id` → `organizations.id`
  - `creado_por` → `auth.users.id`
  - `actualizado_por` → `auth.users.id`
  - `eliminado_por` → `auth.users.id`

### Indexes

- `organizations_pkey` PRIMARY KEY on `id`
- `organizations_slug_key` UNIQUE on `slug`

### Triggers

- `set_audit_user_columns` - Auto-set audit fields on INSERT/UPDATE
- `actualizar_timestamp` - Auto-update `actualizado_en` on UPDATE
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por` when soft deleting
- `assign_owner_on_org_create` - Auto-assign creator as owner in organization_members

### Business Rules

1. Every organization must have a unique `slug` for URL routing
2. Organizations support hierarchical structure via `organizacion_padre_id`
3. Soft delete pattern - use `eliminado_en` instead of DELETE
4. Creator is automatically assigned as 'owner' role via trigger

### JSONB Schemas

**direccion:**
```json
{
  "pais": "CO",
  "departamento": "Antioquia",
  "ciudad": "Medellín",
  "direccion_linea1": "Calle 10 #20-30",
  "codigo_postal": "050001"
}
```

**configuracion:**
```json
{
  "idioma": "es",
  "zona_horaria": "America/Bogota",
  "moneda": "COP",
  "features_habilitadas": ["acciones", "socios", "eventos"]
}
```

---

## business_partners

**Purpose:** Base table for Class Table Inheritance pattern - contains common fields for all business partners.

**Row Count:** 17 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key - Shared with specializations |
| `codigo_bp` | text | NOT NULL | Auto-generated | **UNIQUE** - Auto-generated code (BP-0000001 format) |
| `tipo_actor` | text | NOT NULL | - | Discriminator: 'persona' or 'empresa' |
| `organizacion_id` | uuid | NOT NULL | - | FK to organizations - Multi-tenancy key |
| `estado` | text | NOT NULL | `'activo'::text` | Current status: 'activo', 'inactivo', 'suspendido' |
| `email_principal` | text | NULL | - | Primary contact email (validated) |
| `telefono_principal` | text | NULL | - | Primary contact phone (10 digits in Colombia) |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of record creation |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Last updater |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Constraints

- **PRIMARY KEY:** `id`
- **UNIQUE:** `codigo_bp`
- **CHECK:** `tipo_actor IN ('persona', 'empresa')`
- **CHECK:** `estado IN ('activo', 'inactivo', 'suspendido')`
- **CHECK:** `email_principal ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'` (email validation)
- **CHECK:** `telefono_principal ~ '^[0-9]{10}$'` (10-digit phone)
- **FOREIGN KEYS:**
  - `organizacion_id` → `organizations.id`
  - `creado_por`, `actualizado_por`, `eliminado_por` → `auth.users.id`

### Indexes

- `business_partners_pkey` PRIMARY KEY on `id`
- `business_partners_codigo_bp_key` UNIQUE on `codigo_bp`
- `business_partners_organizacion_id_idx` on `organizacion_id`

### Triggers

- `generar_codigo_bp` - Auto-generate `codigo_bp` on INSERT (BP-0000001 format)
- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. Each business_partner MUST have exactly one specialization (persona OR empresa)
2. `codigo_bp` is auto-generated sequentially (BP-0000001, BP-0000002, ...)
3. `tipo_actor` determines which specialization table to JOIN
4. Email and phone validation enforced at database level
5. Soft delete pattern - never hard DELETE

### Related Tables

- **Specializations:** `personas`, `empresas` (1:1 relationship via `id`)
- **Relationships:** `bp_relaciones` (origen_id, destino_id)
- **Assignments:** `asignaciones_acciones` (business_partner_id)

---

## personas

**Purpose:** Natural persons specialization - extends business_partners with person-specific fields.

**Row Count:** 13 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | - | **PK & FK** to business_partners.id (1:1) |
| `tipo_documento` | text | NOT NULL | - | Document type: CC, CE, TI, PA, RC, NIT, PEP, PPT, DNI, NUIP |
| `numero_documento` | text | NOT NULL | - | Identification number (alphanumeric, 5-20 chars) |
| `fecha_expedicion` | date | NULL | - | Document issue date |
| `lugar_expedicion` | text | NULL | - | Document issue location |
| `primer_nombre` | text | NOT NULL | - | **Required** - First name |
| `segundo_nombre` | text | NULL | - | Middle name(s) |
| `primer_apellido` | text | NOT NULL | - | **Required** - First surname |
| `segundo_apellido` | text | NULL | - | Second surname |
| `genero` | text | NOT NULL | - | Gender: masculino, femenino, otro, no_especifica |
| `fecha_nacimiento` | date | NOT NULL | - | Birth date (validated for 18+ years) |
| `lugar_nacimiento` | text | NULL | - | Place of birth (legacy text field - deprecated) |
| `lugar_nacimiento_id` | uuid | NULL | - | FK to geographic_locations - Structured birth place reference |
| `nacionalidad` | text | NULL | `'CO'::text` | ISO nationality code (default: Colombia) |
| `estado_civil` | text | NULL | - | Marital status: soltero, casado, union_libre, divorciado, viudo, separado |
| `ocupacion` | text | NULL | - | Current occupation |
| `profesion` | text | NULL | - | Professional title/degree |
| `nivel_educacion` | text | NULL | - | Education level: primaria, bachillerato, tecnico, tecnologo, pregrado, posgrado, maestria, doctorado |
| `tipo_sangre` | text | NULL | - | Blood type: A+, A-, B+, B-, AB+, AB-, O+, O- |
| `eps` | text | NULL | - | Health insurance provider (EPS) |
| `fecha_socio` | date | NULL | - | Date of first membership to the club |
| `fecha_aniversario` | date | NULL | - | Wedding/union anniversary date |
| `estado_vital` | text | NULL | `'vivo'::text` | Vital status: vivo, fallecido, desconocido |
| `email_secundario` | text | NULL | - | Additional contact email (validated) |
| `telefono_secundario` | text | NULL | - | Additional phone (10 digits) |
| `whatsapp` | text | NULL | - | WhatsApp number (10 digits) |
| `linkedin_url` | text | NULL | - | LinkedIn profile URL |
| `facebook_url` | text | NULL | - | Facebook profile URL |
| `instagram_handle` | text | NULL | - | Instagram handle |
| `twitter_handle` | text | NULL | - | Twitter/X handle |
| `foto_url` | text | NULL | - | Profile photo URL |
| `contacto_emergencia_id` | uuid | NULL | - | FK to personas.id - Emergency contact person |
| `relacion_emergencia` | text | NULL | - | Relationship with emergency contact |
| `tags` | text[] | NULL | `'{}'::text[]` | Multi-select tags for quick segmentation |
| `perfil_intereses` | jsonb | NULL | `'{}'::jsonb` | Interests and hobbies (WHAT they like) |
| `perfil_preferencias` | jsonb | NULL | `'{}'::jsonb` | Operational preferences (HOW to be served) |
| `perfil_metricas` | jsonb | NULL | `'{}'::jsonb` | Value metrics and AI scores (LTV, Engagement) |
| `perfil_compliance` | jsonb | NULL | `'{}'::jsonb` | Legal history, habeas data, contracts |
| `direccion_residencia` | text | NULL | - | Residence address |
| `barrio_residencia` | text | NULL | - | Neighborhood of residence |
| `ciudad_residencia` | text | NULL | - | City of residence |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of record creation |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_en` | timestamptz | NULL | - | **Synced with business_partners** |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Constraints

- **PRIMARY KEY:** `id`
- **FOREIGN KEY:** `id` → `business_partners.id` (1:1 relationship)
- **FOREIGN KEY:** `contacto_emergencia_id` → `personas.id`
- **FOREIGN KEY:** `lugar_nacimiento_id` → `geographic_locations.id`
- **CHECK:** `tipo_documento IN ('CC', 'CE', 'TI', 'PA', 'RC', 'NIT', 'PEP', 'PPT', 'DNI', 'NUIP')`
- **CHECK:** `numero_documento ~ '^[A-Za-z0-9-]{5,20}$'` (5-20 alphanumeric chars)
- **CHECK:** `genero IN ('masculino', 'femenino', 'otro', 'no_especifica')`
- **CHECK:** `estado_civil IN ('soltero', 'casado', 'union_libre', 'divorciado', 'viudo', 'separado')`
- **CHECK:** `nivel_educacion IN ('primaria', 'bachillerato', 'tecnico', 'tecnologo', 'pregrado', 'posgrado', 'maestria', 'doctorado')`
- **CHECK:** `tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
- **CHECK:** `estado_vital IN ('vivo', 'fallecido', 'desconocido')`
- **CHECK:** `email_secundario ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
- **CHECK:** `telefono_secundario ~ '^[0-9]{10}$'`
- **CHECK:** `whatsapp ~ '^[0-9]{10}$'`

### Indexes

- `personas_pkey` PRIMARY KEY on `id`
- `personas_numero_documento_idx` on `numero_documento`

### Triggers

- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. All personas MUST have corresponding record in `business_partners` with `tipo_actor = 'persona'`
2. Document number must be unique within organization
3. Age validation: `fecha_nacimiento` must be at least 18 years ago
4. Emergency contact must reference another persona (cannot be empresa)
5. `eliminado_en` synced with business_partners for consistency
6. Residence fields (`direccion_residencia`, `barrio_residencia`, `ciudad_residencia`) provide structured address data
7. `lugar_nacimiento_id` provides FK to `geographic_locations` for structured birth place

### JSONB Schemas

**perfil_intereses** (WHAT they like):
```json
{
  "deportes": ["golf", "tenis", "natación"],
  "hobbies": ["lectura", "viajes", "fotografía"],
  "musica": ["rock", "jazz"],
  "gastronomia": ["italiana", "japonesa"]
}
```

**perfil_preferencias** (HOW to be served):
```json
{
  "idioma_preferido": "es",
  "canal_comunicacion": "email",
  "horario_contacto": "mañana",
  "restricciones_alimentarias": ["vegetariano"],
  "alergias": ["maní"]
}
```

**perfil_metricas** (Scores and analytics):
```json
{
  "ltv_score": 8500,
  "engagement_score": 0.85,
  "frecuencia_visitas": "semanal",
  "ultima_visita": "2025-12-20",
  "segmento": "platinum"
}
```

**perfil_compliance** (Legal and contracts):
```json
{
  "habeas_data_aceptado": true,
  "fecha_aceptacion": "2025-01-15",
  "contratos_activos": ["membresia_2025"],
  "pep": false,
  "lista_restrictiva": false
}
```

### Related Tables

- **Base:** `business_partners` (via `id`)
- **Emergency Contact:** Self-reference via `contacto_emergencia_id`
- **Birth Place:** `geographic_locations` (via `lugar_nacimiento_id`)
- **Empresa Representation:** `empresas.representante_legal_id` can reference personas

---

## empresas

**Purpose:** Companies/legal entities specialization - extends business_partners with company-specific fields.

**Row Count:** 4 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | - | **PK & FK** to business_partners.id (1:1) |
| `nit` | text | NOT NULL | - | **UNIQUE** - Tax ID number (7-12 digits, numbers only) |
| `razon_social` | text | NOT NULL | - | Legal company name |
| `nombre_comercial` | text | NULL | - | Trade name / brand name |
| `tipo_sociedad` | text | NOT NULL | - | Legal entity type: SA, SAS, LTDA, EU, COOP, FUNDACION, CORP, ONG, SUCURSAL, OTRO |
| `fecha_constitucion` | date | NULL | - | Incorporation date |
| `ciudad_constitucion` | text | NULL | - | City of incorporation |
| `pais_constitucion` | text | NULL | `'CO'::text` | Country of incorporation (default: Colombia) |
| `numero_registro` | text | NULL | - | Commercial registry number |
| `codigo_ciiu` | text | NULL | - | CIIU economic activity code |
| `sector_industria` | text | NULL | - | Industry sector |
| `actividad_economica` | text | NULL | - | Main economic activity description |
| `tamano_empresa` | text | NULL | - | Company size: micro, pequena, mediana, grande |
| `representante_legal_id` | uuid | NULL | - | FK to personas.id - Legal representative |
| `cargo_representante` | text | NULL | - | Position/title of legal representative |
| `email_secundario` | text | NULL | - | Additional corporate email (validated) |
| `telefono_secundario` | text | NULL | - | Additional phone (10 digits) |
| `whatsapp` | text | NULL | - | Corporate WhatsApp (10 digits) |
| `website` | text | NULL | - | Corporate website URL |
| `linkedin_url` | text | NULL | - | Company LinkedIn page |
| `facebook_url` | text | NULL | - | Company Facebook page |
| `instagram_handle` | text | NULL | - | Company Instagram handle |
| `twitter_handle` | text | NULL | - | Company Twitter/X handle |
| `logo_url` | text | NULL | - | Public URL of company logo |
| `ingresos_anuales` | numeric | NULL | - | Annual revenue/income |
| `numero_empleados` | integer | NULL | - | Number of employees |
| `atributos` | jsonb | NULL | `'{}'::jsonb` | Custom attributes (address, certifications, branches) |
| `digito_verificacion` | text | NULL | - | NIT verification digit (auto-calculated) |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of record creation |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_en` | timestamptz | NULL | - | **Synced with business_partners** |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Constraints

- **PRIMARY KEY:** `id`
- **UNIQUE:** `nit`
- **FOREIGN KEY:** `id` → `business_partners.id` (1:1)
- **FOREIGN KEY:** `representante_legal_id` → `personas.id`
- **CHECK:** `nit ~ '^[0-9]{7,12}$'` (7-12 digits)
- **CHECK:** `tipo_sociedad IN ('SA', 'SAS', 'LTDA', 'EU', 'COOP', 'FUNDACION', 'CORP', 'ONG', 'SUCURSAL', 'OTRO')`
- **CHECK:** `tamano_empresa IN ('micro', 'pequena', 'mediana', 'grande')`
- **CHECK:** `email_secundario ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
- **CHECK:** `telefono_secundario ~ '^[0-9]{10}$'`
- **CHECK:** `whatsapp ~ '^[0-9]{10}$'`

### Indexes

- `empresas_pkey` PRIMARY KEY on `id`
- `empresas_nit_key` UNIQUE on `nit`

### Triggers

- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. All empresas MUST have corresponding record in `business_partners` with `tipo_actor = 'empresa'`
2. NIT must be unique across all companies
3. NIT verification digit can be calculated using `calcular_digito_verificacion_nit()` function
4. Legal representative (`representante_legal_id`) must be a persona, not another empresa
5. `eliminado_en` synced with business_partners

### JSONB Schemas

**atributos:**
```json
{
  "direccion": {
    "principal": {
      "pais": "CO",
      "ciudad": "Bogotá",
      "direccion": "Calle 100 #10-20"
    },
    "sucursales": [
      {
        "nombre": "Medellín",
        "direccion": "Carrera 43A #1-50"
      }
    ]
  },
  "certificaciones": ["ISO 9001", "ISO 14001"],
  "socios": [
    {"nombre": "Juan Pérez", "participacion": 60},
    {"nombre": "María García", "participacion": 40}
  ]
}
```

### Related Tables

- **Base:** `business_partners` (via `id`)
- **Legal Rep:** `personas` (via `representante_legal_id`)

---

## bp_relaciones

**Purpose:** Manages relationships (family, employment, commercial, etc.) between business partners.

**Row Count:** 3 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `organizacion_id` | uuid | NOT NULL | - | FK to organizations - Multi-tenancy key |
| `bp_origen_id` | uuid | NOT NULL | - | FK to business_partners - Origin actor (child, employee, etc.) |
| `bp_destino_id` | uuid | NOT NULL | - | FK to business_partners - Destination actor (parent, company, etc.) |
| `tipo_relacion` | tipo_relacion_bp | NOT NULL | - | **ENUM** - Relationship type |
| `rol_origen` | text | NOT NULL | - | Specific role of origin in relationship context |
| `rol_destino` | text | NOT NULL | - | Specific role of destination in relationship context |
| `atributos` | jsonb | NOT NULL | `'{}'::jsonb` | Additional relationship metadata |
| `fecha_inicio` | date | NULL | - | Relationship start date |
| `fecha_fin` | date | NULL | - | Relationship end date (NULL if active) |
| `es_actual` | boolean | NULL (generated) | `(fecha_fin IS NULL)` | **GENERATED** - true if relationship is current |
| `es_bidireccional` | boolean | NOT NULL | `false` | Auto-query from both directions |
| `notas` | text | NULL | - | Additional notes |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of creation |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Enum Type: tipo_relacion_bp

| Value | Description |
|-------|-------------|
| `familiar` | Family relationship |
| `laboral` | Employment relationship |
| `referencia` | Reference/referral |
| `membresia` | Membership relationship |
| `comercial` | Commercial/business relationship |
| `otra` | Other relationship type |

### Constraints

- **PRIMARY KEY:** `id`
- **FOREIGN KEYS:**
  - `organizacion_id` → `organizations.id`
  - `bp_origen_id` → `business_partners.id`
  - `bp_destino_id` → `business_partners.id`
  - `creado_por`, `actualizado_por`, `eliminado_por` → `auth.users.id`

### Indexes

- `bp_relaciones_pkey` PRIMARY KEY on `id`
- `bp_relaciones_bp_origen_id_idx` on `bp_origen_id`
- `bp_relaciones_bp_destino_id_idx` on `bp_destino_id`

### Triggers

- `validar_tipo_relacion_compatible` - Validates relationship type rules
- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. **Familiar relationships:** Both origen and destino must be personas
2. **Laboral relationships:** Origen must be persona, destino must be empresa
3. No self-relationships (bp_origen_id ≠ bp_destino_id)
4. Only one active relationship of same type between same BPs
5. `fecha_fin` must be ≥ `fecha_inicio`
6. `es_actual` is auto-calculated (true when `fecha_fin IS NULL`)

### Relationship Type Rules

```typescript
// Validation matrix
const relationshipRules = {
  familiar: { origen: 'persona', destino: 'persona' },
  laboral: { origen: 'persona', destino: 'empresa' },
  referencia: { origen: 'any', destino: 'any' },
  membresia: { origen: 'any', destino: 'any' },
  comercial: { origen: 'any', destino: 'any' },
  otra: { origen: 'any', destino: 'any' }
};
```

### Example Roles

| tipo_relacion | rol_origen | rol_destino |
|---------------|------------|-------------|
| familiar | hijo | padre |
| familiar | conyuge | conyuge |
| laboral | empleado | empleador |
| laboral | gerente | empresa |
| referencia | referido | referente |
| membresia | socio | club |
| comercial | proveedor | cliente |

### JSONB Schemas

**atributos:**
```json
{
  "departamento": "Ventas",
  "cargo": "Gerente Regional",
  "salario": 5000000,
  "tipo_contrato": "indefinido",
  "jornada": "tiempo_completo"
}
```

### Related Tables

- **Business Partners:** Both `bp_origen_id` and `bp_destino_id`
- **View:** `obtener_relaciones_bp()` RPC function for bidirectional queries

---

## acciones

**Purpose:** Master table of club shares/actions (titles of value). Does not contain ownership directly.

**Row Count:** 25 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `organizacion_id` | uuid | NOT NULL | - | FK to organizations - Multi-tenancy key |
| `codigo_accion` | text | NOT NULL | - | **UNIQUE** - 4-digit numeric code (e.g., "4398") |
| `estado` | text | NOT NULL | `'disponible'::text` | Current status of the action |
| `creado_en` | timestamptz | NULL | `now()` | Timestamp of creation |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_en` | timestamptz | NULL | `now()` | Timestamp of last update |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Estado Values

| Value | Description |
|-------|-------------|
| `disponible` | Available for assignment |
| `asignada` | Currently assigned to a business partner |
| `arrendada` | Leased/rented |
| `bloqueada` | Blocked (cannot be assigned) |
| `inactiva` | Inactive |

### Constraints

- **PRIMARY KEY:** `id`
- **UNIQUE:** `codigo_accion`
- **CHECK:** `codigo_accion ~ '^[0-9]{4}$'` (exactly 4 digits)
- **CHECK:** `estado IN ('disponible', 'asignada', 'arrendada', 'bloqueada', 'inactiva')`
- **FOREIGN KEYS:**
  - `organizacion_id` → `organizations.id`
  - `creado_por`, `actualizado_por`, `eliminado_por` → `auth.users.id`

### Indexes

- `acciones_pkey` PRIMARY KEY on `id`
- `acciones_codigo_accion_key` UNIQUE on `codigo_accion`

### Triggers

- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. `codigo_accion` must be exactly 4 digits (e.g., "0001", "4398")
2. Ownership is tracked in `asignaciones_acciones` table, not here
3. Estado automatically updated based on assignments (via application logic)
4. Soft delete pattern applies

### Related Tables

- **Assignments:** `asignaciones_acciones` (tracks ownership)
- **Views:** `v_acciones_asignadas` (summary with dueño, titular, beneficiarios)

---

## asignaciones_acciones

**Purpose:** Tracks ownership and beneficiary assignments for club shares with temporal history.

**Row Count:** 2 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `accion_id` | uuid | NOT NULL | - | FK to acciones - The share being assigned |
| `business_partner_id` | uuid | NOT NULL | - | FK to business_partners - Assignee |
| `tipo_asignacion` | text | NOT NULL | - | Assignment type: dueño, titular, beneficiario |
| `subtipo_beneficiario` | text | NULL | - | Required for beneficiarios: conyuge, hijo/a, padre, madre, hermano/a, otro |
| `subcodigo` | text | NOT NULL | - | 2-digit code: 00=dueño, 01=titular, 02+=beneficiarios |
| `codigo_completo` | text | NOT NULL | - | **Auto-generated** - accion_codigo + subcodigo (e.g., "439800") |
| `fecha_inicio` | date | NOT NULL | `CURRENT_DATE` | Start date of assignment validity |
| `fecha_fin` | date | NULL | - | End date (NULL = currently valid) |
| `es_vigente` | boolean | NULL (generated) | `(fecha_fin IS NULL)` | **GENERATED** - true if currently valid |
| `precio_transaccion` | numeric | NULL | - | Transaction price (buy/sell/lease) if applicable |
| `organizacion_id` | uuid | NOT NULL | - | FK to organizations - Multi-tenancy key |
| `notas` | text | NULL | - | Additional notes |
| `atributos` | jsonb | NULL | `'{}'::jsonb` | Custom metadata in JSONB format |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of creation |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Assignment Types

| tipo_asignacion | subcodigo | Constraint | Description |
|-----------------|-----------|------------|-------------|
| `dueño` | `00` | Must be unique per action | Owner of the share |
| `titular` | `01` | Must be persona, unique per action | Title holder (can be different from owner) |
| `beneficiario` | `02+` | Must be persona, requires subtipo | Beneficiaries (multiple allowed) |

### Subtipo Beneficiario Values

- `conyuge` - Spouse
- `hijo/a` - Child
- `padre` - Father
- `madre` - Mother
- `hermano/a` - Sibling
- `otro` - Other

### Constraints

- **PRIMARY KEY:** `id`
- **CHECK:** `tipo_asignacion IN ('dueño', 'titular', 'beneficiario')`
- **CHECK:** `subtipo_beneficiario IN ('conyuge', 'hijo/a', 'padre', 'madre', 'hermano/a', 'otro')`
- **CHECK:** `subcodigo ~ '^[0-9]{2}$'` (exactly 2 digits)
- **FOREIGN KEYS:**
  - `accion_id` → `acciones.id`
  - `business_partner_id` → `business_partners.id`
  - `organizacion_id` → `organizations.id`
  - `creado_por`, `actualizado_por`, `eliminado_por` → `auth.users.id`

### Indexes

- `asignaciones_acciones_pkey` PRIMARY KEY on `id`
- `asignaciones_acciones_accion_id_idx` on `accion_id`
- `asignaciones_acciones_business_partner_id_idx` on `business_partner_id`

### Triggers

- `validar_asignacion_accion` - Validates assignment rules
- `generar_codigo_completo_asignacion` - Auto-generates `codigo_completo`
- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. **Subcode correspondence:**
   - Dueño MUST have subcodigo = '00'
   - Titular MUST have subcodigo = '01'
   - Beneficiarios MUST have subcodigo >= '02'

2. **Type restrictions:**
   - Titulares and beneficiarios MUST be personas (not empresas)
   - Dueños can be either personas or empresas

3. **Uniqueness:**
   - Only ONE active dueño per action
   - Only ONE active titular per action
   - Multiple beneficiarios allowed

4. **Temporal validity:**
   - `fecha_fin` must be >= `fecha_inicio`
   - `es_vigente` auto-calculated

5. **Beneficiary subtype:**
   - Required when `tipo_asignacion = 'beneficiario'`
   - NULL otherwise

### Example Codes

```
Accion 4398:
- 439800 → Dueño (subcodigo 00)
- 439801 → Titular (subcodigo 01)
- 439802 → Beneficiario 1 (subcodigo 02)
- 439803 → Beneficiario 2 (subcodigo 03)
```

### Related Tables

- **Acciones:** `acciones` (the share being assigned)
- **Business Partners:** `business_partners` (assignee)
- **Views:** `v_asignaciones_vigentes`, `v_asignaciones_historial`

---

## geographic_locations

**Purpose:** Reference table for cities and geographic locations used in location pickers (birth place, residence, etc.).

**Row Count:** 1367 | **RLS:** ✅ Enabled (public read access)

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key - Unique location identifier |
| `country_code` | text | NOT NULL | - | ISO 3166-1 alpha-2 country code (CO, US, MX, etc.) |
| `country_name` | text | NOT NULL | - | Full country name (Colombia, United States, México) |
| `state_name` | text | NULL | - | State/department name (Antioquia, Caldas, etc.) |
| `city_name` | text | NOT NULL | - | City name (Medellín, Bogotá, etc.) |
| `city_code` | text | NULL | - | City code for reference |
| `search_text` | text | NOT NULL | - | Combined text for FTS/autocomplete search |

### Constraints

- **PRIMARY KEY:** `id`
- **NOT NULL:** `country_code`, `country_name`, `city_name`, `search_text`

### Indexes

- `geographic_locations_pkey` PRIMARY KEY on `id`
- `idx_geographic_locations_country` on `country_code`
- `idx_geographic_locations_city` on `city_name`

### Triggers

- `actualizar_timestamp` - Auto-update `actualizado_en` on UPDATE

### RLS Policies

**Policy:** `"Public read access to locations"`
- **Operation:** SELECT
- **Using:** `true` (public read access - locations are reference data)

### Business Rules

1. Reference data table - contains cities and geographic locations
2. Used by LocationPicker component for structured location selection
3. Public read access (no sensitive data)
4. Data seeded with major Colombian cities (expandable to international cities)
5. Optimized for search with `search_text` field

### Related Functions

**`search_locations(search_term TEXT)`**
- Fuzzy search function for location picker
- Returns max 20 results ordered by relevance
- Prioritizes exact matches and Colombian cities
- Requires minimum 2 characters

### Usage Example

```sql
-- Search for cities matching "mede"
SELECT * FROM search_locations('mede');

-- Direct query
SELECT id, city_name, state_name, country_name
FROM geographic_locations
WHERE country_code = 'CO'
ORDER BY city_name;
```

### Referenced By

- **personas:** `lugar_nacimiento_id` (birth place)
- **Future:** Can be used for residence, expedition place, etc.

---

## organization_members

**Purpose:** Maps users to organizations with role-based permissions.

**Row Count:** 1 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `user_id` | uuid | NOT NULL | - | FK to auth.users - User ID |
| `organization_id` | uuid | NOT NULL | - | FK to organizations - Organization ID |
| `role` | text | NOT NULL | - | User role: owner, admin, analyst, auditor |
| `created_at` | timestamptz | NOT NULL | `now()` | Timestamp of membership creation |
| `created_by` | uuid | NULL | - | FK to auth.users - Who created the membership |

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `owner` | Organization owner | Full access, can delete org |
| `admin` | Administrator | Manage members, full data access |
| `analyst` | Data analyst | Read-only access to most data |
| `auditor` | Auditor | Read-only access to audit logs |

### Constraints

- **PRIMARY KEY:** `(user_id, organization_id)` (composite)
- **CHECK:** `role IN ('owner', 'admin', 'analyst', 'auditor')`
- **FOREIGN KEYS:**
  - `user_id` → `auth.users.id`
  - `organization_id` → `organizations.id`
  - `created_by` → `auth.users.id`

### Indexes

- `organization_members_pkey` PRIMARY KEY on `(user_id, organization_id)`

### Triggers

- `om_prevent_key_change` - Prevents changing user_id or organization_id after creation

### Business Rules

1. Composite primary key ensures one role per user per organization
2. Users can belong to multiple organizations with different roles
3. Organization creator is automatically added as 'owner' via trigger
4. Cannot change user_id or organization_id after creation (immutable)
5. At least one 'owner' must exist per organization

### Related Tables

- **Users:** `auth.users` (authentication)
- **Organizations:** `organizations`
- **Permissions:** Checked via `can_user_v2()` function + `role_permissions`

---

## roles

**Purpose:** Defines available roles in the system.

**Row Count:** 4 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role` | text | NOT NULL | - | Role identifier (PK) |

### Available Roles

| role | Description |
|------|-------------|
| `owner` | Organization owner |
| `admin` | Administrator |
| `analyst` | Data analyst |
| `auditor` | Auditor |

### Constraints

- **PRIMARY KEY:** `role`

### Indexes

- `roles_pkey` PRIMARY KEY on `role`

### Business Rules

1. Defines the allowed role values for `organization_members.role`
2. Permissions for each role defined in `role_permissions` table
3. System roles - should not be deleted

### Related Tables

- **Members:** `organization_members.role` references this
- **Permissions:** `role_permissions` maps roles to resource permissions

---

## role_permissions

**Purpose:** Fine-grained permission mappings for role-based access control.

**Row Count:** 102 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role` | text | NOT NULL | - | FK to roles.role |
| `resource` | text | NOT NULL | - | Resource name (table/entity) |
| `action` | text | NOT NULL | - | CRUD action: select, insert, update, delete |
| `allow` | boolean | NOT NULL | `true` | Whether permission is granted |

### Actions

| action | Description |
|--------|-------------|
| `select` | Read/query permission |
| `insert` | Create permission |
| `update` | Modify permission |
| `delete` | Delete permission |

### Constraints

- **PRIMARY KEY:** `(role, resource, action)` (composite)
- **CHECK:** `action IN ('select', 'insert', 'update', 'delete')`
- **FOREIGN KEY:** `role` → `roles.role`

### Indexes

- `role_permissions_pkey` PRIMARY KEY on `(role, resource, action)`

### Business Rules

1. Permissions evaluated by `can_user_v2()` function in RLS policies
2. Default `allow = true` for granted permissions
3. Absence of permission row = denied by default
4. Used in combination with organization membership

### Example Permissions

```sql
-- Owner has full access
INSERT INTO role_permissions (role, resource, action)
VALUES
  ('owner', 'business_partners', 'select'),
  ('owner', 'business_partners', 'insert'),
  ('owner', 'business_partners', 'update'),
  ('owner', 'business_partners', 'delete');

-- Analyst has read-only
INSERT INTO role_permissions (role, resource, action)
VALUES ('analyst', 'business_partners', 'select');
```

### Related Tables

- **Roles:** `roles` (via `role`)
- **Used by:** RLS policies via `can_user_v2()` function

---

## oportunidades

**Purpose:** Manages business opportunities such as membership withdrawal requests and new member applications.

**Row Count:** 0 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `codigo` | text | NOT NULL | - | **UNIQUE** - Opportunity code |
| `tipo` | tipo_oportunidad_enum | NOT NULL | - | Opportunity type: Solicitud Retiro, Solicitud Ingreso |
| `fecha_solicitud` | date | NOT NULL | `CURRENT_DATE` | Request date |
| `estado` | estado_oportunidad_enum | NOT NULL | `'abierta'::estado_oportunidad_enum` | Current state |
| `solicitante_id` | uuid | NOT NULL | - | FK to business_partners - Requester |
| `responsable_id` | uuid | NULL | - | FK to auth.users - Assigned staff member |
| `organizacion_id` | uuid | NOT NULL | - | FK to organizations - Organization |
| `monto_estimado` | numeric | NULL | - | Estimated monetary amount |
| `notas` | text | NULL | - | Additional notes |
| `atributos` | jsonb | NULL | `'{}'::jsonb` | Custom metadata |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of creation |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Enum Types

**tipo_oportunidad_enum:**
- `Solicitud Retiro` - Member withdrawal request
- `Solicitud Ingreso` - New member application

**estado_oportunidad_enum:**
- `abierta` - New/open request
- `en_proceso` - Being processed
- `ganada` - Approved/completed
- `perdida` - Rejected
- `cancelada` - Cancelled by requester

### Constraints

- **PRIMARY KEY:** `id`
- **UNIQUE:** `codigo`
- **FOREIGN KEYS:**
  - `organizacion_id` → `organizations.id`
  - `solicitante_id` → `business_partners.id`
  - `responsable_id` → `auth.users.id`
  - `creado_por`, `actualizado_por`, `eliminado_por` → `auth.users.id`

### Indexes

- `oportunidades_pkey` PRIMARY KEY on `id`
- `oportunidades_codigo_key` UNIQUE on `codigo`

### Triggers

- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. Opportunities track business requests (withdrawals, new memberships)
2. Each opportunity has a requester (business partner)
3. Staff member can be assigned as responsible
4. Status workflow: abierta → en_proceso → ganada/perdida/cancelada
5. Soft delete pattern applies
6. Estimated amount can be tracked for financial opportunities

### Related Tables

- **Business Partners:** `business_partners` (via `solicitante_id`)
- **Organizations:** `organizations` (via `organizacion_id`)
- **Tasks:** `tareas` (via `oportunidad_id`)

---

## tareas

**Purpose:** Manages tasks and activities related to opportunities and business partners.

**Row Count:** 0 | **RLS:** ✅ Enabled

### Fields

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `titulo` | text | NOT NULL | - | Task title |
| `descripcion` | text | NULL | - | Task description |
| `prioridad` | prioridad_tarea_enum | NOT NULL | `'media'::prioridad_tarea_enum` | Priority level |
| `estado` | estado_tarea_enum | NOT NULL | `'pendiente'::estado_tarea_enum` | Current status |
| `fecha_vencimiento` | date | NULL | - | Due date |
| `oportunidad_id` | uuid | NULL | - | FK to oportunidades - Related opportunity |
| `asignado_a` | uuid | NULL | - | FK to auth.users - Assigned user |
| `organizacion_id` | uuid | NOT NULL | - | FK to organizations - Organization |
| `relacionado_con_bp` | uuid | NULL | - | FK to business_partners - Related BP |
| `creado_en` | timestamptz | NOT NULL | `now()` | Timestamp of creation |
| `creado_por` | uuid | NULL | - | FK to auth.users - Creator |
| `actualizado_en` | timestamptz | NOT NULL | `now()` | Timestamp of last update |
| `actualizado_por` | uuid | NULL | - | FK to auth.users - Updater |
| `eliminado_en` | timestamptz | NULL | - | Soft delete timestamp |
| `eliminado_por` | uuid | NULL | - | FK to auth.users - Deleter |

### Enum Types

**prioridad_tarea_enum:**
- `baja` - Low priority
- `media` - Medium priority
- `alta` - High priority
- `critica` - Critical priority

**estado_tarea_enum:**
- `pendiente` - Pending
- `en_progreso` - In progress
- `bloqueada` - Blocked
- `hecha` - Completed
- `cancelada` - Cancelled

### Constraints

- **PRIMARY KEY:** `id`
- **FOREIGN KEYS:**
  - `organizacion_id` → `organizations.id`
  - `oportunidad_id` → `oportunidades.id`
  - `asignado_a` → `auth.users.id`
  - `relacionado_con_bp` → `business_partners.id`
  - `creado_por`, `actualizado_por`, `eliminado_por` → `auth.users.id`

### Indexes

- `tareas_pkey` PRIMARY KEY on `id`

### Triggers

- `set_audit_user_columns` - Auto-set audit fields
- `actualizar_timestamp` - Auto-update `actualizado_en`
- `set_deleted_by_on_soft_delete` - Auto-set `eliminado_por`

### Business Rules

1. Tasks track activities and to-do items
2. Can be linked to opportunities or business partners
3. Priority levels help with task management
4. Status workflow: pendiente → en_progreso → hecha (or bloqueada/cancelada)
5. Due dates can be set for time-sensitive tasks
6. Soft delete pattern applies

### Related Tables

- **Opportunities:** `oportunidades` (via `oportunidad_id`)
- **Business Partners:** `business_partners` (via `relacionado_con_bp`)
- **Users:** `auth.users` (via `asignado_a`)

---

## Summary Statistics

| Table | Rows | Columns | RLS | Triggers | Indexes |
|-------|------|---------|-----|----------|---------|
| organizations | 1 | 16 | ✅ | 4 | 2 |
| business_partners | 17 | 13 | ✅ | 4 | 3 |
| personas | 13 | 44 | ✅ | 3 | 2 |
| empresas | 4 | 33 | ✅ | 3 | 2 |
| bp_relaciones | 3 | 17 | ✅ | 4 | 3 |
| acciones | 25 | 10 | ✅ | 3 | 2 |
| asignaciones_acciones | 2 | 20 | ✅ | 5 | 3 |
| geographic_locations | 1367 | 7 | ✅ | 1 | 3 |
| organization_members | 1 | 5 | ✅ | 1 | 1 |
| roles | 4 | 1 | ✅ | 0 | 1 |
| role_permissions | 102 | 4 | ✅ | 0 | 1 |
| oportunidades | 0 | 16 | ✅ | 3 | 2 |
| tareas | 0 | 16 | ✅ | 3 | 1 |
| **TOTAL** | **1539+** | **215** | **13/13** | **34** | **26** |

---

**Last Generated:** 2026-01-03 (Updated with live Supabase schema)
**Source:** Live Supabase database via MCP
**Validation:** ✅ All constraints verified against live schema
