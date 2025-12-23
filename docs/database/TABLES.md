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

Tabla de organizaciones que implementa el sistema multi-tenancy. Cada organización tiene sus propios datos completamente aislados mediante Row Level Security (RLS). Soporta jerarquía de organizaciones (clubs, sedes, divisiones).

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | Identificador único (PK) |
| `nombre` | `TEXT` | NO | - | Nombre de la organización |
| `slug` | `TEXT` | NO | - | Identificador URL-friendly único |
| `tipo` | `TEXT` | YES | `'club'` | Tipo: 'club' \| 'sede' \| 'division' |
| `organizacion_padre_id` | `UUID` | YES | NULL | FK hacia `organizations(id)` para jerarquía |
| `email` | `TEXT` | YES | NULL | Email de contacto de la organización |
| `telefono` | `TEXT` | YES | NULL | Teléfono principal |
| `website` | `TEXT` | YES | NULL | Sitio web |
| `direccion` | `JSONB` | YES | `'{}'::jsonb` | Dirección estructurada |
| `configuracion` | `JSONB` | YES | `'{}'::jsonb` | Configuración específica de la organización |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |

### Constraints

- **Primary Key:** `id`
- **Unique:** `slug` (identificador URL único)
- **Foreign Key:** `organizacion_padre_id` → `organizations(id)` (auto-referencia)
- **Check:** `tipo IN ('club', 'sede', 'division')`
- **Not Null:** `nombre`, `slug`, `creado_en`, `actualizado_en`

### Índices

- `organizations_pkey` en `id` (Primary Key, automático)
- `organizations_slug_key` en `slug` (Unique, automático)
- `organizations_organizacion_padre_id_fkey` en `organizacion_padre_id` (Foreign Key, automático)

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en` automáticamente

### Relaciones

- **1:N** con `business_partners` (una organización tiene muchos socios)
- **1:N** con `bp_relaciones` (una organización tiene muchas relaciones)
- **N:1** con `organizations` (jerarquía: organización puede tener organización padre)
- **1:N** con `organizations` (una organización puede tener sub-organizaciones)

### JSONB Schema - `direccion`

Estructura para direcciones:

```json
{
  "pais": "Colombia",
  "departamento": "Cundinamarca",
  "ciudad": "Bogotá",
  "direccion_linea1": "Carrera 7 # 71-21",
  "direccion_linea2": "Torre A, Oficina 501",
  "codigo_postal": "110231",
  "coordenadas": {
    "latitud": 4.6533,
    "longitud": -74.0836
  }
}
```

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
INSERT INTO organizations (nombre, slug, tipo, email, telefono, direccion, configuracion)
VALUES (
  'Club Campestre El Bosque',
  'club-campestre-el-bosque',
  'club',
  'info@clubelbosque.com',
  '+57 1 234 5678',
  '{"ciudad": "Bogotá", "direccion_linea1": "Carrera 7 # 71-21"}'::jsonb,
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
| `codigo_bp` | `TEXT` | NO | Auto-generado | Código único formato BP-0000001 (7 dígitos) |
| `tipo_actor` | `TEXT` | NO | - | Discriminador: 'persona' \| 'empresa' |
| `organizacion_id` | `UUID` | NO | - | FK hacia `organizations(id)` |
| `estado` | `TEXT` | NO | `'activo'` | Estado: 'activo' \| 'inactivo' \| 'suspendido' |
| `email_principal` | `TEXT` | YES | NULL | Email principal de contacto |
| `telefono_principal` | `TEXT` | YES | NULL | Teléfono principal de contacto |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `creado_por` | `UUID` | YES | NULL | Usuario que creó el registro |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `actualizado_por` | `UUID` | YES | NULL | Usuario que actualizó el registro |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | Timestamp de eliminación (soft delete) |
| `eliminado_por` | `UUID` | YES | NULL | Usuario que eliminó el registro |

### Constraints

- **Primary Key:** `id`
- **Unique:** `codigo_bp` (código autogenerado único)
- **Foreign Key:** `organizacion_id` → `organizations(id)` ON DELETE CASCADE
- **Check:** `tipo_actor IN ('persona', 'empresa')`
- **Check:** `estado IN ('activo', 'inactivo', 'suspendido')`
- **Not Null:** `codigo_bp`, `tipo_actor`, `organizacion_id`, `estado`, `creado_en`, `actualizado_en`

### Índices

- `business_partners_pkey` en `id` (Primary Key)
- `business_partners_codigo_bp_key` en `codigo_bp` (Unique)
- `business_partners_organizacion_id_fkey` en `organizacion_id` (Foreign Key, automático)

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`
- `trigger_generar_codigo_bp` (BEFORE INSERT) - Genera el código BP secuencial automático

### Relaciones

- **N:1** con `organizations` (muchos socios pertenecen a una organización)
- **1:1** con `personas` (si `tipo_actor = 'persona'`)
- **1:1** con `empresas` (si `tipo_actor = 'empresa'`)
- **1:N** con `bp_relaciones` (origen)
- **1:N** con `bp_relaciones` (destino)

### Ejemplo de Registro

```sql
INSERT INTO business_partners (organizacion_id, tipo_actor, estado, email_principal, telefono_principal)
VALUES (
  'org-uuid-here',
  'persona',
  'activo',
  'contacto@example.com',
  '+57 300 123 4567'
)
RETURNING id, codigo_bp;
-- Resultado: codigo_bp autogenerado como 'BP-0000001'
```

### Validación de Consistencia

El trigger `validar_consistencia_tipo_actor` garantiza:

1. Si `tipo_actor = 'persona'` → **DEBE** existir registro en `personas` con el mismo `id`
2. Si `tipo_actor = 'empresa'` → **DEBE** existir registro en `empresas` con el mismo `id`
3. **NO** puede existir en ambas tablas simultáneamente

---

## `personas`

### Descripción

Tabla especializada para personas naturales. Implementa herencia de `business_partners` mediante relación 1:1 con PK compartido.

Todos los registros en esta tabla **DEBEN** tener un registro correspondiente en `business_partners` con el mismo `id` y con `tipo_actor = 'persona'`.

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | - | PK/FK hacia `business_partners(id)` |
| `tipo_documento` | `TEXT` | NO | - | Tipo de documento de identidad |
| `numero_documento` | `TEXT` | NO | - | Número de documento (único) |
| `fecha_expedicion` | `DATE` | YES | NULL | Fecha de expedición del documento |
| `lugar_expedicion` | `TEXT` | YES | NULL | Lugar donde se expidió el documento |
| `primer_nombre` | `TEXT` | NO | - | Primer nombre |
| `segundo_nombre` | `TEXT` | YES | NULL | Segundo nombre (opcional) |
| `primer_apellido` | `TEXT` | NO | - | Primer apellido |
| `segundo_apellido` | `TEXT` | YES | NULL | Segundo apellido (opcional) |
| `genero` | `TEXT` | NO | - | Género de la persona |
| `fecha_nacimiento` | `DATE` | NO | - | Fecha de nacimiento |
| `lugar_nacimiento` | `TEXT` | YES | NULL | Lugar de nacimiento |
| `nacionalidad` | `TEXT` | YES | `'CO'` | Código ISO de nacionalidad (default Colombia) |
| `estado_civil` | `TEXT` | YES | NULL | Estado civil |
| `ocupacion` | `TEXT` | YES | NULL | Ocupación actual |
| `profesion` | `TEXT` | YES | NULL | Profesión |
| `nivel_educacion` | `TEXT` | YES | NULL | Nivel educativo alcanzado |
| `tipo_sangre` | `TEXT` | YES | NULL | Tipo de sangre y RH |
| `email_secundario` | `TEXT` | YES | NULL | Email secundario |
| `telefono_secundario` | `TEXT` | YES | NULL | Teléfono secundario |
| `whatsapp` | `TEXT` | YES | NULL | Número de WhatsApp |
| `linkedin_url` | `TEXT` | YES | NULL | URL de perfil LinkedIn |
| `facebook_url` | `TEXT` | YES | NULL | URL de perfil Facebook |
| `instagram_handle` | `TEXT` | YES | NULL | Usuario de Instagram |
| `twitter_handle` | `TEXT` | YES | NULL | Usuario de Twitter/X |
| `foto_url` | `TEXT` | YES | NULL | URL de foto de perfil |
| `contacto_emergencia_id` | `UUID` | YES | NULL | FK hacia `personas(id)` (auto-referencia) |
| `relacion_emergencia` | `TEXT` | YES | NULL | Relación con contacto de emergencia |
| `atributos` | `JSONB` | YES | `'{}'::jsonb` | Metadata adicional (direcciones, preferencias) |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |

### Constraints

- **Primary Key:** `id`
- **Foreign Key:** `id` → `business_partners(id)` ON DELETE CASCADE
- **Foreign Key:** `contacto_emergencia_id` → `personas(id)` ON DELETE SET NULL
- **Unique:** `numero_documento` (documento único globalmente)
- **Check:** `tipo_documento IN ('CC', 'CE', 'TI', 'PA', 'RC', 'NIT', 'PEP', 'PPT', 'DNI', 'NUIP')`
- **Check:** `genero IN ('masculino', 'femenino', 'otro', 'no_especifica')`
- **Check:** `estado_civil IN ('soltero', 'casado', 'union_libre', 'divorciado', 'viudo', 'separado')`
- **Check:** `nivel_educacion IN ('primaria', 'bachillerato', 'tecnico', 'tecnologo', 'pregrado', 'posgrado', 'maestria', 'doctorado')`
- **Check:** `tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
- **Not Null:** `tipo_documento`, `numero_documento`, `primer_nombre`, `primer_apellido`, `genero`, `fecha_nacimiento`, `creado_en`, `actualizado_en`

### Índices

- `personas_pkey` en `id` (Primary Key)
- `personas_numero_documento_key` en `numero_documento` (Unique)
- `personas_contacto_emergencia_id_fkey` en `contacto_emergencia_id` (Foreign Key)

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`

### Relaciones

- **1:1** con `business_partners` (herencia CTI)
- **N:1** con `personas` (contacto emergencia, auto-referencia opcional)
- **1:N** con `personas` (es contacto de emergencia de otras personas)
- **1:N** con `empresas` (es representante legal de empresas)

### ENUMs

#### `tipo_documento` (CHECK constraint)
```
'CC'   -- Cédula de Ciudadanía
'CE'   -- Cédula de Extranjería
'TI'   -- Tarjeta de Identidad
'PA'   -- Pasaporte
'RC'   -- Registro Civil
'NIT'  -- Número de Identificación Tributaria (casos especiales)
'PEP'  -- Permiso Especial de Permanencia
'PPT'  -- Permiso por Protección Temporal
'DNI'  -- Documento Nacional de Identidad
'NUIP' -- Número Único de Identificación Personal
```

#### `genero` (CHECK constraint)
```
'masculino'
'femenino'
'otro'
'no_especifica'
```

#### `estado_civil` (CHECK constraint)
```
'soltero'
'casado'
'union_libre'
'divorciado'
'viudo'
'separado'
```

#### `nivel_educacion` (CHECK constraint)
```
'primaria'
'bachillerato'
'tecnico'
'tecnologo'
'pregrado'
'posgrado'
'maestria'
'doctorado'
```

#### `tipo_sangre` (CHECK constraint)
```
'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
```

### JSONB Schema - `atributos`

Estructura flexible para datos adicionales específicos de personas:

```json
{
  "direccion_residencia": {
    "pais": "Colombia",
    "ciudad": "Bogotá",
    "direccion": "Calle 123 # 45-67",
    "barrio": "Chapinero",
    "codigo_postal": "110231"
  },
  "direccion_correspondencia": {
    "direccion": "Carrera 15 # 88-22",
    "ciudad": "Bogotá"
  },
  "contacto_adicional": {
    "telefono_oficina": "+57 1 234 5678",
    "extension": "123"
  },
  "informacion_medica": {
    "eps": "Salud Total",
    "alergias": ["penicilina"],
    "condiciones": ["diabetes tipo 2"]
  },
  "preferencias": {
    "idioma_preferido": "es",
    "notificaciones_email": true,
    "notificaciones_sms": false
  }
}
```

### Ejemplo de Registro Completo

```sql
-- Transacción completa para crear persona
BEGIN;

-- 1. Insertar en business_partners
INSERT INTO business_partners (
  organizacion_id,
  tipo_actor,
  estado,
  email_principal,
  telefono_principal
)
VALUES (
  'org-uuid',
  'persona',
  'activo',
  'juan.perez@example.com',
  '+57 300 123 4567'
)
RETURNING id;
-- Guardar el id retornado como 'persona_bp_id'

-- 2. Insertar en personas
INSERT INTO personas (
  id,
  tipo_documento,
  numero_documento,
  fecha_expedicion,
  lugar_expedicion,
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  genero,
  fecha_nacimiento,
  lugar_nacimiento,
  nacionalidad,
  estado_civil,
  ocupacion,
  profesion,
  nivel_educacion,
  tipo_sangre,
  email_secundario,
  whatsapp,
  atributos
)
VALUES (
  'persona_bp_id', -- Mismo ID del business_partner
  'CC',
  '1234567890',
  '2008-03-15',
  'Bogotá',
  'Juan',
  'Carlos',
  'Pérez',
  'González',
  'masculino',
  '1990-05-15',
  'Bogotá, Colombia',
  'CO',
  'soltero',
  'Ingeniero',
  'Ingeniero de Sistemas',
  'pregrado',
  'O+',
  'jperez@gmail.com',
  '+57 300 123 4567',
  '{"direccion_residencia": {"ciudad": "Bogotá", "direccion": "Calle 123 #45-67"}}'::jsonb
);

COMMIT;
```

### Reglas de Negocio

1. **Documento Único:** El `numero_documento` debe ser único globalmente
2. **Nombres Completos:** Requiere al menos `primer_nombre` y `primer_apellido`
3. **Contacto Emergencia:** Debe ser otra persona existente
4. **Auto-referencia:** Una persona NO puede ser su propio contacto de emergencia
5. **Soft Delete:** Al eliminar una persona, se marca `eliminado_en` en business_partners
6. **Contacto Centralizado:** Email y teléfono principal están en `business_partners`

---

## `empresas`

### Descripción

Tabla especializada para empresas/personas jurídicas. Implementa herencia de `business_partners` mediante relación 1:1 con PK compartido.

Todos los registros en esta tabla **DEBEN** tener un registro correspondiente en `business_partners` con el mismo `id` y con `tipo_actor = 'empresa'`.

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | - | PK/FK hacia `business_partners(id)` |
| `nit` | `TEXT` | NO | - | NIT sin dígito de verificación |
| `digito_verificacion` | `TEXT` | NO | - | Dígito verificador del NIT (1 carácter) |
| `razon_social` | `TEXT` | NO | - | Nombre legal de la empresa |
| `nombre_comercial` | `TEXT` | YES | NULL | Nombre comercial (opcional) |
| `tipo_sociedad` | `TEXT` | NO | - | Tipo de sociedad |
| `fecha_constitucion` | `DATE` | YES | NULL | Fecha de constitución |
| `ciudad_constitucion` | `TEXT` | YES | NULL | Ciudad donde se constituyó |
| `pais_constitucion` | `TEXT` | YES | `'CO'` | País de constitución (default Colombia) |
| `numero_registro` | `TEXT` | YES | NULL | Número de registro mercantil |
| `codigo_ciiu` | `TEXT` | YES | NULL | Código CIIU (actividad económica) |
| `sector_industria` | `TEXT` | YES | NULL | Sector industrial |
| `actividad_economica` | `TEXT` | YES | NULL | Descripción de actividad económica |
| `tamano_empresa` | `TEXT` | YES | NULL | Tamaño: micro, pequeña, mediana, grande |
| `representante_legal_id` | `UUID` | YES | NULL | FK hacia `personas(id)` |
| `cargo_representante` | `TEXT` | YES | NULL | Cargo del representante legal |
| `telefono_secundario` | `TEXT` | YES | NULL | Teléfono secundario |
| `whatsapp` | `TEXT` | YES | NULL | Número de WhatsApp |
| `website` | `TEXT` | YES | NULL | Sitio web corporativo |
| `linkedin_url` | `TEXT` | YES | NULL | URL de perfil LinkedIn |
| `facebook_url` | `TEXT` | YES | NULL | URL de página Facebook |
| `instagram_handle` | `TEXT` | YES | NULL | Usuario de Instagram |
| `twitter_handle` | `TEXT` | YES | NULL | Usuario de Twitter/X |
| `logo_url` | `TEXT` | YES | NULL | URL del logo de la empresa |
| `email_secundario` | `TEXT` | YES | NULL | Email secundario corporativo |
| `ingresos_anuales` | `NUMERIC` | YES | NULL | Ingresos anuales en moneda local |
| `numero_empleados` | `INTEGER` | YES | NULL | Número de empleados |
| `atributos` | `JSONB` | YES | `'{}'::jsonb` | Metadata adicional (sucursales, certificaciones) |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |

### Constraints

- **Primary Key:** `id`
- **Foreign Key:** `id` → `business_partners(id)` ON DELETE CASCADE
- **Foreign Key:** `representante_legal_id` → `personas(id)` ON DELETE SET NULL
- **Unique:** `nit` (NIT único globalmente)
- **Check:** `length(digito_verificacion) = 1` (debe ser un solo carácter)
- **Check:** `tipo_sociedad IN ('SA', 'SAS', 'LTDA', 'EU', 'COOP', 'FUNDACION', 'CORP', 'ONG', 'SUCURSAL', 'OTRO')`
- **Check:** `tamano_empresa IN ('micro', 'pequena', 'mediana', 'grande')`
- **Not Null:** `nit`, `digito_verificacion`, `razon_social`, `tipo_sociedad`, `creado_en`, `actualizado_en`

### Índices

- `empresas_pkey` en `id` (Primary Key)
- `empresas_nit_key` en `nit` (Unique)
- `empresas_representante_legal_id_fkey` en `representante_legal_id` (Foreign Key)

### Triggers

- `actualizar_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`

### Relaciones

- **1:1** con `business_partners` (herencia CTI)
- **N:1** con `personas` (representante legal, opcional)

### ENUMs

#### `tipo_sociedad` (CHECK constraint)
```
'SA'         -- Sociedad Anónima
'SAS'        -- Sociedad por Acciones Simplificada
'LTDA'       -- Limitada
'EU'         -- Empresa Unipersonal
'COOP'       -- Cooperativa
'FUNDACION'  -- Fundación
'CORP'       -- Corporación
'ONG'        -- Organización No Gubernamental
'SUCURSAL'   -- Sucursal
'OTRO'       -- Otro tipo
```

#### `tamano_empresa` (CHECK constraint)
```
'micro'    -- Microempresa
'pequena'  -- Pequeña empresa
'mediana'  -- Mediana empresa
'grande'   -- Gran empresa
```

### JSONB Schema - `atributos`

Estructura flexible para datos adicionales específicos de empresas:

```json
{
  "sede_principal": {
    "pais": "Colombia",
    "ciudad": "Bogotá",
    "direccion": "Carrera 7 # 71-21",
    "barrio": "Chapinero",
    "codigo_postal": "110231"
  },
  "sucursales": [
    {
      "nombre": "Sucursal Norte",
      "ciudad": "Medellín",
      "direccion": "Calle 50 # 45-30",
      "telefono": "+57 4 123 4567"
    }
  ],
  "certificaciones": [
    "ISO 9001",
    "ISO 27001",
    "BASC"
  ],
  "productos_servicios": [
    "Desarrollo de software",
    "Consultoría IT",
    "Soporte técnico"
  ],
  "contactos_clave": {
    "gerente_general": {
      "nombre": "María López",
      "telefono": "+57 300 999 8888",
      "email": "gerente@empresa.com"
    },
    "contador": {
      "nombre": "Pedro Ramírez",
      "telefono": "+57 310 777 6666"
    }
  },
  "informacion_bancaria": {
    "banco": "Bancolombia",
    "tipo_cuenta": "corriente",
    "numero_cuenta": "12345678901"
  }
}
```

### Ejemplo de Registro Completo

```sql
-- Transacción completa para crear empresa
BEGIN;

-- 1. Insertar en business_partners
INSERT INTO business_partners (
  organizacion_id,
  tipo_actor,
  estado,
  email_principal,
  telefono_principal
)
VALUES (
  'org-uuid',
  'empresa',
  'activo',
  'info@empresa.com',
  '+57 1 234 5678'
)
RETURNING id;
-- Guardar el id retornado como 'empresa_bp_id'

-- 2. Calcular dígito de verificación
SELECT calcular_digito_verificacion_nit('900123456');
-- Resultado: '8'

-- 3. Insertar en empresas
INSERT INTO empresas (
  id,
  nit,
  digito_verificacion,
  razon_social,
  nombre_comercial,
  tipo_sociedad,
  fecha_constitucion,
  ciudad_constitucion,
  pais_constitucion,
  codigo_ciiu,
  sector_industria,
  actividad_economica,
  tamano_empresa,
  representante_legal_id,
  cargo_representante,
  website,
  numero_empleados,
  atributos
)
VALUES (
  'empresa_bp_id', -- Mismo ID del business_partner
  '900123456',
  '8', -- DV calculado
  'Tecnología Avanzada S.A.S.',
  'TechAdvance',
  'SAS',
  '2020-01-15',
  'Bogotá',
  'CO',
  '6201',
  'Tecnología',
  'Desarrollo de software',
  'pequena',
  'persona-uuid-representante',
  'Gerente General',
  'https://www.techadvance.com',
  50,
  '{"certificaciones": ["ISO 9001"], "productos_servicios": ["Desarrollo de software"]}'::jsonb
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
FROM empresas;
```

**Ejemplo de cálculo:**
```sql
SELECT calcular_digito_verificacion_nit('900123456');
-- Resultado: '8'
```

### Reglas de Negocio

1. **NIT Único:** El `nit` debe ser único globalmente
2. **Dígito Verificación:** Debe calcularse usando `calcular_digito_verificacion_nit()`, es de 1 carácter
3. **Representante Legal:** Debe ser una persona existente en `personas`
4. **Soft Delete:** Al eliminar una empresa, se marca `eliminado_en` en business_partners
5. **NIT Formato:** Solo números, sin guiones ni puntos (formato: '900123456')
6. **Razón Social vs Nombre Comercial:**
   - `razon_social`: Nombre legal registrado (obligatorio)
   - `nombre_comercial`: Marca comercial (opcional)
7. **Contacto Centralizado:** Email y teléfono principal están en `business_partners`

---

## `bp_relaciones`

### Descripción

Tabla de relaciones entre Business Partners que implementa un sistema complejo de vínculos con historial temporal, validaciones de tipo y soporte bidireccional.

Permite modelar cualquier tipo de relación entre socios de negocio (personas y/o empresas) con roles específicos para origen y destino, metadata flexible por tipo de relación, y seguimiento temporal de vigencia.

**Diseño:** Usa dos campos `rol_origen` + `rol_destino` para máxima claridad y mantenibilidad (en lugar de un solo campo `subtipo`).

### Estructura

| Columna | Tipo | Null | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | Identificador único de la relación |
| `organizacion_id` | `UUID` | NO | - | FK hacia `organizations(id)` |
| `bp_origen_id` | `UUID` | NO | - | FK hacia `business_partners(id)` (origen) |
| `bp_destino_id` | `UUID` | NO | - | FK hacia `business_partners(id)` (destino) |
| `tipo_relacion` | `tipo_relacion_bp` | NO | - | ENUM: familiar, laboral, referencia, membresia, comercial, otra |
| `rol_origen` | `TEXT` | NO | - | Rol del BP origen (ej: 'Padre', 'Empleado', 'Jefe') |
| `rol_destino` | `TEXT` | NO | - | Rol del BP destino (ej: 'Hijo', 'Empleador', 'Subordinado') |
| `atributos` | `JSONB` | NO | `'{}'::jsonb` | Metadata adicional según tipo de relación |
| `fecha_inicio` | `DATE` | YES | NULL | Fecha de inicio de la relación |
| `fecha_fin` | `DATE` | YES | NULL | Fecha de fin (NULL = vigente) |
| `es_actual` | `BOOLEAN` | NO | GENERATED | Columna generada: `fecha_fin IS NULL` |
| `es_bidireccional` | `BOOLEAN` | NO | `false` | Si TRUE, la vista genera registro inverso automático |
| `notas` | `TEXT` | YES | NULL | Notas adicionales sobre la relación |
| `creado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de creación |
| `actualizado_en` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp de última actualización |
| `eliminado_en` | `TIMESTAMPTZ` | YES | NULL | Timestamp de eliminación (soft delete) |

### Constraints

- **Primary Key:** `id`
- **Foreign Keys:**
  - `organizacion_id` → `organizations(id)` ON DELETE CASCADE
  - `bp_origen_id` → `business_partners(id)` ON DELETE CASCADE
  - `bp_destino_id` → `business_partners(id)` ON DELETE CASCADE
- **Check:** `bp_origen_id != bp_destino_id` (no auto-relaciones)
- **Check:** `fecha_fin IS NULL OR fecha_fin >= fecha_inicio` (fechas consistentes)
- **Unique:** `(bp_origen_id, bp_destino_id, tipo_relacion)` WHERE `eliminado_en IS NULL AND es_actual = true`
- **Generated:** `es_actual GENERATED ALWAYS AS (fecha_fin IS NULL) STORED`

### Índices

- `bp_relaciones_pkey` en `id` (Primary Key)
- Índices parciales en columnas comunes WHERE `eliminado_en IS NULL` para mejor performance
- Índice único compuesto para prevenir duplicados activos

### Triggers

- `actualizar_bp_relaciones_timestamp` (BEFORE UPDATE) - Actualiza `actualizado_en`
- `validar_relacion_compatible` (BEFORE INSERT/UPDATE) - Valida tipos compatibles

### Relaciones

- **N:1** con `organizations`
- **N:1** con `business_partners` (origen)
- **N:1** con `business_partners` (destino)

### ENUM: `tipo_relacion_bp`

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

### Vista: `v_relaciones_bidireccionales`

La vista `v_relaciones_bidireccionales` expande automáticamente las relaciones marcadas como bidireccionales, generando registros inversos para consultas desde ambas direcciones.

**Ver:** [SCHEMA.md](./SCHEMA.md#v_relaciones_bidireccionales) para definición completa.

### Función Helper: `invertir_rol(rol TEXT)`

Mapea roles a sus inversos para generación automática de relaciones bidireccionales.

Ejemplos:
```sql
SELECT invertir_rol('Padre');    -- 'Hijo'
SELECT invertir_rol('Empleado'); -- 'Empleador'
SELECT invertir_rol('Hermano');  -- 'Hermano' (simétrico)
```

**Ver:** [SCHEMA.md](./SCHEMA.md#helper-functions) para mapeos completos.

### Reglas de Negocio

1. **No Auto-relaciones:** Un BP no puede tener relación consigo mismo
2. **Fechas Válidas:** Si existe `fecha_fin`, debe ser >= `fecha_inicio`
3. **Relación Actual:** Se calcula automáticamente como columna generada
4. **Prevenir Duplicados:** Un par (origen, destino, tipo) solo puede tener UNA relación activa
5. **Tipo Compatible:**
   - Familiar: Ambos deben ser personas (validado por trigger)
   - Laboral: Origen persona, destino empresa (validado por trigger)
6. **Soft Delete:** Al eliminar, se marca `eliminado_en`
7. **Bidireccionalidad:** Si `es_bidireccional = true`, usar vista `v_relaciones_bidireccionales`

---

## Resumen de Convenciones

### Nomenclatura
- **Tablas:** snake_case, plural (excepto especializaciones)
- **Columnas:** snake_case
- **Primary Keys:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `{tabla}_id` (ej: `organizacion_id`)
- **Timestamps:** `creado_en`, `actualizado_en`, `eliminado_en`
- **Auditoría:** `creado_por`, `actualizado_por`, `eliminado_por`

### Tipos de Datos
- **IDs:** `UUID` (no SERIAL/BIGINT)
- **Texto:** `TEXT` (no VARCHAR)
- **Timestamps:** `TIMESTAMPTZ` (con zona horaria)
- **Enums:** Check constraints o tipos nativos PostgreSQL
- **Metadata:** `JSONB`

### Soft Delete
Todas las tablas principales usan soft delete:
```sql
eliminado_en TIMESTAMPTZ DEFAULT NULL
eliminado_por UUID

-- Para "eliminar"
UPDATE tabla SET eliminado_en = NOW(), eliminado_por = auth.uid() WHERE id = 'uuid';

-- Queries filtran activos
SELECT * FROM tabla WHERE eliminado_en IS NULL;
```

---

**Ver también:**
- [SCHEMA.md](./SCHEMA.md) - Arquitectura y relaciones
- [QUERIES.md](./QUERIES.md) - Ejemplos de queries
- [RLS.md](./RLS.md) - Políticas de seguridad
