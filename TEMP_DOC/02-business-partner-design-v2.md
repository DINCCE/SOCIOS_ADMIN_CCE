# Diseño de Base de Datos - Sistema de Gestión de Socios V2
## Club Social Privado - Revisión basada en feedback

---

## CAMBIOS PRINCIPALES

### ✅ Correcciones aplicadas:
1. **Eliminado `category` de `business_partners`**: El Actor no define si es socio o no
2. **Eliminado `attributes` JSONB de `business_partners`**: Solo en Personas y Empresas
3. **Agregados campos de control completos**: created_at, created_by, updated_at, updated_by, deleted_at
4. **Revisión de campos de Persona**: Nombres y Apellidos como campos separados
5. **Campos de Empresa**: Específicos para empresas en Colombia

---

## 1. ESQUEMA REVISADO

### 1.1 Tabla Base: `business_partners` (Actor)

**Propósito:** Entidad base mínima que representa cualquier actor (persona o empresa).

```sql
create table business_partners (
  -- Identificación
  id uuid default gen_random_uuid() primary key,
  code text unique not null,  -- Código único del actor (ej: "BP-2024-001")

  -- Tipo de actor (discriminador)
  partner_type text not null check (partner_type in ('person', 'company')),

  -- Multi-tenancy (organización)
  org_id uuid references organizations(id) on delete cascade not null,

  -- Estado general
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended')),

  -- Información de contacto básica (compartida)
  primary_email text,
  primary_phone text,

  -- Campos de control (auditoría)
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_at timestamptz default now() not null,
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,  -- Soft delete
  deleted_by uuid references auth.users(id)
);

-- Índices
create index idx_bp_org_id on business_partners(org_id);
create index idx_bp_type on business_partners(partner_type);
create index idx_bp_status on business_partners(status);
create index idx_bp_code on business_partners(code);
create index idx_bp_deleted on business_partners(deleted_at) where deleted_at is null;

-- Trigger para updated_at
create trigger update_bp_updated_at before update on business_partners
  for each row execute function update_updated_at_column();
```

**Campos del Actor (mínimos):**
- ✅ `id`: UUID único
- ✅ `code`: Código legible (ej: "BP-2024-001")
- ✅ `partner_type`: Discriminador ('person' o 'company')
- ✅ `org_id`: Multi-tenant
- ✅ `status`: Estado operativo
- ✅ `primary_email/phone`: Contacto básico
- ✅ Campos de control: created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
- ❌ **NO** tiene `category` (eso va en tabla de socios, cuando la creemos)
- ❌ **NO** tiene `attributes` JSONB (eso va en Personas/Empresas)

---

### 1.2 Tabla Especializada: `personas`

**Propósito:** Información específica de personas físicas.

```sql
create table personas (
  -- PK/FK compartida con business_partners
  id uuid primary key references business_partners(id) on delete cascade,

  -- Documento de identidad
  document_type text not null
    check (document_type in (
      'CC',        -- Cédula de Ciudadanía
      'CE',        -- Cédula de Extranjería
      'TI',        -- Tarjeta de Identidad
      'PA',        -- Pasaporte
      'RC',        -- Registro Civil
      'NIT',       -- NIT (personas naturales)
      'PEP',       -- Permiso Especial de Permanencia
      'PPT',       -- Permiso de Protección Temporal
      'DNI',       -- Documento Nacional de Identidad (extranjero)
      'NUIP'       -- Número Único de Identificación Personal
    )),
  document_number text not null,
  document_expedition_date date,
  document_expedition_place text,  -- Ciudad/municipio de expedición

  -- Nombres (separados)
  first_name text not null,   -- Primer nombre
  second_name text,            -- Segundo nombre (opcional)

  -- Apellidos (separados)
  first_surname text not null,   -- Primer apellido
  second_surname text,            -- Segundo apellido (opcional)

  -- Información demográfica
  gender text not null
    check (gender in ('M', 'F', 'O', 'N')),  -- Male, Female, Other, Not specified
  date_of_birth date not null,
  place_of_birth text,  -- Ciudad/municipio de nacimiento
  nationality text default 'CO',  -- ISO 3166-1 alpha-2

  -- Estado civil
  marital_status text
    check (marital_status in (
      'single',        -- Soltero/a
      'married',       -- Casado/a
      'free_union',    -- Unión libre
      'divorced',      -- Divorciado/a
      'widowed',       -- Viudo/a
      'separated'      -- Separado/a
    )),

  -- Información laboral/profesional
  occupation text,
  profession text,  -- Título profesional
  education_level text
    check (education_level in (
      'elementary',    -- Primaria
      'highschool',    -- Bachillerato
      'technical',     -- Técnico
      'technologist',  -- Tecnólogo
      'undergraduate', -- Pregrado
      'postgraduate',  -- Posgrado
      'masters',       -- Maestría
      'doctorate'      -- Doctorado
    )),

  -- RH y Grupo Sanguíneo (útil para clubes con servicios médicos)
  blood_type text
    check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),

  -- Atributos extendidos (JSON)
  attributes jsonb default '{}'::jsonb,

  -- Campos de control
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices
create unique index idx_persona_document
  on personas(document_type, document_number);
create index idx_persona_names
  on personas(first_name, first_surname);
create index idx_persona_birth_date
  on personas(date_of_birth);
create index idx_persona_gender
  on personas(gender);
create index idx_persona_attributes
  on personas using gin(attributes);

-- Trigger para updated_at
create trigger update_persona_updated_at before update on personas
  for each row execute function update_updated_at_column();
```

**Campos de Persona (completos):**
- ✅ Documento: `document_type`, `document_number`, `document_expedition_date`, `document_expedition_place`
- ✅ Nombres: `first_name`, `second_name` (separados)
- ✅ Apellidos: `first_surname`, `second_surname` (separados)
- ✅ Género: `gender` (M/F/O/N)
- ✅ Nacimiento: `date_of_birth`, `place_of_birth`
- ✅ Estado civil: `marital_status`
- ✅ Profesión: `occupation`, `profession`, `education_level`
- ✅ Salud: `blood_type`
- ✅ Atributos extendidos: `attributes` JSONB

**Ejemplos de `attributes` JSONB para personas:**
```json
{
  "emergency_contact": {
    "name": "María García López",
    "relationship": "spouse",
    "phone": "+57 300 123 4567"
  },
  "allergies": ["penicilina", "mariscos"],
  "medical_notes": "Diabetes tipo 2",
  "shirt_size": "M",
  "referred_by": "Juan Pérez",
  "hobbies": ["golf", "tenis", "lectura"]
}
```

---

### 1.3 Tabla Especializada: `empresas`

**Propósito:** Información específica de empresas/corporaciones en Colombia.

```sql
create table empresas (
  -- PK/FK compartida con business_partners
  id uuid primary key references business_partners(id) on delete cascade,

  -- Identificación Tributaria
  nit text not null unique,  -- Número de Identificación Tributaria
  verification_digit text not null check (length(verification_digit) = 1),  -- DV

  -- Nombre Legal y Comercial
  legal_name text not null,   -- Razón social completa
  trade_name text,             -- Nombre comercial

  -- Tipo de Sociedad
  company_type text not null
    check (company_type in (
      'SA',          -- Sociedad Anónima
      'SAS',         -- Sociedad por Acciones Simplificada
      'LTDA',        -- Sociedad Limitada
      'E.U.',        -- Empresa Unipersonal
      'COOP',        -- Cooperativa
      'FUNDACION',   -- Fundación
      'CORP',        -- Corporación
      'ONG',         -- Organización sin ánimo de lucro
      'SUCURSAL',    -- Sucursal de sociedad extranjera
      'OTHER'        -- Otro
    )),

  -- Información de Constitución
  incorporation_date date,
  incorporation_city text,
  incorporation_country text default 'CO',
  registration_number text,  -- Número de matrícula mercantil
  registration_chamber text,  -- Cámara de Comercio

  -- Clasificación Económica
  ciiu_code text,  -- Código CIIU (Clasificación Industrial Internacional Uniforme)
  industry_sector text,  -- Sector económico
  economic_activity text,  -- Actividad económica principal

  -- Tamaño de la Empresa
  company_size text
    check (company_size in (
      'micro',       -- Microempresa (< 10 empleados, activos < 500 SMMLV)
      'small',       -- Pequeña (11-50 empleados, activos 501-5,000 SMMLV)
      'medium',      -- Mediana (51-200 empleados, activos 5,001-30,000 SMMLV)
      'large'        -- Grande (> 200 empleados, activos > 30,000 SMMLV)
    )),

  -- Representante Legal
  legal_representative_id uuid references personas(id),
  legal_representative_position text,  -- Cargo (ej: "Gerente General")
  legal_representative_id_type text,   -- Tipo de documento del representante
  legal_representative_id_number text, -- Número de documento del representante

  -- Contacto Corporativo
  website text,
  main_email text,
  main_phone text,

  -- Información Financiera (opcional)
  annual_revenue numeric(15, 2),
  employee_count integer,

  -- Atributos extendidos (JSON)
  attributes jsonb default '{}'::jsonb,

  -- Campos de control
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices
create unique index idx_empresa_nit on empresas(nit);
create index idx_empresa_legal_name on empresas(legal_name);
create index idx_empresa_trade_name on empresas(trade_name);
create index idx_empresa_legal_rep on empresas(legal_representative_id);
create index idx_empresa_company_type on empresas(company_type);
create index idx_empresa_ciiu on empresas(ciiu_code);
create index idx_empresa_attributes on empresas using gin(attributes);

-- Trigger para updated_at
create trigger update_empresa_updated_at before update on empresas
  for each row execute function update_updated_at_column();
```

**Campos de Empresa (específicos para Colombia):**
- ✅ Identificación: `nit`, `verification_digit`
- ✅ Nombres: `legal_name`, `trade_name`
- ✅ Tipo societario: `company_type` (SA, SAS, LTDA, etc.)
- ✅ Constitución: `incorporation_date`, `registration_number`, `registration_chamber`
- ✅ Clasificación: `ciiu_code`, `industry_sector`, `economic_activity`
- ✅ Tamaño: `company_size` (micro, pequeña, mediana, grande)
- ✅ Representante legal: `legal_representative_id` (FK a personas), position, document
- ✅ Contacto: `website`, `main_email`, `main_phone`
- ✅ Financiero: `annual_revenue`, `employee_count`
- ✅ Atributos extendidos: `attributes` JSONB

**Ejemplos de `attributes` JSONB para empresas:**
```json
{
  "certifications": ["ISO 9001:2015", "ISO 14001:2015"],
  "main_products": ["Software empresarial", "Consultoría"],
  "rut_document_url": "https://storage.example.com/rut-123456.pdf",
  "chamber_certificate_url": "https://storage.example.com/cert-123456.pdf",
  "tax_regime": "Régimen Común",
  "responsible_for_vat": true,
  "self_withholding": true,
  "branch_offices": [
    {"city": "Medellín", "address": "Calle 50 #45-20"},
    {"city": "Cali", "address": "Avenida 6 #23-45"}
  ]
}
```

---

## 2. VALIDACIONES Y CONSTRAINTS

### 2.1 Validación de NIT con Dígito de Verificación

```sql
-- Función para calcular el dígito de verificación del NIT
create or replace function calculate_nit_dv(nit_number text)
returns text as $$
declare
  nit_clean text;
  weights int[] := array[71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  sum_val int := 0;
  dv int;
  i int;
begin
  -- Limpiar el NIT (solo números)
  nit_clean := regexp_replace(nit_number, '[^0-9]', '', 'g');

  -- Calcular suma ponderada
  for i in 1..least(length(nit_clean), 15) loop
    sum_val := sum_val + (substring(nit_clean, length(nit_clean) - i + 1, 1)::int * weights[i]);
  end loop;

  -- Calcular dígito de verificación
  dv := sum_val % 11;

  if dv >= 2 then
    dv := 11 - dv;
  end if;

  return dv::text;
end;
$$ language plpgsql immutable;

-- Constraint para validar DV
alter table empresas add constraint check_nit_dv
  check (verification_digit = calculate_nit_dv(nit));
```

### 2.2 Validación de Edad Mínima (Personas)

```sql
-- Constraint: La persona debe tener al menos 18 años (ajustar según necesidad)
alter table personas add constraint check_minimum_age
  check (
    date_of_birth is null or
    date_of_birth <= current_date - interval '18 years'
  );
```

### 2.3 Trigger: Consistencia de `partner_type`

```sql
create or replace function validate_partner_type_consistency()
returns trigger as $$
begin
  -- Verificar que el partner_type coincida con la tabla especializada
  if new.partner_type = 'person' then
    if not exists (select 1 from personas where id = new.id) then
      raise exception 'Business partner of type "person" must have a record in personas table';
    end if;
  elsif new.partner_type = 'company' then
    if not exists (select 1 from empresas where id = new.id) then
      raise exception 'Business partner of type "company" must have a record in empresas table';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger check_partner_type_consistency
  after insert or update of partner_type on business_partners
  for each row
  execute function validate_partner_type_consistency();
```

---

## 3. QUERIES DE EJEMPLO

### 3.1 Vista Completa de Personas

```sql
create or replace view v_personas_full as
select
  bp.id,
  bp.code,
  bp.org_id,
  bp.status,
  bp.primary_email,
  bp.primary_phone,

  -- Documento
  p.document_type,
  p.document_number,

  -- Nombre completo (calculado)
  trim(
    coalesce(p.first_name, '') || ' ' ||
    coalesce(p.second_name, '') || ' ' ||
    coalesce(p.first_surname, '') || ' ' ||
    coalesce(p.second_surname, '')
  ) as full_name,

  -- Campos individuales
  p.first_name,
  p.second_name,
  p.first_surname,
  p.second_surname,

  p.gender,
  p.date_of_birth,

  -- Edad calculada
  extract(year from age(current_date, p.date_of_birth))::int as age,

  p.nationality,
  p.marital_status,
  p.occupation,
  p.blood_type,
  p.attributes,

  bp.created_at,
  bp.created_by,
  bp.updated_at,
  bp.updated_by,
  bp.deleted_at
from business_partners bp
join personas p on bp.id = p.id
where bp.partner_type = 'person';
```

### 3.2 Vista Completa de Empresas

```sql
create or replace view v_empresas_full as
select
  bp.id,
  bp.code,
  bp.org_id,
  bp.status,
  bp.primary_email,
  bp.primary_phone,

  -- NIT completo
  e.nit || '-' || e.verification_digit as nit_complete,
  e.nit,
  e.verification_digit,

  e.legal_name,
  e.trade_name,
  e.company_type,
  e.incorporation_date,
  e.registration_number,
  e.ciiu_code,
  e.industry_sector,
  e.company_size,

  -- Representante legal
  e.legal_representative_id,
  rep.first_name || ' ' || rep.first_surname as representative_name,
  e.legal_representative_position,

  e.website,
  e.employee_count,
  e.annual_revenue,
  e.attributes,

  bp.created_at,
  bp.created_by,
  bp.updated_at,
  bp.updated_by,
  bp.deleted_at
from business_partners bp
join empresas e on bp.id = e.id
left join personas rep on e.legal_representative_id = rep.id
where bp.partner_type = 'company';
```

### 3.3 Query Unificada (Personas y Empresas)

```sql
select
  bp.id,
  bp.code,
  bp.partner_type,
  bp.status,

  -- Nombre/Razón Social (unificado)
  case
    when bp.partner_type = 'person' then
      trim(p.first_name || ' ' || p.first_surname)
    when bp.partner_type = 'company' then
      e.legal_name
  end as display_name,

  -- Documento/NIT (unificado)
  case
    when bp.partner_type = 'person' then
      p.document_type || ' ' || p.document_number
    when bp.partner_type = 'company' then
      'NIT ' || e.nit || '-' || e.verification_digit
  end as identification,

  bp.primary_email,
  bp.primary_phone,
  bp.created_at

from business_partners bp
left join personas p on bp.id = p.id and bp.partner_type = 'person'
left join empresas e on bp.id = e.id and bp.partner_type = 'company'
where bp.deleted_at is null
  and bp.org_id = 'xxx-xxx-xxx';
```

---

## 4. PREGUNTAS PARA CONTINUAR LA DISCUSIÓN

### 4.1 Sobre Personas

1. **Campos faltantes:**
   - ¿Necesitamos campo de **fotografía** (avatar_url)?
   - ¿Campo de **firma digital**?
   - ¿**Nacionalidad** solo una o puede tener doble nacionalidad?
   - ¿Información de **contacto de emergencia** (tabla separada o JSON)?

2. **Validaciones:**
   - ¿Edad mínima requerida? (¿18 años?)
   - ¿Algún tipo de documento es obligatorio o todos son válidos?
   - ¿El `document_number` debe ser único globalmente o por `document_type`?

3. **Datos demográficos:**
   - ¿Necesitamos **estrato socioeconómico**?
   - ¿**Religión** o preferencias culturales?
   - ¿**Idiomas** que habla?

### 4.2 Sobre Empresas

1. **Campos adicionales:**
   - ¿Necesitamos **fecha de renovación de matrícula mercantil**?
   - ¿**Número de empleados** por género (para reportes de equidad)?
   - ¿**Certificado de existencia y representación legal** (URL del documento)?

2. **Representante Legal:**
   - ¿Una empresa puede tener **múltiples representantes legales**?
   - ¿Necesitamos **historial de representantes** (quién fue antes)?
   - ¿El representante legal **debe ser un socio** del club o puede ser externo?

3. **Facturación:**
   - ¿Necesitamos **dirección de facturación** separada?
   - ¿**Régimen tributario** (común, simplificado)?
   - ¿Si es **gran contribuyente** o **autorretenedor**?

### 4.3 Sobre Direcciones y Contactos

1. **¿Necesitamos tablas separadas para direcciones y contactos?**
   - O con `primary_email` y `primary_phone` en `business_partners` es suficiente?

2. **Si necesitamos múltiples direcciones:**
   - ¿Separamos dirección de residencia, trabajo, facturación?
   - ¿Importa el **historial** (cuándo cambió de dirección)?

3. **Otros contactos:**
   - ¿Emails/teléfonos alternativos?
   - ¿Redes sociales (LinkedIn, Twitter)?
   - ¿WhatsApp Business para empresas?

### 4.4 Sobre Relaciones entre Actores

1. **Familias:**
   - ¿Necesitamos modelar **relaciones familiares** (esposo/a, hijos)?
   - ¿Hay beneficios/descuentos por **grupo familiar**?

2. **Empresas y Personas:**
   - ¿Una persona puede ser **accionista** de empresas socias?
   - ¿Necesitamos rastrear **vínculos laborales** (quién trabaja en qué empresa)?

3. **Jerarquías empresariales:**
   - ¿Una empresa puede tener **subsidiarias** o **matriz**?

### 4.5 Sobre Atributos JSONB

1. **¿Qué atributos específicos necesita el club?**
   - Para personas: ¿Deportes que practica? ¿Talla de ropa? ¿Preferencias alimenticias?
   - Para empresas: ¿Certificaciones? ¿Productos/servicios? ¿Sucursales?

2. **¿Debemos validar la estructura del JSON** o es completamente libre?

3. **¿Hay atributos que inicialmente pensamos en JSON pero deberían ser campos reales?**

---

## 5. PRÓXIMOS PASOS

Una vez tengamos claridad en estas preguntas, podemos:

1. ✅ Finalizar el diseño de `business_partners`, `personas`, `empresas`
2. 🔲 Diseñar tablas auxiliares (addresses, contacts, relationships)
3. 🔲 Definir la estructura de las tablas de **Socios** (que usará `business_partners` como FK)
4. 🔲 Crear las migraciones SQL
5. 🔲 Implementar Zod schemas y tipos TypeScript

---

**Esperando tu feedback para continuar refinando el diseño.**
