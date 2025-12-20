# Diseño de Base de Datos - Sistema de Gestión de Socios
## Club Social Privado

---

## 1. RESUMEN EJECUTIVO

Este documento propone el diseño de base de datos para gestionar Business Partners (Socios) de un club social privado, utilizando un patrón de herencia para diferenciar entre Personas y Empresas.

### Objetivos
- ✅ Modelar Business Partners como entidad base (Actor)
- ✅ Soportar Personas y Empresas con atributos específicos
- ✅ Mantener flexibilidad con campos JSON para atributos extendidos
- ✅ Implementar Row Level Security (RLS) para multi-tenancy
- ✅ Seguir patrones del proyecto actual (Supabase + Next.js)

---

## 2. ARQUITECTURA PROPUESTA

### 2.1 Patrón de Herencia: Shared Primary Key

```
┌─────────────────────────┐
│   business_partners     │  ← Entidad Base (Actor)
│  (id = UUID PK)         │
└───────────┬─────────────┘
            │
            ├──────────────────┬──────────────────┐
            │                  │                  │
┌───────────▼─────────┐ ┌─────▼────────────┐ ┌──▼───────────────┐
│      personas       │ │     empresas     │ │  (future types)  │
│  (id = UUID PK/FK)  │ │ (id = UUID PK/FK)│ │                  │
└─────────────────────┘ └──────────────────┘ └──────────────────┘
```

**Ventajas de este diseño:**
- ✅ Un `business_partner` puede ser **persona** o **empresa** (nunca ambos)
- ✅ El `id` se comparte entre la tabla base y las especializaciones
- ✅ Queries eficientes con JOINs simples
- ✅ Integridad referencial garantizada
- ✅ Extensible para futuros tipos (ej: fundaciones, cooperativas)

---

## 3. ESQUEMA DE TABLAS

### 3.1 Tabla Base: `business_partners`

**Propósito:** Entidad principal que representa cualquier actor en el sistema.

```sql
create table business_partners (
  -- Identificación
  id uuid default gen_random_uuid() primary key,
  code text unique not null,  -- Código único del socio (ej: "SOC-2024-001")

  -- Tipo de actor
  partner_type text not null check (partner_type in ('person', 'company')),

  -- Multi-tenancy (club/organización)
  org_id uuid references organizations(id) on delete cascade not null,

  -- Estado del socio
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended', 'pending')),

  -- Categoría/Tipo de socio
  category text not null default 'regular'
    check (category in ('regular', 'honorary', 'founding', 'temporary', 'corporate')),

  -- Fechas importantes
  admission_date date not null default current_date,
  termination_date date,

  -- Información de contacto compartida
  primary_email text,
  primary_phone text,

  -- Atributos extendidos (JSON)
  attributes jsonb default '{}'::jsonb,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Índices
create index idx_bp_org_id on business_partners(org_id);
create index idx_bp_type on business_partners(partner_type);
create index idx_bp_status on business_partners(status);
create index idx_bp_code on business_partners(code);
create index idx_bp_attributes on business_partners using gin(attributes);

-- Trigger para updated_at
create trigger update_bp_updated_at before update on business_partners
  for each row execute function update_updated_at_column();
```

**Campos clave:**
- `partner_type`: Discriminador para saber si es `person` o `company`
- `code`: Código único del socio (útil para UI, ej: "SOC-2024-001")
- `org_id`: Soporte multi-tenant (un club puede tener múltiples organizaciones)
- `category`: Tipo de membresía (regular, honorario, fundador, temporal, corporativo)
- `attributes`: JSONB para campos customizables sin modificar schema

---

### 3.2 Tabla Especializada: `personas`

**Propósito:** Información específica de personas físicas.

```sql
create table personas (
  -- PK/FK compartida con business_partners
  id uuid primary key references business_partners(id) on delete cascade,

  -- Documento de identidad
  document_type text not null
    check (document_type in ('dni', 'passport', 'cedula', 'rut', 'other')),
  document_number text not null,
  document_country text default 'CO',  -- ISO 3166-1 alpha-2

  -- Nombre completo
  first_name text not null,
  middle_name text,
  last_name text not null,
  second_last_name text,

  -- Información demográfica
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  date_of_birth date,
  nationality text,  -- ISO 3166-1 alpha-2

  -- Información adicional
  marital_status text check (marital_status in ('single', 'married', 'divorced', 'widowed', 'other')),
  occupation text,

  -- Atributos extendidos (JSON)
  attributes jsonb default '{}'::jsonb,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices
create unique index idx_persona_document on personas(document_type, document_number, document_country);
create index idx_persona_birth_date on personas(date_of_birth);
create index idx_persona_attributes on personas using gin(attributes);

-- Trigger para updated_at
create trigger update_persona_updated_at before update on personas
  for each row execute function update_updated_at_column();
```

**Campos clave:**
- `document_type/document_number`: Identificación legal única
- `first_name/last_name`: Nombre completo separado (útil para reportes)
- `date_of_birth`: Para cálculos de edad, cumpleaños automáticos
- `attributes`: JSONB para campos como "alergias", "contacto de emergencia", etc.

---

### 3.3 Tabla Especializada: `empresas`

**Propósito:** Información específica de empresas/corporaciones.

```sql
create table empresas (
  -- PK/FK compartida con business_partners
  id uuid primary key references business_partners(id) on delete cascade,

  -- Identificación empresarial
  tax_id_type text not null
    check (tax_id_type in ('nit', 'rut', 'ein', 'vat', 'other')),
  tax_id_number text not null,
  tax_id_country text default 'CO',  -- ISO 3166-1 alpha-2

  -- Nombre legal y comercial
  legal_name text not null,
  trade_name text,

  -- Información corporativa
  industry text,  -- Sector/industria (ej: "technology", "healthcare")
  company_size text check (company_size in ('micro', 'small', 'medium', 'large', 'enterprise')),
  incorporation_date date,
  incorporation_country text,  -- ISO 3166-1 alpha-2

  -- Representante legal (referencia a una persona)
  legal_representative_id uuid references personas(id),
  legal_representative_title text,  -- Cargo del representante

  -- Website y redes sociales
  website text,

  -- Atributos extendidos (JSON)
  attributes jsonb default '{}'::jsonb,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices
create unique index idx_empresa_tax_id on empresas(tax_id_type, tax_id_number, tax_id_country);
create index idx_empresa_legal_rep on empresas(legal_representative_id);
create index idx_empresa_industry on empresas(industry);
create index idx_empresa_attributes on empresas using gin(attributes);

-- Trigger para updated_at
create trigger update_empresa_updated_at before update on empresas
  for each row execute function update_updated_at_column();
```

**Campos clave:**
- `tax_id_type/tax_id_number`: Identificación tributaria única
- `legal_name/trade_name`: Nombre legal vs nombre comercial
- `legal_representative_id`: Vincula con una persona (representante legal)
- `attributes`: JSONB para campos como "certificaciones", "socios", etc.

---

## 4. TABLAS AUXILIARES RECOMENDADAS

### 4.1 Tabla: `organizations`

**Propósito:** Multi-tenancy. Un club puede tener múltiples organizaciones/sedes.

```sql
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,  -- URL-friendly identifier
  type text default 'club' check (type in ('club', 'branch', 'division')),
  parent_org_id uuid references organizations(id),  -- Jerarquía

  -- Información de contacto
  email text,
  phone text,
  website text,

  -- Dirección
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'CO',

  -- Configuración
  settings jsonb default '{}'::jsonb,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_org_slug on organizations(slug);
create index idx_org_parent on organizations(parent_org_id);
```

---

### 4.2 Tabla: `addresses` (Opcional)

**Propósito:** Direcciones de socios (una persona/empresa puede tener múltiples).

```sql
create table addresses (
  id uuid default gen_random_uuid() primary key,
  business_partner_id uuid references business_partners(id) on delete cascade not null,

  -- Tipo de dirección
  address_type text not null default 'home'
    check (address_type in ('home', 'work', 'billing', 'shipping', 'other')),

  -- Dirección
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text,
  country text not null default 'CO',

  -- Geolocalización (opcional)
  latitude numeric(10, 8),
  longitude numeric(11, 8),

  -- Control
  is_primary boolean default false,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_address_bp on addresses(business_partner_id);
create index idx_address_type on addresses(address_type);
create index idx_address_primary on addresses(is_primary) where is_primary = true;
```

---

### 4.3 Tabla: `contacts` (Opcional)

**Propósito:** Información de contacto adicional (emails, teléfonos, redes sociales).

```sql
create table contacts (
  id uuid default gen_random_uuid() primary key,
  business_partner_id uuid references business_partners(id) on delete cascade not null,

  -- Tipo de contacto
  contact_type text not null
    check (contact_type in ('email', 'phone', 'mobile', 'whatsapp', 'linkedin', 'other')),

  -- Valor
  contact_value text not null,

  -- Etiquetas
  label text,  -- ej: "Personal", "Work", "Emergency"
  is_primary boolean default false,

  -- Metadata
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_contact_bp on contacts(business_partner_id);
create index idx_contact_type on contacts(contact_type);
create index idx_contact_primary on contacts(is_primary) where is_primary = true;
```

---

## 5. ROW LEVEL SECURITY (RLS)

### 5.1 Políticas para `business_partners`

```sql
-- Habilitar RLS
alter table business_partners enable row level security;

-- Los usuarios solo pueden ver socios de su organización
create policy "Users can view org partners"
  on business_partners for select
  using (
    org_id in (
      select org_id from user_roles
      where user_id = auth.uid()
    )
  );

-- Los usuarios solo pueden insertar socios en su organización
create policy "Users can insert org partners"
  on business_partners for insert
  with check (
    org_id in (
      select org_id from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- Los usuarios solo pueden actualizar socios de su organización
create policy "Users can update org partners"
  on business_partners for update
  using (
    org_id in (
      select org_id from user_roles
      where user_id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- Solo admins pueden eliminar socios
create policy "Admins can delete org partners"
  on business_partners for delete
  using (
    org_id in (
      select org_id from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );
```

### 5.2 Políticas para `personas` y `empresas`

```sql
-- Personas
alter table personas enable row level security;

create policy "Users can view org personas"
  on personas for select
  using (
    id in (
      select id from business_partners
      where org_id in (
        select org_id from user_roles where user_id = auth.uid()
      )
    )
  );

-- Similar para INSERT, UPDATE, DELETE
-- (Copiar patrón de business_partners)

-- Empresas
alter table empresas enable row level security;

create policy "Users can view org empresas"
  on empresas for select
  using (
    id in (
      select id from business_partners
      where org_id in (
        select org_id from user_roles where user_id = auth.uid()
      )
    )
  );

-- Similar para INSERT, UPDATE, DELETE
```

**Nota:** Se asume la existencia de una tabla `user_roles` que vincula usuarios con organizaciones y roles.

---

## 6. TRIGGERS Y FUNCIONES

### 6.1 Función: `update_updated_at_column()`

```sql
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

### 6.2 Trigger: Validar consistencia de `partner_type`

```sql
-- Asegurar que si partner_type = 'person', existe registro en personas
create or replace function validate_partner_type()
returns trigger as $$
begin
  if new.partner_type = 'person' then
    if not exists (select 1 from personas where id = new.id) then
      raise exception 'Business partner marked as person must have entry in personas table';
    end if;
  elsif new.partner_type = 'company' then
    if not exists (select 1 from empresas where id = new.id) then
      raise exception 'Business partner marked as company must have entry in empresas table';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_partner_type
  after insert or update on business_partners
  for each row execute function validate_partner_type();
```

---

## 7. QUERIES DE EJEMPLO

### 7.1 Obtener todos los socios con información completa

```sql
-- Personas
select
  bp.id,
  bp.code,
  bp.partner_type,
  bp.status,
  bp.category,
  bp.admission_date,
  p.first_name,
  p.last_name,
  p.document_type,
  p.document_number,
  p.date_of_birth,
  bp.primary_email,
  bp.primary_phone
from business_partners bp
join personas p on bp.id = p.id
where bp.org_id = 'xxx-xxx-xxx'
  and bp.partner_type = 'person'
  and bp.status = 'active';

-- Empresas
select
  bp.id,
  bp.code,
  bp.partner_type,
  bp.status,
  bp.category,
  bp.admission_date,
  e.legal_name,
  e.trade_name,
  e.tax_id_number,
  e.industry,
  bp.primary_email,
  bp.primary_phone
from business_partners bp
join empresas e on bp.id = e.id
where bp.org_id = 'xxx-xxx-xxx'
  and bp.partner_type = 'company'
  and bp.status = 'active';
```

### 7.2 Vista unificada (opcional)

```sql
create or replace view v_business_partners_full as
select
  bp.id,
  bp.code,
  bp.partner_type,
  bp.org_id,
  bp.status,
  bp.category,
  bp.admission_date,
  bp.primary_email,
  bp.primary_phone,
  bp.attributes as bp_attributes,

  -- Campos de personas (null si es empresa)
  p.first_name,
  p.last_name,
  p.document_type,
  p.document_number,
  p.date_of_birth,
  p.gender,
  p.attributes as person_attributes,

  -- Campos de empresas (null si es persona)
  e.legal_name,
  e.trade_name,
  e.tax_id_number,
  e.industry,
  e.legal_representative_id,
  e.attributes as company_attributes,

  bp.created_at,
  bp.updated_at
from business_partners bp
left join personas p on bp.id = p.id and bp.partner_type = 'person'
left join empresas e on bp.id = e.id and bp.partner_type = 'company';
```

---

## 8. CONSIDERACIONES IMPORTANTES

### 8.1 Campos JSON (`attributes`)

**Uso recomendado:**
- ✅ Campos específicos del club que no están en el schema base
- ✅ Datos que cambian frecuentemente en estructura
- ✅ Atributos customizables por organización

**Ejemplos para Personas:**
```json
{
  "emergency_contact": {
    "name": "Juan Pérez",
    "phone": "+57 300 123 4567",
    "relationship": "spouse"
  },
  "dietary_restrictions": ["vegetarian", "gluten-free"],
  "membership_number": "2024-001",
  "referrer": "María García"
}
```

**Ejemplos para Empresas:**
```json
{
  "certifications": ["ISO 9001", "ISO 14001"],
  "main_products": ["Software", "Consulting"],
  "employee_count": 150,
  "annual_revenue": "5M USD"
}
```

### 8.2 Generación de Códigos (`code`)

**Opción 1: Trigger automático**
```sql
create or replace function generate_partner_code()
returns trigger as $$
begin
  if new.code is null then
    new.code := 'SOC-' ||
                to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('partner_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create sequence partner_code_seq start 1;

create trigger set_partner_code
  before insert on business_partners
  for each row execute function generate_partner_code();
```

**Opción 2: Generación en aplicación**
```typescript
// Ejemplo en Server Action
const lastCode = await supabase
  .from('business_partners')
  .select('code')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

const year = new Date().getFullYear()
const sequence = lastCode ? parseInt(lastCode.split('-')[2]) + 1 : 1
const newCode = `SOC-${year}-${sequence.toString().padStart(4, '0')}`
```

### 8.3 Soft Delete vs Hard Delete

**Recomendación:** Usar soft delete con campo `status = 'inactive'` o `deleted_at`.

```sql
-- Agregar a business_partners
alter table business_partners add column deleted_at timestamptz;

-- Modificar RLS policies para excluir eliminados
create policy "Users can view active org partners"
  on business_partners for select
  using (
    org_id in (select org_id from user_roles where user_id = auth.uid())
    and deleted_at is null
  );
```

---

## 9. PRÓXIMOS PASOS

### Fase 1: Diseño y Validación (ACTUAL)
- [ ] Revisar este documento con el equipo
- [ ] Validar campos requeridos vs opcionales
- [ ] Definir valores de ENUM (status, category, etc.)
- [ ] Acordar uso de campos JSON

### Fase 2: Implementación
- [ ] Crear migración SQL en `supabase/migrations/`
- [ ] Implementar triggers y funciones
- [ ] Configurar RLS policies
- [ ] Crear índices de performance

### Fase 3: Tipado y Validación
- [ ] Crear Zod schemas en `types/schema.ts`
- [ ] Generar tipos TypeScript automáticos
- [ ] Crear Server Actions para CRUD operations

### Fase 4: UI y Features
- [ ] Crear `features/partners/` con componentes
- [ ] Implementar formularios de creación/edición
- [ ] Agregar listado con filtros y búsqueda
- [ ] Implementar vistas detalladas

---

## 10. PREGUNTAS PARA DISCUSIÓN

1. **Multi-tenancy:**
   - ¿El sistema manejará un solo club o múltiples clubes/organizaciones?
   - ¿Necesitamos jerarquía de organizaciones (club → sedes → divisiones)?

2. **Campos personalizados:**
   - ¿Qué atributos extendidos específicos necesita el club?
   - ¿Debemos permitir configurar campos custom por organización?

3. **Categorías de socios:**
   - ¿Cuáles son las categorías/tipos de membresía exactas?
   - ¿Hay diferencias en permisos/beneficios por categoría?

4. **Empresas y representantes:**
   - ¿Una empresa puede tener múltiples representantes?
   - ¿Los representantes deben ser socios también?

5. **Direcciones y contactos:**
   - ¿Necesitamos múltiples direcciones por socio?
   - ¿Importa el historial de direcciones (cambios en el tiempo)?

6. **Relaciones familiares:**
   - ¿Necesitamos modelar familias (ej: socio titular + beneficiarios)?
   - ¿Hay descuentos/beneficios por grupo familiar?

7. **Integración con auth:**
   - ¿Todos los socios tendrán usuario en el sistema?
   - ¿O solo el personal administrativo?

8. **Migración de datos:**
   - ¿Existe un sistema previo con datos a migrar?
   - ¿Necesitamos campos para compatibilidad legacy?

---

## ANEXOS

### A. Diagrama ER Simplificado

```
organizations (1) ──< (N) business_partners
                              │
                              ├──< (1) personas
                              └──< (1) empresas
                                       │
                                       └──> (1) legal_representative (persona)

business_partners (1) ──< (N) addresses
business_partners (1) ──< (N) contacts
```

### B. Ejemplo de Inserción

```sql
-- 1. Insertar business partner (persona)
insert into business_partners (code, partner_type, org_id, category, primary_email)
values ('SOC-2024-001', 'person', 'org-uuid', 'regular', 'juan@example.com')
returning id;

-- 2. Insertar datos de persona
insert into personas (id, document_type, document_number, first_name, last_name, date_of_birth)
values ('bp-uuid-from-step-1', 'dni', '12345678', 'Juan', 'Pérez', '1990-01-15');

-- 3. Insertar dirección
insert into addresses (business_partner_id, address_type, line1, city, country, is_primary)
values ('bp-uuid-from-step-1', 'home', 'Calle 123 #45-67', 'Bogotá', 'CO', true);
```

---

**Documento creado:** 2024-12-19
**Versión:** 1.0 - Propuesta Inicial
**Estado:** Borrador para discusión
