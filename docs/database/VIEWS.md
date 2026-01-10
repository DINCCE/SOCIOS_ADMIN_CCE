# Vistas de la Base de Datos - SOCIOS_ADMIN

## Documentación Completa de Vistas

Este documento proporciona información detallada de todas las vistas en la base de datos, incluyendo su propósito, columnas, tablas base y casos de uso.

---

## Índice de Vistas

### Vistas de Negocio
- [v_actores_org](#v_actores_org) - Vista unificada de actores con información consolidada
- [v_doc_comercial_org](#v_doc_comercial_org) - Vista de documentos comerciales con datos de actores
- [v_tareas_org](#v_tareas_org) - Vista de tareas con información relacionada

---

## Vistas de Negocio

### v_actores_org

**Propósito**: Vista unificada de actores (personas y empresas) con toda la información consolidada de `dm_actores`

**Tablas Base**: dm_actores

**Características**:
- Consolidación de información de personas y empresas en una sola vista
- No requiere JOINs adicionales (refactorización CTI)
- Optimizada para búsquedas y listados

**Columnas Principales**:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Identificador único del actor |
| codigo | text | Código BP autogenerado (ACT-00000001) |
| nombre | text | Nombre completo del actor (calculado) |
| identificacion | text | Número de documento de identificación |
| tipo_actor | enum | Tipo: persona o empresa |
| email | text | Email principal de contacto |
| telefono | text | Teléfono principal |
| estado | enum | Estado del actor (activo, inactivo, bloqueado) |
| organizacion_id | uuid | ID de la organización |
| es_socio | boolean | Indica si es socio de la organización |
| es_cliente | boolean | Indica si es cliente |
| es_proveedor | boolean | Indica si es proveedor |
| eliminado_en | timestamptz | Timestamp de soft delete (NULL = activo) |

**Columnas Calculadas**:
- `codigo`: Concatenación de `codigo_bp` de la tabla base
- `nombre`: Para personas: `primer_nombre || ' ' || primer_apellido`<br>Para empresas: `razon_social` o `nombre_comercial`
- `identificacion`: `num_documento`
- `email`: `email_principal`
- `telefono`: `telefono_principal`
- `estado`: `estado_actor`

**Casos de Uso**:
1. **Búsqueda rápida de actores**: Búsqueda por código, nombre o documento
2. **Listados de socios**: Filtrado por tipo de actor y flags (es_socio, es_cliente, es_proveedor)
3. **Selectores de actores**: Componentes dropdown para seleccionar actores
4. **Reportes consolidados**: Informes que requieren datos de personas y empresas

**Ejemplo de Uso**:

```typescript
// Buscar actores por código, nombre o documento
const { data } = await supabase
  .from('v_actores_org')
  .select('*')
  .eq('organizacion_id', organizacion_id)
  .is('eliminado_en', null)
  .or(`codigo.ilike.%${query}%, nombre.ilike.%${query}%, identificacion.ilike.%${query}%`)
  .order('codigo')
  .limit(20)
```

**Referencias**:
- Utilizado en: [app/actions/personas.ts:507](app/actions/personas.ts#L507)
- Utilizado en: [app/actions/oportunidades.ts:18](app/actions/oportunidades.ts#L18)

---

### v_doc_comercial_org

**Propósito**: Vista de documentos comerciales (oportunidades, ofertas, pedidos) con información de solicitantes y pagadores

**Tablas Base**:
- tr_doc_comercial (tabla principal)
- dm_actores (solicitante)
- dm_actores (pagador)

**Características**:
-JOIN con dm_actores para obtener nombres de solicitante y pagador
- Consolidación de información financiera y de estados
- Optimizada para reportes y listados

**Columnas Principales**:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Identificador único del documento |
| codigo | text | Código autogenerado (DOC-00000001) |
| tipo | enum | Tipo: oportunidad, oferta, pedido_venta, reserva |
| sub_tipo | enum | Subtipo: sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos |
| estado | enum | Estado: Nueva, En Progreso, Ganada, Pérdida, Descartada |
| fecha_doc | date | Fecha del documento |
| organizacion_id | uuid | ID de la organización |
| monto_estimado | numeric | Monto estimado inicial |
| valor_total | numeric | Valor final calculado |
| moneda_iso | enum | Moneda (COP, USD, EUR, etc.) |
| solicitante_id | uuid | ID del actor solicitante |
| solicitante_nombre | text | Nombre del solicitante (JOIN) |
| pagador_id | uuid | ID del actor pagador |
| pagador_nombre | text | Nombre del pagador (JOIN) |
| responsable_id | uuid | ID del usuario responsable |
| asociado_id | uuid | ID de la asignación de acción relacionada |
| eliminado_en | timestamptz | Timestamp de soft delete |

**Columnas Calculadas (JOIN)**:
- `solicitante_nombre`: Nombre completo del solicitante desde dm_actores
- `pagador_nombre`: Nombre completo del pagador desde dm_actores

**Casos de Uso**:
1. **Listados de oportunidades**: Ver todas las oportunidades con nombres de clientes
2. **Reportes de ventas**: Análisis de documentos ganados por cliente
3. **Dashboard comercial**: Resumen de oportunidades por estado y cliente
4. **Seguimiento de documentos**: Tracking de documentos con información de contacto

**Ejemplo de Uso**:

```typescript
// Listar oportunidades con nombres de solicitantes
const { data } = await supabase
  .from('v_doc_comercial_org')
  .select(`
    id,
    codigo,
    estado,
    valor_total,
    solicitante_nombre,
    pagador_nombre
  `)
  .eq('organizacion_id', organizacion_id)
  .eq('tipo', 'oportunidad')
  .is('eliminado_en', null)
  .order('fecha_doc', { ascending: false })
```

---

### v_tareas_org

**Propósito**: Vista de tareas del sistema con información de oportunidad relacionada y actor asociado

**Tablas Base**:
- tr_tareas (tabla principal)
- dm_actores (actor relacionado)
- tr_doc_comercial (oportunidad relacionada)

**Características**:
- JOIN con dm_actores para obtener nombre del actor relacionado
- JOIN con tr_doc_comercial para obtener datos de la oportunidad
- Consolidación de información de asignación y vencimiento

**Columnas Principales**:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | Identificador único de la tarea |
| codigo_tarea | text | Código autogenerado (TSK-00000001) |
| titulo | text | Título de la tarea |
| descripcion | text | Descripción detallada |
| prioridad | enum | Prioridad: Baja, Media, Alta, Urgente |
| estado | enum | Estado: Pendiente, En Progreso, Terminada, Pausada, Cancelada |
| fecha_vencimiento | date | Fecha de vencimiento |
| organizacion_id | uuid | ID de la organización |
| oportunidad_id | uuid | ID de la oportunidad relacionada |
| oportunidad_codigo | text | Código de la oportunidad (JOIN) |
| oportunidad_estado | text | Estado de la oportunidad (JOIN) |
| relacionado_con_bp | uuid | ID del actor relacionado |
| actor_nombre | text | Nombre del actor relacionado (JOIN) |
| asignado_a | uuid | ID del usuario asignado |
| tags | text[] | Etiquetas |
| eliminado_en | timestamptz | Timestamp de soft delete |

**Columnas Calculadas (JOIN)**:
- `oportunidad_codigo`: Código de la oportunidad desde tr_doc_comercial
- `oportunidad_estado`: Estado de la oportunidad desde tr_doc_comercial
- `actor_nombre`: Nombre completo del actor desde dm_actores

**Casos de Uso**:
1. **Listado de tareas por usuario**: Ver tareas asignadas con contexto de oportunidad
2. **Dashboard de tareas**: Resumen de tareas por estado, prioridad y vencimiento
3. **Seguimiento de oportunidades**: Tareas asociadas a una oportunidad específica
4. **Reportes de productividad**: Análisis de tareas completadas por usuario

**Ejemplo de Uso**:

```typescript
// Listar tareas pendientes con información de oportunidad
const { data } = await supabase
  .from('v_tareas_org')
  .select(`
    id,
    codigo_tarea,
    titulo,
    prioridad,
    estado,
    fecha_vencimiento,
    oportunidad_codigo,
    actor_nombre
  `)
  .eq('organizacion_id', organizacion_id)
  .eq('estado', 'Pendiente')
  .is('eliminado_en', null)
  .order('fecha_vencimiento', { ascending: true })
```

---

## Patrones de Diseño de Vistas

### Optimización para Lectura

Las vistas están diseñadas para:
- **Reducir JOINs**: Pre-join datos comúnmente requeridos
- **Simplificar consultas**: Abstraer complejidad de negocio
- **Mejorar performance**: Optimizadas para listados y búsquedas

### Columnas Calculadas

Patrón de nomenclatura para columnas calculadas:
- `nombre`: Nombre completo o descriptivo
- `email`: Email principal
- `telefono`: Teléfono principal
- `estado`: Campo de estado principal
- `_*_nombre`: Campos de nombre desde tablas relacionadas

### Filtrado por Organización

Todas las vistas incluyen:
- `organizacion_id`: Para multi-tenancy
- `eliminado_en IS NULL`: Para respetar soft delete

### Naming Convention

Prefijos de vistas:
- `v_*`: Vista simple (una tabla base)
- `v_*_org`: Vista con JOINs y datos organizacionales

---

## Comparación: Tablas vs Vistas

### Cuándo Usar Tablas

Usar tablas base cuando necesitas:
- INSERT/UPDATE/DELETE (las vistas son de solo lectura)
- Todas las columnas disponibles
- Join controlado y explícito
- Transacciones complejas

### Cuándo Usar Vistas

Usar vistas cuando necesitas:
- Lectura optimizada de datos consolidados
- Listados con información de múltiples tablas
- Búsquedas con columnas calculadas
- Simplificar consultas frecuentes

---

## Ejemplos Avanzados

### JOIN Complejo con Vistas

```typescript
// Obtener tareas con toda la información relacionada
const { data } = await supabase
  .from('v_tareas_org')
  .select(`
    id,
    titulo,
    estado,
    fecha_vencimiento,
    oportunidad (
      id,
      codigo,
      estado,
      valor_total
    ),
    asignado_a (
      email
    )
  `)
  .eq('organizacion_id', organizacion_id)
  .gte('fecha_vencimiento', hoy)
  .is('eliminado_en', null)
```

### Filtrado Múltiple

```typescript
// Buscar documentos con filtros complejos
const { data } = await supabase
  .from('v_doc_comercial_org')
  .select('*')
  .eq('organizacion_id', organizacion_id)
  .eq('tipo', 'oportunidad')
  .in('estado', ['Nueva', 'En Progreso'])
  .gte('valor_total', 1000000)
  .is('eliminado_en', null)
  .order('fecha_doc', { ascending: false })
  .limit(50)
```

### Búsqueda Full-Text

```typescript
// Buscar actores por múltiples criterios
const { data } = await supabase
  .from('v_actores_org')
  .select('*')
  .eq('organizacion_id', organizacion_id)
  .eq('tipo_actor', 'persona')
  .or(`nombre.ilike.%${query}%, codigo.ilike.%${query}%, identificacion.ilike.%${query}%`)
  .is('eliminado_en', null)
  .order('nombre')
  .limit(20)
```

---

## Mantenimiento de Vistas

### Actualización de Vistas

Las vistas deben actualizarse cuando:
- Se añaden o modifican columnas en tablas base
- Cambian los requisitos de negocio
- Se requiere optimización de performance

### Verificar Definición de Vista

```sql
-- Ver la definición actual de una vista
SELECT
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'v_actores_org';
```

### Recrear Vista

```sql
-- Recrear vista (ejemplo)
CREATE OR REPLACE VIEW v_actores_org AS
SELECT
  id,
  codigo_bp as codigo,
  CASE
    WHEN tipo_actor = 'persona' THEN
      COALESCE(primer_nombre, '') || ' ' ||
      COALESCE(primer_apellido, '')
    ELSE
      COALESCE(razon_social, nombre_comercial, 'Sin nombre')
  END as nombre,
  num_documento as identificacion,
  tipo_actor,
  email_principal as email,
  telefono_principal as telefono,
  estado_actor as estado,
  organizacion_id,
  es_socio,
  es_cliente,
  es_proveedor,
  eliminado_en
FROM dm_actores;
```

---

## Performance y Optimización

### Índices Recomendados

Las vistas se benefician de índices en:
- `organizacion_id` en todas las tablas base
- `eliminado_en` para soft delete
- `tipo_actor` para filtrado por tipo
- Campos frecuentemente ordenados (fecha_doc, codigo_bp, etc.)

### Monitoreo de Performance

```sql
-- Consultas lentas que usan vistas
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE query LIKE '%v_actores_org%'
   OR query LIKE '%v_doc_comercial_org%'
   OR query LIKE '%v_tareas_org%'
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Documentos Relacionados

- [OVERVIEW.md](OVERVIEW.md) - Visión general de la base de datos
- [TABLES.md](TABLES.md) - Documentación detallada de tablas
- [FUNCTIONS.md](FUNCTIONS.md) - Documentación de funciones y procedimientos
- [API.md](API.md) - Ejemplos de consultas y uso de vistas
- [RLS.md](RLS.md) - Políticas de seguridad y RLS

---

## Notas Importantes

1. **Las vistas son de solo lectura**: No se pueden hacer INSERT/UPDATE/DELETE directamente sobre las vistas
2. **Herentan RLS**: Las vistas respetan las políticas de seguridad de las tablas base
3. **No se actualizan automáticamente**: Si cambia la estructura de tablas base, las vistas deben recrearse
4. **Performance**: Para operaciones críticas, considerar usar las tablas base directamente
