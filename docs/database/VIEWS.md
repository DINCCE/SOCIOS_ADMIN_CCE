# Database Views

> **Last Updated:** 2026-01-08
> **Total Views:** 3

Views provide simplified, read-only access to complex data structures without duplicating data.

---

## Table of Contents

1. [v_actores_org](#v_actores_org) - Unified business partners view
2. [v_doc_comercial_org](#v_doc_comercial_org) - Commercial documents with actor details
3. [v_tr_tareas_org](#v_tr_tareas_org) - Tasks with opportunity and actor details

---

## v_actores_org

**Purpose:** Unified view of all business partners (persons and companies) with all information consolidated in a single table.

**Description:** > Vista unificada de actores (personas y empresas) con toda la información consolidada en dm_actores. Ya no requiere JOIN con dm_personas ni dm_empresas.

### Definition

```sql
CREATE OR REPLACE VIEW v_actores_org AS
SELECT
  -- Common fields
  id,
  codigo_bp,
  tipo_actor,
  organizacion_id,
  email,
  telefono,
  whatsapp,
  foto_url,
  ciudad_id,
  direccion,
  activo,
  fecha_inactivacion,
  motivo_inactivacion,
  atributos,
  -- Person-specific fields
  primer_nombre,
  segundo_nombre,
  primer_apellido,
  segundo_apellido,
  nombre_completo,
  fecha_nacimiento,
  estado_civil,
  genero,
  -- Company-specific fields
  razon_social,
  nit,
  digito_verificacion,
  -- Document fields
  tipo_documento,
  num_documento,
  identificacion_completa,
  -- Soft delete
  eliminado_en,
  eliminado_por,
  -- Audit fields
  creado_en,
  actualizado_en,
  creado_por,
  actualizado_por
FROM dm_actores
WHERE eliminado_en IS NULL;
```

### Columns

| Column | Type | Source | Description |
|--------|------|--------|-------------|
| **Common Fields** |||||
| id | uuid | dm_actores.id | Primary key |
| codigo_bp | text | dm_actores.codigo_bp | Business partner code |
| tipo_actor | tipo_actor_enum | dm_actores.tipo_actor | 'persona' or 'empresa' |
| organizacion_id | uuid | dm_actores.organizacion_id | Organization |
| email | text | dm_actores.email | Email address |
| telefono | text | dm_actores.telefono | Phone number |
| whatsapp | text | dm_actores.whatsapp | WhatsApp |
| foto_url | text | dm_actores.foto_url | Profile photo URL |
| ciudad_id | uuid | dm_actores.ciudad_id | City (FK: config_ciudades) |
| direccion | text | dm_actores.direccion | Street address |
| activo | boolean | dm_actores.activo | Active status |
| **Person Fields** |||||
| primer_nombre | text | dm_actores.primer_nombre | First name |
| segundo_nombre | text | dm_actores.segundo_nombre | Middle name |
| primer_apellido | text | dm_actores.primer_apellido | First surname |
| segundo_apellido | text | dm_actores.segundo_apellido | Second surname |
| nombre_completo | text | dm_actores.nombre_completo | Full name (computed) |
| fecha_nacimiento | date | dm_actores.fecha_nacimiento | Birth date |
| estado_civil | text | dm_actores.estado_civil | Civil status |
| genero | text | dm_actores.genero | Gender |
| **Company Fields** |||||
| razon_social | text | dm_actores.razon_social | Legal business name |
| nit | text | dm_actores.nit | Tax ID |
| digito_verificacion | integer | dm_actores.digito_verificacion | NIT check digit |
| **Document Fields** |||||
| tipo_documento | text | dm_actores.tipo_documento | Document type |
| num_documento | text | dm_actores.num_documento | Document number |
| identificacion_completa | text | (computed) | Full identification |
| **Audit Fields** |||||
| eliminado_en | timestamptz | dm_actores.eliminado_en | Soft delete timestamp |
| creado_en | timestamptz | dm_actores.creado_en | Creation timestamp |
| actualizado_en | timestamptz | dm_actores.actualizado_en | Last update |

### Usage Examples

```sql
-- Get all active persons for an organization
SELECT
  codigo_bp,
  nombre_completo,
  email,
  telefono
FROM v_actores_org
WHERE organizacion_id = 'org-uuid'
  AND tipo_actor = 'persona'
  AND activo = true
ORDER BY nombre_completo;

-- Get all companies
SELECT
  codigo_bp,
  razon_social,
  nit,
  email
FROM v_actores_org
WHERE tipo_actor = 'empresa'
  AND activo = true;

-- Search by identification
SELECT *
FROM v_actores_org
WHERE num_documento = '12345678';
```

### Benefits

1. **Simplified queries** - No need to JOIN with dm_personas or dm_empresas (no longer exist)
2. **Single source of truth** - All actor data in one place using STI pattern
3. **Single Table Inheritance** - All actor types consolidated in dm_actores with tipo_actor discriminator
4. **Soft delete filter** - Automatically excludes soft-deleted records

---

## v_doc_comercial_org

**Purpose:** Commercial documents (opportunities) with full actor details for requester and responsible person.

**Description:** > Vista de documentos comerciales con datos de solicitante y pagador (usando dm_actores consolidado). Tabla origen: tr_doc_comercial

### Definition

```sql
CREATE OR REPLACE VIEW v_doc_comercial_org AS
SELECT
  -- Document fields
  doc.id,
  doc.codigo,
  doc.tipo,
  doc.estado,
  doc.organizacion_id,
  doc.fecha_doc,
  doc.fecha_venc_doc,
  -- Financials
  doc.items,
  doc.moneda_iso,
  doc.valor_neto,
  doc.valor_descuento,
  doc.valor_impuestos,
  doc.valor_total,
  doc.monto_estimado,
  -- Actors
  doc.asociado_id,
  doc.solicitante_id,
  doc.responsable_id,
  doc.pagador_id,
  -- Requester details (from dm_actores)
  solicitante.codigo_bp AS solicitante_codigo,
  solicitante.tipo_actor AS solicitante_tipo,
  CASE
    WHEN solicitante.tipo_actor = 'persona' THEN solicitante.nombre_completo
    WHEN solicitante.tipo_actor = 'empresa' THEN solicitante.razon_social
  END AS solicitante_nombre,
  solicitante.email AS solicitante_email,
  solicitante.telefono AS solicitante_telefono,
  -- Responsible person details
  responsable.codigo_bp AS responsable_codigo,
  responsable.tipo_actor AS responsable_tipo,
  CASE
    WHEN responsable.tipo_actor = 'persona' THEN responsable.nombre_completo
    WHEN responsable.tipo_actor = 'empresa' THEN responsable.razon_social
  END AS responsable_nombre,
  responsable.email AS responsable_email,
  -- Metadata
  doc.documento_origen_id,
  doc.notas,
  doc.tags,
  doc.atributos,
  -- Audit
  doc.eliminado_en,
  doc.creado_en,
  doc.actualizado_en
FROM tr_doc_comercial doc
LEFT JOIN dm_actores solicitante ON doc.solicitante_id = solicitante.id
LEFT JOIN dm_actores responsable ON doc.responsable_id = responsable.id
WHERE doc.eliminado_en IS NULL;
```

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| **Document Identity** ||||
| id | uuid | Document ID |
| codigo | text | Opportunity code |
| tipo | tr_doc_comercial_tipo | Document type |
| estado | tr_doc_comercial_estados | Status |
| **Financials** ||||
| valor_neto | numeric | Net value |
| valor_descuento | numeric | Discount |
| valor_impuestos | numeric | Taxes |
| valor_total | numeric | Total (computed) |
| **Requester (Solicitante)** ||||
| solicitante_nombre | text | Name (person or company) |
| solicitante_email | text | Email |
| solicitante_telefono | text | Phone |
| **Responsible Person** ||||
| responsable_nombre | text | Name |
| responsable_email | text | Email |

### Usage Examples

```sql
-- Get opportunities with requester details
SELECT
  codigo,
  tipo,
  estado,
  solicitante_nombre,
  responsable_nombre,
  valor_total
FROM v_doc_comercial_org
WHERE organizacion_id = 'org-uuid'
  AND estado IN ('propuesta', 'negociacion')
ORDER BY fecha_doc DESC;

-- Pipeline report by requester
SELECT
  solicitante_nombre,
  estado,
  COUNT(*) as cantidad,
  SUM(valor_total) as valor_total
FROM v_doc_comercial_org
WHERE organizacion_id = 'org-uuid'
  AND eliminado_en IS NULL
GROUP BY solicitante_nombre, estado
ORDER BY valor_total DESC;
```

### Benefits

1. **Pre-joined actor data** - No need to JOIN dm_actores separately
2. **Smart name resolution** - Automatically chooses nombre_completo or razon_social
3. **Soft delete filter** - Excludes deleted documents
4. **Contact info included** - Email and phone for immediate use

---

## v_tr_tareas_org

**Purpose:** Tasks with related opportunity details and business partner information.

**Description:** > Vista de tr_tareas con información de oportunidad y actor relacionado (usando dm_actores consolidado). Tabla origen: tr_tr_tareas

### Definition

```sql
CREATE OR REPLACE VIEW v_tr_tareas_org AS
SELECT
  -- Task fields
  t.id,
  t.codigo_tarea,
  t.titulo,
  t.descripcion,
  t.prioridad,
  t.estado,
  t.organizacion_id,
  t.fecha_vencimiento,
  -- Relationships
  t.oportunidad_id,
  t.asignado_a,
  t.relacionado_con_bp,
  -- Opportunity details
  opp.codigo AS oportunidad_codigo,
  opp.tipo AS oportunidad_tipo,
  opp.estado AS oportunidad_estado,
  opp.valor_total AS oportunidad_valor,
  -- Assigned person details
  asignado.codigo_bp AS asignado_codigo,
  asignado.tipo_actor AS asignado_tipo,
  CASE
    WHEN asignado.tipo_actor = 'persona' THEN asignado.nombre_completo
    WHEN asignado.tipo_actor = 'empresa' THEN asignado.razon_social
  END AS asignado_nombre,
  asignado.email AS asignado_email,
  asignado.whatsapp AS asignado_whatsapp,
  -- Related business partner details
  relacionado.codigo_bp AS relacionado_codigo,
  relacionado.tipo_actor AS relacionado_tipo,
  CASE
    WHEN relacionado.tipo_actor = 'persona' THEN relacionado.nombre_completo
    WHEN relacionado.tipo_actor = 'empresa' THEN relacionado.razon_social
  END AS relacionado_nombre,
  -- Metadata
  t.atributos,
  -- Audit
  t.eliminado_en,
  t.creado_en,
  t.actualizado_en
FROM tr_tr_tareas t
LEFT JOIN tr_doc_comercial opp ON t.oportunidad_id = opp.id
LEFT JOIN dm_actores asignado ON t.asignado_a = asignado.id
LEFT JOIN dm_actores relacionado ON t.relacionado_con_bp = relacionado.id
WHERE t.eliminado_en IS NULL;
```

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| **Task** ||||
| id | uuid | Task ID |
| codigo_tarea | text | Task code |
| titulo | text | Task title |
| prioridad | tr_tr_tareas_prioridad | Priority |
| estado | tr_tr_tareas_estado | Status |
| fecha_vencimiento | date | Due date |
| **Opportunity** ||||
| oportunidad_codigo | text | Opportunity code |
| oportunidad_estado | tr_doc_comercial_estados | Opportunity status |
| oportunidad_valor | numeric | Opportunity value |
| **Assigned Person** ||||
| asignado_nombre | text | Name of assignee |
| asignado_email | text | Email |
| asignado_whatsapp | text | WhatsApp |
| **Related Business Partner** ||||
| relacionado_nombre | text | Related partner name |

### Usage Examples

```sql
-- Get tasks for a user with opportunity context
SELECT
  codigo_tarea,
  titulo,
  prioridad,
  estado,
  fecha_vencimiento,
  asignado_nombre,
  oportunidad_codigo,
  oportunidad_valor
FROM v_tr_tareas_org
WHERE organizacion_id = 'org-uuid'
  AND asignado_a = 'user-uuid'
  AND estado != 'completada'
ORDER BY prioridad DESC, fecha_vencimiento ASC;

-- Tasks by opportunity
SELECT
  oportunidad_codigo,
  COUNT(*) as total_tr_tareas,
  SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
  SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
FROM v_tr_tareas_org
WHERE organizacion_id = 'org-uuid'
  AND oportunidad_id IS NOT NULL
GROUP BY oportunidad_codigo;

-- Overdue tasks
SELECT
  codigo_tarea,
  titulo,
  asignado_nombre,
  asignado_whatsapp,
  fecha_vencimiento
FROM v_tr_tareas_org
WHERE fecha_vencimiento < CURRENT_DATE
  AND estado NOT IN ('completada', 'cancelada');
```

### Benefits

1. **Rich context** - Task + opportunity + actor details in one query
2. **Smart name resolution** - Automatically shows correct name field
3. **Contact information** - Email and WhatsApp ready for notifications
4. **Soft delete filter** - Only active tasks shown

---

## View Patterns

### Common Characteristics

All views share these patterns:

1. **Soft Delete Filter**
   ```sql
   WHERE eliminado_en IS NULL
   ```
   Automatically excludes soft-deleted records.

2. **Smart Name Resolution**
   ```sql
   CASE
     WHEN tipo_actor = 'persona' THEN nombre_completo
     WHEN tipo_actor = 'empresa' THEN razon_social
   END
   ```
   Shows the appropriate name field based on actor type.

3. **Organization Isolation**
   All views include `organizacion_id` for filtering by tenant.

4. **Contact Info Inclusion**
   Email, phone, and WhatsApp included for immediate use.

---

## Performance Considerations

### View Performance

Views in PostgreSQL are **not materialized** by default. This means:

- **Pros**: Always show current data, no storage overhead
- **Cons**: Query executes underlying logic each time

### Optimization Tips

1. **Index your WHERE clauses**:
   ```sql
   -- Good: Uses partial index
   SELECT * FROM v_actores_org
   WHERE organizacion_id = 'uuid'
     AND eliminado_en IS NULL;  -- Uses idx_dm_actores_activos
   ```

2. **Limit columns**:
   ```sql
   -- Good: Only select needed columns
   SELECT codigo_bp, nombre_completo, email
   FROM v_actores_org;
   ```

3. **Consider materialized views** for:
   - Heavy aggregations
   - Frequently accessed data
   - Complex joins

### Example: Materialized View for Dashboard

```sql
CREATE MATERIALIZED VIEW mv_dashboard_opportunities AS
SELECT
  organizacion_id,
  estado,
  COUNT(*) as cantidad,
  SUM(valor_total) as valor_total
FROM tr_doc_comercial
WHERE eliminado_en IS NULL
GROUP BY organizacion_id, estado;

CREATE UNIQUE INDEX ON mv_dashboard_opportunities(organizacion_id, estado);

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_dashboard_opportunities;
```

---

## Using Views in Application Code

### Supabase Client (TypeScript)

```typescript
// Get all actors for an organization
const { data: actores } = await supabase
  .from('v_actores_org')
  .select('codigo_bp, nombre_completo, email, tipo_actor')
  .eq('organizacion_id', orgId)
  .eq('activo', true);

// Get tasks with opportunity context
const { data: tr_tareas } = await supabase
  .from('v_tr_tareas_org')
  .select('*')
  .eq('asignado_a', userId)
  .eq('estado', 'pendiente')
  .order('fecha_vencimiento', { ascending: true });

// Get opportunities pipeline
const { data: tr_doc_comercial } = await supabase
  .from('v_doc_comercial_org')
  .select('*')
  .eq('organizacion_id', orgId)
  .gte('fecha_doc', '2026-01-01')
  .order('fecha_doc', { ascending: false });
```

### Raw SQL

```sql
-- Join view with other tables
SELECT
  v.*,
  COUNT(t.id) as total_tr_tareas
FROM v_actores_org v
LEFT JOIN tr_tr_tareas t ON t.asignado_a = v.id
WHERE v.organizacion_id = 'org-uuid'
  AND v.tipo_actor = 'persona'
GROUP BY v.id
ORDER BY v.nombre_completo;
```

---

## Security

### RLS on Views

Views **inherit RLS policies** from their underlying tables:

- If user can read `dm_actores`, they can read `v_actores_org`
- Organization isolation is automatically enforced
- Soft delete filtering is built into the view definition

### Best Practices

1. **Never grant direct SELECT on base tables** to application users
2. **Use views as the API layer** for data access
3. **Combine with RLS** for defense in depth
4. **Add comments** to views explaining their purpose

---

## Maintenance

### When to Update Views

Update views when:
1. Underlying table schema changes
2. New columns added that should be exposed
3. Business logic changes (e.g., name resolution)
4. Performance optimization needed

### View Versioning

Consider versioning for breaking changes:

```sql
-- Original view
CREATE VIEW v_actores_org AS ...

-- New version with different columns
CREATE VIEW v_actores_org_v2 AS ...

-- Gradually migrate application code
DROP VIEW v_actores_org;
ALTER VIEW v_actores_org_v2 RENAME TO v_actores_org;
```

---

## See Also

- [TABLES.md](TABLES.md) - Complete table definitions
- [OVERVIEW.md](OVERVIEW.md) - Architecture concepts
- [SCHEMA.md](SCHEMA.md) - Relationships and ERD
- [QUERIES.md](QUERIES.md) - Query patterns and examples
