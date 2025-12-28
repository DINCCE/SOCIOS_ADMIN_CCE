-- ============================================================================
-- Migration: Fix obtener_relaciones_bp() function
-- Description: Fix nombre_completo generation by constructing from personas/empresas
-- Author: Sistema
-- Date: 2025-12-26
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_relaciones_bp(
  p_bp_id UUID,
  p_solo_actuales BOOLEAN DEFAULT TRUE,
  p_tipo_relacion TEXT DEFAULT NULL
)
RETURNS TABLE (
  relacion_id UUID,
  bp_relacionado_id UUID,
  bp_relacionado_codigo TEXT,
  bp_relacionado_nombre TEXT,
  tipo_relacion TEXT,
  rol_este_bp TEXT,
  rol_bp_relacionado TEXT,
  es_bidireccional BOOLEAN,
  fecha_inicio DATE,
  fecha_fin DATE,
  es_actual BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS relacion_id,
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN r.bp_destino_id
      ELSE r.bp_origen_id
    END AS bp_relacionado_id,
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN bp_dest.codigo_bp
      ELSE bp_orig.codigo_bp
    END AS bp_relacionado_codigo,
    -- Construct nombre_completo from personas or empresas
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN
        COALESCE(
          (SELECT p.primer_nombre || ' ' || p.primer_apellido FROM personas p WHERE p.id = bp_dest.id),
          (SELECT e.razon_social FROM empresas e WHERE e.id = bp_dest.id),
          'Sin nombre'
        )
      ELSE
        COALESCE(
          (SELECT p.primer_nombre || ' ' || p.primer_apellido FROM personas p WHERE p.id = bp_orig.id),
          (SELECT e.razon_social FROM empresas e WHERE e.id = bp_orig.id),
          'Sin nombre'
        )
    END AS bp_relacionado_nombre,
    r.tipo_relacion::TEXT AS tipo_relacion,
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN r.rol_origen
      ELSE r.rol_destino
    END AS rol_este_bp,
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN r.rol_destino
      ELSE r.rol_origen
    END AS rol_bp_relacionado,
    r.es_bidireccional,
    r.fecha_inicio,
    r.fecha_fin,
    r.es_actual
  FROM bp_relaciones r
  INNER JOIN business_partners bp_orig ON r.bp_origen_id = bp_orig.id
  INNER JOIN business_partners bp_dest ON r.bp_destino_id = bp_dest.id
  WHERE (r.bp_origen_id = p_bp_id OR r.bp_destino_id = p_bp_id)
    AND (NOT p_solo_actuales OR (r.eliminado_en IS NULL AND r.es_actual = true))
    AND (p_tipo_relacion IS NULL OR r.tipo_relacion::TEXT = p_tipo_relacion)
  ORDER BY r.fecha_inicio DESC, r.creado_en DESC;
END;
$$;

COMMENT ON FUNCTION public.obtener_relaciones_bp IS
  'Obtiene todas las relaciones de un Business Partner. Puede filtrar solo actuales y por tipo de relación. Retorna TABLE con detalles de relaciones.';
