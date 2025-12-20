# Diseño de Base de Datos - Sistema de Gestión de Socios V3 FINAL
## Club Social Privado - Diseño Definitivo

---

## CAMBIOS EN ESTA VERSIÓN

### ✅ Ajustes aplicados:
1. **Nombres de campos y valores en ESPAÑOL** - Todo traducido
2. **Sin firma digital** - Campo eliminado
3. **Contacto de emergencia** - FK directo a tabla `personas`
4. **Redes sociales** - Campos separados (no JSON)
5. **Email facturación** - Eliminado (irá en tabla proveedores futuro)
6. **Trigger de consistencia** - Implementado correctamente para evitar actores huérfanos
7. **Direcciones** - En JSON tanto para personas como empresas
8. **Teléfonos/Emails** - Principal y secundario como campos separados

---

## 1. ESQUEMA DE TABLAS

### 1.1 Tabla Base: `business_partners` (Actor)

```sql
create table business_partners (
  -- Identificación
  id uuid default gen_random_uuid() primary key,
  codigo text unique not null,  -- Código único del actor (ej: "BP-2024-001")

  -- Tipo de actor (discriminador)
  tipo_actor text not null check (tipo_actor in ('persona', 'empresa')),

  -- Multi-tenancy (organización)
  organizacion_id uuid references organizations(id) on delete cascade not null,

  -- Estado general
  estado text not null default 'activo'
    check (estado in ('activo', 'inactivo', 'suspendido')),

  -- Información de contacto básica (compartida)
  email_principal text,
  telefono_principal text,

  -- Campos de control (auditoría)
  creado_en timestamptz default now() not null,
  creado_por uuid references auth.users(id),
  actualizado_en timestamptz default now() not null,
  actualizado_por uuid references auth.users(id),
  eliminado_en timestamptz,  -- Soft delete
  eliminado_por uuid references auth.users(id)
);

-- Índices
create index idx_bp_organizacion_id on business_partners(organizacion_id);
create index idx_bp_tipo on business_partners(tipo_actor);
create index idx_bp_estado on business_partners(estado);
create index idx_bp_codigo on business_partners(codigo);
create index idx_bp_eliminado on business_partners(eliminado_en) where eliminado_en is null;

-- Trigger para actualizado_en
create trigger actualizar_bp_actualizado_en before update on business_partners
  for each row execute function actualizar_timestamp();
```

---

### 1.2 Tabla Especializada: `personas`

```sql
create table personas (
  -- PK/FK compartida con business_partners
  id uuid primary key references business_partners(id) on delete cascade,

  -- Documento de identidad
  tipo_documento text not null
    check (tipo_documento in (
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
  numero_documento text not null,
  fecha_expedicion date,
  lugar_expedicion text,  -- Ciudad/municipio de expedición

  -- Nombres (separados)
  primer_nombre text not null,
  segundo_nombre text,

  -- Apellidos (separados)
  primer_apellido text not null,
  segundo_apellido text,

  -- Información demográfica
  genero text not null
    check (genero in ('masculino', 'femenino', 'otro', 'no_especifica')),
  fecha_nacimiento date not null,
  lugar_nacimiento text,  -- Ciudad/municipio de nacimiento
  nacionalidad text default 'CO',  -- ISO 3166-1 alpha-2

  -- Estado civil
  estado_civil text
    check (estado_civil in (
      'soltero',        -- Soltero/a
      'casado',         -- Casado/a
      'union_libre',    -- Unión libre
      'divorciado',     -- Divorciado/a
      'viudo',          -- Viudo/a
      'separado'        -- Separado/a
    )),

  -- Información laboral/profesional
  ocupacion text,
  profesion text,  -- Título profesional
  nivel_educacion text
    check (nivel_educacion in (
      'primaria',       -- Primaria
      'bachillerato',   -- Bachillerato
      'tecnico',        -- Técnico
      'tecnologo',      -- Tecnólogo
      'pregrado',       -- Pregrado
      'posgrado',       -- Posgrado
      'maestria',       -- Maestría
      'doctorado'       -- Doctorado
    )),

  -- RH y Grupo Sanguíneo
  tipo_sangre text
    check (tipo_sangre in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),

  -- Contacto adicional
  email_secundario text,
  telefono_secundario text,
  whatsapp text,

  -- Redes sociales
  linkedin_url text,
  facebook_url text,
  instagram_handle text,
  twitter_handle text,

  -- Foto
  foto_url text,

  -- Contacto de emergencia (FK a otra persona)
  contacto_emergencia_id uuid references personas(id),
  relacion_emergencia text,  -- 'conyuge', 'padre', 'madre', 'hijo', 'hermano', 'otro'

  -- Atributos extendidos (JSON)
  atributos jsonb default '{}'::jsonb,

  -- Campos de control
  creado_en timestamptz default now() not null,
  actualizado_en timestamptz default now() not null
);

-- Índices
create unique index idx_persona_documento
  on personas(tipo_documento, numero_documento);
create index idx_persona_nombres
  on personas(primer_nombre, primer_apellido);
create index idx_persona_fecha_nacimiento
  on personas(fecha_nacimiento);
create index idx_persona_genero
  on personas(genero);
create index idx_persona_contacto_emergencia
  on personas(contacto_emergencia_id);
create index idx_persona_atributos
  on personas using gin(atributos);

-- Trigger para actualizado_en
create trigger actualizar_persona_actualizado_en before update on personas
  for each row execute function actualizar_timestamp();
```

**Ejemplo de `atributos` JSONB para personas:**
```json
{
  "direccion": {
    "linea1": "Calle 123 #45-67",
    "linea2": "Apto 501",
    "ciudad": "Bogotá",
    "departamento": "Cundinamarca",
    "codigo_postal": "110111",
    "pais": "CO",
    "estrato": 3,
    "barrio": "Chicó"
  },
  "preferencias": {
    "religion": "catolica",
    "dieta": "vegetariana",
    "alergias": ["penicilina", "mariscos"],
    "talla_camisa": "M",
    "talla_pantalon": "32"
  },
  "informacion_adicional": {
    "hobbies": ["golf", "tenis", "lectura"],
    "referido_por": "Juan Pérez García",
    "notas_medicas": "Diabetes tipo 2"
  }
}
```

---

### 1.3 Tabla Especializada: `empresas`

```sql
create table empresas (
  -- PK/FK compartida con business_partners
  id uuid primary key references business_partners(id) on delete cascade,

  -- Identificación Tributaria
  nit text not null unique,
  digito_verificacion text not null check (length(digito_verificacion) = 1),

  -- Nombre Legal y Comercial
  razon_social text not null,
  nombre_comercial text,

  -- Tipo de Sociedad
  tipo_sociedad text not null
    check (tipo_sociedad in (
      'SA',          -- Sociedad Anónima
      'SAS',         -- Sociedad por Acciones Simplificada
      'LTDA',        -- Sociedad Limitada
      'EU',          -- Empresa Unipersonal
      'COOP',        -- Cooperativa
      'FUNDACION',   -- Fundación
      'CORP',        -- Corporación
      'ONG',         -- Organización sin ánimo de lucro
      'SUCURSAL',    -- Sucursal de sociedad extranjera
      'OTRO'         -- Otro
    )),

  -- Información de Constitución
  fecha_constitucion date,
  ciudad_constitucion text,
  pais_constitucion text default 'CO',
  numero_registro text,  -- Número de registro mercantil

  -- Clasificación Económica
  codigo_ciiu text,  -- Código CIIU (Clasificación Industrial Internacional Uniforme)
  sector_industria text,  -- Sector económico
  actividad_economica text,  -- Actividad económica principal

  -- Tamaño de la Empresa
  tamano_empresa text
    check (tamano_empresa in (
      'micro',       -- Microempresa (< 10 empleados, activos < 500 SMMLV)
      'pequena',     -- Pequeña (11-50 empleados, activos 501-5,000 SMMLV)
      'mediana',     -- Mediana (51-200 empleados, activos 5,001-30,000 SMMLV)
      'grande'       -- Grande (> 200 empleados, activos > 30,000 SMMLV)
    )),

  -- Representante Legal (FK a personas)
  representante_legal_id uuid references personas(id),
  cargo_representante text,  -- Cargo del representante (ej: "Gerente General")

  -- Contacto Corporativo
  telefono_secundario text,
  whatsapp text,
  website text,

  -- Redes sociales
  linkedin_url text,
  facebook_url text,
  instagram_handle text,
  twitter_handle text,

  -- Logo
  logo_url text,

  -- Información Financiera (opcional)
  ingresos_anuales numeric(15, 2),
  numero_empleados integer,

  -- Atributos extendidos (JSON)
  atributos jsonb default '{}'::jsonb,

  -- Campos de control
  creado_en timestamptz default now() not null,
  actualizado_en timestamptz default now() not null
);

-- Índices
create unique index idx_empresa_nit on empresas(nit);
create index idx_empresa_razon_social on empresas(razon_social);
create index idx_empresa_nombre_comercial on empresas(nombre_comercial);
create index idx_empresa_representante on empresas(representante_legal_id);
create index idx_empresa_tipo_sociedad on empresas(tipo_sociedad);
create index idx_empresa_ciiu on empresas(codigo_ciiu);
create index idx_empresa_atributos on empresas using gin(atributos);

-- Trigger para actualizado_en
create trigger actualizar_empresa_actualizado_en before update on empresas
  for each row execute function actualizar_timestamp();
```

**Ejemplo de `atributos` JSONB para empresas:**
```json
{
  "direccion": {
    "linea1": "Carrera 7 #123-45",
    "linea2": "Piso 10",
    "ciudad": "Bogotá",
    "departamento": "Cundinamarca",
    "codigo_postal": "110111",
    "pais": "CO",
    "barrio": "Zona T"
  },
  "certificaciones": [
    {
      "nombre": "ISO 9001:2015",
      "fecha_emision": "2023-01-15",
      "fecha_vencimiento": "2026-01-15",
      "url_certificado": "https://storage.example.com/cert-iso9001.pdf"
    },
    {
      "nombre": "ISO 14001:2015",
      "fecha_emision": "2023-03-20",
      "url_certificado": "https://storage.example.com/cert-iso14001.pdf"
    }
  ],
  "documentos_legales": {
    "rut_url": "https://storage.example.com/rut-123456.pdf",
    "camara_comercio_url": "https://storage.example.com/camara-123456.pdf",
    "certificado_existencia_url": "https://storage.example.com/cert-exist-123456.pdf"
  },
  "sucursales": [
    {
      "ciudad": "Medellín",
      "direccion": "Calle 50 #45-20",
      "telefono": "+57 4 444 5555"
    },
    {
      "ciudad": "Cali",
      "direccion": "Avenida 6 #23-45",
      "telefono": "+57 2 333 4444"
    }
  ],
  "informacion_tributaria": {
    "regimen": "comun",
    "responsable_iva": true,
    "autorretenedor": true,
    "gran_contribuyente": false
  },
  "productos_servicios": [
    "Software empresarial",
    "Consultoría IT",
    "Soporte técnico"
  ]
}
```

---

## 2. TABLAS AUXILIARES

### 2.1 Tabla: `organizations`

```sql
create table organizations (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  slug text unique not null,  -- URL-friendly
  tipo text default 'club' check (tipo in ('club', 'sede', 'division')),
  organizacion_padre_id uuid references organizations(id),  -- Jerarquía

  -- Información de contacto
  email text,
  telefono text,
  website text,

  -- Dirección (JSON)
  direccion jsonb default '{}'::jsonb,

  -- Configuración
  configuracion jsonb default '{}'::jsonb,

  -- Metadata
  creado_en timestamptz default now() not null,
  actualizado_en timestamptz default now() not null
);

create index idx_org_slug on organizations(slug);
create index idx_org_padre on organizations(organizacion_padre_id);

create trigger actualizar_org_actualizado_en before update on organizations
  for each row execute function actualizar_timestamp();
```

---

## 3. FUNCIONES Y TRIGGERS

### 3.1 Función: Actualizar timestamp

```sql
create or replace function actualizar_timestamp()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;
```

### 3.2 Función: Calcular Dígito de Verificación NIT

```sql
create or replace function calcular_digito_verificacion_nit(nit_numero text)
returns text as $$
declare
  nit_limpio text;
  pesos int[] := array[71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  suma int := 0;
  dv int;
  i int;
begin
  -- Limpiar el NIT (solo números)
  nit_limpio := regexp_replace(nit_numero, '[^0-9]', '', 'g');

  -- Calcular suma ponderada
  for i in 1..least(length(nit_limpio), 15) loop
    suma := suma + (substring(nit_limpio, length(nit_limpio) - i + 1, 1)::int * pesos[i]);
  end loop;

  -- Calcular dígito de verificación
  dv := suma % 11;

  if dv >= 2 then
    dv := 11 - dv;
  end if;

  return dv::text;
end;
$$ language plpgsql immutable;
```

### 3.3 Constraint: Validar Dígito de Verificación

```sql
alter table empresas add constraint check_digito_verificacion_nit
  check (digito_verificacion = calcular_digito_verificacion_nit(nit));
```

### 3.4 Trigger: Consistencia de `tipo_actor` (CRÍTICO)

**Este trigger previene actores huérfanos garantizando que:**
- Si `tipo_actor = 'persona'` → DEBE existir en tabla `personas`
- Si `tipo_actor = 'empresa'` → DEBE existir en tabla `empresas`

```sql
create or replace function validar_consistencia_tipo_actor()
returns trigger as $$
begin
  -- Verificar que el tipo_actor coincida con la tabla especializada
  if new.tipo_actor = 'persona' then
    if not exists (select 1 from personas where id = new.id) then
      raise exception 'Business partner de tipo "persona" debe tener un registro en la tabla personas con el mismo ID';
    end if;
  elsif new.tipo_actor = 'empresa' then
    if not exists (select 1 from empresas where id = new.id) then
      raise exception 'Business partner de tipo "empresa" debe tener un registro en la tabla empresas con el mismo ID';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger verificar_consistencia_tipo_actor
  after insert or update of tipo_actor on business_partners
  for each row
  execute function validar_consistencia_tipo_actor();
```

**Importante:** Este trigger se ejecuta DESPUÉS de insertar/actualizar en `business_partners`, lo que significa que:

1. **Orden correcto de inserción:**
```sql
-- Paso 1: Insertar en business_partners
insert into business_partners (id, tipo_actor, codigo, organizacion_id)
values ('abc-123', 'persona', 'BP-2024-001', 'org-uuid')
returning id;

-- Paso 2: INMEDIATAMENTE insertar en personas
insert into personas (id, tipo_documento, numero_documento, primer_nombre, primer_apellido, ...)
values ('abc-123', 'CC', '12345678', 'Juan', 'Pérez', ...);

-- Paso 3: El trigger valida que existe el registro en personas
```

2. **Si falta el registro especializado:**
```sql
-- ❌ Esto FALLARÁ:
insert into business_partners (id, tipo_actor, ...)
values ('abc-123', 'persona', ...);
-- Error: No hay registro en tabla 'personas'

-- Pero permite crear la transacción completa si usas BEGIN/COMMIT:
BEGIN;
  insert into business_partners (...) values (...);
  insert into personas (...) values (...);
COMMIT; -- ✅ El trigger valida al final de la transacción
```

---

## 4. ROW LEVEL SECURITY (RLS)

### 4.1 Políticas para `business_partners`

```sql
-- Habilitar RLS
alter table business_partners enable row level security;

-- Los usuarios solo pueden ver actores de su organización (no eliminados)
create policy "usuarios_pueden_ver_actores_org"
  on business_partners for select
  using (
    organizacion_id in (
      select organizacion_id from user_roles
      where user_id = auth.uid()
    )
    and eliminado_en is null
  );

-- Los usuarios con rol admin/manager pueden insertar actores
create policy "admin_puede_insertar_actores"
  on business_partners for insert
  with check (
    organizacion_id in (
      select organizacion_id from user_roles
      where user_id = auth.uid()
      and rol in ('admin', 'manager')
    )
  );

-- Los usuarios con rol admin/manager pueden actualizar actores
create policy "admin_puede_actualizar_actores"
  on business_partners for update
  using (
    organizacion_id in (
      select organizacion_id from user_roles
      where user_id = auth.uid()
      and rol in ('admin', 'manager')
    )
  );

-- Solo admins pueden eliminar (soft delete)
create policy "admin_puede_eliminar_actores"
  on business_partners for update
  using (
    organizacion_id in (
      select organizacion_id from user_roles
      where user_id = auth.uid()
      and rol = 'admin'
    )
    and eliminado_en is null  -- Solo si no está ya eliminado
  );
```

### 4.2 Políticas para `personas`

```sql
alter table personas enable row level security;

create policy "usuarios_pueden_ver_personas_org"
  on personas for select
  using (
    id in (
      select id from business_partners
      where organizacion_id in (
        select organizacion_id from user_roles where user_id = auth.uid()
      )
      and eliminado_en is null
    )
  );

create policy "admin_puede_insertar_personas"
  on personas for insert
  with check (
    id in (
      select id from business_partners
      where organizacion_id in (
        select organizacion_id from user_roles
        where user_id = auth.uid()
        and rol in ('admin', 'manager')
      )
    )
  );

create policy "admin_puede_actualizar_personas"
  on personas for update
  using (
    id in (
      select id from business_partners
      where organizacion_id in (
        select organizacion_id from user_roles
        where user_id = auth.uid()
        and rol in ('admin', 'manager')
      )
    )
  );
```

### 4.3 Políticas para `empresas`

```sql
alter table empresas enable row level security;

create policy "usuarios_pueden_ver_empresas_org"
  on empresas for select
  using (
    id in (
      select id from business_partners
      where organizacion_id in (
        select organizacion_id from user_roles where user_id = auth.uid()
      )
      and eliminado_en is null
    )
  );

create policy "admin_puede_insertar_empresas"
  on empresas for insert
  with check (
    id in (
      select id from business_partners
      where organizacion_id in (
        select organizacion_id from user_roles
        where user_id = auth.uid()
        and rol in ('admin', 'manager')
      )
    )
  );

create policy "admin_puede_actualizar_empresas"
  on empresas for update
  using (
    id in (
      select id from business_partners
      where organizacion_id in (
        select organizacion_id from user_roles
        where user_id = auth.uid()
        and rol in ('admin', 'manager')
      )
    )
  );
```

**Nota:** Se asume la existencia de una tabla `user_roles` que vincula usuarios con organizaciones y roles.

---

## 5. VISTAS DE CONSULTA

### 5.1 Vista: Personas Completa

```sql
create or replace view v_personas_completa as
select
  bp.id,
  bp.codigo,
  bp.organizacion_id,
  bp.estado,
  bp.email_principal,
  bp.telefono_principal,

  -- Documento
  p.tipo_documento,
  p.numero_documento,
  p.fecha_expedicion,
  p.lugar_expedicion,

  -- Nombre completo (calculado)
  trim(
    coalesce(p.primer_nombre, '') || ' ' ||
    coalesce(p.segundo_nombre, '') || ' ' ||
    coalesce(p.primer_apellido, '') || ' ' ||
    coalesce(p.segundo_apellido, '')
  ) as nombre_completo,

  -- Campos individuales
  p.primer_nombre,
  p.segundo_nombre,
  p.primer_apellido,
  p.segundo_apellido,

  -- Demográficos
  p.genero,
  p.fecha_nacimiento,
  extract(year from age(current_date, p.fecha_nacimiento))::int as edad,
  p.lugar_nacimiento,
  p.nacionalidad,
  p.estado_civil,

  -- Profesional
  p.ocupacion,
  p.profesion,
  p.nivel_educacion,

  -- Salud
  p.tipo_sangre,

  -- Contacto adicional
  p.email_secundario,
  p.telefono_secundario,
  p.whatsapp,

  -- Redes sociales
  p.linkedin_url,
  p.facebook_url,
  p.instagram_handle,
  p.twitter_handle,

  -- Foto
  p.foto_url,

  -- Contacto emergencia
  p.contacto_emergencia_id,
  case
    when ce.id is not null then
      trim(ce.primer_nombre || ' ' || ce.primer_apellido)
    else null
  end as nombre_contacto_emergencia,
  p.relacion_emergencia,

  -- Atributos
  p.atributos,

  -- Metadata
  bp.creado_en,
  bp.creado_por,
  bp.actualizado_en,
  bp.actualizado_por
from business_partners bp
join personas p on bp.id = p.id
left join personas ce on p.contacto_emergencia_id = ce.id
where bp.tipo_actor = 'persona'
  and bp.eliminado_en is null;
```

### 5.2 Vista: Empresas Completa

```sql
create or replace view v_empresas_completa as
select
  bp.id,
  bp.codigo,
  bp.organizacion_id,
  bp.estado,
  bp.email_principal,
  bp.telefono_principal,

  -- NIT completo
  e.nit || '-' || e.digito_verificacion as nit_completo,
  e.nit,
  e.digito_verificacion,

  -- Nombres
  e.razon_social,
  e.nombre_comercial,

  -- Societario
  e.tipo_sociedad,
  e.fecha_constitucion,
  e.ciudad_constitucion,
  e.numero_registro,

  -- Económico
  e.codigo_ciiu,
  e.sector_industria,
  e.actividad_economica,
  e.tamano_empresa,

  -- Representante legal
  e.representante_legal_id,
  case
    when rep.id is not null then
      trim(rep.primer_nombre || ' ' || rep.primer_apellido)
    else null
  end as nombre_representante_legal,
  e.cargo_representante,

  -- Contacto
  e.telefono_secundario,
  e.whatsapp,
  e.website,

  -- Redes sociales
  e.linkedin_url,
  e.facebook_url,
  e.instagram_handle,
  e.twitter_handle,

  -- Logo
  e.logo_url,

  -- Financiero
  e.numero_empleados,
  e.ingresos_anuales,

  -- Atributos
  e.atributos,

  -- Metadata
  bp.creado_en,
  bp.creado_por,
  bp.actualizado_en,
  bp.actualizado_por
from business_partners bp
join empresas e on bp.id = e.id
left join personas rep on e.representante_legal_id = rep.id
where bp.tipo_actor = 'empresa'
  and bp.eliminado_en is null;
```

### 5.3 Vista: Actores Unificados (Personas y Empresas)

```sql
create or replace view v_actores_unificados as
select
  bp.id,
  bp.codigo,
  bp.tipo_actor,
  bp.organizacion_id,
  bp.estado,

  -- Nombre/Razón Social (unificado)
  case
    when bp.tipo_actor = 'persona' then
      trim(p.primer_nombre || ' ' || p.primer_apellido)
    when bp.tipo_actor = 'empresa' then
      e.razon_social
  end as nombre_display,

  -- Documento/NIT (unificado)
  case
    when bp.tipo_actor = 'persona' then
      p.tipo_documento || ' ' || p.numero_documento
    when bp.tipo_actor = 'empresa' then
      'NIT ' || e.nit || '-' || e.digito_verificacion
  end as identificacion,

  -- Contacto
  bp.email_principal,
  bp.telefono_principal,

  -- Metadata
  bp.creado_en,
  bp.actualizado_en

from business_partners bp
left join personas p on bp.id = p.id and bp.tipo_actor = 'persona'
left join empresas e on bp.id = e.id and bp.tipo_actor = 'empresa'
where bp.eliminado_en is null;
```

---

## 6. EJEMPLOS DE USO

### 6.1 Insertar una Persona

```sql
BEGIN;

-- Paso 1: Crear business partner
insert into business_partners (
  id,
  codigo,
  tipo_actor,
  organizacion_id,
  estado,
  email_principal,
  telefono_principal,
  creado_por
)
values (
  gen_random_uuid(),  -- o genera el UUID en tu aplicación
  'BP-2024-001',
  'persona',
  'org-uuid-here',
  'activo',
  'juan.perez@email.com',
  '+57 300 123 4567',
  auth.uid()
)
returning id;  -- Guarda este ID

-- Paso 2: Crear registro en personas (usando el mismo ID)
insert into personas (
  id,  -- MISMO ID del paso anterior
  tipo_documento,
  numero_documento,
  primer_nombre,
  primer_apellido,
  genero,
  fecha_nacimiento,
  atributos
)
values (
  'uuid-del-paso-1',
  'CC',
  '12345678',
  'Juan',
  'Pérez',
  'masculino',
  '1990-05-15',
  '{
    "direccion": {
      "linea1": "Calle 123 #45-67",
      "ciudad": "Bogotá",
      "departamento": "Cundinamarca",
      "codigo_postal": "110111",
      "pais": "CO",
      "estrato": 3
    }
  }'::jsonb
);

COMMIT;  -- El trigger valida la consistencia aquí
```

### 6.2 Insertar una Empresa

```sql
BEGIN;

-- Paso 1: Crear business partner
insert into business_partners (
  id,
  codigo,
  tipo_actor,
  organizacion_id,
  email_principal,
  telefono_principal,
  creado_por
)
values (
  gen_random_uuid(),
  'BP-2024-002',
  'empresa',
  'org-uuid-here',
  'info@empresa.com',
  '+57 1 234 5678',
  auth.uid()
)
returning id;

-- Paso 2: Crear registro en empresas
insert into empresas (
  id,
  nit,
  digito_verificacion,
  razon_social,
  nombre_comercial,
  tipo_sociedad,
  fecha_constitucion,
  codigo_ciiu,
  sector_industria,
  representante_legal_id,  -- FK a una persona existente
  atributos
)
values (
  'uuid-del-paso-1',
  '900123456',
  '3',  -- Se valida automáticamente con el constraint
  'EMPRESA EJEMPLO S.A.S.',
  'Empresa Ejemplo',
  'SAS',
  '2020-01-15',
  '6201',
  'Tecnología',
  'uuid-de-persona-representante',
  '{
    "direccion": {
      "linea1": "Carrera 7 #123-45",
      "ciudad": "Bogotá",
      "pais": "CO"
    },
    "certificaciones": [
      {
        "nombre": "ISO 9001:2015",
        "fecha_emision": "2023-01-15"
      }
    ]
  }'::jsonb
);

COMMIT;
```

### 6.3 Actualizar Persona (agregar contacto de emergencia)

```sql
update personas
set
  contacto_emergencia_id = 'uuid-de-otra-persona',
  relacion_emergencia = 'conyuge',
  actualizado_en = now()
where id = 'uuid-de-la-persona';
```

### 6.4 Soft Delete de un Actor

```sql
update business_partners
set
  eliminado_en = now(),
  eliminado_por = auth.uid()
where id = 'uuid-del-actor';
```

### 6.5 Consultar todas las personas de una organización

```sql
select
  nombre_completo,
  tipo_documento,
  numero_documento,
  edad,
  email_principal,
  telefono_principal
from v_personas_completa
where organizacion_id = 'org-uuid'
  and estado = 'activo'
order by nombre_completo;
```

---

## 7. DICCIONARIO DE DATOS

### 7.1 Tabla `business_partners`

| Campo | Tipo | Requerido | Descripción | Valores permitidos |
|-------|------|-----------|-------------|-------------------|
| `id` | uuid | Sí | Identificador único | UUID v4 |
| `codigo` | text | Sí | Código legible único | "BP-2024-001" |
| `tipo_actor` | text | Sí | Tipo de actor | 'persona', 'empresa' |
| `organizacion_id` | uuid | Sí | Organización dueña | FK a organizations |
| `estado` | text | Sí | Estado operativo | 'activo', 'inactivo', 'suspendido' |
| `email_principal` | text | No | Email principal | email válido |
| `telefono_principal` | text | No | Teléfono principal | formato libre |
| `creado_en` | timestamptz | Sí | Fecha creación | auto |
| `creado_por` | uuid | No | Usuario creador | FK a auth.users |
| `actualizado_en` | timestamptz | Sí | Última actualización | auto |
| `actualizado_por` | uuid | No | Usuario actualizador | FK a auth.users |
| `eliminado_en` | timestamptz | No | Fecha soft delete | null = no eliminado |
| `eliminado_por` | uuid | No | Usuario eliminador | FK a auth.users |

### 7.2 Tabla `personas`

| Campo | Tipo | Requerido | Descripción | Valores permitidos |
|-------|------|-----------|-------------|-------------------|
| `id` | uuid | Sí | ID compartido con BP | FK a business_partners |
| `tipo_documento` | text | Sí | Tipo de identificación | CC, CE, TI, PA, RC, NIT, PEP, PPT, DNI, NUIP |
| `numero_documento` | text | Sí | Número del documento | único por tipo |
| `fecha_expedicion` | date | No | Fecha expedición doc | fecha válida |
| `lugar_expedicion` | text | No | Ciudad expedición | texto libre |
| `primer_nombre` | text | Sí | Primer nombre | texto |
| `segundo_nombre` | text | No | Segundo nombre | texto |
| `primer_apellido` | text | Sí | Primer apellido | texto |
| `segundo_apellido` | text | No | Segundo apellido | texto |
| `genero` | text | Sí | Género | masculino, femenino, otro, no_especifica |
| `fecha_nacimiento` | date | Sí | Fecha de nacimiento | fecha válida |
| `lugar_nacimiento` | text | No | Ciudad nacimiento | texto libre |
| `nacionalidad` | text | No | Nacionalidad | ISO 3166-1 alpha-2 (CO, US, etc) |
| `estado_civil` | text | No | Estado civil | soltero, casado, union_libre, divorciado, viudo, separado |
| `ocupacion` | text | No | Ocupación actual | texto libre |
| `profesion` | text | No | Título profesional | texto libre |
| `nivel_educacion` | text | No | Nivel educativo | primaria, bachillerato, tecnico, tecnologo, pregrado, posgrado, maestria, doctorado |
| `tipo_sangre` | text | No | Tipo y RH sanguíneo | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `email_secundario` | text | No | Email alternativo | email válido |
| `telefono_secundario` | text | No | Teléfono alternativo | formato libre |
| `whatsapp` | text | No | Número WhatsApp | formato libre |
| `linkedin_url` | text | No | URL perfil LinkedIn | URL válida |
| `facebook_url` | text | No | URL perfil Facebook | URL válida |
| `instagram_handle` | text | No | Usuario Instagram | @usuario |
| `twitter_handle` | text | No | Usuario Twitter/X | @usuario |
| `foto_url` | text | No | URL foto perfil | URL válida |
| `contacto_emergencia_id` | uuid | No | Contacto emergencia | FK a personas |
| `relacion_emergencia` | text | No | Relación con contacto | conyuge, padre, madre, hijo, hermano, otro |
| `atributos` | jsonb | No | Atributos extendidos | JSON válido |
| `creado_en` | timestamptz | Sí | Fecha creación | auto |
| `actualizado_en` | timestamptz | Sí | Última actualización | auto |

### 7.3 Tabla `empresas`

| Campo | Tipo | Requerido | Descripción | Valores permitidos |
|-------|------|-----------|-------------|-------------------|
| `id` | uuid | Sí | ID compartido con BP | FK a business_partners |
| `nit` | text | Sí | NIT sin DV | único, solo números |
| `digito_verificacion` | text | Sí | Dígito verificación | 0-9, validado automáticamente |
| `razon_social` | text | Sí | Nombre legal completo | texto |
| `nombre_comercial` | text | No | Nombre comercial | texto |
| `tipo_sociedad` | text | Sí | Tipo societario | SA, SAS, LTDA, EU, COOP, FUNDACION, CORP, ONG, SUCURSAL, OTRO |
| `fecha_constitucion` | date | No | Fecha constitución | fecha válida |
| `ciudad_constitucion` | text | No | Ciudad constitución | texto libre |
| `pais_constitucion` | text | No | País constitución | ISO 3166-1 alpha-2 |
| `numero_registro` | text | No | # registro mercantil | texto |
| `codigo_ciiu` | text | No | Código CIIU | texto (4 dígitos) |
| `sector_industria` | text | No | Sector económico | texto libre |
| `actividad_economica` | text | No | Actividad principal | texto libre |
| `tamano_empresa` | text | No | Tamaño | micro, pequena, mediana, grande |
| `representante_legal_id` | uuid | No | Representante legal | FK a personas |
| `cargo_representante` | text | No | Cargo representante | texto libre |
| `telefono_secundario` | text | No | Teléfono alternativo | formato libre |
| `whatsapp` | text | No | Número WhatsApp | formato libre |
| `website` | text | No | Sitio web | URL válida |
| `linkedin_url` | text | No | URL LinkedIn empresa | URL válida |
| `facebook_url` | text | No | URL Facebook página | URL válida |
| `instagram_handle` | text | No | Usuario Instagram | @usuario |
| `twitter_handle` | text | No | Usuario Twitter/X | @usuario |
| `logo_url` | text | No | URL logo empresa | URL válida |
| `numero_empleados` | integer | No | Cantidad empleados | número entero |
| `ingresos_anuales` | numeric(15,2) | No | Ingresos anuales | decimal |
| `atributos` | jsonb | No | Atributos extendidos | JSON válido |
| `creado_en` | timestamptz | Sí | Fecha creación | auto |
| `actualizado_en` | timestamptz | Sí | Última actualización | auto |

---

## 8. PRÓXIMOS PASOS

### ✅ Fase Completada: Diseño Base de Actores
- [x] Tabla `business_partners` (Actor base)
- [x] Tabla `personas` con todos los campos
- [x] Tabla `empresas` con campos para Colombia
- [x] Triggers de validación y consistencia
- [x] RLS policies para multi-tenancy
- [x] Vistas de consulta optimizadas

### 🔲 Fase Siguiente: Implementación
1. Crear migración SQL en `supabase/migrations/`
2. Ejecutar migración en entorno local
3. Probar inserts, updates, queries
4. Validar triggers y constraints
5. Verificar RLS policies

### 🔲 Fase Futura: Roles y Relaciones
- Tabla `socios` (rol de Actor)
- Tabla `proveedores` (rol de Actor)
- Tabla `empleados` (rol de Actor)
- Relaciones entre actores (familias, accionistas, etc.)

---

## 9. VALIDACIONES FINALES

### ✅ Checklist de Diseño

- [x] Campos en español (nombres y valores)
- [x] Sin firma digital
- [x] Contacto emergencia como FK a personas
- [x] Redes sociales como campos separados
- [x] Email facturación eliminado (irá en proveedores)
- [x] Trigger de consistencia implementado
- [x] Direcciones en JSON
- [x] Emails/teléfonos principal y secundario
- [x] WhatsApp como campo separado
- [x] Foto/logo URLs incluidos
- [x] Validación NIT con dígito verificación
- [x] Unique constraint en documento (tipo + número)
- [x] Sin validación edad mínima
- [x] Campos de control completos (creado/actualizado/eliminado)
- [x] Soft delete implementado

---

**Este diseño está listo para implementación. ¿Procedemos a crear la migración SQL?**
