# Database Overview - Sistema de Gestión de Socios

## Introducción

Este documento describe la arquitectura de la base de datos del Sistema de Gestión de Socios (SOCIOS_ADMIN). El sistema está diseñado para gestionar diferentes tipos de socios de negocio (Business Partners) incluyendo personas naturales y empresas, implementando un patrón de herencia de tabla de clase (Class Table Inheritance - CTI) con PostgreSQL y Supabase.

**Estado Actual:** Sistema base completamente implementado con 5 tablas principales, 5 funciones de base de datos, 4 vistas, y políticas RLS básicas. El sistema está diseñado para ser extensible y permitir agregar más tipos de socios en el futuro.

## Tablas Implementadas

El sistema actualmente incluye las siguientes tablas:

1. **`organizations`** - Organizaciones del sistema (multi-tenancy) con soporte de jerarquías
2. **`business_partners`** - Tabla base para todos los socios de negocio (patrón CTI)
3. **`personas`** - Personas naturales (hereda de business_partners)
4. **`empresas`** - Empresas/personas jurídicas (hereda de business_partners)
5. **`bp_relaciones`** - Relaciones entre Business Partners con historial y bidireccionalidad

**Tablas Futuras:** El diseño contempla agregar tipos adicionales de actores como socios, proveedores, empleados, etc.

## Conceptos Fundamentales

### 1. Class Table Inheritance (CTI)

El sistema utiliza el patrón CTI donde:

- **Tabla Base (`business_partners`):** Contiene campos comunes a todos los tipos de socios
  - `id`, `organizacion_id`, `tipo_actor`, `codigo_bp`, `estado`, `atributos`
  - Auditoría: `creado_en`, `actualizado_en`, `eliminado_en`, `creado_por`, `actualizado_por`, `eliminado_por`
- **Tablas Especializadas (`personas`, `empresas`):** Contienen campos específicos de cada tipo
- **Relación 1:1:** Cada registro en una tabla especializada tiene exactamente un registro correspondiente en `business_partners`
- **Primary Key compartida:** `id` se comparte entre business_partners y sus especializaciones
- **Validación de Integridad:** Se garantiza el registro secuencial mediante `trigger_generar_codigo_bp()`.

**Ventajas:**
- Evita duplicación de datos comunes
- Queries polimórficos eficientes (vistas unificadas)
- Extensibilidad para nuevos tipos de socios
- Normalización óptima

### 2. Row Level Security (RLS)

**Todas las tablas tienen RLS habilitado.** La seguridad se implementa a nivel de base de datos, no en código de aplicación.

**Estado Actual:**
- ✅ RLS habilitado en todas las tablas
- ✅ Políticas básicas implementadas (requieren autenticación)
- ✅ Soft delete respetado en políticas SELECT
- ⚠️ Multi-tenancy NO implementado aún (todos los usuarios autenticados ven todas las organizaciones)

**Principios:**
- Las políticas RLS controlan qué filas puede ver/modificar cada usuario
- `auth.role()` identifica si el usuario está autenticado
- Hard DELETE bloqueado (sin políticas DELETE)
- Sin necesidad de validaciones en el código de aplicación

**Ver:** [RLS.md](./RLS.md) para detalles de políticas por tabla y roadmap de multi-tenancy.

### 3. Soft Delete (Eliminación Suave)

**El sistema NO utiliza `DELETE` físico.** Todos los registros marcados como eliminados permanecen en la base de datos con un timestamp.

**Implementación:**
- Campo `eliminado_en TIMESTAMPTZ` en todas las tablas
- `NULL` = registro activo
- `NOT NULL` = registro eliminado (timestamp de eliminación)
- Queries filtran por `WHERE eliminado_en IS NULL`
- RLS políticas automáticamente excluyen registros eliminados en SELECT
- Permite auditoría y recuperación de datos

**Ventajas:**
- Historial completo de datos
- Cumplimiento normativo (auditoría)
- Recuperación de eliminaciones accidentales
- Integridad referencial preservada

### 4. Multi-Tenancy

El sistema tiene la ESTRUCTURA para multi-tenancy pero NO está totalmente implementado:

**Implementado:**
- Campo `organizacion_id UUID` en todas las tablas principales
- Foreign key hacia `organizations(id)`
- Soporte de jerarquías de organizaciones (`organizacion_padre_id` en organizations)
- Políticas RLS habilitadas

**NO Implementado:**
- Tabla `profiles` para asociar usuarios con organizaciones
- Filtrado de RLS por `organizacion_id` del usuario
- Aislamiento completo de datos entre organizaciones

**Estado Actual:** Todos los usuarios autenticados pueden ver todas las organizaciones.

**Ver:** [RLS.md](./RLS.md) sección "Roadmap Futuro" para plan de implementación de multi-tenancy.

### 5. Triggers y Funciones

El sistema incluye 6 funciones de base de datos principales:

**1. `actualizar_timestamp()`**
- Actualiza `actualizado_en` automáticamente en UPDATE
- Aplicado a todas las tablas con timestamp tracking
- Trigger: `BEFORE UPDATE ON {table}`

**2. `generar_codigo_bp()`**
- Asigna el código secuencial BP-000000X automáticamente.
- Trigger: `BEFORE INSERT ON business_partners`.

**3. `calcular_digito_verificacion_nit(nit TEXT)`**
- Calcula el dígito de verificación para NITs colombianos
- Usado en validación de empresas
- Implementa algoritmo estándar DIAN
- Parámetro: NIT sin dígito verificador
- Retorna: Dígito verificador como TEXT

**4. `invertir_rol(rol TEXT, tipo_relacion tipo_relacion_bp)`**
- Genera el rol inverso para relaciones bidireccionales
- Ejemplos: "Padre" → "Hijo", "Hermano" → "Hermano", "Empleado" → "Empleador"
- Retorna TEXT con el rol inverso apropiado
- Usado por la vista `v_relaciones_bidireccionales`

**5. `validar_tipo_relacion_compatible(tipo_relacion tipo_relacion_bp, tipo_origen TEXT, tipo_destino TEXT)`**
- Valida que los tipos de actores sean compatibles con el tipo de relación
- Reglas:
  - `familiar`: ambos deben ser 'persona'
  - `laboral`: origen 'persona', destino 'empresa'
  - Otros tipos: sin restricciones
- Retorna BOOLEAN

### 6. Vistas de Base de Datos

El sistema provee 4 vistas para simplificar queries:

**1. `v_personas_completa`**
- Persona + Business Partner + Organización en una sola vista
- Concatena `primer_nombre || segundo_nombre || primer_apellido || segundo_apellido` como `nombre_completo`
- Incluye prefijos `bp_` para campos de business_partners
- Filtra registros eliminados automáticamente

**2. `v_empresas_completa`**
- Empresa + Business Partner + Organización en una sola vista
- Incluye `nit_completo` (NIT + DV concatenado)
- Incluye prefijos `bp_` para campos de business_partners
- Filtra registros eliminados automáticamente

**3. `v_actores_unificados`**
- Vista polimórfica de TODOS los actores (personas + empresas)
- Campos unificados: `tipo_actor`, `nombre`, `identificacion`, `email`, `telefono`, `estado`
- Útil para búsquedas que no distinguen tipo de actor

**4. `v_relaciones_bidireccionales`**
- Genera registros inversos automáticos para relaciones bidireccionales
- Añade campo `direccion` ('directo' o 'inverso')
- Usa función `invertir_rol()` para generar roles inversos
- Permite consultar relaciones desde ambas direcciones

**Ver:** [SCHEMA.md](./SCHEMA.md) para definiciones completas de vistas y funciones.

## Arquitectura de Datos

```
┌──────────────────────┐
│   organizations      │
│  - id (PK)           │
│  - slug (UNIQUE)     │
│  - tipo              │◄─┐
│  - organizacion_     │  │ auto-referencia
│    padre_id          │──┘ (jerarquía)
└──────────┬───────────┘
           │ 1:N
           │
┌──────────▼──────────────────────┐
│    business_partners             │ ◄─── Tabla Base (CTI)
│  - id (PK)                       │
│  - organizacion_id (FK)          │
│  - tipo_actor (persona/empresa)  │
│  - codigo_bp                     │
│  - estado (activo/inactivo/...)  │
│  - atributos JSONB               │
│  - creado_por, actualizado_por   │
│  - eliminado_por                 │
└──────────┬──────────────────────┘
           │
           │ 1:1 (validado por trigger)
           │
       ┌───┴─────┐
       │         │
┌──────▼──────┐ ┌▼──────────────┐
│  personas   │ │   empresas    │  ◄─── Tablas Especializadas
│  - id (PK=  │ │  - id (PK=FK) │
│    FK a BP) │ │  - razon_     │
│  - primer_  │ │    social     │
│    nombre   │ │  - nit        │
│  - segundo_ │ │  - digito_    │
│    nombre   │ │    verifica-  │
│  - primer_  │ │    cion       │
│    apellido │ │  - tipo_      │
│  - segundo_ │ │    sociedad   │
│    apellido │ │  - represen-  │
│  - tipo_    │ │    tante_     │
│    documento│ │    legal_id   │───┐
│  - numero_  │ │               │   │
│    documento│ │               │   │
│  - contacto_│ │               │   │
│    emergen- │ │               │   │
│    cia_id   │───┐             │   │
│  - direccion│   │             │   │
│    (JSONB)  │   │             │   │
└─────────────┘   │             └───┼───┘
                  │                 │
                  └─────────────────┘
                    referencias a personas


         ┌──────────────────┐
         │  bp_relaciones   │
         │  - id (PK)       │
         │  - organizacion_ │
         │    id (FK)       │
         │  - bp_origen_id  │──┐
         │    (FK a BP)     │  │
         │  - bp_destino_id │  │
         │    (FK a BP)     │  │
         │  - tipo_relacion │  │
         │    (ENUM)        │  │
         │  - rol_origen    │  │
         │  - rol_destino   │  │
         │  - atributos     │  │
         │    (JSONB)       │  │
         │  - fecha_inicio  │  │
         │  - fecha_fin     │  │
         │  - es_actual     │  │ GENERATED
         │    (GENERATED)   │  │
         │  - es_bidirec-   │  │
         │    cional        │  │
         └──────────────────┘  │
                │              │
                └──────────────┘
                  referencias a business_partners
```

## Tipos de Datos Estructurados

### ENUMs de PostgreSQL

**`tipo_relacion_bp`** (nativo ENUM):
- `familiar`, `laboral`, `referencia`, `membresia`, `comercial`, `otra`

### CHECK Constraints para ENUMs

**`tipo_documento`** (10 valores):
- `cedula_ciudadania`, `cedula_extranjeria`, `nit`, `pasaporte`, `permiso_especial_permanencia`
- `tarjeta_identidad`, `registro_civil`, `permiso_proteccion_temporal`, `documento_extranjero`, `sin_identificacion`

**`tipo_sociedad`** (10 valores):
- `sas`, `sa`, `ltda`, `empresa_unipersonal`, `entidad_sin_animo_lucro`
- `cooperativa`, `sucursal_extranjera`, `empresa_industrial_comercial_estado`, `sociedad_economia_mixta`, `otro`

**`genero`** (5 valores):
- `masculino`, `femenino`, `no_binario`, `prefiero_no_decir`, `otro`

**`estado_civil`** (6 valores):
- `soltero`, `casado`, `union_libre`, `divorciado`, `viudo`, `separado`

**`estado_bp`** (5 valores):
- `activo`, `inactivo`, `suspendido`, `pendiente`, `bloqueado`

**`tipo_organizacion`** (6 valores):
- `empresa`, `institucion_educativa`, `entidad_gubernamental`, `organizacion_sin_animo_lucro`, `asociacion`, `otro`

## Stack Tecnológico

- **Base de Datos:** PostgreSQL 15+ (vía Supabase)
- **Hosting:** Supabase (Database + Auth + RLS)
- **ORM/Query:** Supabase Client (JavaScript/TypeScript)
- **Migraciones:** Archivos SQL en `supabase/migrations/`
- **Tipos:** Generados automáticamente desde schema

## Navegación de Documentación

- **[SCHEMA.md](./SCHEMA.md)** - Diagrama ERD, arquitectura de tablas, funciones y triggers
- **[TABLES.md](./TABLES.md)** - Diccionario de datos completo con todos los campos
- **[QUERIES.md](./QUERIES.md)** - Ejemplos de SQL y patrones de consulta
- **[RLS.md](./RLS.md)** - Políticas de seguridad Row Level Security

## Roadmap

### Implementado ✅

**Tablas:**
- Tabla `organizations` con jerarquías (slug, tipo, organizacion_padre_id)
- Tabla base `business_partners` con patrón CTI y campos de auditoría
- Especialización `personas` con 30+ campos incluyendo:
  - Nombres separados (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
  - 10 tipos de documento
  - Información de emergencia (contacto_emergencia_id, nombre_contacto_emergencia, relacion_emergencia, telefono_emergencia)
  - Información personal extendida (fecha_expedicion, lugar_expedicion, estado_civil, ocupacion, profesion, nivel_educacion, tipo_sangre)
  - Redes sociales (facebook_url, instagram_url, linkedin_url, twitter_url)
  - Foto de perfil (foto_url)
  - Dirección como JSONB
- Especialización `empresas` con 25+ campos incluyendo:
  - 10 tipos de sociedad
  - Información de constitución (ciudad_constitucion, pais_constitucion, fecha_constitucion, numero_registro)
  - Actividad económica (codigo_ciiu, sector_industria, actividad_economica, tamano_empresa)
  - Representante legal (representante_legal_id, cargo_representante)
  - Redes sociales y branding (logo_url, facebook_url, linkedin_url, twitter_url, website)
  - Métricas empresariales (ingresos_anuales, numero_empleados)
  - Dirección como JSONB
- Tabla `bp_relaciones` con:
  - 6 tipos de relaciones (ENUM nativo: familiar, laboral, referencia, membresia, comercial, otra)
  - Soporte bidireccional con campo `es_bidireccional`
  - Historial temporal con `fecha_inicio`/`fecha_fin` y campo calculado `es_actual`
  - Validaciones de tipo (familiar: personas, laboral: persona→empresa)
  - Atributos JSONB para metadata flexible
  - UNIQUE constraint para prevenir duplicados

**Funciones y Triggers:**
- `actualizar_timestamp()` en todas las tablas
- `trigger_generar_codigo_bp()` para asignación secuencial
- `calcular_digito_verificacion_nit()` para NITs colombianos
- `invertir_rol()` para relaciones bidireccionales
- `validar_tipo_relacion_compatible()` para validar tipos de relaciones

**Vistas:**
- `v_personas_completa` con concatenación de nombres completos
- `v_empresas_completa` con NIT completo
- `v_actores_unificados` para queries polimórficos
- `v_relaciones_bidireccionales` con generación automática de inversos

**Seguridad:**
- RLS policies básicas (requieren autenticación)
- Soft delete en todas las tablas
- Hard DELETE bloqueado completamente
- Campos de auditoría (creado_por, actualizado_por, eliminado_por)

### Planificado 🔄

**Fase 1: Multi-Tenancy (Prioridad Alta)**
- Tabla `profiles` para asociar usuarios con organizaciones
- Actualizar políticas RLS para filtrar por `organizacion_id`
- Testing exhaustivo de aislamiento de datos

**Fase 2: Roles y Permisos**
- Campo `role` en tabla `profiles` (admin, manager, viewer)
- Políticas RLS diferenciadas por rol
- Control granular de permisos (solo admins crean, managers editan, viewers leen)

**Fase 3: Especializaciones Adicionales**
- Tabla `socios` (especialización de business_partners)
- Tabla `proveedores` (especialización de business_partners)
- Tabla `empleados` (especialización de business_partners)

**Fase 4: Auditoría Avanzada**
- Tabla `audit_log` para tracking completo de cambios
- Triggers de auditoría en todas las tablas
- Políticas RLS de solo lectura para auditoría

**Fase 5: Optimización**
- Indexación avanzada para búsquedas
- Análisis de performance de vistas
- Optimización de políticas RLS complejas

## Guía Rápida

### Crear una Persona

```sql
-- 1. Insertar en business_partners
INSERT INTO business_partners (organizacion_id, tipo_actor, codigo_bp, estado)
VALUES ('org-uuid', 'persona', 'BP-2024-001', 'activo')
RETURNING id;
-- Resultado: 'bp-uuid-123'

-- 2. Insertar en personas (usando el ID retornado)
INSERT INTO personas (
  id,
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  tipo_documento,
  numero_documento,
  direccion
)
VALUES (
  'bp-uuid-123',
  'Juan',
  'Carlos',
  'Pérez',
  'González',
  'cedula_ciudadania',
  '1234567890',
  '{"calle": "Calle 123 # 45-67", "ciudad": "Bogotá", "pais": "Colombia"}'::jsonb
);
```

### Crear una Empresa

```sql
-- 1. Insertar en business_partners
INSERT INTO business_partners (organizacion_id, tipo_actor, codigo_bp, estado)
VALUES ('org-uuid', 'empresa', 'EMP-2024-001', 'activo')
RETURNING id;

-- 2. Calcular DV del NIT
SELECT calcular_digito_verificacion_nit('900123456');
-- Retorna: '8'

-- 3. Insertar en empresas
INSERT INTO empresas (
  id,
  razon_social,
  nit,
  digito_verificacion,
  tipo_sociedad,
  representante_legal_id,
  direccion
)
VALUES (
  'empresa-bp-uuid',
  'Tecnología Avanzada S.A.S.',
  '900123456',
  '8',
  'sas',
  'persona-uuid-representante',
  '{"calle": "Carrera 7 # 71-21", "ciudad": "Bogotá", "pais": "Colombia"}'::jsonb
);
```

### Buscar Persona por Documento

```sql
-- Opción 1: Vista completa (recomendado)
SELECT * FROM v_personas_completa
WHERE numero_documento = '1234567890'
  AND bp_eliminado_en IS NULL;

-- Opción 2: Query manual
SELECT
  p.*,
  bp.estado,
  bp.codigo_bp,
  o.nombre AS organizacion_nombre
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
WHERE p.numero_documento = '1234567890'
  AND p.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;
```

### Crear Relación Laboral

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
  'org-uuid',
  'persona-empleado-uuid',
  'empresa-empleador-uuid',
  'laboral',
  'Empleado',
  'Empleador',
  jsonb_build_object(
    'cargo', 'Desarrollador Senior',
    'departamento', 'Ingeniería',
    'tipo_contrato', 'indefinido'
  ),
  '2020-01-15',
  false
);
```

### Soft Delete

```sql
-- Marcar business_partner como eliminado (cascada a especialización)
UPDATE business_partners
SET eliminado_en = NOW()
WHERE id = 'bp-uuid';

-- Recuperar registro eliminado
UPDATE business_partners
SET eliminado_en = NULL
WHERE id = 'bp-uuid';
```

**Ver [QUERIES.md](./QUERIES.md) para más ejemplos.**

## Convenciones y Estándares

### Nomenclatura

- **Tablas:** snake_case, plural cuando aplica (excepto `personas`, `empresas`)
- **Columnas:** snake_case
- **Primary Keys:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `{tabla}_id` (ej: `organizacion_id`, `representante_legal_id`)
- **Timestamps:** `creado_en`, `actualizado_en`, `eliminado_en`
- **Auditoría:** `creado_por`, `actualizado_por`, `eliminado_por` (UUID de usuario)
- **ENUMs:** snake_case con valores descriptivos

### Tipos de Datos

- **IDs:** `UUID` (no SERIAL/BIGINT)
- **Texto corto:** `TEXT` (no VARCHAR)
- **Timestamps:** `TIMESTAMPTZ` (con zona horaria)
- **ENUMs:** Tipo nativo PostgreSQL o CHECK constraints
- **Metadata flexible:** `JSONB` (ej: `atributos`, `direccion`, `configuracion`)
- **Booleanos:** `BOOLEAN` con DEFAULT explícito
- **Números:** `INTEGER`, `NUMERIC(precision, scale)` según necesidad

### Índices

- Primary key en `id` (automático)
- Foreign keys indexadas automáticamente
- Campos de búsqueda frecuente:
  - `personas.numero_documento` (UNIQUE)
  - `empresas.nit` (UNIQUE)
  - `organizations.slug` (UNIQUE)
- Campos de filtrado:
  - `business_partners.organizacion_id`
  - `business_partners.eliminado_en`
  - `bp_relaciones.bp_origen_id`, `bp_relaciones.bp_destino_id`

### Constraints

- **UNIQUE:** Prevenir duplicados (documentos, NITs, slugs)
- **CHECK:** Validar ENUMs y reglas de negocio
- **FOREIGN KEY:** Mantener integridad referencial
  - `ON DELETE CASCADE` cuando cascada es deseada
  - `ON DELETE RESTRICT` por defecto
- **NOT NULL:** Campos obligatorios claramente marcados

## Recursos Adicionales

- **Migraciones:** [docs/MIGRATIONS.md](../MIGRATIONS.md)
- **Schema SQL:** [supabase/schema.sql](../../supabase/schema.sql)
- **Reporte de Pruebas:** [TEMP_DOC/REPORTE-RESULTADOS-PRUEBAS.md](../../TEMP_DOC/REPORTE-RESULTADOS-PRUEBAS.md)
- **Diseño Original:** [TEMP_DOC/03-business-partner-design-v3-FINAL.md](../../TEMP_DOC/03-business-partner-design-v3-FINAL.md)
