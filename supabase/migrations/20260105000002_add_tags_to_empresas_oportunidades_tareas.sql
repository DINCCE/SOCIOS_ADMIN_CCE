-- Añadir campo tags a las tablas empresas, oportunidades y tareas
-- Tipo: TEXT[] (array de texto)
-- Default: ARRAY[]::text[] (array vacío)

-- Añadir columna tags a la tabla empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::text[];

-- Añadir columna tags a la tabla oportunidades
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::text[];

-- Añadir columna tags a la tabla tareas
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::text[];

-- Actualizar la vista oportunidades_view para incluir el campo tags
DROP VIEW IF EXISTS oportunidades_view;

CREATE VIEW oportunidades_view AS
SELECT
  o.id,
  o.codigo,
  o.tipo,
  o.estado,
  o.fecha_solicitud,
  o.monto_estimado,
  o.notas,
  o.atributos,
  o.tags,
  o.organizacion_id,
  org.nombre AS organizacion_nombre,
  o.solicitante_id,
  bp.codigo_bp AS solicitante_codigo_bp,
  COALESCE(NULLIF(TRIM(BOTH FROM concat(p.primer_nombre, ' ', COALESCE(p.segundo_nombre, ''::text), ' ', p.primer_apellido, ' ', COALESCE(p.segundo_apellido, ''::text))), ''::text), e.razon_social) AS solicitante_nombre,
  o.responsable_id,
  seu.email AS responsable_email,
  o.creado_en,
  o.creado_por,
  o.actualizado_en,
  o.actualizado_por,
  o.eliminado_en,
  o.eliminado_por
FROM (((((oportunidades o
  LEFT JOIN organizations org ON (((org.id = o.organizacion_id) AND (org.eliminado_en IS NULL))))
  LEFT JOIN business_partners bp ON (((bp.id = o.solicitante_id) AND (bp.eliminado_en IS NULL))))
  LEFT JOIN personas p ON (((p.id = o.solicitante_id) AND (bp.tipo_actor = 'persona'::text) AND (p.eliminado_en IS NULL))))
  LEFT JOIN empresas e ON (((e.id = o.solicitante_id) AND (bp.tipo_actor = 'empresa'::text) AND (e.eliminado_en IS NULL))))
  LEFT JOIN safe_user_emails seu ON ((seu.id = o.responsable_id)))
WHERE (o.eliminado_en IS NULL);

-- Actualizar la vista tareas_view para incluir el campo tags
DROP VIEW IF EXISTS tareas_view;

CREATE VIEW tareas_view AS
SELECT
  t.id,
  t.titulo,
  t.descripcion,
  t.estado,
  t.prioridad,
  t.tags,
  t.fecha_vencimiento,
  t.organizacion_id,
  org.nombre AS organizacion_nombre,
  t.asignado_a,
  seu.email AS asignado_email,
  t.oportunidad_id,
  o.codigo AS oportunidad_codigo,
  o.estado AS oportunidad_estado,
  t.relacionado_con_bp,
  rbp.codigo_bp AS relacionado_codigo_bp,
  COALESCE(NULLIF(TRIM(BOTH FROM concat(rp.primer_nombre, ' ', COALESCE(rp.segundo_nombre, ''::text), ' ', rp.primer_apellido, ' ', COALESCE(rp.segundo_apellido, ''::text))), ''::text), re.razon_social) AS relacionado_nombre,
  t.creado_en,
  t.creado_por,
  t.actualizado_en,
  t.actualizado_por,
  t.eliminado_en,
  t.eliminado_por
FROM ((((((tareas t
  LEFT JOIN organizations org ON (((org.id = t.organizacion_id) AND (org.eliminado_en IS NULL))))
  LEFT JOIN safe_user_emails seu ON ((seu.id = t.asignado_a)))
  LEFT JOIN oportunidades o ON (((o.id = t.oportunidad_id) AND (o.eliminado_en IS NULL))))
  LEFT JOIN business_partners rbp ON (((rbp.id = t.relacionado_con_bp) AND (rbp.eliminado_en IS NULL))))
  LEFT JOIN personas rp ON (((rp.id = t.relacionado_con_bp) AND (rbp.tipo_actor = 'persona'::text) AND (rp.eliminado_en IS NULL))))
  LEFT JOIN empresas re ON (((re.id = t.relacionado_con_bp) AND (rbp.tipo_actor = 'empresa'::text) AND (re.eliminado_en IS NULL))))
WHERE (t.eliminado_en IS NULL);

-- NOTA: La vista v_empresas_org ya tenía tags definido como ARRAY[]::text[]
-- Ahora automáticamente usará el campo real de la tabla empresas
