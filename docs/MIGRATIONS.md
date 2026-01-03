# Database Migration Guide

> **Complete migration history and schema evolution**
>
> Last updated: 2026-01-03 | Database: PostgreSQL 17

---

## Table of Contents

- [Overview](#overview)
- [Migration Strategy](#migration-strategy)
- [Complete Migration History](#complete-migration-history)
- [System Evolution](#system-evolution)
- [Best Practices](#best-practices)
- [Rollback Strategy](#rollback-strategy)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

---

## Overview

### Two-File Approach

- **`supabase/schema.sql`**: Initial schema for first-time setup
- **`supabase/migrations/`**: Timestamped files for schema changes

### Current Status

- **Total Migrations Applied**: 24
- **Database Version**: PostgreSQL 17
- **Last Migration**: 2025-11-24 (geographic_locations)
- **RLS Status**: Enabled on all 13 tables

---

## Migration Strategy

### Initial Setup (New Projects)

Run `schema.sql` in Supabase Dashboard SQL Editor:

1. Dashboard → SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Run query

Creates:

- `profiles` table with RLS
- `todos` table with RLS
- Realtime publication

### Adding Schema Changes

**Never modify schema.sql directly.** Create new migration:

#### 1. Create Migration File

Format: `YYYYMMDDHHMMSS_description.sql`

Example: `supabase/migrations/20240315120000_add_billing_table.sql`

```sql
-- Migration: Add billing table
-- Created: 2024-03-15

create table billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subscription_tier text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table billing enable row level security;

create policy "Users can view own billing"
  on billing for select
  using ( auth.uid() = user_id );
```

#### 2. Apply Migration

**Local (Supabase CLI):**

```bash
supabase db push
```

**Production:**

1. Supabase Dashboard → SQL Editor
2. Copy migration file contents
3. Run query
4. Verify in Table Editor

#### 3. Document in schema.sql (Optional)

For new developers, append migration to `schema.sql` with comment:

```sql
-- Migration: 20240315120000_add_billing_table.sql
-- (migration content)
```

---

## Complete Migration History

### Migration List (24 Total)

| # | Migration | Date | Description | Tables Modified |
|---|-----------|------|-------------|-----------------|
| 1 | `20250826184213_initial_schema.sql` | 2025-08-26 | Initial schema setup | profiles, todos |
| 2 | `20250826184214_create_organizations.sql` | 2025-08-26 | Multi-tenancy foundation | organizations |
| 3 | `20250826184215_create_business_partners.sql` | 2025-08-26 | CTI base table | business_partners |
| 4 | `20250826184216_create_personas.sql` | 2025-08-26 | Natural persons | personas |
| 5 | `20250826184217_create_empresas.sql` | 2025-08-26 | Companies | empresas |
| 6 | `20250826184218_create_bp_relaciones.sql` | 2025-08-26 | Relationships | bp_relaciones |
| 7 | `20250826184219_create_acciones.sql` | 2025-08-26 | Club shares | acciones, asignaciones_acciones |
| 8 | `20250826184220_create_functions_triggers.sql` | 2025-08-26 | Helper functions | N/A (functions) |
| 9 | `20250826184221_create_views.sql` | 2025-08-26 | Query views | N/A (views) |
| 10 | `20250826184222_create_rls_policies.sql` | 2025-08-26 | Security policies | All tables |
| 11 | `20250826184223_create_enums.sql` | 2025-08-26 | Custom enums | N/A (types) |
| 12 | `20250826184224_add_indexes.sql` | 2025-08-26 | Performance indexes | All tables |
| 13 | `20250826184225_add_geographic_locations.sql` | 2025-08-26 | Geographic data | geographic_locations |
| 14 | `20250826184226_add_oportunidades.sql` | 2025-08-26 | Opportunities | oportunidades |
| 15 | `20250826184227_add_tareas.sql` | 2025-08-26 | Tasks | tareas |
| 16 | `20250826184228_add_role_permissions.sql` | 2025-08-26 | RBAC | role_permissions |
| 17 | `20250826184229_add_audit_triggers.sql` | 2025-08-26 | Audit logging | All tables |
| 18 | `20250826184230_add_soft_delete.sql` | 2025-08-26 | Soft delete pattern | All tables |
| 19 | `20250826184231_add_temporal_tracking.sql` | 2025-08-26 | Temporal validity | bp_relaciones, asignaciones_acciones |
| 20 | `20250826184232_add_jsonb_functions.sql` | 2025-08-26 | JSONB utilities | N/A (functions) |
| 21 | `20250826184233_add_validation_functions.sql` | 2025-08-26 | Data validation | N/A (functions) |
| 22 | `20250826184234_add_business_logic.sql` | 2025-08-26 | Business logic | N/A (functions) |
| 23 | `20250826184235_add_data_migrations.sql` | 2025-08-26 | Data migrations | N/A (data) |
| 24 | `20251124184236_add_geographic_locations.sql` | 2025-11-24 | Geographic locations (update) | geographic_locations |

---

### Migration Details

#### 1. Initial Schema (2025-08-26)

**File:** `20250826184213_initial_schema.sql`

Creates base tables for authentication and simple task tracking:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### 2. Organizations (2025-08-26)

**File:** `20250826184214_create_organizations.sql`

Multi-tenancy foundation:

```sql
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  configuracion JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- Soft delete support
- JSONB configuration for flexibility
- Timestamps for audit trail

---

#### 3. Business Partners Base (2025-08-26)

**File:** `20250826184215_create_business_partners.sql`

CTI (Class Table Inheritance) base table:

```sql
CREATE TABLE business_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacion_id UUID REFERENCES organizations(id) NOT NULL,
  tipo_actor tipo_actor_enum NOT NULL,
  codigo_bp TEXT UNIQUE,
  email_principal TEXT,
  celular_principal TEXT,
  telefono_principal TEXT,
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_business_partners_org_codigo
  ON business_partners(organizacion_id, codigo_bp)
  WHERE eliminado_en IS NULL;
```

**Features:**
- CTI pattern base
- Soft delete support
- Unique constraint per organization
- JSONB for extensible metadata

---

#### 4. Personas (2025-08-26)

**File:** `20250826184216_create_personas.sql`

Natural persons specialization:

```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY REFERENCES business_partners(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  tipo_documento tipo_documento_persona_enum NOT NULL,
  numero_documento TEXT NOT NULL,
  fecha_nacimiento DATE,
  genero genero_persona_enum,
  estado_civil estado_civil_persona_enum,
  nacionalidad TEXT,
  direccion_residencia TEXT,
  barrio_residencia TEXT,
  ciudad_residencia TEXT,
  lugar_nacimiento_id UUID REFERENCES geographic_locations(id),
  perfil_persona JSONB DEFAULT '{}',
  contacto_emergencia_id UUID REFERENCES personas(id),
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- 1:1 relationship with business_partners
- Self-reference for emergency contact
- Geographic location support
- Extensible JSONB profile

---

#### 5. Empresas (2025-08-26)

**File:** `20250826184217_create_empresas.sql`

Companies specialization:

```sql
CREATE TABLE empresas (
  id UUID PRIMARY KEY REFERENCES business_partners(id) ON DELETE CASCADE,
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  nit TEXT NOT NULL,
  digito_verificacion INTEGER,
  tipo_empresa tipo_empresa_enum,
  representante_legal_id UUID REFERENCES personas(id),
  direccion_principal TEXT,
  ciudad TEXT,
  pais TEXT,
  perfil_empresa JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- NIT with verification digit
- Representative legal reference
- Extensible JSONB profile

---

#### 6. BP Relaciones (2025-08-26)

**File:** `20250826184218_create_bp_relaciones.sql`

Bidirectional relationships with temporal tracking:

```sql
CREATE TABLE bp_relaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacion_id UUID REFERENCES organizations(id) NOT NULL,
  bp_origen_id UUID REFERENCES business_partners(id) NOT NULL,
  bp_destino_id UUID REFERENCES business_partners(id) NOT NULL,
  tipo_relacion tipo_relacion_bp_enum NOT NULL,
  rol_origen TEXT,
  rol_destino TEXT,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  es_actual BOOLEAN GENERATED ALWAYS AS (fecha_fin IS NULL) STORED,
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- Temporal validity (fecha_inicio/fecha_fin)
- Generated column for active status
- Bidirectional support via view
- Type validation via triggers

---

#### 7. Acciones (2025-08-26)

**File:** `20250826184219_create_acciones.sql`

Club shares with ownership tracking:

```sql
CREATE TABLE acciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacion_id UUID REFERENCES organizations(id) NOT NULL,
  codigo_accion TEXT UNIQUE NOT NULL,
  estado estado_accion_enum NOT NULL,
  categoria categoria_accion_enum,
  porcentaje_participacion NUMERIC(5, 2),
  valor_nominal NUMERIC(12, 2),
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE asignaciones_acciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accion_id UUID REFERENCES acciones(id) NOT NULL,
  business_partner_id UUID REFERENCES business_partners(id) NOT NULL,
  tipo_asignacion tipo_asignacion_enum NOT NULL,
  subcodigo TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  es_vigente BOOLEAN GENERATED ALWAYS AS (fecha_fin IS NULL) STORED,
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- Share ownership tracking
- Multiple assignment types (owner, holder, beneficiary)
- Temporal validity
- Subcode for multiple shares per person

---

#### 8. Functions & Triggers (2025-08-26)

**File:** `20250826184220_create_functions_triggers.sql`

Helper functions and triggers:

```sql
-- Auto-update timestamp
CREATE FUNCTION actualizar_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create persona
CREATE FUNCTION crear_persona(
  organizacion_id UUID,
  nombres TEXT,
  apellidos TEXT,
  email_principal TEXT,
  celular_principal TEXT,
  tipo_documento tipo_documento_persona_enum,
  numero_documento TEXT,
  perfil_persona JSONB,
  atributos JSONB
) RETURNS UUID AS $$
DECLARE
  bp_id UUID;
BEGIN
  -- Insert into base table
  INSERT INTO business_partners (organizacion_id, tipo_actor, email_principal, celular_principal, atributos)
  VALUES (organizacion_id, 'persona', email_principal, celular_principal, COALESCE(atributos, '{}'))
  RETURNING id INTO bp_id;

  -- Insert into specialization
  INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento, perfil_persona)
  VALUES (bp_id, nombres, apellidos, tipo_documento, numero_documento, COALESCE(perfil_persona, '{}'));

  RETURN bp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create empresa
CREATE FUNCTION crear_empresa(
  organizacion_id UUID,
  razon_social TEXT,
  nombre_comercial TEXT,
  email_principal TEXT,
  telefono_principal TEXT,
  nit TEXT,
  digito_verificacion INTEGER,
  representante_legal_id UUID,
  perfil_empresa JSONB,
  atributos JSONB
) RETURNS UUID AS $$
DECLARE
  bp_id UUID;
BEGIN
  -- Calculate verification digit if not provided
  IF digito_verificacion IS NULL THEN
    digito_verificacion := calcular_digito_verificacion_nit(nit);
  END IF;

  -- Insert into base table
  INSERT INTO business_partners (organizacion_id, tipo_actor, email_principal, telefono_principal, atributos)
  VALUES (organizacion_id, 'empresa', email_principal, telefono_principal, COALESCE(atributos, '{}'))
  RETURNING id INTO bp_id;

  -- Insert into specialization
  INSERT INTO empresas (id, razon_social, nombre_comercial, nit, digito_verificacion, representante_legal_id, perfil_empresa)
  VALUES (bp_id, razon_social, nombre_comercial, nit, digito_verificacion, representante_legal_id, COALESCE(perfil_empresa, '{}'));

  RETURN bp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate NIT verification digit
CREATE FUNCTION calcular_digito_verificacion_nit(nit TEXT) RETURNS INTEGER AS $$
DECLARE
  nit_clean TEXT;
  digitos INTEGER[];
  pesos INTEGER[] := ARRAY[41, 37, 33, 29, 25, 21, 17, 13, 9, 5, 3];
  suma INTEGER := 0;
  i INTEGER;
BEGIN
  -- Remove non-digit characters
  nit_clean := regexp_replace(nit, '[^0-9]', '', 'g');

  -- Convert to array
  digitos := string_to_array(nit_clean, NULL)::INTEGER[];

  -- Calculate weighted sum
  FOR i IN 1..array_length(digitos, 1) LOOP
    IF i <= array_length(pesos, 1) THEN
      suma := suma + (digitos[i] * pesos[i]);
    END IF;
  END LOOP;

  -- Calculate verification digit
  RETURN 11 - (suma % 11);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

#### 9. Views (2025-08-26)

**File:** `20250826184221_create_views.sql`

Pre-built views for common queries:

```sql
-- Unified actors view
CREATE VIEW v_actores_unificados AS
SELECT
  bp.id,
  bp.organizacion_id,
  bp.tipo_actor,
  bp.codigo_bp,
  bp.email_principal,
  COALESCE(bp.celular_principal, bp.telefono_principal) AS telefono,
  CASE
    WHEN bp.tipo_actor = 'persona' THEN p.nombres || ' ' || p.apellidos
    WHEN bp.tipo_actor = 'empresa' THEN e.razon_social
  END AS nombre_completo,
  CASE
    WHEN bp.tipo_actor = 'persona' THEN p.numero_documento
    WHEN bp.tipo_actor = 'empresa' THEN e.nit || '-' || e.digito_verificacion
  END AS identificacion,
  bp.atributos,
  bp.creado_en,
  bp.actualizado_en
FROM business_partners bp
LEFT JOIN personas p ON bp.id = p.id
LEFT JOIN empresas e ON bp.id = e.id
WHERE bp.eliminado_en IS NULL;

-- Personas with organization
CREATE VIEW v_personas_org AS
SELECT
  p.*,
  bp.organizacion_id,
  bp.codigo_bp,
  bp.email_principal,
  bp.celular_principal,
  bp.atributos,
  o.nombre AS organizacion_nombre
FROM personas p
JOIN business_partners bp ON p.id = bp.id
JOIN organizations o ON bp.organizacion_id = o.id
WHERE p.eliminado_en IS NULL;

-- Empresas with organization
CREATE VIEW v_empresas_org AS
SELECT
  e.*,
  bp.organizacion_id,
  bp.codigo_bp,
  bp.email_principal,
  bp.telefono_principal,
  bp.atributos,
  o.nombre AS organizacion_nombre
FROM empresas e
JOIN business_partners bp ON e.id = bp.id
JOIN organizations o ON bp.organizacion_id = o.id
WHERE e.eliminado_en IS NULL;

-- Bidirectional relationships
CREATE VIEW v_relaciones_bidireccionales AS
SELECT
  r.*,
  'directo' AS direccion
FROM bp_relaciones r
WHERE r.eliminado_en IS NULL

UNION ALL

SELECT
  r.id,
  r.organizacion_id,
  r.bp_destino_id AS bp_origen_id,
  r.bp_origen_id AS bp_destino_id,
  r.tipo_relacion,
  invertir_rol(r.rol_destino) AS rol_origen,
  invertir_rol(r.rol_origen) AS rol_destino,
  r.descripcion,
  r.fecha_inicio,
  r.fecha_fin,
  r.es_actual,
  r.atributos,
  r.eliminado_en,
  r.creado_en,
  r.actualizado_en,
  'inverso' AS direccion
FROM bp_relaciones r
WHERE r.eliminado_en IS NULL;

-- Active assignments
CREATE VIEW v_asignaciones_vigentes AS
SELECT
  aa.*,
  a.codigo_accion,
  bp.codigo_bp AS bp_codigo,
  CASE
    WHEN bp.tipo_actor = 'persona' THEN p.nombres || ' ' || p.apellidos
    WHEN bp.tipo_actor = 'empresa' THEN e.razon_social
  END AS bp_nombre
FROM asignaciones_acciones aa
JOIN acciones a ON aa.accion_id = a.id
JOIN business_partners bp ON aa.business_partner_id = bp.id
LEFT JOIN personas p ON bp.id = p.id
LEFT JOIN empresas e ON bp.id = e.id
WHERE aa.es_vigente = TRUE
  AND aa.eliminado_en IS NULL;

-- Assignment history
CREATE VIEW v_asignaciones_historial AS
SELECT
  aa.*,
  a.codigo_accion,
  bp.codigo_bp AS bp_codigo,
  CASE
    WHEN bp.tipo_actor = 'persona' THEN p.nombres || ' ' || p.apellidos
    WHEN bp.tipo_actor = 'empresa' THEN e.razon_social
  END AS bp_nombre
FROM asignaciones_acciones aa
JOIN acciones a ON aa.accion_id = a.id
JOIN business_partners bp ON aa.business_partner_id = bp.id
LEFT JOIN personas p ON bp.id = p.id
LEFT JOIN empresas e ON bp.id = e.id
WHERE aa.eliminado_en IS NULL;
```

---

#### 10. RLS Policies (2025-08-26)

**File:** `20250826184222_create_rls_policies.sql`

Row Level Security for all tables:

```sql
-- Business Partners
ALTER TABLE business_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business partners in their organization"
  ON business_partners FOR SELECT
  USING (
    organizacion_id IN (
      SELECT organizacion_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert business partners in their organization"
  ON business_partners FOR INSERT
  WITH CHECK (
    organizacion_id IN (
      SELECT organizacion_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update business partners in their organization"
  ON business_partners FOR UPDATE
  USING (
    organizacion_id IN (
      SELECT organizacion_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can soft delete business partners in their organization"
  ON business_partners FOR UPDATE
  USING (
    organizacion_id IN (
      SELECT organizacion_id FROM user_organizations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    eliminado_en IS NOT NULL AND
    organizacion_id IN (
      SELECT organizacion_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Similar policies for personas, empresas, bp_relaciones, acciones, asignaciones_acciones, oportunidades, tareas
```

---

#### 11. Custom Enums (2025-08-26)

**File:** `20250826184223_create_enums.sql`

Custom enum types:

```sql
-- Actor types
CREATE TYPE tipo_actor_enum AS ENUM ('persona', 'empresa');

-- Actor states
CREATE TYPE estado_actor_enum AS ENUM ('activo', 'inactivo', 'suspendido');

-- Document types
CREATE TYPE tipo_documento_persona_enum AS ENUM ('CC', 'CE', 'TI', 'PP', 'NIT', 'PASAPORTE', 'CEDULA_EXTRANJERIA');

-- Genders
CREATE TYPE genero_persona_enum AS ENUM ('masculino', 'femenino', 'otro', 'no_especificado');

-- Civil states
CREATE TYPE estado_civil_persona_enum AS ENUM ('soltero', 'casado', 'divorciado', 'viudo', 'union_libre');

-- Company types
CREATE TYPE tipo_empresa_enum AS ENUM ('SAS', 'SA', 'LTDA', 'E.U.', 'SUCURSAL', 'OTRA');

-- Relationship types
CREATE TYPE tipo_relacion_bp_enum AS ENUM ('familiar', 'laboral', 'referencia', 'membresia', 'comercial', 'otra');

-- Action states
CREATE TYPE estado_accion_enum AS ENUM ('emitida', 'en_cartera', 'en_garantia', 'en_litigio', 'pagada', 'cancelada', 'suspendida');

-- Action categories
CREATE TYPE categoria_accion_enum AS ENUM ('ordinaria', 'preferente', 'sin_voto', 'convertible');

-- Assignment types
CREATE TYPE tipo_asignacion_enum AS ENUM ('dueño', 'titular', 'beneficiario');

-- Opportunity types
CREATE TYPE tipo_oportunidad_enum AS ENUM ('Solicitud Retiro', 'Solicitud Aporte', 'Prestamo', 'Inversion', 'Otra');

-- Task priorities
CREATE TYPE prioridad_tarea_enum AS ENUM ('baja', 'media', 'alta', 'urgente');

-- Task states
CREATE TYPE estado_tarea_enum AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');
```

---

#### 12. Indexes (2025-08-26)

**File:** `20250826184224_add_indexes.sql`

Performance indexes:

```sql
-- Business Partners
CREATE INDEX idx_business_partners_org ON business_partners(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_business_partners_tipo ON business_partners(tipo_actor) WHERE eliminado_en IS NULL;
CREATE INDEX idx_business_partners_codigo ON business_partners(codigo_bp) WHERE eliminado_en IS NULL;

-- Personas
CREATE INDEX idx_personas_documento ON personas(numero_documento) WHERE eliminado_en IS NULL;
CREATE INDEX idx_personas_nombres ON personas(nombres) WHERE eliminado_en IS NULL;
CREATE INDEX idx_personas_apellidos ON personas(apellidos) WHERE eliminado_en IS NULL;

-- Empresas
CREATE INDEX idx_empresas_nit ON empresas(nit) WHERE eliminado_en IS NULL;
CREATE INDEX idx_empresas_razon ON empresas(razon_social) WHERE eliminado_en IS NULL;

-- Relationships
CREATE INDEX idx_bp_relaciones_origen ON bp_relaciones(bp_origen_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_bp_relaciones_destino ON bp_relaciones(bp_destino_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_bp_relaciones_tipo ON bp_relaciones(tipo_relacion) WHERE eliminado_en IS NULL;
CREATE INDEX idx_bp_relaciones_actual ON bp_relaciones(es_actual) WHERE eliminado_en IS NULL;
CREATE INDEX idx_bp_relaciones_bidireccional ON bp_relaciones(bp_origen_id, bp_destino_id) WHERE eliminado_en IS NULL;

-- Actions
CREATE INDEX idx_acciones_codigo ON acciones(codigo_accion) WHERE eliminado_en IS NULL;
CREATE INDEX idx_acciones_estado ON acciones(estado) WHERE eliminado_en IS NULL;

-- Assignments
CREATE INDEX idx_asignaciones_accion ON asignaciones_acciones(accion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_asignaciones_bp ON asignaciones_acciones(business_partner_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_asignaciones_tipo ON asignaciones_acciones(tipo_asignacion) WHERE eliminado_en IS NULL;
CREATE INDEX idx_asignaciones_vigente ON asignaciones_acciones(es_vigente) WHERE eliminado_en IS NULL;

-- Opportunities
CREATE INDEX idx_oportunidades_org ON oportunidades(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado) WHERE eliminado_en IS NULL;
CREATE INDEX idx_oportunidades_tipo ON oportunidades(tipo) WHERE eliminado_en IS NULL;
CREATE INDEX idx_oportunidades_solicitante ON oportunidades(solicitante_id) WHERE eliminado_en IS NULL;

-- Tasks
CREATE INDEX idx_tareas_org ON tareas(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_estado ON tareas(estado) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_prioridad ON tareas(prioridad) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_asignado ON tareas(asignado_a) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_vencimiento ON tareas(fecha_vencimiento) WHERE eliminado_en IS NULL;
```

---

#### 13. Geographic Locations (2025-08-26)

**File:** `20250826184225_add_geographic_locations.sql`

Geographic data for addresses:

```sql
CREATE TABLE geographic_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'pais', 'departamento', 'ciudad', 'barrio'
  codigo TEXT,
  nombre TEXT NOT NULL,
  parent_id UUID REFERENCES geographic_locations(id),
  nivel INTEGER NOT NULL, -- 1: pais, 2: departamento, 3: ciudad, 4: barrio
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geo_tipo ON geographic_locations(tipo) WHERE eliminado_en IS NULL;
CREATE INDEX idx_geo_parent ON geographic_locations(parent_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_geo_nivel ON geographic_locations(nivel) WHERE eliminado_en IS NULL;
```

---

#### 14. Opportunities (2025-08-26)

**File:** `20250826184226_add_oportunidades.sql`

Business opportunities:

```sql
CREATE TABLE oportunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  tipo tipo_oportunidad_enum NOT NULL,
  fecha_solicitud DATE NOT NULL,
  solicitante_id UUID REFERENCES business_partners(id) NOT NULL,
  organizacion_id UUID REFERENCES organizations(id) NOT NULL,
  monto_estimado NUMERIC(12, 2),
  descripcion TEXT,
  estado TEXT DEFAULT 'abierta',
  responsable_id UUID REFERENCES auth.users(id),
  fecha_cierre DATE,
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_oportunidades_org ON oportunidades(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado) WHERE eliminado_en IS NULL;
CREATE INDEX idx_oportunidades_tipo ON oportunidades(tipo) WHERE eliminado_en IS NULL;
CREATE INDEX idx_oportunidades_solicitante ON oportunidades(solicitante_id) WHERE eliminado_en IS NULL;
```

---

#### 15. Tasks (2025-08-26)

**File:** `20250826184227_add_tareas.sql`

Task management:

```sql
CREATE TABLE tareas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad prioridad_tarea_enum NOT NULL,
  estado estado_tarea_enum NOT NULL,
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  asignado_a UUID REFERENCES auth.users(id),
  organizacion_id UUID REFERENCES organizations(id) NOT NULL,
  relacionado_con_bp UUID REFERENCES business_partners(id),
  relacionado_con_oportunidad UUID REFERENCES oportunidades(id),
  atributos JSONB DEFAULT '{}',
  eliminado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tareas_org ON tareas(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_estado ON tareas(estado) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_prioridad ON tareas(prioridad) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_asignado ON tareas(asignado_a) WHERE eliminado_en IS NULL;
CREATE INDEX idx_tareas_vencimiento ON tareas(fecha_vencimiento) WHERE eliminado_en IS NULL;
```

---

#### 16. Role Permissions (2025-08-26)

**File:** `20250826184228_add_role_permissions.sql`

RBAC (Role-Based Access Control):

```sql
CREATE TABLE role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rol TEXT NOT NULL,
  recurso TEXT NOT NULL,
  accion TEXT NOT NULL,
  condiciones JSONB DEFAULT '{}',
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_role_permissions_unique ON role_permissions(rol, recurso, accion);
```

---

#### 17. Audit Triggers (2025-08-26)

**File:** `20250826184229_add_audit_triggers.sql`

Automatic audit logging:

```sql
CREATE FUNCTION audit_log() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (tabla, operacion, registro_id, datos_nuevos, usuario_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (tabla, operacion, registro_id, datos_antiguos, datos_nuevos, usuario_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (tabla, operacion, registro_id, datos_antiguos, usuario_id)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### 18. Soft Delete (2025-08-26)

**File:** `20250826184230_add_soft_delete.sql`

Soft delete pattern:

```sql
CREATE FUNCTION soft_delete() RETURNS TRIGGER AS $$
BEGIN
  NEW.eliminado_en = NOW();
  NEW.eliminado_por = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### 19. Temporal Tracking (2025-08-26)

**File:** `20250826184231_add_temporal_tracking.sql`

Temporal validity for relationships and assignments:

```sql
-- Already implemented via generated columns:
-- es_actual BOOLEAN GENERATED ALWAYS AS (fecha_fin IS NULL) STORED
-- es_vigente BOOLEAN GENERATED ALWAYS AS (fecha_fin IS NULL) STORED
```

---

#### 20. JSONB Functions (2025-08-26)

**File:** `20250826184232_add_jsonb_functions.sql`

JSONB utility functions:

```sql
CREATE FUNCTION merge_jsonb(target JSONB, source JSONB) RETURNS JSONB AS $$
BEGIN
  RETURN target || source;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

#### 21. Validation Functions (2025-08-26)

**File:** `20250826184233_add_validation_functions.sql`

Data validation functions:

```sql
CREATE FUNCTION validar_documento(numero_documento TEXT, tipo_documento tipo_documento_persona_enum) RETURNS BOOLEAN AS $$
BEGIN
  -- Document validation logic
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

#### 22. Business Logic (2025-08-26)

**File:** `20250826184234_add_business_logic.sql`

Business logic functions:

```sql
CREATE FUNCTION crear_relacion_bp(
  bp_origen_id UUID,
  bp_destino_id UUID,
  tipo_relacion tipo_relacion_bp_enum,
  descripcion TEXT,
  fecha_inicio DATE,
  atributos JSONB
) RETURNS UUID AS $$
DECLARE
  relacion_id UUID;
BEGIN
  INSERT INTO bp_relaciones (
    organizacion_id, bp_origen_id, bp_destino_id, tipo_relacion, descripcion, fecha_inicio, atributos
  )
  VALUES (
    (SELECT organizacion_id FROM business_partners WHERE id = bp_origen_id),
    bp_origen_id, bp_destino_id, tipo_relacion, descripcion, fecha_inicio, COALESCE(atributos, '{}')
  )
  RETURNING id INTO relacion_id;

  RETURN relacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION obtener_relaciones_bp(bp_id UUID, solo_vigentes BOOLEAN DEFAULT TRUE) RETURNS TABLE (
  id UUID,
  bp_origen_id UUID,
  bp_destino_id UUID,
  tipo_relacion tipo_relacion_bp_enum,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  es_actual BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM bp_relaciones r
  WHERE (r.bp_origen_id = bp_id OR r.bp_destino_id = bp_id)
    AND r.eliminado_en IS NULL
    AND (NOT solo_vigentes OR r.es_actual = TRUE)
  ORDER BY r.fecha_inicio DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION crear_asignacion_accion(
  accion_id UUID,
  persona_id UUID,
  tipo_asignacion tipo_asignacion_enum,
  subcodigo TEXT,
  fecha_inicio DATE,
  atributos JSONB
) RETURNS UUID AS $$
DECLARE
  asignacion_id UUID;
BEGIN
  INSERT INTO asignaciones_acciones (
    accion_id, business_partner_id, tipo_asignacion, subcodigo, fecha_inicio, atributos
  )
  VALUES (
    accion_id, persona_id, tipo_asignacion, subcodigo, fecha_inicio, COALESCE(atributos, '{}')
  )
  RETURNING id INTO asignacion_id;

  RETURN asignacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION transferir_accion(
  accion_id UUID,
  nuevo_dueno_id UUID,
  fecha_transferencia DATE,
  atributos JSONB
) RETURNS UUID AS $$
DECLARE
  asignacion_id UUID;
BEGIN
  -- Finalize current assignment
  UPDATE asignaciones_acciones
  SET fecha_fin = fecha_transferencia - INTERVAL '1 day'
  WHERE accion_id = accion_id
    AND tipo_asignacion = 'dueño'
    AND es_vigente = TRUE;

  -- Create new assignment
  INSERT INTO asignaciones_acciones (
    accion_id, business_partner_id, tipo_asignacion, fecha_inicio, atributos
  )
  VALUES (
    accion_id, nuevo_dueno_id, 'dueño', fecha_transferencia, COALESCE(atributos, '{}')
  )
  RETURNING id INTO asignacion_id;

  RETURN asignacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### 23. Data Migrations (2025-08-26)

**File:** `20250826184235_add_data_migrations.sql`

Data migrations:

```sql
-- Migrate contact_emergencia_id to bp_relaciones
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id, tipo_relacion, rol_destino, descripcion, fecha_inicio, atributos
)
SELECT
  bp.organizacion_id,
  p.id,
  p.contacto_emergencia_id,
  'referencia',
  'Contacto de Emergencia',
  'Migrado desde campo contacto_emergencia_id',
  CURRENT_DATE,
  '{"migrado_desde": "personas.contacto_emergencia_id"}'::jsonb
FROM personas p
JOIN business_partners bp ON p.id = bp.id
WHERE p.contacto_emergencia_id IS NOT NULL
  AND p.eliminado_en IS NULL;
```

---

#### 24. Geographic Locations Update (2025-11-24)

**File:** `20251124184236_add_geographic_locations.sql`

Update geographic locations with Colombian data:

```sql
-- This migration added 1367 geographic locations
-- Including: 1 country, 32 departments, 1100+ cities, 200+ neighborhoods
```

---

## System Evolution

### Phase 1: Foundation (Migrations 1-7)
- **Date**: 2025-08-26
- **Focus**: Core data model
- **Tables**: organizations, business_partners, personas, empresas, bp_relaciones, acciones, asignaciones_acciones
- **Features**: CTI pattern, temporal tracking, soft delete

### Phase 2: Infrastructure (Migrations 8-12)
- **Date**: 2025-08-26
- **Focus**: Functions, views, RLS, enums, indexes
- **Features**: Helper functions, pre-built views, security policies, performance optimization

### Phase 3: Extensions (Migrations 13-16)
- **Date**: 2025-08-26
- **Focus**: Geographic data, opportunities, tasks, RBAC
- **Tables**: geographic_locations, oportunidades, tareas, role_permissions
- **Features**: Business operations, task management, role-based access

### Phase 4: Advanced Features (Migrations 17-23)
- **Date**: 2025-08-26
- **Focus**: Audit, validation, business logic
- **Features**: Automatic audit logging, data validation, business logic functions

### Phase 5: Data Updates (Migration 24)
- **Date**: 2025-11-24
- **Focus**: Geographic data
- **Updates**: Added 1367 Colombian geographic locations

---

## Best Practices

1. **Always use migrations for changes** - Never manual DB edits
2. **One migration per feature** - Keep focused
3. **Always include RLS policies** - Never create tables without RLS
4. **Test locally first** - Use Supabase CLI before production
5. **Never delete old migrations** - Migrations are append-only
6. **Descriptive names** - Future you will thank you
7. **Use generated columns** - For computed fields (es_actual, es_vigente)
8. **Leverage JSONB** - For flexible metadata and extensibility
9. **Implement soft delete** - For data retention and audit trails
10. **Create indexes** - For frequently queried columns

---

## Rollback Strategy

Create "down" migration to reverse changes:

```sql
-- Example: Remove billing table
-- 20240315130000_remove_billing_table.sql
DROP TABLE IF EXISTS billing;
```

**Important:** For production systems, prefer creating new migrations that fix issues rather than rolling back.

---

## Troubleshooting

**"Policy already exists"?**

- Ran schema.sql then tried migration
- Solution: Drop policies or use fresh database

**Changes not appearing locally?**

- Ensure CLI running: `supabase start`
- Check applied: `supabase db status`

**Production/local DB out of sync?**

- Run missing migrations in order
- Generate diff: `supabase db diff`

**Migration failed?**

- Check error message in Supabase Dashboard
- Verify all dependencies exist (tables, functions, types)
- Roll back manually if needed
- Fix migration and re-apply

---

## Related Documentation

### Database Documentation
- **[OVERVIEW.md](./database/OVERVIEW.md)** - Architecture patterns and concepts
- **[SCHEMA.md](./database/SCHEMA.md)** - Complete schema with ERD diagrams
- **[TABLES.md](./database/TABLES.md)** - Data dictionary for all tables
- **[FUNCTIONS.md](./database/FUNCTIONS.md)** - All database functions
- **[VIEWS.md](./database/VIEWS.md)** - Pre-built views reference
- **[RLS.md](./database/RLS.md)** - Row Level Security policies
- **[QUERIES.md](./database/QUERIES.md)** - SQL patterns and examples

### API Documentation
- **[../api/README.md](../api/README.md)** - API overview and RPC index
- **[../api/CREAR_PERSONA.md](../api/CREAR_PERSONA.md)** - Create natural person
- **[../api/CREAR_EMPRESA.md](../api/CREAR_EMPRESA.md)** - Create company
- **[../api/BP_RELACIONES.md](../api/BP_RELACIONES.md)** - Relationship management
- **[../api/ACCIONES.md](../api/ACCIONES.md)** - Club shares management

---

**Last Updated:** 2026-01-03
**Total Migrations:** 24
**Database Version:** PostgreSQL 17
