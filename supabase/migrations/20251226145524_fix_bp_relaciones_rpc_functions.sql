-- ============================================================================
-- Migration: Fix bp_relaciones RPC Functions
-- Description: Remove references to non-existent audit columns (creado_por,
--              actualizado_por, eliminado_por) from bp_relaciones functions
-- Author: Sistema
-- Date: 2025-12-26
-- ============================================================================

-- ============================================================================
-- 1. FIX: crear_relacion_bp()
-- ============================================================================

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
    notas
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
    p_notas
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
-- 2. FIX: actualizar_relacion_bp()
-- ============================================================================

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
    notas = COALESCE(p_notas, notas)
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


-- ============================================================================
-- 3. FIX: finalizar_relacion_bp()
-- ============================================================================

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
    END
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


-- ============================================================================
-- 4. FIX: eliminar_relacion_bp()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.eliminar_relacion_bp(
  p_relacion_id UUID,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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


-- ============================================================================
-- END OF FIX MIGRATION
-- ============================================================================
-- Fixed columns removed from all functions:
-- - creado_por (doesn't exist in bp_relaciones)
-- - actualizado_por (doesn't exist in bp_relaciones)
-- - eliminado_por (doesn't exist in bp_relaciones)
-- ============================================================================
