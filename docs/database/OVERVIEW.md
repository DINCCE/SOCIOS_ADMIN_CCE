# Database Overview - Sistema de Gestión de Socios

## Introducción

Este documento describe la arquitectura de la base de datos del Sistema de Gestión de Socios (SOCIOS_ADMIN). El sistema está diseñado para gestionar diferentes tipos de socios de negocio (Business Partners) incluyendo personas naturales y empresas, implementando un patrón de herencia de tabla de clase (Class Table Inheritance - CTI) con PostgreSQL y Supabase.

**Estado Actual:** Sistema base completamente implementado con 4 tablas principales. El sistema está diseñado para ser extensible y permitir agregar más tipos de socios en el futuro.

## Tablas Implementadas

El sistema actualmente incluye las siguientes tablas:

1. **`organizations`** - Organizaciones del sistema (multi-tenancy)
2. **`business_partners`** - Tabla base para todos los socios de negocio
3. **`personas`** - Personas naturales (hereda de business_partners)
4. **`empresas`** - Empresas/personas jurídicas (hereda de business_partners)

**Tablas Futuras:** El diseño contempla agregar tipos adicionales de actores como socios, proveedores, empleados, etc.

## Conceptos Fundamentales

### 1. Class Table Inheritance (CTI)

El sistema utiliza el patrón CTI donde:

- **Tabla Base (`business_partners`):** Contiene campos comunes a todos los tipos de socios
- **Tablas Especializadas (`personas`, `empresas`):** Contienen campos específicos de cada tipo
- **Relación 1:1:** Cada registro en una tabla especializada tiene exactamente un registro correspondiente en `business_partners`
- **Validación de Integridad:** Triggers garantizan que no existan socios "huérfanos" (sin especialización)

**Ventajas:**
- Evita duplicación de datos comunes
- Queries polimórficos eficientes (vistas unificadas)
- Extensibilidad para nuevos tipos de socios
- Normalización óptima

### 2. Row Level Security (RLS)

**Todas las tablas tienen RLS habilitado.** La seguridad se implementa a nivel de base de datos, no en código de aplicación.

**Principios:**
- Las políticas RLS controlan qué filas puede ver/modificar cada usuario
- `auth.uid()` identifica al usuario autenticado
- Multi-tenancy mediante `organizacion_id`
- Sin necesidad de validaciones en el código de aplicación

**Ver:** [RLS.md](./RLS.md) para detalles de políticas por tabla.

### 3. Soft Delete (Eliminación Suave)

**El sistema NO utiliza `DELETE` físico.** Todos los registros marcados como eliminados permanecen en la base de datos con un timestamp.

**Implementación:**
- Campo `eliminado_en TIMESTAMPTZ` en todas las tablas
- `NULL` = registro activo
- `NOT NULL` = registro eliminado (timestamp de eliminación)
- Queries filtran por `WHERE eliminado_en IS NULL`
- Permite auditoría y recuperación de datos

**Ventajas:**
- Historial completo de datos
- Cumplimiento normativo (auditoría)
- Recuperación de eliminaciones accidentales
- Integridad referencial preservada

### 4. Multi-Tenancy

El sistema soporta múltiples organizaciones en la misma base de datos mediante:

- Campo `organizacion_id UUID` en todas las tablas principales
- Foreign key hacia `organizations(id)`
- Políticas RLS que filtran por organización
- Aislamiento completo de datos entre organizaciones

**Flujo:**
1. Usuario se autentica (Supabase Auth)
2. Usuario pertenece a una organización (tabla `profiles`)
3. Todas las queries filtran automáticamente por `organizacion_id` vía RLS
4. Imposible acceder a datos de otras organizaciones

### 5. Triggers y Funciones

El sistema incluye triggers automáticos para:

**`actualizar_timestamp()`**
- Actualiza `actualizado_en` automáticamente en UPDATE
- Aplicado a todas las tablas con timestamp tracking

**`validar_consistencia_tipo_actor()`**
- Valida que cada `business_partner` tenga exactamente una especialización
- Previene socios "huérfanos" sin persona o empresa asociada
- Se ejecuta ANTES de INSERT/UPDATE en `business_partners`

**`calcular_digito_verificacion_nit(nit TEXT)`**
- Calcula el dígito de verificación para NITs colombianos
- Usado en validación de empresas
- Implementa algoritmo estándar DIAN

### 6. Vistas Materializadas

El sistema provee vistas para simplificar queries:

- **`v_personas_completa`** - Persona + Business Partner + Organización en una sola vista
- **`v_empresas_completa`** - Empresa + Business Partner + Organización en una sola vista
- **`v_actores_unificados`** - Vista polimórfica de TODOS los actores (personas + empresas)

**Ver:** [SCHEMA.md](./SCHEMA.md) para detalles de cada vista.

## Arquitectura de Datos

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │ 1:N
         │
┌────────▼──────────────┐
│  business_partners    │ ◄─── Tabla Base (CTI)
│  - id (PK)            │
│  - organizacion_id    │
│  - tipo_actor         │
│  - estado             │
│  - metadata JSONB     │
└───────┬───────────────┘
        │
        │ 1:1 (validado por trigger)
        │
    ┌───┴────┐
    │        │
┌───▼────┐ ┌─▼────────┐
│personas│ │ empresas │  ◄─── Tablas Especializadas
└────┬───┘ └──────────┘
     │
     │ N:1 (contacto emergencia)
     └──────┐
            │
        ┌───▼────┐
        │personas│ (auto-referencia)
        └────────┘
```

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
- Tabla `organizations` (multi-tenancy)
- Tabla base `business_partners` con patrón CTI
- Especialización `personas` con contacto de emergencia
- Especialización `empresas` con representante legal
- Triggers de validación y timestamps
- Vistas unificadas
- RLS policies básicas
- Soft delete en todas las tablas

### Planificado 🔄
- Tabla `socios` (especialización de business_partners)
- Tabla `proveedores` (especialización de business_partners)
- Tabla `empleados` (especialización de business_partners)
- Auditoría avanzada (tabla de logs)
- Indexación optimizada para búsquedas
- Políticas RLS basadas en roles de usuario
- Migración de timestamps a `created_at`/`updated_at` estándar

## Guía Rápida

### Crear una Persona
```sql
-- 1. Insertar en business_partners
INSERT INTO business_partners (organizacion_id, tipo_actor, estado)
VALUES ('org-uuid', 'persona', 'activo')
RETURNING id;

-- 2. Insertar en personas (usando el ID retornado)
INSERT INTO personas (id, nombres, apellidos, tipo_documento, numero_documento)
VALUES ('bp-uuid', 'Juan', 'Pérez', 'CC', '123456789');
```

### Buscar Persona por Documento
```sql
SELECT * FROM v_personas_completa
WHERE numero_documento = '123456789'
  AND eliminado_en IS NULL;
```

### Soft Delete
```sql
UPDATE personas
SET eliminado_en = NOW()
WHERE id = 'persona-uuid';
```

**Ver [QUERIES.md](./QUERIES.md) para más ejemplos.**

## Convenciones y Estándares

### Nomenclatura
- **Tablas:** snake_case, plural (excepto tablas especializadas: `personas`, `empresas`)
- **Columnas:** snake_case
- **Primary Keys:** `id UUID DEFAULT gen_random_uuid()`
- **Foreign Keys:** `{tabla}_id` (ej: `organizacion_id`)
- **Timestamps:** `creado_en`, `actualizado_en`, `eliminado_en`
- **Enums:** snake_case con prefijo de contexto

### Tipos de Datos
- **IDs:** `UUID` (no SERIAL/BIGINT)
- **Texto corto:** `TEXT` (no VARCHAR)
- **Timestamps:** `TIMESTAMPTZ` (con zona horaria)
- **Enums:** Tipo nativo PostgreSQL
- **Metadata flexible:** `JSONB`

### Índices
- Primary key en `id` (automático)
- Foreign keys indexadas automáticamente
- Campos de búsqueda frecuente (ej: `numero_documento`)
- Campos de filtrado (ej: `organizacion_id`, `eliminado_en`)

## Recursos Adicionales

- **Migraciones:** [docs/MIGRATIONS.md](../MIGRATIONS.md)
- **Schema SQL:** [supabase/schema.sql](../../supabase/schema.sql)
- **Reporte de Pruebas:** [TEMP_DOC/REPORTE-RESULTADOS-PRUEBAS.md](../../TEMP_DOC/REPORTE-RESULTADOS-PRUEBAS.md)
- **Diseño Original:** [TEMP_DOC/03-business-partner-design-v3-FINAL.md](../../TEMP_DOC/03-business-partner-design-v3-FINAL.md)
