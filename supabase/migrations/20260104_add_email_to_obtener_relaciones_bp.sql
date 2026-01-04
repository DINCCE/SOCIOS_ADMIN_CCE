-- ============================================================================
-- Migration: Add email_principal to obtener_relaciones_bp()
-- Description: Add email field to RPC return for family cards
-- Author: Sistema
-- Date: 2026-01-04
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obtener_relaciones_bp(
  p_bp_id UUID,
  p_solo_actuales BOOLEAN DEFAULT TRUE,
  p_tipo_relacion TEXT DEFAULT NULL
)
RETURNS TABLE (
  -- Relationship core fields
  id UUID,
  bp_origen_id UUID,
  bp_destino_id UUID,
  tipo_relacion TEXT,
  rol_origen TEXT,
  rol_destino TEXT,
  es_bidireccional BOOLEAN,
  fecha_inicio DATE,
  fecha_fin DATE,
  es_actual BOOLEAN,
  atributos JSONB,
  notas TEXT,
  creado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ,
  -- Origen persona data
  origen_id UUID,
  origen_codigo_bp TEXT,
  origen_tipo_actor TEXT,
  origen_primer_nombre TEXT,
  origen_segundo_nombre TEXT,
  origen_primer_apellido TEXT,
  origen_segundo_apellido TEXT,
  origen_nombre_completo TEXT,
  origen_tipo_documento TEXT,
  origen_numero_documento TEXT,
  origen_identificacion TEXT,
  origen_fecha_nacimiento DATE,
  origen_foto_url TEXT,
  origen_whatsapp TEXT,
  origen_email_principal TEXT,
  -- Destino persona data
  destino_id UUID,
  destino_codigo_bp TEXT,
  destino_tipo_actor TEXT,
  destino_primer_nombre TEXT,
  destino_segundo_nombre TEXT,
  destino_primer_apellido TEXT,
  destino_segundo_apellido TEXT,
  destino_nombre_completo TEXT,
  destino_tipo_documento TEXT,
  destino_numero_documento TEXT,
  destino_identificacion TEXT,
  destino_fecha_nacimiento DATE,
  destino_foto_url TEXT,
  destino_whatsapp TEXT,
  destino_email_principal TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Relationship core fields
    r.id,
    r.bp_origen_id,
    r.bp_destino_id,
    r.tipo_relacion::TEXT,
    r.rol_origen,
    r.rol_destino,
    r.es_bidireccional,
    r.fecha_inicio,
    r.fecha_fin,
    r.es_actual,
    COALESCE(r.atributos, '{}'::jsonb) AS atributos,
    r.notas,
    r.creado_en,
    r.actualizado_en,
    -- Origen persona data
    bp_orig.id AS origen_id,
    bp_orig.codigo_bp AS origen_codigo_bp,
    bp_orig.tipo_actor AS origen_tipo_actor,
    per_orig.primer_nombre AS origen_primer_nombre,
    per_orig.segundo_nombre AS origen_segundo_nombre,
    per_orig.primer_apellido AS origen_primer_apellido,
    per_orig.segundo_apellido AS origen_segundo_apellido,
    -- Construct origen_nombre_completo
    CASE
      WHEN per_orig.id IS NOT NULL THEN
        concat_ws(' ',
          per_orig.primer_nombre,
          per_orig.segundo_nombre,
          per_orig.primer_apellido,
          per_orig.segundo_apellido
        )
      ELSE NULL
    END AS origen_nombre_completo,
    per_orig.tipo_documento AS origen_tipo_documento,
    per_orig.numero_documento AS origen_numero_documento,
    -- Construct origen_identificacion
    CASE
      WHEN per_orig.id IS NOT NULL THEN
        per_orig.tipo_documento || ' ' || per_orig.numero_documento
      ELSE NULL
    END AS origen_identificacion,
    per_orig.fecha_nacimiento AS origen_fecha_nacimiento,
    per_orig.foto_url AS origen_foto_url,
    per_orig.whatsapp AS origen_whatsapp,
    per_orig.email_principal AS origen_email_principal,
    -- Destino persona data
    bp_dest.id AS destino_id,
    bp_dest.codigo_bp AS destino_codigo_bp,
    bp_dest.tipo_actor AS destino_tipo_actor,
    per_dest.primer_nombre AS destino_primer_nombre,
    per_dest.segundo_nombre AS destino_segundo_nombre,
    per_dest.primer_apellido AS destino_primer_apellido,
    per_dest.segundo_apellido AS destino_segundo_apellido,
    -- Construct destino_nombre_completo
    CASE
      WHEN per_dest.id IS NOT NULL THEN
        concat_ws(' ',
          per_dest.primer_nombre,
          per_dest.segundo_nombre,
          per_dest.primer_apellido,
          per_dest.segundo_apellido
        )
      ELSE NULL
    END AS destino_nombre_completo,
    per_dest.tipo_documento AS destino_tipo_documento,
    per_dest.numero_documento AS destino_numero_documento,
    -- Construct destino_identificacion
    CASE
      WHEN per_dest.id IS NOT NULL THEN
        per_dest.tipo_documento || ' ' || per_dest.numero_documento
      ELSE NULL
    END AS destino_identificacion,
    per_dest.fecha_nacimiento AS destino_fecha_nacimiento,
    per_dest.foto_url AS destino_foto_url,
    per_dest.whatsapp AS destino_whatsapp,
    per_dest.email_principal AS destino_email_principal
  FROM bp_relaciones r
  INNER JOIN business_partners bp_orig ON r.bp_origen_id = bp_orig.id
  INNER JOIN business_partners bp_dest ON r.bp_destino_id = bp_dest.id
  LEFT JOIN personas per_orig ON bp_orig.id = per_orig.id AND bp_orig.tipo_actor = 'persona'
  LEFT JOIN personas per_dest ON bp_dest.id = per_dest.id AND bp_dest.tipo_actor = 'persona'
  WHERE (r.bp_origen_id = p_bp_id OR r.bp_destino_id = p_bp_id)
    AND r.eliminado_en IS NULL
    AND (NOT p_solo_actuales OR r.es_actual = true)
    AND (p_tipo_relacion IS NULL OR r.tipo_relacion::TEXT = p_tipo_relacion)
  ORDER BY r.fecha_inicio DESC, r.creado_en DESC;
END;
$$;

COMMENT ON FUNCTION public.obtener_relaciones_bp IS
  'Obtiene todas las relaciones de un Business Partner con datos completos de personas (origen y destino). Incluye atributos, nombres individuales, fotos, contactos y email. Útil para interfaces de usuario que necesitan mostrar información detallada de familiares.';
