# Database Tables - Diccionario de Datos

Este documento describe en detalle todas las tablas, sus columnas, tipos de datos, constraints, índices y relaciones.

## Índice

- [organizations](#organizations)
- [business_partners](#business_partners)
- [personas](#personas)
- [empresas](#empresas)
- [bp_relaciones](#bp_relaciones)

---

## `organizations`

### Descripción

Tabla de organizaciones que implementa el sistema multi-tenancy. Cada organización tiene sus propios datos completamente aislados mediante Row Level Security (RLS).

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | Identificador único (PK) |
| `nombre` | `TEXT` | NO | - | Nombre de la organización |
| `descripcion` | `TEXT` | YES | NULL | Descripción opcional de la organización |
| `configuracion` | `JSONB` | YES | `'{}'::jsonb` | Configuración específica de la organización |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | Timestamp de eliminación (soft delete) |

### Constraints

- **Primary Key:** `id`
- **Not Null:** `nombre`, `creado_en`, `actualizado_en`

### Índices

- `organizations_pkey` en `id` (Primary Key, automático)

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en` automáticamente

### Relaciones

- **1:N** con `business_partners` (una organización puede tener muchos socios)

### JSONB Schema - `configuracion`

Estructura flexible para configuración específica de cada organización:

```json
{
  "timezone": "America/Bogota",
  "locale": "es-CO",
  "currency": "COP",
  "features": {
    "enable_personas": true,
    "enable_empresas": true,
    "enable_proveedores": false
  },
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#FF5733"
  }
}
```

### Ejemplo de Registro

```sql
INSERT INTO organizations (nombre, descripcion, configuracion)
VALUES (
  'Cooperativa Central',
  'Cooperativa de ahorro y crédito',
  '{"timezone": "America/Bogota", "currency": "COP"}'::jsonb
);
```

---

## `business_partners`

### Descripción

Tabla base del patrón Class Table Inheritance (CTI). Contiene campos comunes a todos los tipos de socios de negocio (personas, empresas, etc.).

Esta tabla **nunca se consulta directamente** para obtener datos completos. Siempre se hace JOIN con la tabla especializada correspondiente (`personas` o `empresas`).

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | Identificador único (PK) compartido con especialización |
| `organizacion_id` | `UUID` | NO | - | FK hacia `organizations(id)` |
| `tipo_actor` | `tipo_actor` | NO | - | Tipo de socio: 'persona' \| 'empresa' |
| `codigo_interno` | `TEXT` | YES | NULL | Código interno asignado por la organización |
| `estado` | `estado_actor` | NO | `'activo'` | Estado: 'activo' \| 'inactivo' \| 'suspendido' |
| `atributos` | `JSONB` | YES | `'{}'::jsonb` | Metadata adicional flexible |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | Timestamp de eliminación (soft delete) |

### Constraints

- **Primary Key:** `id`
- **Foreign Key:** `organizacion_id` → `organizations(id)` ON DELETE CASCADE
- **Not Null:** `organizacion_id`, `tipo_actor`, `estado`, `creado_en`, `actualizado_en`
- **Check:** `tipo_actor IN ('persona', 'empresa')`
- **Unique:** `(organizacion_id, codigo_interno)` WHERE `eliminado_en IS NULL`

### Índices

- `business_partners_pkey` en `id` (Primary Key)
- `idx_business_partners_organizacion` en `organizacion_id` (Foreign Key, automático)
- Índice parcial único en `(organizacion_id, codigo_interno)` donde `eliminado_en IS NULL`

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`
- `validar_consistencia_tipo_actor` (BEFORE INSERT/UPDATE) - Valida que exista especialización

### Relaciones

- **N:1** con `organizations` (muchos socios pertenecen a una organización)
- **1:1** con `personas` (si `tipo_actor = 'persona'`)
- **1:1** con `empresas` (si `tipo_actor = 'empresa'`)

### ENUMs

#### `tipo_actor`
```sql
CREATE TYPE tipo_actor AS ENUM ('persona', 'empresa');
```

#### `estado_actor`
```sql
CREATE TYPE estado_actor AS ENUM ('activo', 'inactivo', 'suspendido');
```

### JSONB Schema - `atributos`

Estructura flexible para metadata adicional:

```json
{
  "tags": ["vip", "frecuente"],
  "notas": "Cliente preferencial",
  "fuente_registro": "referido",
  "custom_fields": {
    "prioridad": "alta",
    "descuento_especial": 15
  }
}
```

### Ejemplo de Registro

```sql
INSERT INTO business_partners (organizacion_id, tipo_actor, codigo_interno, estado, atributos)
VALUES (
  'org-uuid-here',
  'persona',
  'BP-2024-001',
  'activo',
  '{"tags": ["nuevo", "online"]}'::jsonb
)
RETURNING id;
```

### Validación de Consistencia

El trigger `validar_consistencia_tipo_actor` garantiza:

1. Si `tipo_actor = 'persona'` → **DEBE** existir registro en `personas` con el mismo `id`
2. Si `tipo_actor = 'empresa'` → **DEBE** existir registro en `empresas` con el mismo `id`
3. **NO** puede existir en ambas tablas simultáneamente

**Flujo correcto de inserción:**
```sql
-- 1. Primero insertar en business_partners
INSERT INTO business_partners (organizacion_id, tipo_actor, estado)
VALUES ('org-uuid', 'persona', 'activo')
RETURNING id;

-- 2. Luego insertar en personas con el MISMO id
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('bp-uuid-del-paso-1', 'Juan', 'Pérez', 'CC', '123456');
```

---

## `personas`

### Descripción

Tabla especializada para personas naturales. Implementa herencia de `business_partners` mediante relación 1:1 con PK compartido.

Todos los registros en esta tabla **DEBEN** tener un registro correspondiente en `business_partners` con el mismo `id` y con `tipo_actor = 'persona'`.

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | - | PK/FK hacia `business_partners(id)` |
| `nombres` | `TEXT` | NO | - | Nombres de la persona |
| `apellidos` | `TEXT` | NO | - | Apellidos de la persona |
| `tipo_documento` | `tipo_documento_persona` | NO | - | Tipo de documento de identidad |
| `numero_documento` | `TEXT` | NO | - | Número de documento (único) |
| `fecha_nacimiento` | `DATE` | YES | NULL | Fecha de nacimiento |
| `genero` | `genero_persona` | YES | NULL | Género de la persona |
| `telefono` | `TEXT` | YES | NULL | Número de teléfono |
| `email` | `TEXT` | YES | NULL | Correo electrónico |
| `direccion` | `TEXT` | YES | NULL | Dirección de residencia |
| `contacto_emergencia_id` | `UUID` | YES | NULL | FK hacia `personas(id)` (auto-referencia) |
| `atributos` | `JSONB` | YES | `'{}'::jsonb` | Metadata adicional específica de persona |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | Timestamp de eliminación (soft delete) |

### Constraints

- **Primary Key:** `id`
- **Foreign Key:** `id` → `business_partners(id)` ON DELETE CASCADE
- **Foreign Key:** `contacto_emergencia_id` → `personas(id)` ON DELETE SET NULL
- **Not Null:** `nombres`, `apellidos`, `tipo_documento`, `numero_documento`, `creado_en`, `actualizado_en`
- **Unique:** `numero_documento` WHERE `eliminado_en IS NULL` (índice parcial)

### Índices

- `personas_pkey` en `id` (Primary Key)
- `idx_personas_documento` en `numero_documento` (búsqueda por documento)
- `idx_personas_nombres` en `nombres` (búsqueda por nombre)
- `idx_personas_apellidos` en `apellidos` (búsqueda por apellido)
- `idx_personas_contacto_emergencia` en `contacto_emergencia_id` (Foreign Key, automático)
- Índice parcial único en `numero_documento` donde `eliminado_en IS NULL`

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`

### Relaciones

- **1:1** con `business_partners` (herencia CTI)
- **N:1** con `personas` (contacto emergencia, auto-referencia opcional)
- **1:N** con `personas` (es contacto de emergencia de otras personas)
- **1:N** con `empresas` (es representante legal de empresas)

### ENUMs

#### `tipo_documento_persona`
```sql
CREATE TYPE tipo_documento_persona AS ENUM (
    'CC',  -- Cédula de Ciudadanía
    'CE',  -- Cédula de Extranjería
    'PA',  -- Pasaporte
    'TI',  -- Tarjeta de Identidad
    'RC'   -- Registro Civil
);
```

#### `genero_persona`
```sql
CREATE TYPE genero_persona AS ENUM (
    'masculino',
    'femenino',
    'otro',
    'prefiero_no_decir'
);
```

### JSONB Schema - `atributos`

Estructura flexible para datos adicionales específicos de personas:

```json
{
  "estado_civil": "soltero",
  "profesion": "Ingeniero",
  "lugar_nacimiento": "Bogotá",
  "nacionalidad": "Colombiana",
  "nivel_educativo": "Universitario",
  "redes_sociales": {
    "linkedin": "https://linkedin.com/in/...",
    "twitter": "@username"
  },
  "contacto_adicional": {
    "telefono_oficina": "+57 1 234 5678",
    "whatsapp": "+57 300 123 4567"
  }
}
```

### Ejemplo de Registro Completo

```sql
-- Transacción completa para crear persona
BEGIN;

-- 1. Insertar en business_partners
INSERT INTO business_partners (organizacion_id, tipo_actor, codigo_interno, estado)
VALUES ('org-uuid', 'persona', 'BP-001', 'activo')
RETURNING id INTO persona_bp_id;

-- 2. Insertar en personas
INSERT INTO personas (
  id,
  nombres,
  apellidos,
  tipo_documento,
  numero_documento,
  fecha_nacimiento,
  genero,
  telefono,
  email,
  direccion,
  atributos
)
VALUES (
  persona_bp_id,
  'Juan Carlos',
  'Pérez González',
  'CC',
  '1234567890',
  '1990-05-15',
  'masculino',
  '+57 300 123 4567',
  'juan.perez@example.com',
  'Calle 123 # 45-67, Bogotá',
  '{"profesion": "Ingeniero", "estado_civil": "soltero"}'::jsonb
);

COMMIT;
```

### Reglas de Negocio

1. **Documento Único:** El `numero_documento` debe ser único por organización (solo para registros no eliminados)
2. **Contacto Emergencia:** Debe ser otra persona existente en la misma organización
3. **Auto-referencia:** Una persona NO puede ser su propio contacto de emergencia
4. **Soft Delete:** Al eliminar una persona, se marca `eliminado_en`, no se borra físicamente
5. **Edad Mínima:** Si se implementa validación, verificar edad mínima según `tipo_documento`

---

## `empresas`

### Descripción

Tabla especializada para empresas/personas jurídicas. Implementa herencia de `business_partners` mediante relación 1:1 con PK compartido.

Todos los registros en esta tabla **DEBEN** tener un registro correspondiente en `business_partners` con el mismo `id` y con `tipo_actor = 'empresa'`.

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | - | PK/FK hacia `business_partners(id)` |
| `razon_social` | `TEXT` | NO | - | Nombre legal de la empresa |
| `nombre_comercial` | `TEXT` | YES | NULL | Nombre comercial (opcional) |
| `nit` | `TEXT` | NO | - | Número de Identificación Tributaria |
| `digito_verificacion` | `TEXT` | NO | - | Dígito verificador del NIT (1 carácter) |
| `tipo_empresa` | `tipo_empresa` | YES | NULL | Tipo societario |
| `fecha_constitucion` | `DATE` | YES | NULL | Fecha de constitución de la empresa |
| `telefono` | `TEXT` | YES | NULL | Número de teléfono principal |
| `email` | `TEXT` | YES | NULL | Correo electrónico corporativo |
| `direccion` | `TEXT` | YES | NULL | Dirección de la sede principal |
| `representante_legal_id` | `UUID` | YES | NULL | FK hacia `personas(id)` |
| `atributos` | `JSONB` | YES | `'{}'::jsonb` | Metadata adicional específica de empresa |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | Timestamp de eliminación (soft delete) |

### Constraints

- **Primary Key:** `id`
- **Foreign Key:** `id` → `business_partners(id)` ON DELETE CASCADE
- **Foreign Key:** `representante_legal_id` → `personas(id)` ON DELETE SET NULL
- **Not Null:** `razon_social`, `nit`, `digito_verificacion`, `creado_en`, `actualizado_en`
- **Unique:** `nit` WHERE `eliminado_en IS NULL` (índice parcial)
- **Check:** `length(digito_verificacion) = 1` (debe ser un solo carácter)

### Índices

- `empresas_pkey` en `id` (Primary Key)
- `idx_empresas_nit` en `nit` (búsqueda por NIT)
- `idx_empresas_razon_social` en `razon_social` (búsqueda por razón social)
- `idx_empresas_representante_legal` en `representante_legal_id` (Foreign Key, automático)
- Índice parcial único en `nit` donde `eliminado_en IS NULL`

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`

### Relaciones

- **1:1** con `business_partners` (herencia CTI)
- **N:1** con `personas` (representante legal, opcional)

### ENUMs

#### `tipo_empresa`
```sql
CREATE TYPE tipo_empresa AS ENUM (
    'SA',           -- Sociedad Anónima
    'SAS',          -- Sociedad por Acciones Simplificada
    'LTDA',         -- Limitada
    'UNIPERSONAL',  -- Empresa Unipersonal
    'OTRA'          -- Otro tipo
);
```

### JSONB Schema - `atributos`

Estructura flexible para datos adicionales específicos de empresas:

```json
{
  "sector_economico": "Tecnología",
  "actividad_principal": "Desarrollo de software",
  "numero_empleados": 50,
  "capital_social": 100000000,
  "pagina_web": "https://empresa.com",
  "redes_sociales": {
    "linkedin": "https://linkedin.com/company/...",
    "facebook": "https://facebook.com/..."
  },
  "certificaciones": ["ISO 9001", "ISO 27001"],
  "contactos_adicionales": {
    "contador": {
      "nombre": "María López",
      "telefono": "+57 300 999 8888",
      "email": "contador@empresa.com"
    },
    "gerente_ventas": {
      "nombre": "Pedro Ramírez",
      "telefono": "+57 310 777 6666"
    }
  }
}
```

### Ejemplo de Registro Completo

```sql
-- Transacción completa para crear empresa
BEGIN;

-- 1. Insertar en business_partners
INSERT INTO business_partners (organizacion_id, tipo_actor, codigo_interno, estado)
VALUES ('org-uuid', 'empresa', 'EMP-001', 'activo')
RETURNING id INTO empresa_bp_id;

-- 2. Calcular dígito de verificación
SELECT calcular_digito_verificacion_nit('900123456') INTO dv_calculado;

-- 3. Insertar en empresas
INSERT INTO empresas (
  id,
  razon_social,
  nombre_comercial,
  nit,
  digito_verificacion,
  tipo_empresa,
  fecha_constitucion,
  telefono,
  email,
  direccion,
  representante_legal_id,
  atributos
)
VALUES (
  empresa_bp_id,
  'Tecnología Avanzada S.A.S.',
  'TechAdvance',
  '900123456',
  dv_calculado,  -- '8'
  'SAS',
  '2020-01-15',
  '+57 1 234 5678',
  'info@techadvance.com',
  'Carrera 7 # 71-21, Bogotá',
  'persona-uuid-representante',
  '{"sector_economico": "Tecnología", "numero_empleados": 50}'::jsonb
);

COMMIT;
```

### Validación de NIT

El sistema incluye la función `calcular_digito_verificacion_nit(nit TEXT)` para validar NITs colombianos:

```sql
-- Validar que el DV sea correcto
SELECT
  nit,
  digito_verificacion,
  calcular_digito_verificacion_nit(nit) AS dv_correcto,
  CASE
    WHEN digito_verificacion = calcular_digito_verificacion_nit(nit)
    THEN 'VÁLIDO'
    ELSE 'INVÁLIDO'
  END AS estado_validacion
FROM empresas
WHERE eliminado_en IS NULL;
```

**Ejemplo de cálculo:**
```sql
SELECT calcular_digito_verificacion_nit('900123456');
-- Resultado: '8'
```

### Reglas de Negocio

1. **NIT Único:** El `nit` debe ser único por organización (solo para registros no eliminados)
2. **Dígito Verificación:** Debe calcularse usando `calcular_digito_verificacion_nit()`, es de 1 carácter
3. **Representante Legal:** Debe ser una persona existente en `personas` de la misma organización
4. **Soft Delete:** Al eliminar una empresa, se marca `eliminado_en`, no se borra físicamente
5. **NIT Formato:** Solo números, sin guiones ni puntos (formato: '900123456')
6. **Razón Social vs Nombre Comercial:**
   - `razon_social`: Nombre legal registrado (obligatorio)
   - `nombre_comercial`: Marca comercial (opcional)

---

## `bp_relaciones`

### Descripción

Tabla de relaciones entre Business Partners que implementa un sistema complejo de vínculos con historial temporal, validaciones de tipo y soporte bidireccional.

Permite modelar cualquier tipo de relación entre socios de negocio (personas y/o empresas) con roles específicos para origen y destino, metadata flexible por tipo de relación, y seguimiento temporal de vigencia.

**Diseño:** Usa dos campos `rol_origen` + `rol_destino` para máxima claridad y mantenibilidad (en lugar de un solo campo `subtipo`).

### Estructura

| Columna | Tipo | Null | Default | PK/FK | Descripción |
|---------|------|------|---------|-------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK | Identificador único de la relación |
| `organizacion_id` | `UUID` | NO | - | FK | FK hacia `organizations(id)` |
| `bp_origen_id` | `UUID` | NO | - | FK | FK hacia `business_partners(id)` (origen) |
| `bp_destino_id` | `UUID` | NO | - | FK | FK hacia `business_partners(id)` (destino) |
| `tipo_relacion` | `tipo_relacion_bp` | NO | - | - | Tipo: familiar, laboral, referencia, membresia, comercial, otra |
| `rol_origen` | `TEXT` | NO | - | - | Rol del BP origen (ej: 'Padre', 'Empleado', 'Referencia') |
| `rol_destino` | `TEXT` | NO | - | - | Rol del BP destino (ej: 'Hijo', 'Empleador', 'Contacto de Emergencia') |
| `atributos` | `JSONB` | NO | `'{}'::jsonb` | - | Metadata adicional según tipo de relación |
| `fecha_inicio` | `DATE` | YES | NULL | - | Fecha de inicio de la relación |
| `fecha_fin` | `DATE` | YES | NULL | - | Fecha de fin de la relación (NULL = vigente) |
| `es_actual` | `BOOLEAN` | NO | GENERATED | - | Columna generada: `fecha_fin IS NULL` |
| `es_bidireccional` | `BOOLEAN` | NO | `false` | - | Si TRUE, la vista genera registro inverso automático |
| `notas` | `TEXT` | YES | NULL | - | Notas adicionales sobre la relación |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | - | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | - | Timestamp de última actualización |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | - | Timestamp de eliminación (soft delete) |

### Constraints

- **Primary Key:** `id`
- **Foreign Keys:**
  - `organizacion_id` → `organizations(id)` ON DELETE CASCADE
  - `bp_origen_id` → `business_partners(id)` ON DELETE CASCADE
  - `bp_destino_id` → `business_partners(id)` ON DELETE CASCADE
- **Not Null:** `organizacion_id`, `bp_origen_id`, `bp_destino_id`, `tipo_relacion`, `rol_origen`, `rol_destino`, `atributos`, `es_bidireccional`, `creado_en`, `actualizado_en`
- **Check Constraints:**
  - `bp_relaciones_no_auto_relacion`: `bp_origen_id != bp_destino_id` (impide auto-relaciones)
  - `bp_relaciones_fechas_validas`: `fecha_fin IS NULL OR fecha_fin >= fecha_inicio` (fechas consistentes)
- **Unique Constraint:**
  - Índice único en `(bp_origen_id, bp_destino_id, tipo_relacion)` WHERE `eliminado_en IS NULL AND es_actual = true` (previene relaciones duplicadas activas)

### Índices

| Nombre | Tipo | Columnas | Condición | Propósito |
|--------|------|----------|-----------|-----------|
| `bp_relaciones_pkey` | PRIMARY KEY | `id` | - | Primary key |
| `idx_bp_relaciones_origen` | B-tree | `bp_origen_id` | `WHERE eliminado_en IS NULL` | Búsqueda por BP origen |
| `idx_bp_relaciones_destino` | B-tree | `bp_destino_id` | `WHERE eliminado_en IS NULL` | Búsqueda por BP destino |
| `idx_bp_relaciones_tipo` | B-tree | `tipo_relacion` | `WHERE eliminado_en IS NULL` | Filtrado por tipo |
| `idx_bp_relaciones_org` | B-tree | `organizacion_id` | `WHERE eliminado_en IS NULL` | Filtrado por organización |
| `idx_bp_relaciones_actual` | B-tree | `es_actual` | `WHERE eliminado_en IS NULL AND es_actual = true` | Relaciones vigentes |
| `idx_bp_relaciones_bidireccional` | B-tree | `bp_origen_id, bp_destino_id, tipo_relacion` | `WHERE eliminado_en IS NULL` | Queries bidireccionales |
| `idx_bp_relaciones_unique_activa` | UNIQUE | `bp_origen_id, bp_destino_id, tipo_relacion` | `WHERE eliminado_en IS NULL AND es_actual = true` | Prevenir duplicados |

**Nota sobre índices parciales:** Todos los índices (excepto PK) tienen condición `WHERE eliminado_en IS NULL` para indexar solo registros activos, mejorando performance.

### Triggers

| Trigger | Evento | Función | Propósito |
|---------|--------|---------|-----------|
| `actualizar_bp_relaciones_timestamp` | BEFORE UPDATE | `actualizar_timestamp()` | Actualiza `actualizado_en` automáticamente |
| `validar_relacion_compatible` | BEFORE INSERT OR UPDATE | `validar_tipo_relacion_compatible()` | Valida compatibilidad de tipos según reglas de negocio |

**Validaciones del trigger `validar_relacion_compatible`:**

1. **Relación familiar:** Ambos BP (origen y destino) deben ser `tipo_actor = 'persona'`
2. **Relación laboral:** BP origen debe ser `tipo_actor = 'persona'`, BP destino debe ser `tipo_actor = 'empresa'`
3. **Otras relaciones:** Sin restricciones de tipo

### Relaciones

- **N:1** con `organizations` (muchas relaciones pertenecen a una organización)
- **N:1** con `business_partners` (origen) - muchas relaciones parten de un BP
- **N:1** con `business_partners` (destino) - muchas relaciones apuntan a un BP

### ENUMs

#### `tipo_relacion_bp`

```sql
CREATE TYPE tipo_relacion_bp AS ENUM (
    'familiar',      -- Relaciones familiares entre personas
    'laboral',       -- Empleado-Empresa, Socio-Empresa
    'referencia',    -- Referencias personales, contactos de emergencia
    'membresia',     -- Membresías en clubes, juntas directivas, asociaciones
    'comercial',     -- Relaciones comerciales, proveedor-cliente
    'otra'           -- Tipo customizable con atributos JSONB
);
```

| Valor | Descripción | Ejemplo de Roles |
|-------|-------------|------------------|
| `familiar` | Vínculos familiares entre personas | Padre/Hijo, Hermano/Hermano, Cónyuge/Cónyuge |
| `laboral` | Relaciones de trabajo (persona → empresa) | Empleado/Empleador, Socio/Empresa |
| `referencia` | Referencias personales | Referencia/Referido, Contacto de Emergencia/Persona |
| `membresia` | Membresías organizacionales | Miembro/Club, Director/Junta Directiva |
| `comercial` | Relaciones comerciales | Proveedor/Cliente, Distribuidor/Empresa |
| `otra` | Tipos personalizados | Definidos vía `atributos` JSONB |

### JSONB Schema - `atributos`

Estructura flexible que varía según `tipo_relacion`:

#### Relación Familiar

```json
{
  "parentesco": "Padre",
  "linea": "paterna",
  "convive": true,
  "notas": "Vive en la misma ciudad"
}
```

#### Relación Laboral

```json
{
  "cargo": "Desarrollador Senior",
  "departamento": "Ingeniería",
  "tipo_contrato": "indefinido",
  "salario_rango": "alto",
  "fecha_ingreso": "2020-01-15",
  "activo": true
}
```

#### Relación Membresía

```json
{
  "organizacion": "Junta Directiva ABC",
  "cargo": "Presidente",
  "fecha_inicio": "2023-01-01",
  "fecha_fin": "2024-12-31",
  "tipo_membresia": "activa"
}
```

#### Relación Referencia

```json
{
  "tipo": "emergencia",
  "relacion": "Hermano",
  "telefono_contacto": "+57 300 123 4567",
  "migrado_desde": "personas.contacto_emergencia_id"
}
```

#### Relación Comercial

```json
{
  "tipo_comercial": "proveedor",
  "categoria": "tecnología",
  "volumen_mensual": 5000000,
  "forma_pago": "30 días",
  "descuento_acordado": 15
}
```

### Vista: `v_relaciones_bidireccionales`

La vista `v_relaciones_bidireccionales` expande automáticamente las relaciones marcadas como bidireccionales:

**Funcionamiento:**
- Registros con `es_bidireccional = false` → Solo registro directo
- Registros con `es_bidireccional = true` → Registro directo + registro inverso generado

**Columna adicional:** `direccion` (`TEXT`) indica `'directo'` o `'inverso'`

**Ejemplo:**

```sql
-- Insertar relación bidireccional: Hermano ↔ Hermano
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  es_bidireccional
)
VALUES (
  'org-uuid', 'persona-a-uuid', 'persona-b-uuid',
  'familiar', 'Hermano', 'Hermano',
  true
);

-- Consultar vista
SELECT
  bp_origen_id,
  bp_destino_id,
  rol_origen,
  rol_destino,
  direccion
FROM v_relaciones_bidireccionales
WHERE bp_origen_id IN ('persona-a-uuid', 'persona-b-uuid');

-- Resultado:
-- persona-a-uuid | persona-b-uuid | Hermano | Hermano | directo
-- persona-b-uuid | persona-a-uuid | Hermano | Hermano | inverso (auto-generado)
```

**Ver:** [SCHEMA.md](./SCHEMA.md#v_relaciones_bidireccionales) para definición SQL completa.

### Función: `invertir_rol(rol TEXT)`

Función auxiliar que mapea roles a sus inversos para generación automática de relaciones bidireccionales:

```sql
SELECT invertir_rol('Padre');    -- 'Hijo'
SELECT invertir_rol('Empleado'); -- 'Empleador'
SELECT invertir_rol('Hermano');  -- 'Hermano' (simétrico)
```

**Mapeos implementados:**

| Rol Origen | Rol Destino |
|------------|-------------|
| Padre | Hijo |
| Madre | Hija |
| Empleado | Empleador |
| Socio | Empresa |
| Miembro | Club |
| Director | Junta Directiva |
| Proveedor | Cliente |
| Referencia | Referido |
| Hermano | Hermano |
| Cónyuge | Cónyuge |
| Contacto de Emergencia | Persona |
| ... | ... (20+ pares) |

**Ver:** [SCHEMA.md](./SCHEMA.md#helper-functions) para implementación completa.

### RLS Policies

| Policy | Operación | Target | Condición |
|--------|-----------|--------|-----------|
| Usuarios autenticados pueden ver | SELECT | `authenticated` | `true` (básica) |
| Usuarios autenticados pueden insertar | INSERT | `authenticated` | `true` (básica) |
| Usuarios autenticados pueden actualizar | UPDATE | `authenticated` | `true` (básica) |

**⚠️ Nota de Seguridad:** Las políticas actuales son básicas para desarrollo. En producción, refinarse para filtrar por `organizacion_id` usando tabla `user_organizations` (cuando se implemente).

**Política recomendada para producción:**

```sql
CREATE POLICY "Usuarios pueden ver relaciones de su organización"
  ON bp_relaciones FOR SELECT
  USING (
    organizacion_id IN (
      SELECT organizacion_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

### Migración de Datos: `contacto_emergencia_id`

Se migró el campo `personas.contacto_emergencia_id` a relaciones:

```sql
-- Query ejecutada (0 registros migrados en este proyecto)
INSERT INTO bp_relaciones (
  organizacion_id, bp_origen_id, bp_destino_id,
  tipo_relacion, rol_origen, rol_destino,
  atributos, es_bidireccional, fecha_inicio
)
SELECT
  bp.organizacion_id,
  p.id,
  p.contacto_emergencia_id,
  'referencia'::tipo_relacion_bp,
  'Persona',
  'Contacto de Emergencia',
  jsonb_build_object(
    'tipo', 'emergencia',
    'relacion', COALESCE(p.relacion_emergencia, 'No especificada'),
    'migrado_desde', 'personas.contacto_emergencia_id'
  ),
  false,
  p.creado_en::date
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
WHERE p.contacto_emergencia_id IS NOT NULL
  AND bp.eliminado_en IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM bp_relaciones r
    WHERE r.bp_origen_id = p.id
      AND r.bp_destino_id = p.contacto_emergencia_id
      AND r.tipo_relacion = 'referencia'
  );
```

**Nota:** El campo `personas.contacto_emergencia_id` **no se elimina** para mantener compatibilidad con código existente. Gradualmente será deprecado.

### Ejemplo de Registro Completo

#### Relación Familiar (Padre-Hijo)

```sql
INSERT INTO bp_relaciones (
  organizacion_id,
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  rol_origen,
  rol_destino,
  atributos,
  fecha_inicio,
  es_bidireccional,
  notas
)
VALUES (
  'org-uuid-here',
  'persona-padre-uuid',
  'persona-hijo-uuid',
  'familiar',
  'Padre',
  'Hijo',
  jsonb_build_object(
    'parentesco', 'Padre',
    'linea', 'paterna',
    'convive', true
  ),
  '1990-05-15',
  true,
  'Relación padre-hijo, conviven en la misma ciudad'
);
```

#### Relación Laboral (Empleado-Empresa)

```sql
INSERT INTO bp_relaciones (
  organizacion_id,
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  rol_origen,
  rol_destino,
  atributos,
  fecha_inicio,
  es_bidireccional
)
VALUES (
  'org-uuid-here',
  'persona-empleado-uuid',
  'empresa-empleador-uuid',
  'laboral',
  'Empleado',
  'Empleador',
  jsonb_build_object(
    'cargo', 'Desarrollador Senior',
    'departamento', 'Ingeniería',
    'tipo_contrato', 'indefinido',
    'activo', true
  ),
  '2020-01-15',
  false
);
```

#### Relación Bidireccional (Hermanos)

```sql
-- Solo se inserta UNA vez, la vista genera la inversa automáticamente
INSERT INTO bp_relaciones (
  organizacion_id,
  bp_origen_id,
  bp_destino_id,
  tipo_relacion,
  rol_origen,
  rol_destino,
  atributos,
  es_bidireccional
)
VALUES (
  'org-uuid-here',
  'persona-a-uuid',
  'persona-b-uuid',
  'familiar',
  'Hermano',
  'Hermano',
  jsonb_build_object('parentesco', 'Hermano', 'linea', 'paterna'),
  true  -- ¡Genera registro inverso automáticamente!
);

-- Consultar vista bidireccional
SELECT * FROM v_relaciones_bidireccionales
WHERE bp_origen_id = 'persona-a-uuid' OR bp_origen_id = 'persona-b-uuid';

-- Resultado: 2 registros (directo + inverso)
```

### Reglas de Negocio

1. **No Auto-relaciones:** Un BP no puede tener relación consigo mismo (`CHECK constraint`)
2. **Fechas Válidas:** Si existe `fecha_fin`, debe ser >= `fecha_inicio` (`CHECK constraint`)
3. **Relación Actual:** Se calcula automáticamente (`es_actual = fecha_fin IS NULL`)
4. **Prevenir Duplicados:** Un par (origen, destino, tipo) solo puede tener UNA relación activa (`UNIQUE index`)
5. **Tipo Compatible:**
   - Familiar: Ambos deben ser personas (`trigger validación`)
   - Laboral: Origen persona, destino empresa (`trigger validación`)
6. **Soft Delete:** Al eliminar, se marca `eliminado_en`, no se borra físicamente
7. **Bidireccionalidad:** Si `es_bidireccional = true`, consultar siempre la vista `v_relaciones_bidireccionales`
8. **Migración Transparente:** Contactos de emergencia migrados tienen `atributos.migrado_desde = 'personas.contacto_emergencia_id'`

### Queries Comunes

#### Ver todas las relaciones de un BP

```sql
-- Relaciones donde es origen
SELECT * FROM bp_relaciones
WHERE bp_origen_id = 'bp-uuid' AND eliminado_en IS NULL;

-- Relaciones donde es destino
SELECT * FROM bp_relaciones
WHERE bp_destino_id = 'bp-uuid' AND eliminado_en IS NULL;

-- Todas las relaciones (dirección agnóstica)
SELECT * FROM v_relaciones_bidireccionales
WHERE bp_origen_id = 'bp-uuid';
```

#### Historial laboral de una persona

```sql
SELECT
  r.fecha_inicio,
  r.fecha_fin,
  r.es_actual,
  r.atributos->>'cargo' AS cargo,
  r.atributos->>'departamento' AS departamento,
  e.razon_social AS empresa
FROM bp_relaciones r
INNER JOIN empresas e ON r.bp_destino_id = e.id
WHERE r.bp_origen_id = 'persona-uuid'
  AND r.tipo_relacion = 'laboral'
  AND r.eliminado_en IS NULL
ORDER BY r.fecha_inicio DESC;
```

#### Finalizar relación (mantener historial)

```sql
UPDATE bp_relaciones
SET fecha_fin = CURRENT_DATE,
    notas = COALESCE(notas, '') || ' - Finalizada el ' || CURRENT_DATE
WHERE id = 'relacion-uuid'
  AND eliminado_en IS NULL;
```

**Ver también:**
- [QUERIES.md](./QUERIES.md) - Más ejemplos de queries complejas
- [SCHEMA.md](./SCHEMA.md) - Arquitectura y diagramas ERD

---

## Resumen de Tipos de Datos

### UUID
Todos los IDs usan `UUID` generados con `gen_random_uuid()`:
- Ventaja: Distribución uniforme, imposibilidad de colisión, generación cliente-servidor
- Uso: Primary Keys, Foreign Keys

### TEXT
Preferencia por `TEXT` sobre `VARCHAR(n)`:
- PostgreSQL optimiza `TEXT` internamente
- No requiere especificar longitud máxima
- Uso: Nombres, direcciones, emails, documentos

### TIMESTAMPTZ
Todos los timestamps usan `TIMESTAMPTZ` (con zona horaria):
- Almacena en UTC internamente
- Convierte automáticamente a zona horaria del cliente
- Uso: `creado_en`, `actualizado_en`, `eliminado_en`

### JSONB
Metadata flexible almacenada en formato binario:
- Indexable y consultable eficientemente
- Soporta operadores JSON nativos de PostgreSQL
- Uso: `atributos`, `configuracion`

### ENUM
Tipos enumerados nativos de PostgreSQL:
- Type-safe a nivel de base de datos
- Mejor performance que CHECK constraints con strings
- Uso: Estados, tipos, categorías predefinidas

---

## Queries de Referencia Rápida

### Contar registros por tabla
```sql
SELECT
  'organizations' AS tabla, COUNT(*) AS total FROM organizations WHERE eliminado_en IS NULL
UNION ALL
SELECT 'business_partners', COUNT(*) FROM business_partners WHERE eliminado_en IS NULL
UNION ALL
SELECT 'personas', COUNT(*) FROM personas WHERE eliminado_en IS NULL
UNION ALL
SELECT 'empresas', COUNT(*) FROM empresas WHERE eliminado_en IS NULL;
```

### Ver estructura de una tabla
```sql
-- PostgreSQL
\d+ personas

-- SQL estándar
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'personas'
ORDER BY ordinal_position;
```

### Ver constraints de una tabla
```sql
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'personas'::regclass;
```

### Ver índices de una tabla
```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'personas';
```

---

**Ver también:**
- [SCHEMA.md](./SCHEMA.md) - Arquitectura y relaciones
- [QUERIES.md](./QUERIES.md) - Ejemplos de queries
- [RLS.md](./RLS.md) - Políticas de seguridad
