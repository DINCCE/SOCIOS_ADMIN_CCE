# Database Schema - Sistema de Gestión de Socios

## Diagrama de Relaciones (ERD)

### Diagrama Completo

```mermaid
erDiagram
    organizations ||--o{ business_partners : "contiene"
    business_partners ||--o| personas : "es_una"
    business_partners ||--o| empresas : "es_una"
    personas }o--o| personas : "contacto_emergencia"
    empresas }o--o| personas : "representante_legal"

    organizations {
        uuid id PK
        text nombre
        text descripcion
        jsonb configuracion
        timestamptz creado_en
        timestamptz actualizado_en
        timestamptz eliminado_en
    }

    business_partners {
        uuid id PK
        uuid organizacion_id FK
        enum tipo_actor
        text codigo_interno
        enum estado
        jsonb atributos
        timestamptz creado_en
        timestamptz actualizado_en
        timestamptz eliminado_en
    }

    personas {
        uuid id PK_FK
        text nombres
        text apellidos
        enum tipo_documento
        text numero_documento
        date fecha_nacimiento
        enum genero
        text telefono
        text email
        text direccion
        uuid contacto_emergencia_id FK
        jsonb atributos
    }

    empresas {
        uuid id PK_FK
        text razon_social
        text nombre_comercial
        text nit
        text digito_verificacion
        enum tipo_empresa
        date fecha_constitucion
        text telefono
        text email
        text direccion
        uuid representante_legal_id FK
        jsonb atributos
    }
```

### Diagrama Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│                       ORGANIZATIONS                          │
│  - Nivel de multi-tenancy                                    │
│  - Contiene todos los datos de la organización              │
└──────────────────────────┬──────────────────────────────────┘
                           │ 1:N
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   BUSINESS_PARTNERS                          │
│  - Tabla base (CTI Pattern)                                  │
│  - Campos comunes a todos los tipos                         │
│  - tipo_actor: 'persona' | 'empresa'                        │
└─────────────┬────────────────────────────────────────────────┘
              │
              │ 1:1 (STRICT - validado por trigger)
              │
      ┌───────┴────────┐
      │                │
┌─────▼──────┐  ┌──────▼────────┐
│  PERSONAS  │  │   EMPRESAS    │
│            │  │               │
│  Persona   │  │  Razón social │
│  natural   │  │  NIT + DV     │
│            │  │  Rep. legal───┼─┐
└──────┬─────┘  └───────────────┘ │
       │                           │
       │ N:1 (opcional)            │
       │ contacto_emergencia       │ N:1 (opcional)
       │                           │ representante_legal
       └───────────────────────────┘
           (auto-referencia a personas)
```

## Arquitectura de Tablas

### 1. `organizations`

**Propósito:** Tabla de organizaciones para implementar multi-tenancy. Cada organización tiene sus propios datos aislados vía RLS.

**Tipo:** Tabla independiente

**Relaciones:**
- 1:N con `business_partners` (una organización tiene múltiples socios)

**Campos Principales:**
- `id` (PK): Identificador único
- `nombre`: Nombre de la organización
- `configuracion` (JSONB): Configuración específica de la organización

**Ver:** [TABLES.md](./TABLES.md#organizations) para diccionario completo.

---

### 2. `business_partners`

**Propósito:** Tabla base del patrón Class Table Inheritance (CTI). Contiene campos comunes a todos los tipos de socios de negocio.

**Tipo:** Tabla base (CTI)

**Relaciones:**
- N:1 con `organizations` (cada socio pertenece a una organización)
- 1:1 con `personas` (si `tipo_actor = 'persona'`)
- 1:1 con `empresas` (si `tipo_actor = 'empresa'`)

**Campos Principales:**
- `id` (PK): Identificador único compartido con tabla especializada
- `organizacion_id` (FK): Organización a la que pertenece
- `tipo_actor` (ENUM): 'persona' | 'empresa'
- `estado` (ENUM): 'activo' | 'inactivo' | 'suspendido'
- `atributos` (JSONB): Metadata adicional flexible

**Constraints Importantes:**
- FK hacia `organizations(id)` ON DELETE CASCADE
- CHECK: `tipo_actor IN ('persona', 'empresa')`
- UNIQUE: `(organizacion_id, codigo_interno)` WHERE `eliminado_en IS NULL`

**Triggers:**
- `actualizar_timestamp` (BEFORE UPDATE)
- `validar_consistencia_tipo_actor` (BEFORE INSERT/UPDATE)

**Ver:** [TABLES.md](./TABLES.md#business_partners) para diccionario completo.

---

### 3. `personas`

**Propósito:** Tabla especializada para personas naturales. Hereda de `business_partners` mediante relación 1:1.

**Tipo:** Tabla especializada (CTI)

**Relaciones:**
- 1:1 con `business_partners` (PK compartido)
- N:1 con `personas` (contacto de emergencia, auto-referencia opcional)

**Campos Principales:**
- `id` (PK, FK): Mismo ID que en `business_partners`
- `nombres`, `apellidos`: Nombre completo
- `tipo_documento` (ENUM): 'CC' | 'CE' | 'PA' | 'TI' | 'RC'
- `numero_documento`: Número único de identificación
- `contacto_emergencia_id` (FK, opcional): Referencia a otra persona

**Constraints Importantes:**
- PK/FK hacia `business_partners(id)` ON DELETE CASCADE
- UNIQUE: `numero_documento` WHERE `eliminado_en IS NULL`
- FK hacia `personas(id)` para contacto emergencia (permite NULL)

**Índices:**
- `idx_personas_documento` en `numero_documento`
- `idx_personas_nombres` en `nombres`
- `idx_personas_apellidos` en `apellidos`

**Triggers:**
- `actualizar_timestamp` (BEFORE UPDATE)

**Ver:** [TABLES.md](./TABLES.md#personas) para diccionario completo.

---

### 4. `empresas`

**Propósito:** Tabla especializada para empresas/personas jurídicas. Hereda de `business_partners` mediante relación 1:1.

**Tipo:** Tabla especializada (CTI)

**Relaciones:**
- 1:1 con `business_partners` (PK compartido)
- N:1 con `personas` (representante legal, opcional)

**Campos Principales:**
- `id` (PK, FK): Mismo ID que en `business_partners`
- `razon_social`: Nombre legal de la empresa
- `nombre_comercial`: Nombre comercial (opcional)
- `nit`: Número de Identificación Tributaria
- `digito_verificacion`: Dígito verificador del NIT (calculado automáticamente)
- `representante_legal_id` (FK, opcional): Referencia a `personas`

**Constraints Importantes:**
- PK/FK hacia `business_partners(id)` ON DELETE CASCADE
- UNIQUE: `nit` WHERE `eliminado_en IS NULL`
- FK hacia `personas(id)` para representante legal (permite NULL)
- CHECK: `length(digito_verificacion) = 1`

**Índices:**
- `idx_empresas_nit` en `nit`
- `idx_empresas_razon_social` en `razon_social`

**Triggers:**
- `actualizar_timestamp` (BEFORE UPDATE)

**Ver:** [TABLES.md](./TABLES.md#empresas) para diccionario completo.

---

## Tipos Enumerados (ENUMs)

### `tipo_documento_persona`
```sql
CREATE TYPE tipo_documento_persona AS ENUM (
    'CC',  -- Cédula de Ciudadanía
    'CE',  -- Cédula de Extranjería
    'PA',  -- Pasaporte
    'TI',  -- Tarjeta de Identidad
    'RC'   -- Registro Civil
);
```

### `genero_persona`
```sql
CREATE TYPE genero_persona AS ENUM (
    'masculino',
    'femenino',
    'otro',
    'prefiero_no_decir'
);
```

### `tipo_empresa`
```sql
CREATE TYPE tipo_empresa AS ENUM (
    'SA',           -- Sociedad Anónima
    'SAS',          -- Sociedad por Acciones Simplificada
    'LTDA',         -- Limitada
    'UNIPERSONAL',  -- Empresa Unipersonal
    'OTRA'          -- Otro tipo
);
```

### `estado_actor`
```sql
CREATE TYPE estado_actor AS ENUM (
    'activo',
    'inactivo',
    'suspendido'
);
```

### `tipo_actor`
```sql
CREATE TYPE tipo_actor AS ENUM (
    'persona',
    'empresa'
);
```

---

## Funciones de Base de Datos

### `calcular_digito_verificacion_nit(nit TEXT)`

**Propósito:** Calcula el dígito de verificación para NITs colombianos según el algoritmo estándar de la DIAN.

**Parámetros:**
- `nit` (TEXT): Número de Identificación Tributaria sin dígito verificador

**Retorna:** TEXT (un solo dígito '0'-'9')

**Algoritmo:**
1. Multiplicar cada dígito del NIT por la secuencia [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]
2. Sumar todos los productos
3. Calcular el residuo de la división por 11
4. Si residuo = 0 o 1, DV = residuo, sino DV = 11 - residuo

**Ejemplo:**
```sql
SELECT calcular_digito_verificacion_nit('900123456');
-- Resultado: '8'
```

**Uso:**
```sql
-- Validar NIT antes de insertar
SELECT nit, calcular_digito_verificacion_nit(nit) AS dv_calculado
FROM empresas
WHERE digito_verificacion != calcular_digito_verificacion_nit(nit);
```

---

### `actualizar_timestamp()`

**Propósito:** Trigger function que actualiza automáticamente el campo `actualizado_en` al valor actual cada vez que se modifica un registro.

**Tipo:** Trigger Function (BEFORE UPDATE)

**Retorna:** TRIGGER (NEW row con timestamp actualizado)

**Aplicado a:**
- `organizations`
- `business_partners`
- `personas`
- `empresas`

**Ejemplo de creación del trigger:**
```sql
CREATE TRIGGER actualizar_business_partners_timestamp
    BEFORE UPDATE ON business_partners
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();
```

---

### `validar_consistencia_tipo_actor()`

**Propósito:** Valida que cada `business_partner` tenga exactamente UNA especialización correspondiente a su `tipo_actor`. Previene registros "huérfanos".

**Tipo:** Trigger Function (BEFORE INSERT/UPDATE)

**Retorna:** TRIGGER (NEW row si validación pasa, ERROR si falla)

**Lógica:**
1. Si `tipo_actor = 'persona'` → DEBE existir registro en `personas` con mismo `id`
2. Si `tipo_actor = 'empresa'` → DEBE existir registro en `empresas` con mismo `id`
3. NO puede existir en ambas tablas simultáneamente

**Aplicado a:** `business_partners`

**Errores que previene:**
- Business partner tipo 'persona' sin registro en tabla `personas`
- Business partner tipo 'empresa' sin registro en tabla `empresas`
- Business partner existente en ambas tablas especializadas

**Ejemplo de error:**
```sql
-- Esto fallaría:
INSERT INTO business_partners (organizacion_id, tipo_actor)
VALUES ('org-uuid', 'persona');
-- ERROR: Business partner de tipo 'persona' debe tener registro en tabla personas
```

---

## Vistas

### `v_personas_completa`

**Propósito:** Vista desnormalizada que combina datos de `personas`, `business_partners` y `organizations` para facilitar queries.

**Campos:**
- Todos los campos de `personas`
- Campos relevantes de `business_partners` (estado, codigo_interno, atributos)
- Nombre de la organización
- `nombre_completo` (computed): `nombres || ' ' || apellidos`
- `nombre_contacto_emergencia` (computed): Nombre completo del contacto

**Query Base:**
```sql
SELECT
    p.*,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.codigo_interno,
    bp.estado,
    bp.atributos AS atributos_bp,
    bp.creado_en AS bp_creado_en,
    bp.actualizado_en AS bp_actualizado_en,
    bp.eliminado_en AS bp_eliminado_en,
    o.nombre AS organizacion_nombre,
    (p.nombres || ' ' || p.apellidos) AS nombre_completo,
    (ce.nombres || ' ' || ce.apellidos) AS nombre_contacto_emergencia
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas ce ON p.contacto_emergencia_id = ce.id;
```

**Uso recomendado:**
```sql
-- Buscar persona por documento con todos sus datos
SELECT * FROM v_personas_completa
WHERE numero_documento = '123456789'
  AND bp_eliminado_en IS NULL;
```

---

### `v_empresas_completa`

**Propósito:** Vista desnormalizada que combina datos de `empresas`, `business_partners`, `organizations` y representante legal.

**Campos:**
- Todos los campos de `empresas`
- Campos relevantes de `business_partners`
- Nombre de la organización
- `nit_completo` (computed): `nit || '-' || digito_verificacion`
- `nombre_representante_legal` (computed): Nombre completo del representante

**Query Base:**
```sql
SELECT
    e.*,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.codigo_interno,
    bp.estado,
    bp.atributos AS atributos_bp,
    bp.creado_en AS bp_creado_en,
    bp.actualizado_en AS bp_actualizado_en,
    bp.eliminado_en AS bp_eliminado_en,
    o.nombre AS organizacion_nombre,
    (e.nit || '-' || e.digito_verificacion) AS nit_completo,
    (rl.nombres || ' ' || rl.apellidos) AS nombre_representante_legal
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas rl ON e.representante_legal_id = rl.id;
```

**Uso recomendado:**
```sql
-- Buscar empresa por NIT con todos sus datos
SELECT * FROM v_empresas_completa
WHERE nit = '900123456'
  AND bp_eliminado_en IS NULL;
```

---

### `v_actores_unificados`

**Propósito:** Vista polimórfica que unifica TODOS los actores (personas + empresas) en una sola vista con campos comunes.

**Campos:**
- `id`: ID del business partner
- `organizacion_id`: ID de la organización
- `tipo_actor`: 'persona' | 'empresa'
- `nombre`: Nombre completo (persona) o razón social (empresa)
- `identificacion`: Número documento (persona) o NIT completo (empresa)
- `tipo_identificacion`: Tipo de documento o 'NIT'
- `email`, `telefono`, `direccion`: Campos de contacto
- `estado`: Estado del actor
- `codigo_interno`: Código interno del business partner
- Campos de timestamp

**Query Base:**
```sql
-- UNION de personas y empresas
SELECT
    bp.id,
    bp.organizacion_id,
    bp.tipo_actor,
    (p.nombres || ' ' || p.apellidos) AS nombre,
    p.numero_documento AS identificacion,
    p.tipo_documento::text AS tipo_identificacion,
    p.email,
    p.telefono,
    p.direccion,
    bp.estado,
    bp.codigo_interno,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
FROM business_partners bp
INNER JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'

UNION ALL

SELECT
    bp.id,
    bp.organizacion_id,
    bp.tipo_actor,
    e.razon_social AS nombre,
    (e.nit || '-' || e.digito_verificacion) AS identificacion,
    'NIT' AS tipo_identificacion,
    e.email,
    e.telefono,
    e.direccion,
    bp.estado,
    bp.codigo_interno,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
FROM business_partners bp
INNER JOIN empresas e ON bp.id = e.id
WHERE bp.tipo_actor = 'empresa';
```

**Uso recomendado:**
```sql
-- Buscar cualquier actor por nombre o identificación
SELECT * FROM v_actores_unificados
WHERE nombre ILIKE '%Juan%'
   OR identificacion = '123456789'
  AND eliminado_en IS NULL
ORDER BY nombre;
```

---

## Índices

### Índices de Primary Key (automáticos)
- `organizations(id)`
- `business_partners(id)`
- `personas(id)`
- `empresas(id)`

### Índices de Foreign Key (automáticos)
- `business_partners(organizacion_id)`
- `personas(contacto_emergencia_id)`
- `empresas(representante_legal_id)`

### Índices de Búsqueda
- `idx_personas_documento` en `personas(numero_documento)`
- `idx_personas_nombres` en `personas(nombres)`
- `idx_personas_apellidos` en `personas(apellidos)`
- `idx_empresas_nit` en `empresas(nit)`
- `idx_empresas_razon_social` en `empresas(razon_social)`

### Índices Compuestos Únicos (con filtro soft delete)
- `UNIQUE (organizacion_id, codigo_interno)` WHERE `eliminado_en IS NULL` en `business_partners`
- `UNIQUE (numero_documento)` WHERE `eliminado_en IS NULL` en `personas`
- `UNIQUE (nit)` WHERE `eliminado_en IS NULL` en `empresas`

---

## Convenciones de Naming

### Tablas
- snake_case, plural para tablas independientes: `organizations`, `business_partners`
- snake_case, plural consistente para especializaciones: `personas`, `empresas`

### Columnas
- snake_case: `numero_documento`, `fecha_nacimiento`
- Sufijos estándar:
  - `_id` para foreign keys: `organizacion_id`, `contacto_emergencia_id`
  - `_en` para timestamps: `creado_en`, `actualizado_en`, `eliminado_en`

### Constraints
- Primary Key: `{tabla}_pkey` (automático)
- Foreign Key: `{tabla}_{columna}_fkey` (automático)
- Unique: `{tabla}_{columna}_key` (automático)
- Check: `{tabla}_{descripcion}_check`

### Índices
- `idx_{tabla}_{columna}` para índices simples
- `idx_{tabla}_{col1}_{col2}` para índices compuestos

### Funciones
- snake_case: `calcular_digito_verificacion_nit`, `actualizar_timestamp`
- Verbos descriptivos: `calcular_`, `validar_`, `actualizar_`

### Triggers
- `{accion}_{tabla}_{descripcion}`
- Ejemplo: `actualizar_business_partners_timestamp`

---

## Política de Soft Delete

**Implementación uniforme en todas las tablas:**

```sql
-- Campo en todas las tablas
eliminado_en TIMESTAMPTZ DEFAULT NULL

-- Para "eliminar" un registro
UPDATE tabla SET eliminado_en = NOW() WHERE id = 'uuid';

-- Queries siempre filtran registros activos
SELECT * FROM tabla WHERE eliminado_en IS NULL;

-- Recuperar registro eliminado
UPDATE tabla SET eliminado_en = NULL WHERE id = 'uuid';
```

**Ventajas:**
- Auditoría completa
- Recuperación de datos
- Integridad referencial preservada
- Cumplimiento normativo

**Ver:** [QUERIES.md](./QUERIES.md#soft-delete) para ejemplos de uso.

---

## Diagrama de Flujo de Validación

```
┌─────────────────────────────────────────┐
│  INSERT/UPDATE business_partners        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  TRIGGER: validar_consistencia_tipo_actor │
└──────────────────┬──────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌──────────────┐      ┌──────────────────┐
│ tipo_actor = │      │ tipo_actor =     │
│  'persona'?  │      │  'empresa'?      │
└──────┬───────┘      └────────┬─────────┘
       │                       │
       ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ ¿Existe en   │      │ ¿Existe en       │
│  personas?   │      │  empresas?       │
└──────┬───────┘      └────────┬─────────┘
       │                       │
    ┌──┴──┐                 ┌──┴──┐
    │ SI  │                 │ SI  │
    └──┬──┘                 └──┬──┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
          ┌────────────────┐
          │  VALIDACIÓN OK │
          │  Continúa...   │
          └────────────────┘

       ┌──┴──┐              ┌──┴──┐
       │ NO  │              │ NO  │
       └──┬──┘              └──┬──┘
          │                    │
          ▼                    ▼
     ┌─────────────────────────────┐
     │  ERROR: Falta especialización│
     └─────────────────────────────┘
```

---

## Próximos Pasos de Arquitectura

1. **Normalización de Timestamps:**
   - Migrar de `creado_en`/`actualizado_en` → `created_at`/`updated_at`
   - Consistencia con estándares internacionales

2. **Auditoría Avanzada:**
   - Tabla `audit_log` para tracking de cambios
   - Trigger `log_changes()` en tablas críticas

3. **Roles y Permisos:**
   - Tabla `user_roles` (admin, manager, viewer)
   - RLS policies basadas en roles

4. **Extensiones de Socios:**
   - Tabla `socios` (tipo_socio, participacion, etc.)
   - Tabla `proveedores` (calificacion, productos)
   - Tabla `empleados` (cargo, departamento)

5. **Optimización:**
   - Índices parciales para soft delete
   - Particionamiento por organización (si escala)
   - Materialización de vistas frecuentes

---

**Siguiente:** [TABLES.md](./TABLES.md) - Diccionario de datos completo
