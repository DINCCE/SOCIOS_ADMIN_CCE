-- Migration: Rename Functions - vn_asociados
-- Date: 2026-01-08
-- Description: Rename functions to follow naming convention: {table_name}_{action}
--              Also fix search_path for SECURITY DEFINER functions

-- ============================================================================
-- RENAME FUNCTIONS
-- ============================================================================

-- Function 1: finalizar_asignacion_accion → vn_asociados_finalizar
CREATE OR REPLACE FUNCTION vn_asociados_finalizar(
  p_asignacion_id uuid,
  p_fecha_fin date DEFAULT NULL::date,
  p_notas text DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_fecha_inicio DATE;
  v_fecha_fin DATE := COALESCE(p_fecha_fin, CURRENT_DATE);
  v_actualizado_por UUID := auth.uid();
BEGIN
  SELECT fecha_inicio INTO v_fecha_inicio
  FROM vn_asociados
  WHERE id = p_asignacion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment with ID % does not exist or has been deleted', p_asignacion_id;
  END IF;

  IF v_fecha_fin < v_fecha_inicio THEN
    RAISE EXCEPTION 'fecha_fin (%) cannot be before fecha_inicio (%)', v_fecha_fin, v_fecha_inicio;
  END IF;

  UPDATE vn_asociados
  SET fecha_fin = v_fecha_fin,
      notas = CASE
        WHEN p_notas IS NOT NULL THEN
          COALESCE(notas || E'\n\n', '') || 'Finalization: ' || p_notas
        ELSE notas
      END,
      actualizado_por = v_actualizado_por
  WHERE id = p_asignacion_id;

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

CREATE OR REPLACE FUNCTION finalizar_asignacion_accion(
  p_asignacion_id uuid,
  p_fecha_fin date DEFAULT NULL::date,
  p_notas text DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN vn_asociados_finalizar(p_asignacion_id, p_fecha_fin, p_notas);
END;
$$;

-- Function 2: generar_codigo_completo_asignacion → vn_asociados_generar_codigo_completo
CREATE OR REPLACE FUNCTION vn_asociados_generar_codigo_completo()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_codigo_accion TEXT;
BEGIN
  SELECT codigo_accion INTO v_codigo_accion
  FROM dm_acciones
  WHERE id = NEW.accion_id;

  IF v_codigo_accion IS NULL THEN
    RAISE EXCEPTION 'No se encontro la accion con ID %', NEW.accion_id;
  END IF;

  NEW.codigo_completo := v_codigo_accion || NEW.subcodigo;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generar_codigo_completo_asignacion()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN vn_asociados_generar_codigo_completo();
END;
$$;

-- Function 3: generar_siguiente_subcodigo → vn_asociados_generar_siguiente_subcodigo
CREATE OR REPLACE FUNCTION vn_asociados_generar_siguiente_subcodigo(
  p_accion_id uuid,
  p_tipo_asignacion text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_max_subcodigo INTEGER;
  v_siguiente_subcodigo TEXT;
BEGIN
  IF p_tipo_asignacion = 'dueño' THEN
    RETURN '00';
  END IF;

  IF p_tipo_asignacion = 'titular' THEN
    RETURN '01';
  END IF;

  IF p_tipo_asignacion = 'beneficiario' THEN
    SELECT MAX(subcodigo::INTEGER) INTO v_max_subcodigo
    FROM vn_asociados
    WHERE accion_id = p_accion_id
      AND tipo_asignacion = 'beneficiario'
      AND eliminado_en IS NULL;

    IF v_max_subcodigo IS NULL THEN
      RETURN '02';
    END IF;

    v_siguiente_subcodigo := LPAD((v_max_subcodigo + 1)::TEXT, 2, '0');
    RETURN v_siguiente_subcodigo;
  END IF;

  RAISE EXCEPTION 'Invalid assignment type: %. Allowed values: dueño, titular, beneficiario', p_tipo_asignacion;
END;
$$;

CREATE OR REPLACE FUNCTION generar_siguiente_subcodigo(
  p_accion_id uuid,
  p_tipo_asignacion text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN vn_asociados_generar_siguiente_subcodigo(p_accion_id, p_tipo_asignacion);
END;
$$;

-- Function 4: transferir_accion → vn_asociados_transferir
CREATE OR REPLACE FUNCTION vn_asociados_transferir(
  p_accion_id uuid,
  p_nuevo_dueno_id uuid,
  p_precio_transaccion numeric DEFAULT NULL::numeric,
  p_fecha_transferencia date DEFAULT NULL::date,
  p_finalizar_titular boolean DEFAULT false,
  p_finalizar_beneficiarios boolean DEFAULT false,
  p_notas text DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
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
  SELECT organizacion_id INTO v_organizacion_id
  FROM dm_acciones
  WHERE id = p_accion_id
    AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action with ID % does not exist or has been deleted', p_accion_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM dm_actores
    WHERE id = p_nuevo_dueno_id
      AND organizacion_id = v_organizacion_id
      AND eliminado_en IS NULL
  ) THEN
    RAISE EXCEPTION 'New owner does not exist or does not belong to the action organization';
  END IF;

  UPDATE vn_asociados
  SET fecha_fin = v_fecha_transferencia,
      actualizado_por = v_actualizado_por
  WHERE accion_id = p_accion_id
    AND tipo_asignacion = 'dueño'
    AND fecha_fin IS NULL
    AND eliminado_en IS NULL;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_finalizados := v_finalizados + v_row_count;

  IF p_finalizar_titular THEN
    UPDATE vn_asociados
    SET fecha_fin = v_fecha_transferencia,
        actualizado_por = v_actualizado_por
    WHERE accion_id = p_accion_id
      AND tipo_asignacion = 'titular'
      AND fecha_fin IS NULL
      AND eliminado_en IS NULL;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_finalizados := v_finalizados + v_row_count;
  END IF;

  IF p_finalizar_beneficiarios THEN
    UPDATE vn_asociados
    SET fecha_fin = v_fecha_transferencia,
        actualizado_por = v_actualizado_por
    WHERE accion_id = p_accion_id
      AND tipo_asignacion = 'beneficiario'
      AND fecha_fin IS NULL
      AND eliminado_en IS NULL;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_finalizados := v_finalizados + v_row_count;
  END IF;

  INSERT INTO vn_asociados (
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

CREATE OR REPLACE FUNCTION transferir_accion(
  p_accion_id uuid,
  p_nuevo_dueno_id uuid,
  p_precio_transaccion numeric DEFAULT NULL::numeric,
  p_fecha_transferencia date DEFAULT NULL::date,
  p_finalizar_titular boolean DEFAULT false,
  p_finalizar_beneficiarios boolean DEFAULT false,
  p_notas text DEFAULT NULL::text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN vn_asociados_transferir(
    p_accion_id,
    p_nuevo_dueno_id,
    p_precio_transaccion,
    p_fecha_transferencia,
    p_finalizar_titular,
    p_finalizar_beneficiarios,
    p_notas
  );
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  proname as function_name,
  CASE
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc
JOIN pg_namespace n ON pg_proc.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN (
    'vn_asociados_finalizar',
    'vn_asociados_generar_codigo_completo',
    'vn_asociados_generar_siguiente_subcodigo',
    'vn_asociados_transferir',
    'finalizar_asignacion_accion',
    'generar_codigo_completo_asignacion',
    'generar_siguiente_subcodigo',
    'transferir_accion'
  )
ORDER BY proname;

-- Expected: 8 functions (4 new + 4 wrappers)
