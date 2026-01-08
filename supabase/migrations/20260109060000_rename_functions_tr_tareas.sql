-- Migration: Rename Functions - tr_tareas
-- Date: 2026-01-08
-- Description: Rename functions to follow naming convention: {table_name}_{action}
--              Also fix search_path and table name references (tareas → tr_tareas)

-- ============================================================================
-- RENAME FUNCTIONS
-- ============================================================================

-- Function 1: actualizar_tarea → tr_tareas_actualizar
CREATE OR REPLACE FUNCTION tr_tareas_actualizar(
  p_tarea_id uuid,
  p_titulo text DEFAULT NULL::text,
  p_descripcion text DEFAULT NULL::text,
  p_prioridad tr_tareas_prioridad DEFAULT NULL::tr_tareas_prioridad,
  p_estado tr_tareas_estado DEFAULT NULL::tr_tareas_estado,
  p_oportunidad_id uuid DEFAULT NULL::uuid,
  p_asignado_a uuid DEFAULT NULL::uuid,
  p_fecha_vencimiento date DEFAULT NULL::date,
  p_atributos jsonb DEFAULT NULL::jsonb
)
  RETURNS tr_tareas
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_tarea tr_tareas%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_tarea.organizacion_id
  FROM tr_tareas WHERE id = p_tarea_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('tr_tareas', 'update', v_tarea.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update tarea
  UPDATE tr_tareas
  SET
    titulo = COALESCE(p_titulo, titulo),
    descripcion = COALESCE(p_descripcion, descripcion),
    prioridad = COALESCE(p_prioridad, prioridad),
    estado = COALESCE(p_estado, estado),
    oportunidad_id = COALESCE(p_oportunidad_id, oportunidad_id),
    asignado_a = COALESCE(p_asignado_a, asignado_a),
    fecha_vencimiento = COALESCE(p_fecha_vencimiento, fecha_vencimiento),
    atributos = COALESCE(p_atributos, atributos)
  WHERE id = p_tarea_id
  RETURNING * INTO v_tarea;

  RETURN v_tarea;
END;
$$;

-- Keep old function as wrapper
CREATE OR REPLACE FUNCTION actualizar_tarea(
  p_tarea_id uuid,
  p_titulo text DEFAULT NULL::text,
  p_descripcion text DEFAULT NULL::text,
  p_prioridad tr_tareas_prioridad DEFAULT NULL::tr_tareas_prioridad,
  p_estado tr_tareas_estado DEFAULT NULL::tr_tareas_estado,
  p_oportunidad_id uuid DEFAULT NULL::uuid,
  p_asignado_a uuid DEFAULT NULL::uuid,
  p_fecha_vencimiento date DEFAULT NULL::date,
  p_atributos jsonb DEFAULT NULL::jsonb
)
  RETURNS tr_tareas
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN tr_tareas_actualizar(
    p_tarea_id,
    p_titulo,
    p_descripcion,
    p_prioridad,
    p_estado,
    p_oportunidad_id,
    p_asignado_a,
    p_fecha_vencimiento,
    p_atributos
  );
END;
$$;

-- Function 2: crear_tarea → tr_tareas_crear
CREATE OR REPLACE FUNCTION tr_tareas_crear(
  p_organizacion_id uuid,
  p_titulo text,
  p_descripcion text DEFAULT NULL::text,
  p_prioridad tr_tareas_prioridad DEFAULT 'Media'::tr_tareas_prioridad,
  p_oportunidad_id uuid DEFAULT NULL::uuid,
  p_asignado_a uuid DEFAULT NULL::uuid,
  p_relacionado_con_bp uuid DEFAULT NULL::uuid,
  p_fecha_vencimiento date DEFAULT NULL::date,
  p_atributos jsonb DEFAULT '{}'::jsonb
)
  RETURNS tr_tareas
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_tarea tr_tareas%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('tr_tareas', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new tarea
  INSERT INTO tr_tareas (
    organizacion_id,
    titulo,
    descripcion,
    prioridad,
    oportunidad_id,
    asignado_a,
    relacionado_con_bp,
    fecha_vencimiento,
    atributos
  )
  VALUES (
    p_organizacion_id,
    p_titulo,
    p_descripcion,
    p_prioridad,
    p_oportunidad_id,
    p_asignado_a,
    p_relacionado_con_bp,
    p_fecha_vencimiento,
    p_atributos
  )
  RETURNING * INTO v_tarea;

  RETURN v_tarea;
END;
$$;

-- Keep old function as wrapper
CREATE OR REPLACE FUNCTION crear_tarea(
  p_organizacion_id uuid,
  p_titulo text,
  p_descripcion text DEFAULT NULL::text,
  p_prioridad tr_tareas_prioridad DEFAULT 'Media'::tr_tareas_prioridad,
  p_oportunidad_id uuid DEFAULT NULL::uuid,
  p_asignado_a uuid DEFAULT NULL::uuid,
  p_relacionado_con_bp uuid DEFAULT NULL::uuid,
  p_fecha_vencimiento date DEFAULT NULL::date,
  p_atributos jsonb DEFAULT '{}'::jsonb
)
  RETURNS tr_tareas
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN tr_tareas_crear(
    p_organizacion_id,
    p_titulo,
    p_descripcion,
    p_prioridad,
    p_oportunidad_id,
    p_asignado_a,
    p_relacionado_con_bp,
    p_fecha_vencimiento,
    p_atributos
  );
END;
$$;

-- Function 3: generar_codigo_tarea → tr_tareas_generar_codigo
CREATE OR REPLACE FUNCTION tr_tareas_generar_codigo()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  next_num BIGINT;
  new_code TEXT;
BEGIN
  IF NEW.codigo_tarea IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    MAX(
      CASE
        WHEN codigo_tarea ~ '^TSK-[0-9]{8}$'
        THEN CAST(substring(codigo_tarea FROM 5 FOR 8) AS BIGINT)
        ELSE 0
      END
    ),
    0
  ) INTO next_num
  FROM tr_tareas
  WHERE codigo_tarea ~ '^TSK-[0-9]{8}$';

  next_num := next_num + 1;
  new_code := 'TSK-' || LPAD(next_num::TEXT, 8, '0');
  NEW.codigo_tarea := new_code;

  RETURN NEW;
END;
$$;

-- Function 4: soft_delete_tareas → tr_tareas_soft_delete (already exists, just fix reference)
CREATE OR REPLACE FUNCTION tr_tareas_soft_delete(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE tr_tareas
    SET eliminado_en = NOW(),
        eliminado_por = auth.uid()
    WHERE id = p_id;
  END IF;
END;
$$;

-- Keep old function as wrapper (for backward compatibility)
CREATE OR REPLACE FUNCTION soft_delete_tareas(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM tr_tareas_soft_delete(p_id);
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify functions exist
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  CASE
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc
JOIN pg_namespace n ON pg_proc.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN (
    'tr_tareas_actualizar',
    'tr_tareas_crear',
    'tr_tareas_generar_codigo',
    'tr_tareas_soft_delete',
    'actualizar_tarea',
    'crear_tarea',
    'generar_codigo_tarea',
    'soft_delete_tareas'
  )
ORDER BY proname;

-- Expected: 8 functions (4 new + 4 wrappers)
