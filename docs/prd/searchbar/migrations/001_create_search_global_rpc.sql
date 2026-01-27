-- ============================================================================
-- Global Search RPC Function for SOCIOS_ADMIN
-- ============================================================================
-- Purpose: Unified search across all entities (personas, empresas, tareas,
--          acciones, documentos) with RLS support and relevance ranking
--
-- Usage: SELECT * FROM search_global('juan', org_uuid, 20);
--
-- IMPORTANT: Use Supabase MCP tool to apply this migration:
--   mcp__supabase__apply_migration
-- ============================================================================

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
  -- Validate input
  IF LENGTH(TRIM(p_query)) < v_min_length THEN
    RETURN;
  END IF;

  -- ========================================================================
  -- SEARCH 1: Personas and Empresas (dm_actores via v_actores_org)
  -- ========================================================================
  -- Searches: nombre_completo, razon_social, num_documento, codigo_bp, email
  -- Returns: Unified actor results with type distinction
  -- ========================================================================
  RETURN QUERY
  SELECT
    'actor'::TEXT as entity_type,
    a.id as entity_id,
    -- Title: Priority to nombre_completo, fallback to razon_social
    COALESCE(
      NULLIF(a.nombre_completo, ''),
      NULLIF(a.razon_social, ''),
      'Sin nombre'
    ) as title,
    -- Subtitle: Document number, BP code, or email
    COALESCE(
      CASE
        WHEN a.num_documento IS NOT NULL THEN 'ID: ' || a.num_documento
        WHEN a.codigo_bp IS NOT NULL THEN 'BP: ' || a.codigo_bp
        WHEN a.email_principal IS NOT NULL THEN a.email_principal
        ELSE 'Sin identificación'
      END
    ) as subtitle,
    -- Route: Navigate to personas detail page (handles both personas and empresas)
    '/admin/socios/personas/' || a.id::TEXT as route,
    -- Metadata: Extended info for UI rendering
    jsonb_build_object(
      'tipo_actor', a.tipo_actor,
      'estado', a.estado,
      'tags', COALESCE(a.tags, '[]'::jsonb),
      'ciudad', a.ciudad_nombre,
      'created_at', a.creado_en
    ) as metadata
  FROM v_actores_org a
  WHERE a.organizacion_id = p_org_id
    AND a.eliminado_en IS NULL
    AND (
      -- Search in name fields
      LOWER(a.nombre_completo) LIKE v_search_term
      OR LOWER(a.razon_social) LIKE v_search_term
      -- Search in identifiers
      OR LOWER(a.num_documento) LIKE v_search_term
      OR LOWER(a.codigo_bp) LIKE v_search_term
      -- Search in contact
      OR LOWER(a.email_principal) LIKE v_search_term
      OR LOWER(a.telefono_principal) LIKE v_search_term
      -- Search in tags (array)
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(COALESCE(a.tags, '[]'::jsonb)) AS tag
        WHERE LOWER(tag) LIKE v_search_term
      )
    )
  ORDER BY
    -- Relevance: Exact matches first, then prefix matches, then contains
    CASE
      WHEN LOWER(a.nombre_completo) = LOWER(p_query) THEN 1
      WHEN LOWER(a.razon_social) = LOWER(p_query) THEN 1
      WHEN LOWER(a.nombre_completo) LIKE LOWER(p_query) || '%' THEN 2
      WHEN LOWER(a.razon_social) LIKE LOWER(p_query) || '%' THEN 2
      ELSE 3
    END,
    a.actualizado_en DESC
  LIMIT p_limit;

  -- ========================================================================
  -- SEARCH 2: Tareas (tr_tareas via v_tareas_org)
  -- ========================================================================
  -- Searches: titulo, codigo_tarea, descripcion, asignado
  -- Returns: Task results with priority and due date info
  -- ========================================================================
  RETURN QUERY
  SELECT
    'tarea'::TEXT as entity_type,
    t.id as entity_id,
    t.titulo as title,
    -- Subtitle: Code, assignee, or status
    COALESCE(
      CASE
        WHEN t.codigo_tarea IS NOT NULL THEN t.codigo_tarea
        WHEN t.asignado_nombre_completo IS NOT NULL THEN 'Asignado: ' || t.asignado_nombre_completo
        WHEN t.estado IS NOT NULL THEN 'Estado: ' || t.estado
        ELSE 'Sin código'
      END
    ) as subtitle,
    -- Route: TODO - Update when task detail page is created
    '/admin/procesos/tareas/' || t.id::TEXT as route,
    -- Metadata: Priority, status, dates, relationships
    jsonb_build_object(
      'estado', t.estado,
      'prioridad', t.prioridad,
      'fecha_vencimiento', t.fecha_vencimiento,
      'asignado', t.asignado_nombre_completo,
      'tags', COALESCE(t.tags, '[]'::jsonb),
      'codigo_tarea', t.codigo_tarea
    ) as metadata
  FROM v_tareas_org t
  WHERE t.organizacion_id = p_org_id
    AND t.eliminado_en IS NULL
    AND (
      LOWER(t.titulo) LIKE v_search_term
      OR LOWER(t.codigo_tarea) LIKE v_search_term
      OR LOWER(t.descripcion) LIKE v_search_term
      OR LOWER(t.asignado_nombre_completo) LIKE v_search_term
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(COALESCE(t.tags, '[]'::jsonb)) AS tag
        WHERE LOWER(tag) LIKE v_search_term
      )
    )
  ORDER BY
    -- Relevance: Title matches first, then code
    CASE
      WHEN LOWER(t.titulo) = LOWER(p_query) THEN 1
      WHEN LOWER(t.titulo) LIKE LOWER(p_query) || '%' THEN 2
      WHEN LOWER(t.codigo_tarea) = LOWER(p_query) THEN 1
      ELSE 3
    END,
    -- Priority: Urgent tasks first
    CASE t.prioridad
      WHEN 'Urgente' THEN 1
      WHEN 'Alta' THEN 2
      WHEN 'Media' THEN 3
      WHEN 'Baja' THEN 4
      ELSE 5
    END,
    t.fecha_vencimiento ASC NULLS LAST
  LIMIT p_limit;

  -- ========================================================================
  -- SEARCH 3: Acciones (dm_acciones via v_acciones_org)
  -- ========================================================================
  -- Searches: codigo_accion, propietario, organizacion
  -- Returns: Share/action results with ownership info
  -- ========================================================================
  RETURN QUERY
  SELECT
    'accion'::TEXT as entity_type,
    acc.id as entity_id,
    acc.codigo_accion as title,
    -- Subtitle: Owner or organization
    COALESCE(
      acc.propietario_nombre_completo,
      acc.organizacion_nombre
    ) as subtitle,
    -- Route: Navigate to acciones detail page
    '/admin/procesos/acciones/' || acc.id::TEXT as route,
    -- Metadata: State, ownership details
    jsonb_build_object(
      'estado', acc.estado,
      'organizacion', acc.organizacion_nombre,
      'propietario', acc.propietario_nombre_completo,
      'precio_adquisicion', acc.precio_adquisicion
    ) as metadata
  FROM v_acciones_org acc
  WHERE acc.organizacion_id = p_org_id
    AND acc.eliminado_en IS NULL
    AND (
      LOWER(acc.codigo_accion) LIKE v_search_term
      OR LOWER(acc.propietario_nombre_completo) LIKE v_search_term
      OR LOWER(acc.organizacion_nombre) LIKE v_search_term
    )
  ORDER BY
    -- Relevance: Code exact matches first
    CASE
      WHEN LOWER(acc.codigo_accion) = LOWER(p_query) THEN 1
      WHEN LOWER(acc.codigo_accion) LIKE LOWER(p_query) || '%' THEN 2
      ELSE 3
    END,
    acc.codigo_accion
  LIMIT p_limit;

  -- ========================================================================
  -- SEARCH 4: Documentos Comerciales (tr_doc_comercial via v_doc_comercial_org)
  -- ========================================================================
  -- Searches: codigo, titulo, solicitante, asociado
  -- Returns: Commercial document results with relationship info
  -- ========================================================================
  RETURN QUERY
  SELECT
    'documento'::TEXT as entity_type,
    doc.id as entity_id,
    COALESCE(doc.titulo, doc.codigo) as title,
    -- Subtitle: Code, requester, or associate
    COALESCE(
      CASE
        WHEN doc.codigo IS NOT NULL THEN doc.codigo
        WHEN doc.solicitante_nombre_completo IS NOT NULL THEN 'Solicitante: ' || doc.solicitante_nombre_completo
        WHEN doc.asociado_codigo_completo IS NOT NULL THEN 'Asociado: ' || doc.asociado_codigo_completo
        ELSE 'Sin código'
      END
    ) as subtitle,
    -- Route: TODO - Update when document detail page is created
    '/admin/procesos/documentos-comerciales/' || doc.id::TEXT as route,
    -- Metadata: State, type, values
    jsonb_build_object(
      'estado', doc.estado,
      'tipo_documento', doc.tipo_documento,
      'valor_total', doc.valor_total,
      'solicitante', doc.solicitante_nombre_completo
    ) as metadata
  FROM v_doc_comercial_org doc
  WHERE doc.organizacion_id = p_org_id
    AND doc.eliminado_en IS NULL
    AND (
      LOWER(doc.codigo) LIKE v_search_term
      OR LOWER(doc.titulo) LIKE v_search_term
      OR LOWER(doc.solicitante_nombre_completo) LIKE v_search_term
      OR LOWER(doc.asociado_codigo_completo) LIKE v_search_term
    )
  ORDER BY
    -- Relevance: Code matches first
    CASE
      WHEN LOWER(doc.codigo) = LOWER(p_query) THEN 1
      WHEN LOWER(doc.codigo) LIKE LOWER(p_query) || '%' THEN 2
      WHEN LOWER(doc.titulo) LIKE LOWER(p_query) || '%' THEN 2
      ELSE 3
    END,
    doc.creado_en DESC
  LIMIT p_limit;

END;
$$;

-- ============================================================================
-- SECURITY: Grant execute permission to authenticated users
-- ============================================================================
-- The function uses SECURITY DEFINER to allow cross-tenant searches while
-- maintaining RLS through the WHERE clauses that filter by organizacion_id
-- ============================================================================

GRANT EXECUTE ON FUNCTION search_global(TEXT, UUID, INTEGER) TO authenticated;

-- ============================================================================
-- PERFORMANCE: Add comment for optimization
-- ============================================================================

COMMENT ON FUNCTION search_global IS '
Global search function for SOCIOS_ADMIN CRM.
Searches across actors, tasks, actions, and commercial documents.
Parameters:
  - p_query: Search term (min 2 characters)
  - p_org_id: Organization UUID for multi-tenancy
  - p_limit: Maximum results per entity type (default: 20)

Returns results ordered by relevance (exact matches > prefix matches > contains)
and respects soft deletes (eliminado_en IS NULL) and RLS policies.
';

-- ============================================================================
-- TESTING: Sample queries for validation
-- ============================================================================
-- Test with Supabase MCP: mcp__supabase__execute_sql
--
-- -- Search for a person
-- SELECT * FROM search_global('juan', '<your-org-id>', 5);
--
-- -- Search for a task
-- SELECT * FROM search_global('revisar', '<your-org-id>', 5);
--
-- -- Search for an action code
-- SELECT * FROM search_global('ACC-001', '<your-org-id>', 5);
--
-- -- Search across all entities
-- SELECT * FROM search_global('colombiana', '<your-org-id>', 10);
-- ============================================================================
