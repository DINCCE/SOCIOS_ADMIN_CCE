-- Migration: Rename Functions - tr_doc_comercial
-- Date: 2026-01-08
-- Description: Rename functions to follow naming convention: {table_name}_{action}
--              Also fix search_path and table name references

-- ============================================================================
-- RENAME FUNCTIONS
-- ============================================================================

-- Function 1: actualizar_oportunidad → tr_doc_comercial_actualizar
CREATE OR REPLACE FUNCTION tr_doc_comercial_actualizar(
  p_oportunidad_id uuid,
  p_estado tr_doc_comercial_estados DEFAULT NULL::tr_doc_comercial_estados,
  p_responsable_id uuid DEFAULT NULL::uuid,
  p_monto_estimado numeric DEFAULT NULL::numeric,
  p_notas text DEFAULT NULL::text,
  p_atributos jsonb DEFAULT NULL::jsonb
)
  RETURNS tr_doc_comercial
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_doc_comercial tr_doc_comercial%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_doc_comercial.organizacion_id
  FROM tr_doc_comercial WHERE id = p_oportunidad_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('tr_doc_comercial', 'update', v_doc_comercial.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update tr_doc_comercial
  UPDATE tr_doc_comercial
  SET
    estado = COALESCE(p_estado, estado),
    responsable_id = COALESCE(p_responsable_id, responsable_id),
    monto_estimado = COALESCE(p_monto_estimado, monto_estimado),
    notas = COALESCE(p_notas, notas),
    atributos = COALESCE(p_atributos, atributos)
  WHERE id = p_oportunidad_id
  RETURNING * INTO v_doc_comercial;

  RETURN v_doc_comercial;
END;
$$;

-- Keep old function as wrapper
CREATE OR REPLACE FUNCTION actualizar_oportunidad(
  p_oportunidad_id uuid,
  p_estado tr_doc_comercial_estados DEFAULT NULL::tr_doc_comercial_estados,
  p_responsable_id uuid DEFAULT NULL::uuid,
  p_monto_estimado numeric DEFAULT NULL::numeric,
  p_notas text DEFAULT NULL::text,
  p_atributos jsonb DEFAULT NULL::jsonb
)
  RETURNS tr_doc_comercial
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN tr_doc_comercial_actualizar(
    p_oportunidad_id,
    p_estado,
    p_responsable_id,
    p_monto_estimado,
    p_notas,
    p_atributos
  );
END;
$$;

-- Function 2: crear_doc_comercial → tr_doc_comercial_crear
CREATE OR REPLACE FUNCTION tr_doc_comercial_crear(
  p_organizacion_id uuid,
  p_codigo text,
  p_tipo tr_doc_comercial_tipo,
  p_solicitante_id uuid,
  p_responsable_id uuid DEFAULT NULL::uuid,
  p_monto_estimado numeric DEFAULT NULL::numeric,
  p_notas text DEFAULT NULL::text,
  p_atributos jsonb DEFAULT '{}'::jsonb
)
  RETURNS tr_doc_comercial
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_doc_comercial tr_doc_comercial%ROWTYPE;
BEGIN
  INSERT INTO tr_doc_comercial (
    organizacion_id,
    codigo,
    tipo,
    solicitante_id,
    responsable_id,
    monto_estimado,
    notas,
    atributos
  ) VALUES (
    p_organizacion_id,
    p_codigo,
    p_tipo,
    p_solicitante_id,
    p_responsable_id,
    p_monto_estimado,
    p_notas,
    p_atributos
  ) RETURNING * INTO v_doc_comercial;

  RETURN v_doc_comercial;
END;
$$;

-- Keep old function as wrapper
CREATE OR REPLACE FUNCTION crear_doc_comercial(
  p_organizacion_id uuid,
  p_codigo text,
  p_tipo tr_doc_comercial_tipo,
  p_solicitante_id uuid,
  p_responsable_id uuid DEFAULT NULL::uuid,
  p_monto_estimado numeric DEFAULT NULL::numeric,
  p_notas text DEFAULT NULL::text,
  p_atributos jsonb DEFAULT '{}'::jsonb
)
  RETURNS tr_doc_comercial
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN tr_doc_comercial_crear(
    p_organizacion_id,
    p_codigo,
    p_tipo,
    p_solicitante_id,
    p_responsable_id,
    p_monto_estimado,
    p_notas,
    p_atributos
  );
END;
$$;

-- Function 3: gen_codigo_oportunidad → tr_doc_comercial_generar_codigo
CREATE OR REPLACE FUNCTION tr_doc_comercial_generar_codigo()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  nextval_int bigint;
BEGIN
  IF NEW.codigo IS NULL THEN
    nextval_int := nextval('public.seq_oportunidad_codigo');
    NEW.codigo := 'OP-' || lpad(nextval_int::text, 10, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Keep old function as wrapper (for trigger compatibility, just recreate it)
DROP FUNCTION IF EXISTS gen_codigo_oportunidade();

-- Function 4: calcular_valor_total_oportunidad → tr_doc_comercial_calcular_total
CREATE OR REPLACE FUNCTION tr_doc_comercial_calcular_total()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Calcular automáticamente el valor total basado en la fórmula:
  -- valor_total = valor_neto - valor_descuento + valor_impuestos

  NEW.valor_total := (
    COALESCE(NEW.valor_neto, 0) -
    COALESCE(NEW.valor_descuento, 0) +
    COALESCE(NEW.valor_impuestos, 0)
  );

  RETURN NEW;
END;
$$;

-- Function 5: soft_delete_oportunidad_by_id → tr_doc_comercial_soft_delete_by_id
CREATE OR REPLACE FUNCTION tr_doc_comercial_soft_delete_by_id(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE tr_doc_comercial
    SET eliminado_en = NOW(),
        eliminado_por = auth.uid()
    WHERE id = p_id;
  END IF;
END;
$$;

-- Keep old function as wrapper
CREATE OR REPLACE FUNCTION soft_delete_oportunidad_by_id(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM tr_doc_comercial_soft_delete_by_id(p_id);
END;
$$;

-- Function 6: soft_delete_oportunidades → tr_doc_comercial_soft_delete
CREATE OR REPLACE FUNCTION tr_doc_comercial_soft_delete()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.eliminado_en := now();
  NEW.eliminado_por := auth.uid();
  RETURN NEW;
END;
$$;

-- Keep old function as wrapper (for trigger compatibility)
CREATE OR REPLACE FUNCTION soft_delete_oportunidades()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN tr_doc_comercial_soft_delete();
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
    'tr_doc_comercial_actualizar',
    'tr_doc_comercial_crear',
    'tr_doc_comercial_generar_codigo',
    'tr_doc_comercial_calcular_total',
    'tr_doc_comercial_soft_delete_by_id',
    'tr_doc_comercial_soft_delete',
    'actualizar_oportunidad',
    'crear_doc_comercial',
    'soft_delete_oportunidad_by_id',
    'soft_delete_oportunidades'
  )
ORDER BY proname;

-- Expected: 10 functions (6 new + 4 wrappers)
