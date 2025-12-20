# Database Tables - Diccionario de Datos

Este documento describe en detalle todas las tablas, sus columnas, tipos de datos, constraints, índices y relaciones.

## Índice

- [organizations](#organizations)
- [business_partners](#business_partners)
- [personas](#personas)
- [empresas](#empresas)

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
