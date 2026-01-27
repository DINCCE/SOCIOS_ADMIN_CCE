-- Migration: 003_refine_search_routes.sql
-- Goal: Update search_global RPC with correct routes and add recent items support if needed

CREATE OR REPLACE FUNCTION search_global(
  p_query TEXT,
  p_org_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  subtitle TEXT,
  route TEXT,
  metadata JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search_term TEXT := '%' || LOWER(TRIM(p_query)) || '%';
  v_min_length INTEGER := 2;
BEGIN
  IF LENGTH(TRIM(p_query)) < v_min_length THEN
    RETURN;
  END IF;

  -- 1. Actors (Personas/Empresas)
  RETURN QUERY
  SELECT
    'actor'::TEXT,
    a.id,
    COALESCE(NULLIF(a.nombre_completo, ''), NULLIF(a.razon_social, ''), 'Sin nombre'),
    COALESCE(
      CASE
        WHEN a.num_documento IS NOT NULL THEN 'ID: ' || a.num_documento
        WHEN a.codigo_bp IS NOT NULL THEN 'BP: ' || a.codigo_bp
        ELSE a.email_principal
      END,
      'Sin identificación'
    ),
    '/admin/socios/personas/' || a.id::TEXT,
    jsonb_build_object('tipo_actor', a.tipo_actor, 'estado', a.estado_actor)
  FROM v_actores_org a
  WHERE a.organizacion_id = p_org_id AND a.eliminado_en IS NULL
    AND (LOWER(a.nombre_completo) LIKE v_search_term OR LOWER(a.razon_social) LIKE v_search_term OR a.num_documento LIKE v_search_term OR a.codigo_bp LIKE v_search_term)
  LIMIT p_limit;

  -- 2. Tareas (Using query param for sheet integration)
  RETURN QUERY
  SELECT
    'tarea'::TEXT,
    t.id,
    t.titulo,
    COALESCE(t.codigo_tarea, 'Tarea'),
    '/admin/procesos/tareas?id=' || t.id::TEXT,
    jsonb_build_object('estado', t.estado, 'prioridad', t.prioridad)
  FROM v_tareas_org t
  WHERE t.organizacion_id = p_org_id AND t.eliminado_en IS NULL
    AND (LOWER(t.titulo) LIKE v_search_term OR LOWER(t.codigo_tarea) LIKE v_search_term)
  LIMIT p_limit;

  -- 3. Acciones
  RETURN QUERY
  SELECT
    'accion'::TEXT,
    acc.id,
    acc.codigo_accion,
    COALESCE(acc.propietario_nombre_completo, 'Sin propietario'),
    '/admin/procesos/acciones/' || acc.id::TEXT,
    jsonb_build_object('estado', acc.estado)
  FROM v_acciones_org acc
  WHERE acc.organizacion_id = p_org_id AND acc.eliminado_en IS NULL
    AND (LOWER(acc.codigo_accion) LIKE v_search_term OR LOWER(acc.propietario_nombre_completo) LIKE v_search_term)
  LIMIT p_limit;

  -- 4. Documentos
  RETURN QUERY
  SELECT
    'documento'::TEXT,
    doc.id,
    COALESCE(doc.titulo, doc.codigo),
    COALESCE(doc.codigo, 'Documento'),
    '/admin/procesos/documentos-comerciales/' || doc.id::TEXT,
    jsonb_build_object('estado', doc.estado, 'tipo', doc.tipo_documento)
  FROM v_doc_comercial_org doc
  WHERE doc.organizacion_id = p_org_id AND doc.eliminado_en IS NULL
    AND (LOWER(doc.titulo) LIKE v_search_term OR LOWER(doc.codigo) LIKE v_search_term)
  LIMIT p_limit;
END;
$$;
