-- ============================================================================
-- Migration: Enrich obtener_relaciones_bp() function
-- Description: Add status, document, dob, and contact info to response
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
  bp_relacionado_estado TEXT,         -- NEW
  bp_relacionado_tipo_doc TEXT,       -- NEW
  bp_relacionado_num_doc TEXT,        -- NEW
  bp_relacionado_fecha_nac DATE,      -- NEW
  bp_relacionado_email TEXT,          -- NEW
  bp_relacionado_celular TEXT,        -- NEW
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
    -- Construct nombre_completo
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
    
    -- NEW FIELDS ------------------------------------
    -- Estado
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN bp_dest.estado
      ELSE bp_orig.estado
    END AS bp_relacionado_estado,

    -- Tipo Doc
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN (SELECT p.tipo_documento FROM personas p WHERE p.id = bp_dest.id)
      ELSE (SELECT p.tipo_documento FROM personas p WHERE p.id = bp_orig.id)
    END AS bp_relacionado_tipo_doc,

    -- Num Doc
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN (SELECT p.numero_documento FROM personas p WHERE p.id = bp_dest.id)
      ELSE (SELECT p.numero_documento FROM personas p WHERE p.id = bp_orig.id)
    END AS bp_relacionado_num_doc,

    -- Fecha Nacimiento
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN (SELECT p.fecha_nacimiento FROM personas p WHERE p.id = bp_dest.id)
      ELSE (SELECT p.fecha_nacimiento FROM personas p WHERE p.id = bp_orig.id)
    END AS bp_relacionado_fecha_nac,

    -- Email (Principal)
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN 
        COALESCE((SELECT p.email_principal FROM personas p WHERE p.id = bp_dest.id), bp_dest.email_principal)
      ELSE 
        COALESCE((SELECT p.email_principal FROM personas p WHERE p.id = bp_orig.id), bp_orig.email_principal)
    END AS bp_relacionado_email,

    -- Celular (Principal)
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN (SELECT p.celular_principal FROM personas p WHERE p.id = bp_dest.id)
      ELSE (SELECT p.celular_principal FROM personas p WHERE p.id = bp_orig.id)
    END AS bp_relacionado_celular,
    --------------------------------------------------

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
  'Obtiene todas las relaciones de un Business Partner con detalles enriquecidos (estado, docs, contacto).';
