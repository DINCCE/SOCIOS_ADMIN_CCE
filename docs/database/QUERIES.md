# Database Queries - Common Patterns and Examples

> **Last Updated:** 2026-01-08
> **Purpose:** Reference guide for common SQL operations

---

## Table of Contents

1. [Basic Patterns](#basic-patterns)
2. [Business Partner Queries](#business-partner-queries)
3. [Opportunity Queries](#opportunity-queries)
4. [Task Queries](#task-queries)
5. [Share Assignment Queries](#share-assignment-queries)
6. [Relationship Queries](#relationship-queries)
7. [Analytics Queries](#analytics-queries)
8. [Maintenance Queries](#maintenance-queries)

---

## Basic Patterns

### Query with Organization Filter

**Always include organization filter and soft delete check:**

```sql
-- Basic pattern
SELECT *
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
ORDER BY creado_en DESC;
```

### Search with LIKE

```sql
-- Case-insensitive search
SELECT *
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND (
    nombre_completo ILIKE '%Juan%'
    OR razon_social ILIKE '%Juan%'
    OR email ILIKE '%juan%'
  );
```

### Pagination

```sql
-- Get first 20 records
SELECT *
FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
ORDER BY creado_en DESC
LIMIT 20 OFFSET 0;

-- Get next 20 records (page 2)
LIMIT 20 OFFSET 20;
```

### Count Records

```sql
-- Count active records
SELECT COUNT(*) as total
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL;

-- Count by type
SELECT tipo_actor, COUNT(*) as count
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
GROUP BY tipo_actor;
```

---

## Business Partner Queries

### Get All Active Actors

```sql
SELECT
  id,
  codigo_bp,
  tipo_actor,
  CASE
    WHEN tipo_actor = 'persona' THEN nombre_completo
    WHEN tipo_actor = 'empresa' THEN razon_social
  END as nombre,
  email,
  telefono,
  activo
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
ORDER BY
  tipo_actor,
  nombre;
```

### Search by Document

```sql
SELECT *
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND tipo_documento = 'CC'
  AND num_documento = '12345678';
```

### Get Persons Only

```sql
SELECT
  id,
  codigo_bp,
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  nombre_completo,
  email,
  telefono
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND tipo_actor = 'persona'
  AND eliminado_en IS NULL
ORDER BY nombre_completo;
```

### Get Companies Only

```sql
SELECT
  id,
  codigo_bp,
  razon_social,
  nit,
  email,
  telefono
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND tipo_actor = 'empresa'
  AND eliminado_en IS NULL
ORDER BY razon_social;
```

### Get Active Actors (Not Inactive)

```sql
SELECT *
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND activo = true
  AND fecha_inactivacion IS NULL;
```

### Get Recently Created Actors

```sql
SELECT *
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND creado_en >= NOW() - INTERVAL '30 days'
ORDER BY creado_en DESC;
```

### Actors with City Information

```sql
SELECT
  a.id,
  a.codigo_bp,
  CASE a.tipo_actor
    WHEN 'persona' THEN a.nombre_completo
    WHEN 'empresa' THEN a.razon_social
  END as nombre,
  c.city_name,
  c.state_name,
  c.country_name
FROM dm_actores a
LEFT JOIN config_ciudades c ON a.ciudad_id = c.id
WHERE a.organizacion_id = 'org-uuid'
  AND a.eliminado_en IS NULL
ORDER BY nombre;
```

---

## Opportunity Queries

### Get Pipeline Summary

```sql
SELECT
  estado,
  COUNT(*) as cantidad,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as valor_promedio
FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
GROUP BY estado
ORDER BY
  CASE estado
    WHEN 'lead' THEN 1
    WHEN 'calificado' THEN 2
    WHEN 'propuesta' THEN 3
    WHEN 'negociacion' THEN 4
    WHEN 'ganado' THEN 5
    WHEN 'perdido' THEN 6
  END;
```

### Get Opportunities by Stage

```sql
SELECT
  codigo,
  tipo,
  estado,
  monto_estimado,
  valor_total,
  fecha_doc,
  solicitante.nombre as solicitante,
  responsable.nombre as responsable
FROM tr_doc_comercial doc
LEFT JOIN dm_actores solicitante ON doc.solicitante_id = solicitante.id
LEFT JOIN dm_actores responsable ON doc.responsable_id = responsable.id
WHERE doc.organizacion_id = 'org-uuid'
  AND doc.eliminado_en IS NULL
  AND doc.estado = 'negociacion'
ORDER BY doc.fecha_doc DESC;
```

### Opportunities Closing Soon

```sql
SELECT
  codigo,
  estado,
  valor_total,
  fecha_venc_doc,
  DATEDIFF('day', CURRENT_DATE, fecha_venc_doc) as days_until_due
FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND estado IN ('propuesta', 'negociacion')
  AND fecha_venc_doc BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
ORDER BY fecha_venc_doc ASC;
```

### Opportunities by Actor

```sql
SELECT
  a.codigo_bp,
  CASE a.tipo_actor
    WHEN 'persona' THEN a.nombre_completo
    WHEN 'empresa' THEN a.razon_social
  END as nombre,
  COUNT(*) as total_tr_doc_comercial,
  SUM(doc.valor_total) as valor_total
FROM tr_doc_comercial doc
JOIN dm_actores a ON doc.asociado_id = a.id
WHERE doc.organizacion_id = 'org-uuid'
  AND doc.eliminado_en IS NULL
  AND doc.eliminado_en IS NULL
GROUP BY a.id, a.codigo_bp, a.tipo_actor, a.nombre_completo, a.razon_social
ORDER BY valor_total DESC;
```

### Won Opportunities This Month

```sql
SELECT
  codigo,
  valor_total,
  fecha_doc,
  solicitante.nombre as solicitante
FROM tr_doc_comercial doc
LEFT JOIN dm_actores solicitante ON doc.solicitante_id = solicitante.id
WHERE doc.organizacion_id = 'org-uuid'
  AND doc.eliminado_en IS NULL
  AND doc.estado = 'ganado'
  AND DATE_TRUNC('month', doc.creado_en) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY doc.valor_total DESC;
```

### Opportunities Without Responsible

```sql
SELECT
  codigo,
  tipo,
  estado,
  monto_estimado,
  creado_en
FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND responsable_id IS NULL
  AND estado NOT IN ('ganado', 'perdido')
ORDER BY creado_en DESC;
```

---

## Task Queries

### My Tasks

```sql
SELECT
  t.codigo_tarea,
  t.titulo,
  t.prioridad,
  t.estado,
  t.fecha_vencimiento,
  opp.codigo as oportunidad_codigo,
  opp.valor_total as oportunidad_valor,
  CASE a.tipo_actor
    WHEN 'persona' THEN a.nombre_completo
    WHEN 'empresa' THEN a.razon_social
  END as relacionado_nombre
FROM tr_tr_tareas t
LEFT JOIN tr_doc_comercial opp ON t.oportunidad_id = opp.id
LEFT JOIN dm_actores a ON t.relacionado_con_bp = a.id
WHERE t.organizacion_id = 'org-uuid'
  AND t.eliminado_en IS NULL
  AND t.asignado_a = 'user-uuid'
  AND t.estado != 'completada'
ORDER BY
  t.prioridad DESC,
  t.fecha_vencimiento ASC;
```

### Overdue Tasks

```sql
SELECT
  t.codigo_tarea,
  t.titulo,
  t.prioridad,
  t.fecha_vencimiento,
  CURRENT_DATE - t.fecha_vencimiento as days_overdue,
  asignado.nombre as asignado,
  asignado.whatsapp as asignado_whatsapp
FROM tr_tr_tareas t
LEFT JOIN dm_actores asignado ON t.asignado_a = asignado.id
WHERE t.organizacion_id = 'org-uuid'
  AND t.eliminado_en IS NULL
  AND t.estado NOT IN ('completada', 'cancelada')
  AND t.fecha_vencimiento < CURRENT_DATE
ORDER BY t.fecha_vencimiento ASC;
```

### Tasks by Opportunity

```sql
SELECT
  opp.codigo as oportunidad_codigo,
  COUNT(*) as total_tr_tareas,
  SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) as completadas,
  SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
  SUM(CASE WHEN t.estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso
FROM tr_tr_tareas t
JOIN tr_doc_comercial opp ON t.oportunidad_id = opp.id
WHERE t.organizacion_id = 'org-uuid'
  AND t.eliminado_en IS NULL
GROUP BY opp.id, opp.codigo
HAVING COUNT(*) > 0
ORDER BY COUNT(*) DESC;
```

### High Priority Tasks

```sql
SELECT
  t.*,
  asignado.nombre as asignado_nombre,
  asignado.whatsapp
FROM tr_tr_tareas t
LEFT JOIN dm_actores asignado ON t.asignado_a = asignado.id
WHERE t.organizacion_id = 'org-uuid'
  AND t.eliminado_en IS NULL
  AND t.prioridad IN ('Alta', 'Urgente')
  AND t.estado NOT IN ('completada', 'cancelada')
ORDER BY t.fecha_vencimiento ASC;
```

### Tasks Due This Week

```sql
SELECT *
FROM tr_tr_tareas
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND estado NOT IN ('completada', 'cancelada')
ORDER BY fecha_vencimiento ASC;
```

### Task Completion Rate

```sql
SELECT
  DATE_TRUNC('week', creado_en) as week,
  COUNT(*) as created,
  SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completed,
  ROUND(
    100.0 * SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as completion_rate
FROM tr_tr_tareas
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND creado_en >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY week
ORDER BY week DESC;
```

---

## Share Assignment Queries

### Current Owners (Dueños)

```sql
SELECT
  accion.codigo_accion,
  a.codigo_bp,
  a.nombre_completo,
  asig.fecha_inicio,
  asig.precio_transaccion
FROM vn_asociados asig
JOIN dm_acciones accion ON asig.accion_id = accion.id
JOIN dm_actores a ON asig.business_partner_id = a.id
WHERE asig.organizacion_id = 'org-uuid'
  AND asig.eliminado_en IS NULL
  AND asig.tipo_asignacion = 'dueño'
  AND asig.es_actual = true
ORDER BY accion.codigo_accion;
```

### All Active Assignments

```sql
SELECT
  accion.codigo_accion,
  asig.tipo_asignacion,
  asig.subcodigo,
  asig.codigo_completo,
  CASE a.tipo_actor
    WHEN 'persona' THEN a.nombre_completo
    WHEN 'empresa' THEN a.razon_social
  END as nombre,
  asig.fecha_inicio,
  asig.es_actual
FROM vn_asociados asig
JOIN dm_acciones accion ON asig.accion_id = accion.id
JOIN dm_actores a ON asig.business_partner_id = a.id
WHERE asig.organizacion_id = 'org-uuid'
  AND asig.eliminado_en IS NULL
  AND asig.es_actual = true
ORDER BY accion.codigo_accion, asig.tipo_asignacion;
```

### Assignments by Actor

```sql
SELECT
  a.codigo_bp,
  a.nombre_completo,
  COUNT(*) FILTER (WHERE asig.es_actual = true) as activas,
  COUNT(*) FILTER (WHERE asig.es_actual = false) as finalizadas,
  asig.tipo_asignacion
FROM vn_asociados asig
JOIN dm_actores a ON asig.business_partner_id = a.id
WHERE asig.organizacion_id = 'org-uuid'
  AND asig.eliminado_en IS NULL
GROUP BY a.id, a.codigo_bp, a.nombre_completo, asig.tipo_asignacion
ORDER BY activas DESC;
```

### Assignment History

```sql
SELECT
  accion.codigo_accion,
  asig.tipo_asignacion,
  a.nombre_completo,
  asig.fecha_inicio,
  asig.fecha_fin,
  CASE
    WHEN asig.fecha_fin IS NULL THEN 'Vigente'
    ELSE 'Finalizada'
  END as estado
FROM vn_asociados asig
JOIN dm_acciones accion ON asig.accion_id = accion.id
JOIN dm_actores a ON asig.business_partner_id = a.id
WHERE asig.organizacion_id = 'org-uuid'
  AND asig.eliminado_en IS NULL
  -- AND asig.accion_id = 'accion-uuid'  -- Specific action
ORDER BY asig.fecha_inicio DESC;
```

---

## Relationship Queries

### All Active Relationships

```sql
SELECT
  r.tipo_relacion,
  r.rol_origen,
  r.rol_destino,
  origen.nombre_completo as origen_nombre,
  destino.nombre_completo as destino_nombre,
  r.fecha_inicio,
  r.es_actual
FROM vn_relaciones_actores r
JOIN dm_actores origen ON r.bp_origen_id = origen.id
JOIN dm_actores destino ON r.bp_destino_id = destino.id
WHERE r.organizacion_id = 'org-uuid'
  AND r.eliminado_en IS NULL
  AND r.es_actual = true
ORDER BY r.tipo_relacion, origen.nombre_completo;
```

### Relationships by Type

```sql
SELECT
  origen.nombre_completo as persona,
  destino.razon_social as empresa,
  r.rol_origen as cargo,
  r.fecha_inicio
FROM vn_relaciones_actores r
JOIN dm_actores origen ON r.bp_origen_id = origen.id
JOIN dm_actores destino ON r.bp_destino_id = destino.id
WHERE r.organizacion_id = 'org-uuid'
  AND r.eliminado_en IS NULL
  AND r.tipo_relacion = 'laboral'
  AND r.es_actual = true
ORDER BY origen.nombre_completo;
```

### Get All Relationships for an Actor

```sql
-- Using the function
SELECT *
FROM obtener_relaciones_bp('actor-uuid', true);

-- Or manual query
SELECT
  r.tipo_relacion,
  r.rol_origen,
  r.rol_destino,
  CASE r.bp_origen_id
    WHEN 'actor-uuid' THEN destino.nombre_completo
    ELSE origen.nombre_completo
  END as related_to,
  r.es_actual
FROM vn_relaciones_actores r
JOIN dm_actores origen ON r.bp_origen_id = origen.id
JOIN dm_actores destino ON r.bp_destino_id = destino.id
WHERE r.organizacion_id = 'org-uuid'
  AND r.eliminado_en IS NULL
  AND (r.bp_origen_id = 'actor-uuid' OR r.bp_destino_id = 'actor-uuid')
ORDER BY r.tipo_relacion, r.es_actual DESC, r.fecha_inicio DESC;
```

### Family Relationships

```sql
SELECT
  origen.nombre_completo as persona1,
  r.rol_origen as parentesco1,
  r.rol_destino as parentesco2,
  destino.nombre_completo as persona2
FROM vn_relaciones_actores r
JOIN dm_actores origen ON r.bp_origen_id = origen.id
JOIN dm_actores destino ON r.bp_destino_id = destino.id
WHERE r.organizacion_id = 'org-uuid'
  AND r.eliminado_en IS NULL
  AND r.tipo_relacion = 'familiar'
  AND r.es_actual = true
ORDER BY origen.nombre_completo;
```

---

## Analytics Queries

### Monthly Revenue

```sql
SELECT
  DATE_TRUNC('month', creado_en) as month,
  COUNT(*) as total_tr_doc_comercial,
  SUM(CASE WHEN estado = 'ganado' THEN valor_total ELSE 0 END) as revenue_ganado,
  SUM(CASE WHEN estado IN ('propuesta', 'negociacion') THEN valor_total ELSE 0 END) as pipeline
FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
  AND creado_en >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY month
ORDER BY month DESC;
```

### Sales Funnel

```sql
WITH funnel AS (
  SELECT
    CASE
      WHEN estado = 'lead' THEN 1
      WHEN estado = 'calificado' THEN 2
      WHEN estado = 'propuesta' THEN 3
      WHEN estado = 'negociacion' THEN 4
      WHEN estado = 'ganado' THEN 5
      WHEN estado = 'perdido' THEN 6
    END as stage_order,
    estado,
    COUNT(*) as count,
    SUM(valor_total) as value
  FROM tr_doc_comercial
  WHERE organizacion_id = 'org-uuid'
    AND eliminado_en IS NULL
  GROUP BY estado
)
SELECT
  estado,
  count,
  value,
  SUM(count) OVER (ORDER BY stage_order) - count as dropped_off
FROM funnel
ORDER BY stage_order;
```

### Top Actors by Value

```sql
SELECT
  a.codigo_bp,
  CASE a.tipo_actor
    WHEN 'persona' THEN a.nombre_completo
    WHEN 'empresa' THEN a.razon_social
  END as nombre,
  COUNT(DISTINCT doc.id) as total_tr_doc_comercial,
  COALESCE(SUM(doc.valor_total), 0) as valor_total
FROM dm_actores a
LEFT JOIN tr_doc_comercial doc ON doc.asociado_id = a.id
  AND doc.eliminado_en IS NULL
  AND doc.estado = 'ganado'
WHERE a.organizacion_id = 'org-uuid'
  AND a.eliminado_en IS NULL
GROUP BY a.id, a.codigo_bp, a.tipo_actor, a.nombre_completo, a.razon_social
ORDER BY valor_total DESC
LIMIT 10;
```

### Task Performance by User

```sql
SELECT
  asignado.nombre_completo,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.estado = 'completada' AND t.fecha_vencimiento >= t.actualizado_en THEN 1 ELSE 0 END) as on_time,
  SUM(CASE WHEN t.estado = 'completada' AND t.fecha_vencimiento < t.actualizado_en THEN 1 ELSE 0 END) as late
FROM tr_tr_tareas t
JOIN dm_actores asignado ON t.asignado_a = asignado.id
WHERE t.organizacion_id = 'org-uuid'
  AND t.eliminado_en IS NULL
  AND t.creado_en >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY asignado.id, asignado.nombre_completo
ORDER BY completed DESC;
```

### Growth Metrics

```sql
SELECT
  DATE_TRUNC('month', creado_en) as month,
  COUNT(DISTINCT organizacion_id) as new_orgs,
  COUNT(*) FILTER (WHERE tipo_actor = 'persona') as new_personas,
  COUNT(*) FILTER (WHERE tipo_actor = 'empresa') as new_empresas
FROM dm_actores
WHERE eliminado_en IS NULL
  AND creado_en >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY month
ORDER BY month DESC;
```

---

## Maintenance Queries

### Find Soft-Deleted Records

```sql
-- By table
SELECT COUNT(*) as deleted_records
FROM dm_actores
WHERE eliminado_en IS NOT NULL;

-- By organization
SELECT
  'dm_actores' as table_name,
  COUNT(*) FILTER (WHERE eliminado_en IS NULL) as active,
  COUNT(*) FILTER (WHERE eliminado_en IS NOT NULL) as deleted
FROM dm_actores
WHERE organizacion_id = 'org-uuid'
UNION ALL
SELECT
  'tr_doc_comercial' as table_name,
  COUNT(*) FILTER (WHERE eliminado_en IS NULL) as active,
  COUNT(*) FILTER (WHERE eliminado_en IS NOT NULL) as deleted
FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid';
```

### Find Orphaned Records

```sql
-- Actors without organization (shouldn't exist with CASCADE)
SELECT COUNT(*)
FROM dm_actores
WHERE organizacion_id IS NULL
  AND eliminado_en IS NULL;

-- Tasks with invalid opportunity reference
SELECT t.id, t.titulo, t.oportunidad_id
FROM tr_tr_tareas t
LEFT JOIN tr_doc_comercial opp ON t.oportunidad_id = opp.id
WHERE t.oportunidad_id IS NOT NULL
  AND opp.id IS NULL
  AND t.eliminado_en IS NULL;
```

### Index Usage

```sql
-- Check which indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid::regclass) DESC;
```

### Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Bloat Check

```sql
-- Find tables with high bloat (>30%)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Supabase Client Examples

### TypeScript / JavaScript

```typescript
// Get all actors for an organization
const { data: actores } = await supabase
  .from('dm_actores')
  .select('*')
  .eq('organizacion_id', orgId)
  .is('eliminado_en', null)
  .eq('activo', true)
  .order('creado_en', { ascending: false });

// Get tasks with opportunity details
const { data: tr_tareas } = await supabase
  .from('tr_tr_tareas')
  .select(`
    *,
    oportunidad:tr_doc_comercial(
      codigo,
      estado,
      valor_total
    ),
    asignado:dm_actores(
      codigo_bp,
      nombre_completo,
      email
    )
  `)
  .eq('organizacion_id', orgId)
  .eq('asignado_a', userId)
  .is('eliminado_en', null);

// Insert new actor
const { data: newActor, error } = await supabase
  .from('dm_actores')
  .insert({
    organizacion_id: orgId,
    tipo_actor: 'persona',
    primer_nombre: 'Juan',
    primer_apellido: 'Pérez',
    email: 'juan@example.com'
  })
  .select()
  .single();

// Soft delete actor
const { error } = await supabase.rpc('soft_delete_bp', {
  p_id: actorId
});

// Check permissions
const { data: hasPermission } = await supabase.rpc('has_org_permission', {
  p_org_id: orgId,
  p_permission: 'tr_tareas:update'
});
```

---

## Best Practices

### 1. Always Filter by Organization

```sql
-- Good
SELECT * FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL;

-- Bad (security risk - queries all config_organizaciones)
SELECT * FROM dm_actores
WHERE eliminado_en IS NULL;
```

### 2. Use Prepared Statements

```typescript
// Good - Parameterized
await supabase
  .from('dm_actores')
  .select()
  .eq('organizacion_id', orgId)  // Parameterized

// Bad - String interpolation (SQL injection risk)
const query = `SELECT * FROM dm_actores WHERE organizacion_id = '${orgId}'`;
```

### 3. Select Only Needed Columns

```sql
-- Good - Only what you need
SELECT id, codigo_bp, nombre_completo, email
FROM dm_actores
WHERE organizacion_id = 'org-uuid';

-- Bad - Returns all columns (slower)
SELECT * FROM dm_actores
WHERE organizacion_id = 'org-uuid';
```

### 4. Use Views for Complex Joins

```sql
-- Good - Use view
SELECT * FROM v_actores_org
WHERE organizacion_id = 'org-uuid';

-- Acceptable - Direct query
SELECT a.*, c.city_name
FROM dm_actores a
LEFT JOIN config_ciudades c ON a.ciudad_id = c.id
WHERE a.organizacion_id = 'org-uuid';
```

### 5. Handle Nulls Properly

```sql
-- Good - COALESCE for default values
SELECT
  codigo_bp,
  COALESCE(email, 'Sin email') as email,
  COALESCE(telefono, 'Sin teléfono') as telefono
FROM dm_actores
WHERE organizacion_id = 'org-uuid';

-- Good - Filter NULLs
SELECT *
FROM tr_tr_tareas
WHERE oportunidad_id IS NOT NULL;
```

---

## Performance Tips

### 1. Use Partial Indexes

```sql
-- Query uses partial index automatically
SELECT * FROM dm_actores
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL;  -- Uses idx_dm_actores_activos
```

### 2. Avoid Functions on Indexed Columns

```sql
-- Bad - Function prevents index use
WHERE LOWER(nombre_completo) = 'juan perez'

-- Good - Use ILIKE
WHERE nombre_completo ILIKE 'Juan Perez'
```

### 3. Use EXISTS Instead of IN

```sql
-- Good - EXISTS stops at first match
SELECT *
FROM dm_actores a
WHERE EXISTS (
  SELECT 1 FROM tr_doc_comercial doc
  WHERE doc.asociado_id = a.id
    AND doc.estado = 'ganado'
);

-- Slower - IN scans all values
SELECT *
FROM dm_actores a
WHERE a.id IN (
  SELECT doc.asociado_id
  FROM tr_doc_comercial doc
  WHERE doc.estado = 'ganado'
);
```

### 4. Limit Result Sets

```sql
-- Always use LIMIT for large tables
SELECT * FROM tr_doc_comercial
WHERE organizacion_id = 'org-uuid'
ORDER BY creado_en DESC
LIMIT 100;
```

---

## See Also

- [TABLES.md](TABLES.md) - Complete data dictionary
- [OVERVIEW.md](OVERVIEW.md) - Architecture concepts
- [SCHEMA.md](SCHEMA.md) - ERD and relationships
- [VIEWS.md](VIEWS.md) - Database views
