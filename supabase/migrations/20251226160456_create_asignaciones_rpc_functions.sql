-- ============================================================================
-- Migration: RPC Functions for asignaciones_acciones
-- Description: Transactional functions for creating, transferring, and finalizing
--              assignments of acciones to business partners
-- Author: Sistema
-- Date: 2025-12-26
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: generar_siguiente_subcodigo()
-- ============================================================================
-- Purpose: Calculate next available subcode based on assignment type
-- Parameters: p_accion_id (UUID), p_tipo_asignacion (TEXT)
-- Returns: TEXT (2-digit subcode)

CREATE OR REPLACE FUNCTION public.generar_siguiente_subcodigo(
  p_accion_id UUID,
  p_tipo_asignacion TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_max_subcodigo INTEGER;
  v_siguiente_subcodigo TEXT;
BEGIN
  -- Case 1: Dueno (always 00)
  IF p_tipo_asignacion = 'dueño' THEN
    RETURN '00';
  END IF;

  -- Case 2: Titular (always 01)
  IF p_tipo_asignacion = 'titular' THEN
    RETURN '01';
  END IF;

  -- Case 3: Beneficiario (consecutive from 02)
  IF p_tipo_asignacion = 'beneficiario' THEN
    SELECT MAX(subcodigo::INTEGER) INTO v_max_subcodigo
    FROM public.asignaciones_acciones
    WHERE accion_id = p_accion_id
      AND tipo_asignacion = 'beneficiario'
      AND eliminado_en IS NULL;

    -- If no beneficiarios exist, start at 02
    IF v_max_subcodigo IS NULL THEN
      RETURN '02';
    END IF;

    -- Increment the maximum found
    v_siguiente_subcodigo := LPAD((v_max_subcodigo + 1)::TEXT, 2, '0');

    RETURN v_siguiente_subcodigo;
  END IF;

  -- Invalid type
  RAISE EXCEPTION 'Invalid assignment type: %. Allowed values: dueño, titular, beneficiario', p_tipo_asignacion;
END;
$$;

COMMENT ON FUNCTION public.generar_siguiente_subcodigo(UUID, TEXT) IS
  'Returns the next available subcode: 00 (dueno), 01 (titular), or consecutive from 02 (beneficiarios).';


-- ============================================================================
-- 2. FUNCTION: crear_asignacion_accion()
-- ============================================================================
-- Purpose: Create assignment with full validations and transactional safety
-- Returns: JSONB with success, asignacion_id, codigo_completo, message, warnings

CREATE OR REPLACE FUNCTION public.crear_asignacion_accion(
  p_accion_id UUID,
  p_business_partner_id UUID,
  p_tipo_asignacion TEXT,
  p_subtipo_beneficiario TEXT DEFAULT NULL,
  p_fecha_inicio DATE DEFAULT NULL,
  p_precio_transaccion NUMERIC DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asignacion_id UUID;
  v_subcodigo TEXT;
  v_codigo_completo TEXT;
  v_organizacion_id UUID;
  v_creado_por UUID := auth.uid();
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_es_persona BOOLEAN;
BEGIN
  -- VALIDATION 1: Accion exists and not deleted
  SELECT organizacion_id INTO v_organizacion_id
  FROM acciones
  WHERE id = p_accion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action with ID % does not exist or has been deleted', p_accion_id;
  END IF;

  -- VALIDATION 2: Business Partner exists and belongs to same organization
  IF NOT EXISTS (
    SELECT 1
    FROM business_partners
    WHERE id = p_business_partner_id
      AND organizacion_id = v_organizacion_id
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'Business Partner does not exist, was deleted, or does not belong to the action organization';
  END IF;

  -- VALIDATION 3: Titulares and beneficiarios must be personas
  IF p_tipo_asignacion IN ('titular', 'beneficiario') THEN
    SELECT EXISTS (
      SELECT 1 FROM personas WHERE id = p_business_partner_id
    ) INTO v_es_persona;

    IF NOT v_es_persona THEN
      RAISE EXCEPTION 'Titulares and beneficiarios must be natural persons, not companies';
    END IF;
  END IF;

  -- VALIDATION 4: Subtipo beneficiario required for beneficiarios
  IF p_tipo_asignacion = 'beneficiario' AND p_subtipo_beneficiario IS NULL THEN
    RAISE EXCEPTION 'subtipo_beneficiario is required for beneficiario assignments';
  END IF;

  -- VALIDATION 5: Valid assignment type
  IF p_tipo_asignacion NOT IN ('dueño', 'titular', 'beneficiario') THEN
    RAISE EXCEPTION 'Invalid assignment type: %. Allowed values: dueño, titular, beneficiario', p_tipo_asignacion;
  END IF;

  -- GENERATE SUBCODE
  v_subcodigo := generar_siguiente_subcodigo(p_accion_id, p_tipo_asignacion);

  -- INSERT ASSIGNMENT (triggers will validate additional rules)
  INSERT INTO asignaciones_acciones (
    accion_id,
    business_partner_id,
    tipo_asignacion,
    subtipo_beneficiario,
    subcodigo,
    fecha_inicio,
    precio_transaccion,
    organizacion_id,
    notas,
    creado_por
  )
  VALUES (
    p_accion_id,
    p_business_partner_id,
    p_tipo_asignacion,
    p_subtipo_beneficiario,
    v_subcodigo,
    COALESCE(p_fecha_inicio, CURRENT_DATE),
    p_precio_transaccion,
    v_organizacion_id,
    p_notas,
    v_creado_por
  )
  RETURNING id, codigo_completo INTO v_asignacion_id, v_codigo_completo;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'asignacion_id', v_asignacion_id,
    'codigo_completo', v_codigo_completo,
    'message', 'Assignment created successfully',
    'warnings', v_warnings
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'asignacion_id', NULL,
      'codigo_completo', NULL,
      'warnings', ARRAY[]::TEXT[]
    );
END;
$$;

COMMENT ON FUNCTION public.crear_asignacion_accion IS
  'Creates an assignment of an accion to a business partner with full validations. Returns JSON with result (success, asignacion_id, codigo_completo).';


-- ============================================================================
-- 3. FUNCTION: transferir_accion()
-- ============================================================================
-- Purpose: Transfer ownership (dueno) of an accion, optionally finalizing titular and beneficiarios
-- Returns: JSONB with success, nueva_asignacion_id, codigo_completo, asignaciones_finalizadas, message

CREATE OR REPLACE FUNCTION public.transferir_accion(
  p_accion_id UUID,
  p_nuevo_dueno_id UUID,
  p_fecha_transferencia DATE DEFAULT NULL,
  p_precio_transaccion NUMERIC DEFAULT NULL,
  p_finalizar_titular BOOLEAN DEFAULT FALSE,
  p_finalizar_beneficiarios BOOLEAN DEFAULT FALSE,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nueva_asignacion_id UUID;
  v_codigo_completo TEXT;
  v_organizacion_id UUID;
  v_finalizados INTEGER := 0;
  v_row_count INTEGER;
  v_fecha_transferencia DATE := COALESCE(p_fecha_transferencia, CURRENT_DATE);
  v_actualizado_por UUID := auth.uid();
BEGIN
  -- VALIDATION 1: Accion exists
  SELECT organizacion_id INTO v_organizacion_id
  FROM acciones
  WHERE id = p_accion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action with ID % does not exist or has been deleted', p_accion_id;
  END IF;

  -- VALIDATION 2: New owner exists and belongs to organization
  IF NOT EXISTS (
    SELECT 1
    FROM business_partners
    WHERE id = p_nuevo_dueno_id
      AND organizacion_id = v_organizacion_id
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'New owner does not exist or does not belong to the action organization';
  END IF;

  -- STEP 1: Finalize previous owner
  UPDATE asignaciones_acciones
  SET fecha_fin = v_fecha_transferencia,
      actualizado_por = v_actualizado_por
  WHERE accion_id = p_accion_id
    AND tipo_asignacion = 'dueño'
    AND fecha_fin IS NULL
    AND eliminado_en IS NULL;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_finalizados := v_finalizados + v_row_count;

  -- STEP 2: Finalize titular if requested
  IF p_finalizar_titular THEN
    UPDATE asignaciones_acciones
    SET fecha_fin = v_fecha_transferencia,
        actualizado_por = v_actualizado_por
    WHERE accion_id = p_accion_id
      AND tipo_asignacion = 'titular'
      AND fecha_fin IS NULL
      AND eliminado_en IS NULL;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_finalizados := v_finalizados + v_row_count;
  END IF;

  -- STEP 3: Finalize beneficiarios if requested
  IF p_finalizar_beneficiarios THEN
    UPDATE asignaciones_acciones
    SET fecha_fin = v_fecha_transferencia,
        actualizado_por = v_actualizado_por
    WHERE accion_id = p_accion_id
      AND tipo_asignacion = 'beneficiario'
      AND fecha_fin IS NULL
      AND eliminado_en IS NULL;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_finalizados := v_finalizados + v_row_count;
  END IF;

  -- STEP 4: Create new owner
  INSERT INTO asignaciones_acciones (
    accion_id,
    business_partner_id,
    tipo_asignacion,
    subcodigo,
    fecha_inicio,
    precio_transaccion,
    organizacion_id,
    notas,
    creado_por
  )
  VALUES (
    p_accion_id,
    p_nuevo_dueno_id,
    'dueño',
    '00',
    v_fecha_transferencia,
    p_precio_transaccion,
    v_organizacion_id,
    p_notas,
    v_actualizado_por
  )
  RETURNING id, codigo_completo INTO v_nueva_asignacion_id, v_codigo_completo;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'nueva_asignacion_id', v_nueva_asignacion_id,
    'codigo_completo', v_codigo_completo,
    'asignaciones_finalizadas', v_finalizados,
    'message', 'Transfer completed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'nueva_asignacion_id', NULL,
      'codigo_completo', NULL,
      'asignaciones_finalizadas', 0
    );
END;
$$;

COMMENT ON FUNCTION public.transferir_accion IS
  'Transfers ownership (dueno) of an accion. Optionally finalizes active titular and beneficiarios.';


-- ============================================================================
-- 4. FUNCTION: finalizar_asignacion_accion()
-- ============================================================================
-- Purpose: Finalize an assignment by setting fecha_fin
-- Returns: JSONB with success and message

CREATE OR REPLACE FUNCTION public.finalizar_asignacion_accion(
  p_asignacion_id UUID,
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
  v_fecha_fin DATE := COALESCE(p_fecha_fin, CURRENT_DATE);
  v_actualizado_por UUID := auth.uid();
BEGIN
  -- VALIDATION 1: Assignment exists and not deleted
  SELECT fecha_inicio INTO v_fecha_inicio
  FROM asignaciones_acciones
  WHERE id = p_asignacion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment with ID % does not exist or has been deleted', p_asignacion_id;
  END IF;

  -- VALIDATION 2: fecha_fin >= fecha_inicio
  IF v_fecha_fin < v_fecha_inicio THEN
    RAISE EXCEPTION 'fecha_fin (%) cannot be before fecha_inicio (%)', v_fecha_fin, v_fecha_inicio;
  END IF;

  -- UPDATE
  UPDATE asignaciones_acciones
  SET fecha_fin = v_fecha_fin,
      notas = CASE
        WHEN p_notas IS NOT NULL THEN
          COALESCE(notas || E'\n\n', '') || 'Finalization: ' || p_notas
        ELSE notas
      END,
      actualizado_por = v_actualizado_por
  WHERE id = p_asignacion_id;

  -- SUCCESS RETURN
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Assignment finalized successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.finalizar_asignacion_accion IS
  'Finalizes an assignment by setting fecha_fin. Validates that fecha_fin >= fecha_inicio.';


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Functions created: 4
--
-- RESULT:
-- - generar_siguiente_subcodigo() - Calculates next available subcode
-- - crear_asignacion_accion() - Creates assignment with full validations
-- - transferir_accion() - Transfers ownership (dueno) of accion
-- - finalizar_asignacion_accion() - Finalizes assignment by setting fecha_fin
--
-- All functions return JSONB with standardized success/error format
-- All use SECURITY DEFINER for controlled execution context
-- All include EXCEPTION blocks for error handling
-- ============================================================================
