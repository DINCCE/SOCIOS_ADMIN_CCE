-- ============================================================================
-- Migration: RPC Functions for bp_relaciones
-- Description: Transactional functions for creating, updating, finalizing,
--              and deleting relationships between business partners
-- Author: Sistema
-- Date: 2025-12-26
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: crear_relacion_bp()
-- ============================================================================
-- Purpose: Create a new relationship between two business partners with full validations
-- Returns: JSONB with success, relacion_id, message, warnings

CREATE OR REPLACE FUNCTION public.crear_relacion_bp(
  -- Required parameters
  p_organizacion_id UUID,
  p_bp_origen_id UUID,
  p_bp_destino_id UUID,
  p_tipo_relacion TEXT,
  p_rol_origen TEXT,
  p_rol_destino TEXT,
  -- Optional parameters
  p_es_bidireccional BOOLEAN DEFAULT FALSE,
  p_fecha_inicio DATE DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_relacion_id UUID;
  v_creado_por UUID := auth.uid();
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_tipo_actor_origen TEXT;
  v_tipo_actor_destino TEXT;
  v_tipo_relacion_valido BOOLEAN;
  v_existe_soft_deleted BOOLEAN;
BEGIN
  -- VALIDATION 1: Organization exists
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organizacion_id) THEN
    RAISE EXCEPTION 'La organización especificada no existe';
  END IF;

  -- VALIDATION 2: Both BPs exist and belong to organization
  IF NOT EXISTS (
    SELECT 1
    FROM business_partners
    WHERE id = p_bp_origen_id
      AND organizacion_id = p_organizacion_id
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El Business Partner de origen no existe, fue eliminado o no pertenece a la organización';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM business_partners
    WHERE id = p_bp_destino_id
      AND organizacion_id = p_organizacion_id
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'El Business Partner de destino no existe, fue eliminado o no pertenece a la organización';
  END IF;

  -- VALIDATION 3: No self-relationships
  IF p_bp_origen_id = p_bp_destino_id THEN
    RAISE EXCEPTION 'No se pueden crear relaciones de un Business Partner consigo mismo';
  END IF;

  -- VALIDATION 4: Valid tipo_relacion enum value
  SELECT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'tipo_relacion_bp'
      AND e.enumlabel = p_tipo_relacion
  ) INTO v_tipo_relacion_valido;

  IF NOT v_tipo_relacion_valido THEN
    RAISE EXCEPTION 'Tipo de relación inválido: %. Valores permitidos: familiar, laboral, referencia, membresia, comercial, otra', p_tipo_relacion;
  END IF;

  -- VALIDATION 5: Type compatibility (early check for better UX, trigger will also validate)
  SELECT tipo_actor INTO v_tipo_actor_origen
  FROM business_partners
  WHERE id = p_bp_origen_id;

  SELECT tipo_actor INTO v_tipo_actor_destino
  FROM business_partners
  WHERE id = p_bp_destino_id;

  -- Familiar relationships: Both must be personas
  IF p_tipo_relacion = 'familiar' THEN
    IF v_tipo_actor_origen != 'persona' OR v_tipo_actor_destino != 'persona' THEN
      RAISE EXCEPTION 'Las relaciones familiares solo pueden existir entre personas naturales';
    END IF;
  END IF;

  -- Labor relationships: Origin must be persona, destination must be empresa
  IF p_tipo_relacion = 'laboral' THEN
    IF v_tipo_actor_origen != 'persona' OR v_tipo_actor_destino != 'empresa' THEN
      RAISE EXCEPTION 'Las relaciones laborales requieren: origen = persona, destino = empresa';
    END IF;
  END IF;

  -- VALIDATION 6: Check for duplicate active relationship
  IF EXISTS (
    SELECT 1
    FROM bp_relaciones
    WHERE bp_origen_id = p_bp_origen_id
      AND bp_destino_id = p_bp_destino_id
      AND tipo_relacion = p_tipo_relacion::tipo_relacion_bp
      AND eliminado_en IS NULL
      AND es_actual = true
  ) THEN
    RAISE EXCEPTION 'Ya existe una relación activa del mismo tipo entre estos Business Partners';
  END IF;

  -- WARNING: Check if soft-deleted relationship exists
  SELECT EXISTS (
    SELECT 1
    FROM bp_relaciones
    WHERE bp_origen_id = p_bp_origen_id
      AND bp_destino_id = p_bp_destino_id
      AND tipo_relacion = p_tipo_relacion::tipo_relacion_bp
      AND eliminado_en IS NOT NULL
  ) INTO v_existe_soft_deleted;

  IF v_existe_soft_deleted THEN
    v_warnings := array_append(v_warnings, 'Se encontró una relación similar eliminada anteriormente en el sistema');
  END IF;

  -- INSERT RELATIONSHIP (trigger validar_relacion_compatible will run automatically)
  INSERT INTO bp_relaciones (
    organizacion_id,
    bp_origen_id,
    bp_destino_id,
    tipo_relacion,
    rol_origen,
    rol_destino,
    es_bidireccional,
    fecha_inicio,
    atributos,
    notas,
    creado_por
  )
  VALUES (
    p_organizacion_id,
    p_bp_origen_id,
    p_bp_destino_id,
    p_tipo_relacion::tipo_relacion_bp,
    p_rol_origen,
    p_rol_destino,
    p_es_bidireccional,
    COALESCE(p_fecha_inicio, CURRENT_DATE),
    p_atributos,
    p_notas,
    v_creado_por
  )
  RETURNING id INTO v_relacion_id;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'relacion_id', v_relacion_id,
    'message', 'Relación creada exitosamente',
    'warnings', v_warnings
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'relacion_id', NULL,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

COMMENT ON FUNCTION public.crear_relacion_bp IS
  'Crea una nueva relación entre dos Business Partners con validaciones completas. Retorna JSON con {success, relacion_id, message, warnings}';


-- ============================================================================
-- 2. FUNCTION: actualizar_relacion_bp()
-- ============================================================================
-- Purpose: Update a relationship's mutable fields (roles, attributes, bidirectionality, notes)
-- Returns: JSONB with success and message

CREATE OR REPLACE FUNCTION public.actualizar_relacion_bp(
  p_relacion_id UUID,
  p_rol_origen TEXT DEFAULT NULL,
  p_rol_destino TEXT DEFAULT NULL,
  p_es_bidireccional BOOLEAN DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL,
  p_atributos JSONB DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fecha_inicio DATE;
  v_actualizado_por UUID := auth.uid();
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- VALIDATION 1: Relationship exists and not soft-deleted
  SELECT fecha_inicio INTO v_fecha_inicio
  FROM bp_relaciones
  WHERE id = p_relacion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La relación con ID % no existe o fue eliminada', p_relacion_id;
  END IF;

  -- VALIDATION 2: If fecha_fin provided, must be >= fecha_inicio
  IF p_fecha_fin IS NOT NULL AND p_fecha_fin < v_fecha_inicio THEN
    RAISE EXCEPTION 'La fecha_fin (%) no puede ser anterior a fecha_inicio (%)', p_fecha_fin, v_fecha_inicio;
  END IF;

  -- UPDATE (only fields where parameter IS NOT NULL)
  UPDATE bp_relaciones
  SET
    rol_origen = COALESCE(p_rol_origen, rol_origen),
    rol_destino = COALESCE(p_rol_destino, rol_destino),
    es_bidireccional = COALESCE(p_es_bidireccional, es_bidireccional),
    fecha_fin = COALESCE(p_fecha_fin, fecha_fin),
    atributos = COALESCE(p_atributos, atributos),
    notas = COALESCE(p_notas, notas),
    actualizado_por = v_actualizado_por
  WHERE id = p_relacion_id;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Relación actualizada exitosamente',
    'warnings', v_warnings
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

COMMENT ON FUNCTION public.actualizar_relacion_bp IS
  'Actualiza campos mutables de una relación (roles, atributos, bidireccionalidad, notas). No permite cambiar organizacion_id, bp_origen_id, bp_destino_id o tipo_relacion.';


-- ============================================================================
-- 3. FUNCTION: finalizar_relacion_bp()
-- ============================================================================
-- Purpose: End a relationship by setting fecha_fin (temporal end, keeps visible)
-- Returns: JSONB with success and message

CREATE OR REPLACE FUNCTION public.finalizar_relacion_bp(
  p_relacion_id UUID,
  p_fecha_fin DATE DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fecha_inicio DATE;
  v_es_actual BOOLEAN;
  v_fecha_fin DATE := COALESCE(p_fecha_fin, CURRENT_DATE);
  v_actualizado_por UUID := auth.uid();
BEGIN
  -- VALIDATION 1: Relationship exists and not soft-deleted
  SELECT fecha_inicio, es_actual INTO v_fecha_inicio, v_es_actual
  FROM bp_relaciones
  WHERE id = p_relacion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La relación con ID % no existe o fue eliminada', p_relacion_id;
  END IF;

  -- VALIDATION 2: Relationship is currently active
  IF NOT v_es_actual THEN
    RAISE EXCEPTION 'La relación ya fue finalizada anteriormente';
  END IF;

  -- VALIDATION 3: fecha_fin >= fecha_inicio
  IF v_fecha_fin < v_fecha_inicio THEN
    RAISE EXCEPTION 'La fecha_fin (%) no puede ser anterior a fecha_inicio (%)', v_fecha_fin, v_fecha_inicio;
  END IF;

  -- UPDATE
  UPDATE bp_relaciones
  SET
    fecha_fin = v_fecha_fin,
    notas = CASE
      WHEN p_notas IS NOT NULL THEN
        COALESCE(notas || E'\n\n', '') || 'Finalización: ' || p_notas
      ELSE notas
    END,
    actualizado_por = v_actualizado_por
  WHERE id = p_relacion_id;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Relación finalizada exitosamente',
    'warnings', ARRAY[]::TEXT[]
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

COMMENT ON FUNCTION public.finalizar_relacion_bp IS
  'Finaliza una relación estableciendo fecha_fin. La relación permanece visible pero con es_actual = false. Para relaciones que terminaron naturalmente.';


-- ============================================================================
-- 4. FUNCTION: eliminar_relacion_bp()
-- ============================================================================
-- Purpose: Soft delete a relationship (sets eliminado_en, preserves audit trail)
-- Returns: JSONB with success and message

CREATE OR REPLACE FUNCTION public.eliminar_relacion_bp(
  p_relacion_id UUID,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eliminado_por UUID := auth.uid();
BEGIN
  -- VALIDATION 1: Relationship exists
  IF NOT EXISTS (SELECT 1 FROM bp_relaciones WHERE id = p_relacion_id) THEN
    RAISE EXCEPTION 'La relación con ID % no existe', p_relacion_id;
  END IF;

  -- VALIDATION 2: Not already soft-deleted
  IF EXISTS (SELECT 1 FROM bp_relaciones WHERE id = p_relacion_id AND eliminado_en IS NOT NULL) THEN
    RAISE EXCEPTION 'La relación ya fue eliminada anteriormente';
  END IF;

  -- SOFT DELETE
  UPDATE bp_relaciones
  SET
    eliminado_en = NOW(),
    eliminado_por = v_eliminado_por,
    notas = CASE
      WHEN p_notas IS NOT NULL THEN
        COALESCE(notas || E'\n\n', '') || 'Eliminación: ' || p_notas
      ELSE notas
    END
  WHERE id = p_relacion_id;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Relación eliminada exitosamente',
    'warnings', ARRAY[]::TEXT[]
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

COMMENT ON FUNCTION public.eliminar_relacion_bp IS
  'Elimina una relación (soft delete: establece eliminado_en). Preserva audit trail. Para relaciones creadas por error.';


-- ============================================================================
-- 5. FUNCTION: obtener_relaciones_bp()
-- ============================================================================
-- Purpose: Get all relationships for a specific business partner
-- Returns: TABLE with relationship details

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
    CASE
      WHEN r.bp_origen_id = p_bp_id THEN bp_dest.nombre_completo
      ELSE bp_orig.nombre_completo
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


-- ============================================================================
-- GRANTS
-- ============================================================================
-- Grant execute permissions to authenticated users

GRANT EXECUTE ON FUNCTION public.crear_relacion_bp TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_relacion_bp TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_relacion_bp TO authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_relacion_bp TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_relaciones_bp TO authenticated;


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Functions created: 5
--
-- RESULT:
-- - crear_relacion_bp() - Creates relationship with full validations
-- - actualizar_relacion_bp() - Updates mutable fields
-- - finalizar_relacion_bp() - Ends relationship (sets fecha_fin)
-- - eliminar_relacion_bp() - Soft deletes relationship
-- - obtener_relaciones_bp() - Query helper to get relationships for a BP
--
-- All main functions return JSONB with standardized success/error format
-- All use SECURITY DEFINER for controlled execution context
-- All include EXCEPTION blocks for error handling
-- All track audit trail (creado_por, actualizado_por, eliminado_por)
-- ============================================================================
