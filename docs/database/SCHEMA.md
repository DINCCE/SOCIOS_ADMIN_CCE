# Database Schema - Sistema de Gestión de Socios

## Diagrama de Relaciones (ERD)

### Diagrama Completo

```mermaid
erDiagram
    organizations ||--o{ organizations : "jerarquia"
    organizations ||--o{ business_partners : "contiene"
    organizations ||--o{ bp_relaciones : "gestiona"
    business_partners ||--o| personas : "es_una"
    business_partners ||--o| empresas : "es_una"
    business_partners ||--o{ bp_relaciones : "origen"
    business_partners ||--o{ bp_relaciones : "destino"
    personas }o--o| personas : "contacto_emergencia"
    empresas }o--o| personas : "representante_legal"

    organizations {
        uuid id PK
        text nombre
        text slug UK
        text tipo
        uuid organizacion_padre_id FK
        text email
        text telefono
        text website
        jsonb direccion
        jsonb configuracion
        timestamptz creado_en
        timestamptz actualizado_en
    }

    business_partners {
        uuid id PK
        text codigo_bp UK
        text tipo_actor
        uuid organizacion_id FK
        text estado
        text email_principal
        text telefono_principal
        timestamptz creado_en
        uuid creado_por
        timestamptz actualizado_en
        uuid actualizado_por
        timestamptz eliminado_en
        uuid eliminado_por
    }

    personas {
        uuid id PK_FK
        text tipo_documento
        text numero_documento UK
        date fecha_expedicion
        text lugar_expedicion
        text primer_nombre
        text segundo_nombre
        text primer_apellido
        text segundo_apellido
        text genero
        date fecha_nacimiento
        text lugar_nacimiento
        text nacionalidad
        text estado_civil
        text ocupacion
        text profesion
        text nivel_educacion
        text tipo_sangre
        text email_secundario
        text telefono_secundario
        text whatsapp
        text linkedin_url
        text facebook_url
        text instagram_handle
        text twitter_handle
        text foto_url
        uuid contacto_emergencia_id FK
        text relacion_emergencia
        jsonb atributos
        timestamptz creado_en
        timestamptz actualizado_en
    }

    empresas {
        uuid id PK_FK
        text nit UK
        text digito_verificacion
        text razon_social
        text nombre_comercial
        text tipo_sociedad
        date fecha_constitucion
        text ciudad_constitucion
        text pais_constitucion
        text numero_registro
        text codigo_ciiu
        text sector_industria
        text actividad_economica
        text tamano_empresa
        uuid representante_legal_id FK
        text cargo_representante
        text telefono_secundario
        text whatsapp
        text email_secundario
        text website
        text linkedin_url
        text facebook_url
        text instagram_handle
        text twitter_handle
        text logo_url
        numeric ingresos_anuales
        integer numero_empleados
        jsonb atributos
        timestamptz creado_en
        timestamptz actualizado_en
    }

    bp_relaciones {
        uuid id PK
        uuid organizacion_id FK
        uuid bp_origen_id FK
        uuid bp_destino_id FK
        tipo_relacion_bp tipo_relacion
        text rol_origen
        text rol_destino
        jsonb atributos
        date fecha_inicio
        date fecha_fin
        boolean es_actual "GENERATED"
        boolean es_bidireccional
        text notas
        timestamptz creado_en
        timestamptz actualizado_en
        timestamptz eliminado_en
    }
```

### Diagrama Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│                       ORGANIZATIONS                          │
│  - Nivel de multi-tenancy                                    │
│  - Soporta jerarquía (organizacion_padre_id)               │
│  - Contiene todos los datos de la organización              │
└──────────────────────────┬──────────────────────────────────┘
                           │ 1:N
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   BUSINESS_PARTNERS                          │
│  - Tabla base (CTI Pattern)                                  │
│  - Campos comunes + auditoría (creado_por, etc.)           │
│  - codigo_bp autogenerado (BP-0000001)                      │
│  - tipo_actor: 'persona' | 'empresa'                        │
│  - Contacto centralizado: email_principal, telefono_principal│
└─────────────┬────────────────────────────────────────────────┘
              │
              │ 1:1 (STRICT - validado por trigger)
              │
      ┌───────┴────────┐
      │                │
┌─────▼──────┐  ┌──────▼────────┐
│  PERSONAS  │  │   EMPRESAS    │
│            │  │               │
│  30+ campos│  │  25+ campos   │
│  nombres   │  │  Razón social │
│  separados │  │  NIT + DV     │
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

**Propósito:** Tabla de organizaciones para implementar multi-tenancy. Soporta jerarquía de organizaciones (clubs, sedes, divisiones).

**Tipo:** Tabla independiente con auto-referencia

**Relaciones:**
- 1:N con `business_partners` (una organización tiene múltiples socios)
- 1:N con `bp_relaciones` (una organización gestiona relaciones)
- N:1 con `organizations` (jerarquía: organización padre)
- 1:N con `organizations` (sub-organizaciones)

**Campos Principales:**
- `id` (PK): Identificador único
- `nombre`: Nombre de la organización
- `slug` (UNIQUE): Identificador URL-friendly único
- `tipo`: 'club' | 'sede' | 'division'
- `organizacion_padre_id` (FK): Para jerarquía de organizaciones
- `email`, `telefono`, `website`: Contacto
- `direccion` (JSONB): Dirección estructurada
- `configuracion` (JSONB): Configuración específica

**Ver:** [TABLES.md](./TABLES.md#organizations) para diccionario completo.

---

### 2. `business_partners`

**Propósito:** Tabla base del patrón Class Table Inheritance (CTI). Contiene campos comunes a todos los tipos de socios de negocio.

**Tipo:** Tabla base (CTI)

**Relaciones:**
- N:1 con `organizations` (cada socio pertenece a una organización)
- 1:1 con `personas` (si `tipo_actor = 'persona'`)
- 1:1 con `empresas` (si `tipo_actor = 'empresa'`)
- 1:N con `bp_relaciones` (como origen)
- 1:N con `bp_relaciones` (como destino)

**Campos Principales:**
- `id` (PK): Identificador único compartido con tabla especializada
- `codigo_bp` (UNIQUE, autogenerado): Código formato BP-0000001
- `organizacion_id` (FK): Organización a la que pertenece
- `tipo_actor`: 'persona' | 'empresa'
- `estado`: 'activo' | 'inactivo' | 'suspendido'
- `email_principal`, `telefono_principal`: Contacto centralizado
- Campos de auditoría: `creado_por`, `actualizado_por`, `eliminado_por`

**Constraints Importantes:**
- FK hacia `organizations(id)` ON DELETE CASCADE
- CHECK: `tipo_actor IN ('persona', 'empresa')`
- CHECK: `estado IN ('activo', 'inactivo', 'suspendido')`
- UNIQUE: `codigo_bp`

**Triggers:**
- `actualizar_timestamp` (BEFORE UPDATE)
- `trigger_generar_codigo_bp` (BEFORE INSERT)

**Ver:** [TABLES.md](./TABLES.md#business_partners) para diccionario completo.

---

### 3. `personas`

**Propósito:** Tabla especializada para personas naturales. Hereda de `business_partners` mediante relación 1:1 con PK compartido.

**Tipo:** Tabla especializada (CTI)

**Relaciones:**
- 1:1 con `business_partners` (PK compartido)
- N:1 con `personas` (contacto de emergencia, auto-referencia opcional)
- 1:N con `personas` (es contacto de emergencia de otras)
- 1:N con `empresas` (es representante legal de empresas)

**Campos Principales:**
- `id` (PK, FK): Mismo ID que en `business_partners`
- **Nombres separados:** `primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`
- `tipo_documento`: 10 valores (CC, CE, TI, PA, RC, NIT, PEP, PPT, DNI, NUIP)
- `numero_documento` (UNIQUE): Número único de identificación
- `fecha_expedicion`, `lugar_expedicion`: Datos del documento
- `genero`: 'masculino' | 'femenino' | 'otro' | 'no_especifica'
- `fecha_nacimiento`, `lugar_nacimiento`, `nacionalidad`
- `estado_civil`: 6 valores (soltero, casado, union_libre, divorciado, viudo, separado)
- `ocupacion`, `profesion`
- `nivel_educacion`: 8 valores (primaria a doctorado)
- `tipo_sangre`: 8 valores (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Contacto secundario: `email_secundario`, `telefono_secundario`, `whatsapp`
- Redes sociales: `linkedin_url`, `facebook_url`, `instagram_handle`, `twitter_handle`
- `foto_url`
- `contacto_emergencia_id` (FK), `relacion_emergencia`
- `atributos` (JSONB): Direcciones, info médica, preferencias

**Constraints Importantes:**
- PK/FK hacia `business_partners(id)` ON DELETE CASCADE
- UNIQUE: `numero_documento`
- FK hacia `personas(id)` para contacto emergencia (permite NULL)
- Múltiples CHECK constraints para ENUMs

**Triggers:**
- `actualizar_timestamp` (BEFORE UPDATE)

**Ver:** [TABLES.md](./TABLES.md#personas) para diccionario completo.

---

### 4. `empresas`

**Propósito:** Tabla especializada para empresas/personas jurídicas. Hereda de `business_partners` mediante relación 1:1 con PK compartido.

**Tipo:** Tabla especializada (CTI)

**Relaciones:**
- 1:1 con `business_partners` (PK compartido)
- N:1 con `personas` (representante legal, opcional)

**Campos Principales:**
- `id` (PK, FK): Mismo ID que en `business_partners`
- `nit` (UNIQUE): Número de Identificación Tributaria
- `digito_verificacion`: Dígito verificador del NIT (1 carácter)
- `razon_social`: Nombre legal de la empresa
- `nombre_comercial`: Nombre comercial (opcional)
- `tipo_sociedad`: 10 valores (SA, SAS, LTDA, EU, COOP, FUNDACION, CORP, ONG, SUCURSAL, OTRO)
- `fecha_constitucion`, `ciudad_constitucion`, `pais_constitucion`
- `numero_registro`: Registro mercantil
- `codigo_ciiu`: Código CIIU (actividad económica)
- `sector_industria`, `actividad_economica`
- `tamano_empresa`: 'micro' | 'pequena' | 'mediana' | 'grande'
- `representante_legal_id` (FK hacia personas), `cargo_representante`
- Contacto: `telefono_secundario`, `whatsapp`, `website`
- Redes sociales: `linkedin_url`, `facebook_url`, `instagram_handle`, `twitter_handle`
- `logo_url`
- Métricas: `ingresos_anuales`, `numero_empleados`
- `atributos` (JSONB): Sucursales, certificaciones, contactos clave, info bancaria

**Constraints Importantes:**
- PK/FK hacia `business_partners(id)` ON DELETE CASCADE
- UNIQUE: `nit`
- FK hacia `personas(id)` para representante legal (permite NULL)
- CHECK: `length(digito_verificacion) = 1`
- CHECK constraints para `tipo_sociedad` y `tamano_empresa`

**Triggers:**
- `actualizar_timestamp` (BEFORE UPDATE)

**Ver:** [TABLES.md](./TABLES.md#empresas) para diccionario completo.

---

### 5. `bp_relaciones`

**Propósito:** Gestiona relaciones entre Business Partners (familiares, laborales, referencias, membresías, comerciales).

**Tipo:** Tabla de relaciones con soporte bidireccional

**Relaciones:**
- N:1 con `organizations` (cada relación pertenece a una organización)
- N:1 con `business_partners` como origen
- N:1 con `business_partners` como destino

**Campos Principales:**
- `id` (PK): Identificador único
- `organizacion_id` (FK): Organización propietaria
- `bp_origen_id` (FK): Business Partner origen
- `bp_destino_id` (FK): Business Partner destino
- `tipo_relacion` (ENUM): familiar, laboral, referencia, membresia, comercial, otra
- `rol_origen`, `rol_destino`: Roles específicos (ej: Padre/Hijo, Empleado/Empleador)
- `atributos` (JSONB): Metadata flexible por tipo
- `fecha_inicio`, `fecha_fin`: Temporalidad
- `es_actual` (GENERATED): TRUE si `fecha_fin IS NULL`
- `es_bidireccional`: Si TRUE, vista genera registro inverso
- `notas`: Observaciones adicionales

**Constraints Importantes:**
- FK hacia `organizations(id)` ON DELETE CASCADE
- FK hacia `business_partners(id)` ON DELETE CASCADE (origen y destino)
- CHECK: `bp_origen_id != bp_destino_id` (no auto-relaciones)
- CHECK: `fecha_fin IS NULL OR fecha_fin >= fecha_inicio`
- UNIQUE: `(bp_origen_id, bp_destino_id, tipo_relacion)` WHERE `eliminado_en IS NULL AND es_actual = true`

**Triggers:**
- `actualizar_bp_relaciones_timestamp` (BEFORE UPDATE)
- `validar_relacion_compatible` (BEFORE INSERT/UPDATE) - Valida tipos compatibles

**Ver:** [TABLES.md](./TABLES.md#bp_relaciones) para diccionario completo.

---

## Tipos Enumerados (ENUMs / CHECK Constraints)

### `tipo_documento` (personas)
```sql
CHECK (tipo_documento IN (
    'CC',   -- Cédula de Ciudadanía
    'CE',   -- Cédula de Extranjería
    'TI',   -- Tarjeta de Identidad
    'PA',   -- Pasaporte
    'RC',   -- Registro Civil
    'NIT',  -- Número de Identificación Tributaria
    'PEP',  -- Permiso Especial de Permanencia
    'PPT',  -- Permiso por Protección Temporal
    'DNI',  -- Documento Nacional de Identidad
    'NUIP'  -- Número Único de Identificación Personal
))
```

### `genero` (personas)
```sql
CHECK (genero IN (
    'masculino',
    'femenino',
    'otro',
    'no_especifica'
))
```

### `estado_civil` (personas)
```sql
CHECK (estado_civil IN (
    'soltero',
    'casado',
    'union_libre',
    'divorciado',
    'viudo',
    'separado'
))
```

### `nivel_educacion` (personas)
```sql
CHECK (nivel_educacion IN (
    'primaria',
    'bachillerato',
    'tecnico',
    'tecnologo',
    'pregrado',
    'posgrado',
    'maestria',
    'doctorado'
))
```

### `tipo_sangre` (personas)
```sql
CHECK (tipo_sangre IN (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
))
```

### `tipo_sociedad` (empresas)
```sql
CHECK (tipo_sociedad IN (
    'SA',         -- Sociedad Anónima
    'SAS',        -- Sociedad por Acciones Simplificada
    'LTDA',       -- Limitada
    'EU',         -- Empresa Unipersonal
    'COOP',       -- Cooperativa
    'FUNDACION',  -- Fundación
    'CORP',       -- Corporación
    'ONG',        -- Organización No Gubernamental
    'SUCURSAL',   -- Sucursal
    'OTRO'        -- Otro tipo
))
```

### `tamano_empresa` (empresas)
```sql
CHECK (tamano_empresa IN (
    'micro',
    'pequena',
    'mediana',
    'grande'
))
```

### `estado_actor` (business_partners)
```sql
CHECK (estado IN (
    'activo',
    'inactivo',
    'suspendido'
))
```

### `tipo_actor` (business_partners)
```sql
CHECK (tipo_actor IN (
    'persona',
    'empresa'
))
```

### `tipo` (organizations)
```sql
CHECK (tipo IN (
    'club',
    'sede',
    'division'
))
```

### `tipo_relacion_bp` (bp_relaciones - Native ENUM)
```sql
CREATE TYPE tipo_relacion_bp AS ENUM (
    'familiar',      -- Relaciones familiares (padre-hijo, hermanos, cónyuge)
    'laboral',       -- Relaciones laborales (empleado-empresa)
    'referencia',    -- Referencias personales
    'membresia',     -- Membresías en clubes, juntas, asociaciones
    'comercial',     -- Relaciones comerciales/proveedores
    'otra'           -- Tipo customizable
);
```

---

## Funciones de Base de Datos

### `calcular_digito_verificacion_nit(nit_numero TEXT)`

**Propósito:** Calcula el dígito de verificación para NITs colombianos según el algoritmo estándar de la DIAN.

**Parámetros:**
- `nit_numero` (TEXT): Número de Identificación Tributaria sin dígito verificador

**Retorna:** TEXT (un solo dígito '0'-'9')

**Algoritmo:**
1. Limpiar el NIT (solo números)
2. Multiplicar cada dígito por la secuencia [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]
3. Sumar todos los productos
4. Calcular el residuo de la división por 11
5. Si residuo >= 2, DV = 11 - residuo, sino DV = residuo

**Ejemplo:**
```sql
SELECT calcular_digito_verificacion_nit('900123456');
-- Resultado: '8'
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
- `bp_relaciones`

**Implementación:**
```sql
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### `trigger_generar_codigo_bp()`

**Propósito:** Asigna automáticamente el código secuencial BP-000000X a los nuevos registros de business_partners antes de su inserción.

**Tipo:** Trigger Function (BEFORE INSERT)

**Aplicado a:** `business_partners`

---

### `invertir_rol(rol TEXT)`

**Propósito:** Función auxiliar que mapea roles a sus inversos para generación automática de relaciones bidireccionales en la vista `v_relaciones_bidireccionales`.

**Parámetros:**
- `rol` (TEXT): Rol a invertir

**Retorna:** TEXT (rol inverso)

**Ejemplos:**
```sql
SELECT invertir_rol('Padre');    -- 'Hijo'
SELECT invertir_rol('Madre');    -- 'Hija'
SELECT invertir_rol('Empleado'); -- 'Empleador'
SELECT invertir_rol('Hermano');  -- 'Hermano' (simétrico)
SELECT invertir_rol('Cónyuge');  -- 'Cónyuge' (simétrico)
```

**Mapeos implementados:**
- Relaciones familiares: Padre/Hijo, Madre/Hija, Hermano/Hermano, Abuelo/Nieto, Tío/Sobrino, etc.
- Relaciones laborales: Empleado/Empleador, Jefe/Subordinado, Supervisor/Supervisado
- Si no hay mapeo, devuelve el mismo rol

---

### `validar_tipo_relacion_compatible()`

**Propósito:** Trigger function que valida que los tipos de Business Partners sean compatibles con el tipo de relación.

**Tipo:** Trigger Function (BEFORE INSERT/UPDATE)

**Retorna:** TRIGGER (NEW row si validación pasa, ERROR si falla)

**Validaciones:**
1. **Relación familiar:** Ambos BP (origen y destino) deben ser `tipo_actor = 'persona'`
2. **Relación laboral:** BP origen debe ser `tipo_actor = 'persona'`, BP destino debe ser `tipo_actor = 'empresa'`
3. **Otras relaciones:** Sin restricciones de tipo

**Aplicado a:** `bp_relaciones`

**Errores que previene:**
- Relaciones familiares entre empresas
- Relaciones laborales donde el empleado no es persona
- Relaciones laborales donde el empleador no es empresa

---

## Vistas

### `v_personas_completa`

**Propósito:** Vista desnormalizada que combina datos de `personas`, `business_partners` y `organizations` para facilitar queries.

**Campos Destacados:**
- Todos los campos de `personas`
- Campos relevantes de `business_partners` (estado, codigo_bp, email_principal, telefono_principal)
- Nombre de la organización, slug, tipo
- **`nombre_completo` (computed):** Concatenación de nombres y apellidos
- **`contacto_emergencia_nombre` (computed):** Nombre completo del contacto

**Nota sobre nombres:** La vista concatena correctamente:
```sql
primer_nombre || COALESCE(' ' || segundo_nombre, '') || ' ' ||
primer_apellido || COALESCE(' ' || segundo_apellido, '')
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

**Campos Destacados:**
- Todos los campos de `empresas`
- Campos relevantes de `business_partners`
- Nombre de la organización, slug, tipo
- **`nit_completo` (computed):** `nit || '-' || digito_verificacion`
- **`representante_legal_nombre` (computed):** Nombre completo del representante

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
- `codigo_bp`: Código autogenerado
- `organizacion_id`: ID de la organización
- `tipo_actor`: 'persona' | 'empresa'
- `nombre`: Nombre completo (persona) o razón social (empresa)
- `identificacion`: Número documento (persona) o NIT completo (empresa)
- `tipo_identificacion`: Tipo de documento o 'NIT'
- `email_principal`, `telefono_principal`: Contacto principal
- `email_secundario`, `telefono_secundario`: Contacto secundario
- `estado`: Estado del actor
- Campos de timestamp

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

### `v_relaciones_bidireccionales`

**Propósito:** Vista que genera automáticamente registros inversos para relaciones bidireccionales, facilitando consultas desde ambas direcciones.

**Funcionamiento:**
- Registros con `es_bidireccional = false` → Solo registro directo
- Registros con `es_bidireccional = true` → Registro directo + registro inverso generado

**Columna adicional:** `direccion` ('directo' | 'inverso')

**Query Base:**
```sql
-- Registros directos
SELECT *, 'directo' AS direccion
FROM bp_relaciones
WHERE eliminado_en IS NULL

UNION ALL

-- Registros inversos (solo si es_bidireccional = true)
SELECT
    id,
    organizacion_id,
    bp_destino_id AS bp_origen_id,  -- Invertido
    bp_origen_id AS bp_destino_id,  -- Invertido
    tipo_relacion,
    invertir_rol(rol_destino) AS rol_origen,  -- Convertido
    invertir_rol(rol_origen) AS rol_destino,  -- Convertido
    atributos,
    fecha_inicio,
    fecha_fin,
    es_actual,
    es_bidireccional,
    notas,
    creado_en,
    actualizado_en,
    'inverso' AS direccion
FROM bp_relaciones
WHERE es_bidireccional = true
  AND eliminado_en IS NULL;
```

**Ejemplo de uso:**
```sql
-- Consultar todas las relaciones de un BP (desde cualquier dirección)
SELECT * FROM v_relaciones_bidireccionales
WHERE bp_origen_id = 'bp-uuid'
ORDER BY es_actual DESC, fecha_inicio DESC;
```

---

## Índices

### Índices de Primary Key (automáticos)
- `organizations(id)`
- `business_partners(id)`
- `personas(id)`
- `empresas(id)`
- `bp_relaciones(id)`

### Índices Únicos
- `organizations(slug)`
- `business_partners(codigo_bp)`
- `personas(numero_documento)`
- `empresas(nit)`

### Índices de Foreign Key (automáticos)
- `organizations(organizacion_padre_id)`
- `business_partners(organizacion_id)`
- `personas(contacto_emergencia_id)`
- `empresas(representante_legal_id)`
- `bp_relaciones(organizacion_id)`
- `bp_relaciones(bp_origen_id)`
- `bp_relaciones(bp_destino_id)`

### Índices Parciales (bp_relaciones)
Todos los índices en `bp_relaciones` tienen condición `WHERE eliminado_en IS NULL` para indexar solo registros activos:
- `idx_bp_relaciones_origen` en `bp_origen_id`
- `idx_bp_relaciones_destino` en `bp_destino_id`
- `idx_bp_relaciones_tipo` en `tipo_relacion`
- `idx_bp_relaciones_org` en `organizacion_id`
- `idx_bp_relaciones_actual` en `es_actual` WHERE `es_actual = true`
- `idx_bp_relaciones_bidireccional` en `(bp_origen_id, bp_destino_id, tipo_relacion)`

---

## Convenciones de Naming

### Tablas
- snake_case, plural para tablas independientes: `organizations`, `business_partners`
- snake_case, plural para especializaciones: `personas`, `empresas`

### Columnas
- snake_case: `numero_documento`, `fecha_nacimiento`
- Nombres separados: `primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido`
- Sufijos estándar:
  - `_id` para foreign keys: `organizacion_id`, `contacto_emergencia_id`
  - `_en` para timestamps: `creado_en`, `actualizado_en`, `eliminado_en`
  - `_por` para auditoría: `creado_por`, `actualizado_por`, `eliminado_por`

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
- Verbos descriptivos: `calcular_`, `validar_`, `actualizar_`, `invertir_`

### Triggers
- `{accion}_{tabla}_{descripcion}`
- Ejemplo: `actualizar_business_partners_timestamp`

---

## Política de Soft Delete

**Implementación uniforme en todas las tablas:**

```sql
-- Campos en todas las tablas principales
eliminado_en TIMESTAMPTZ DEFAULT NULL
eliminado_por UUID  -- En business_partners

-- Para "eliminar" un registro
UPDATE tabla SET
  eliminado_en = NOW(),
  eliminado_por = auth.uid()  -- Si aplica
WHERE id = 'uuid';

-- Queries siempre filtran registros activos
SELECT * FROM tabla WHERE eliminado_en IS NULL;

-- Recuperar registro eliminado
UPDATE tabla SET
  eliminado_en = NULL,
  eliminado_por = NULL
WHERE id = 'uuid';
```

**Ventajas:**
- Auditoría completa
- Recuperación de datos
- Integridad referencial preservada
- Cumplimiento normativo

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

**Implementado ✅**
- Multi-tenancy con jerarquía de organizaciones
- CTI pattern con personas y empresas (30+ y 25+ campos respectivamente)
- Sistema completo de relaciones bidireccionales
- Auditoría con campos `*_por`
- Soft delete en todas las tablas
- Vistas unificadas y polimórficas
- RLS habilitado en todas las tablas

**Planificado 🔄**
1. **RLS Policies basadas en Organización:**
   - Actualmente: Políticas básicas con `auth.role() = 'authenticated'`
   - Objetivo: Filtrado automático por `organizacion_id` usando tabla `user_organizations`

2. **Roles y Permisos:**
   - Tabla `user_roles` (admin, manager, viewer)
   - RLS policies diferenciadas por rol
   - Restricciones de operaciones según rol

3. **Extensiones de Socios:**
   - Tabla `socios` (especialización de business_partners)
   - Tabla `proveedores` (especialización de business_partners)
   - Tabla `empleados` (especialización de business_partners)

4. **Auditoría Avanzada:**
   - Tabla `audit_log` para tracking completo de cambios
   - Trigger `log_changes()` en tablas críticas

5. **Optimización:**
   - Índices adicionales según patrones de uso
   - Particionamiento por organización (si escala)
   - Materialización de vistas frecuentes

---

**Siguiente:** [TABLES.md](./TABLES.md) - Diccionario de datos completo
