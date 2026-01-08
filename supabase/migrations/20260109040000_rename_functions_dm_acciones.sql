-- Migration: Rename Functions - dm_acciones
-- Date: 2026-01-08
-- Description: Rename functions to follow naming convention: {table_name}_{action}
--              Also fix search_path for SECURITY DEFINER functions

-- ============================================================================
-- RENAME FUNCTIONS
-- ============================================================================

-- Function 1: actualizar_accion → dm_acciones_actualizar
CREATE OR REPLACE FUNCTION dm_acciones_actualizar(
  p_accion_id uuid,
  p_estado text DEFAULT NULL::text
)
  RETURNS dm_acciones
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_accion dm_acciones%ROWTYPE;
BEGIN
  SELECT organizacion_id INTO v_accion.organizacion_id
  FROM dm_acciones WHERE id = p_accion_id;

  IF NOT can_user_v2('dm_acciones', 'update', v_accion.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  UPDATE dm_acciones
  SET estado = COALESCE(p_estado, estado)
  WHERE id = p_accion_id
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$;

-- Keep old function as wrapper for backward compatibility
CREATE OR REPLACE FUNCTION actualizar_accion(
  p_accion_id uuid,
  p_estado text DEFAULT NULL::text
)
  RETURNS dm_acciones
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN dm_acciones_actualizar(p_accion_id, p_estado);
END;
$$;

-- Function 2: crear_accion → dm_acciones_crear
CREATE OR REPLACE FUNCTION dm_acciones_crear(
  p_organizacion_id uuid,
  p_codigo_accion text,
  p_estado text DEFAULT NULL::text
)
  RETURNS dm_acciones
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_accion dm_acciones%ROWTYPE;
BEGIN
  IF NOT can_user_v2('dm_acciones', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO dm_acciones (organizacion_id, codigo_accion, estado)
  VALUES (p_organizacion_id, p_codigo_accion, p_estado)
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$;

-- Keep old function as wrapper for backward compatibility
CREATE OR REPLACE FUNCTION crear_accion(
  p_organizacion_id uuid,
  p_codigo_accion text,
  p_estado text DEFAULT NULL::text
)
  RETURNS dm_acciones
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN dm_acciones_crear(p_organizacion_id, p_codigo_accion, p_estado);
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
  END as security_type,
  proconfig as search_path
FROM pg_proc
JOIN pg_namespace n ON pg_proc.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('dm_acciones_actualizar', 'dm_acciones_crear', 'actualizar_accion', 'crear_accion')
ORDER BY proname;

-- Expected output:
-- function_name              | arguments                                                                    | security_type     | search_path
-- --------------------------|------------------------------------------------------------------------------|-------------------|---------------------------
-- actualizar_accion         | p_accion_id uuid, p_estado text DEFAULT NULL::text                          | SECURITY DEFINER  | {search_path=pg_catalog, public}
-- crear_accion              | p_organizacion_id uuid, p_codigo_accion text, p_estado text DEFAULT NULL::text | SECURITY DEFINER | {search_path=pg_catalog, public}
-- dm_acciones_actualizar    | p_accion_id uuid, p_estado text DEFAULT NULL::text                          | SECURITY DEFINER  | {search_path=pg_catalog, public}
-- dm_acciones_crear         | p_organizacion_id uuid, p_codigo_accion text, p_estado text DEFAULT NULL::text | SECURITY DEFINER | {search_path=pg_catalog, public}

-- ============================================================================
-- ROLLBACK
-- ============================================================================

/*
-- To rollback, run:

DROP FUNCTION IF EXISTS dm_acciones_actualizar(uuid, text);
DROP FUNCTION IF EXISTS dm_acciones_crear(uuid, text, text);

-- Restore original functions with old search_path
CREATE OR REPLACE FUNCTION actualizar_accion(p_accion_id uuid, p_estado text DEFAULT NULL::text)
  RETURNS dm_acciones
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_accion dm_acciones%ROWTYPE;
BEGIN
  SELECT organizacion_id INTO v_accion.organizacion_id
  FROM dm_acciones WHERE id = p_accion_id;

  IF NOT can_user_v2('dm_acciones', 'update', v_accion.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  UPDATE dm_acciones
  SET estado = COALESCE(p_estado, estado)
  WHERE id = p_accion_id
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$;

CREATE OR REPLACE FUNCTION crear_accion(p_organizacion_id uuid, p_codigo_accion text, p_estado text DEFAULT NULL::text)
  RETURNS dm_acciones
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_accion dm_acciones%ROWTYPE;
BEGIN
  IF NOT can_user_v2('dm_acciones', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO dm_acciones (organizacion_id, codigo_accion, estado)
  VALUES (p_organizacion_id, p_codigo_accion, p_estado)
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$;
*/
