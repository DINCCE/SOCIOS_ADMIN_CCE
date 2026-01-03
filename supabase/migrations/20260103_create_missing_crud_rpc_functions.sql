-- Migration: Create Missing CRUD RPC Functions
-- Description: This migration creates RPC functions for acciones, oportunidades, and tareas
-- Based on: IMPLEMENTATION_PLAN_MISSING_CRUD_FUNCTIONS.md
-- Created: 2026-01-03

-- ============================================================================
-- ACCIONES (Club Shares) RPC Functions
-- ============================================================================

-- Create RPC function for creating acciones
CREATE OR REPLACE FUNCTION crear_accion(
  p_organizacion_id UUID,
  p_codigo_accion TEXT,
  p_estado TEXT DEFAULT 'disponible'
) RETURNS acciones AS $$
DECLARE
  v_accion acciones%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('acciones', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new accion
  INSERT INTO acciones (organizacion_id, codigo_accion, estado)
  VALUES (p_organizacion_id, p_codigo_accion, p_estado)
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating acciones
CREATE OR REPLACE FUNCTION actualizar_accion(
  p_accion_id UUID,
  p_estado TEXT DEFAULT NULL
) RETURNS acciones AS $$
DECLARE
  v_accion acciones%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_accion.organizacion_id
  FROM acciones WHERE id = p_accion_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('acciones', 'update', v_accion.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update accion
  UPDATE acciones
  SET estado = COALESCE(p_estado, estado)
  WHERE id = p_accion_id
  RETURNING * INTO v_accion;

  RETURN v_accion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- OPORTUNIDADES (Opportunities) RPC Functions
-- ============================================================================

-- Create RPC function for creating oportunidades
CREATE OR REPLACE FUNCTION crear_oportunidad(
  p_organizacion_id UUID,
  p_codigo TEXT,
  p_tipo tipo_oportunidad_enum,
  p_solicitante_id UUID,
  p_responsable_id UUID DEFAULT NULL,
  p_monto_estimado NUMERIC DEFAULT NULL,
  p_notas TEXT DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb
) RETURNS oportunidades AS $$
DECLARE
  v_oportunidad oportunidades%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('oportunidades', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new oportunidad
  INSERT INTO oportunidades (
    organizacion_id,
    codigo,
    tipo,
    solicitante_id,
    responsable_id,
    monto_estimado,
    notas,
    atributos
  )
  VALUES (
    p_organizacion_id,
    p_codigo,
    p_tipo,
    p_solicitante_id,
    p_responsable_id,
    p_monto_estimado,
    p_notas,
    p_atributos
  )
  RETURNING * INTO v_oportunidad;

  RETURN v_oportunidad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating oportunidades
CREATE OR REPLACE FUNCTION actualizar_oportunidad(
  p_oportunidad_id UUID,
  p_estado estado_oportunidad_enum DEFAULT NULL,
  p_responsable_id UUID DEFAULT NULL,
  p_monto_estimado NUMERIC DEFAULT NULL,
  p_notas TEXT DEFAULT NULL,
  p_atributos JSONB DEFAULT NULL
) RETURNS oportunidades AS $$
DECLARE
  v_oportunidad oportunidades%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_oportunidad.organizacion_id
  FROM oportunidades WHERE id = p_oportunidad_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('oportunidades', 'update', v_oportunidad.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update oportunidad
  UPDATE oportunidades
  SET
    estado = COALESCE(p_estado, estado),
    responsable_id = COALESCE(p_responsable_id, responsable_id),
    monto_estimado = COALESCE(p_monto_estimado, monto_estimado),
    notas = COALESCE(p_notas, notas),
    atributos = COALESCE(p_atributos, atributos)
  WHERE id = p_oportunidad_id
  RETURNING * INTO v_oportunidad;

  RETURN v_oportunidad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TAREAS (Tasks) RPC Functions
-- ============================================================================

-- Create RPC function for creating tareas
CREATE OR REPLACE FUNCTION crear_tarea(
  p_organizacion_id UUID,
  p_titulo TEXT,
  p_descripcion TEXT DEFAULT NULL,
  p_prioridad prioridad_tarea_enum DEFAULT 'media',
  p_oportunidad_id UUID DEFAULT NULL,
  p_asignado_a UUID DEFAULT NULL,
  p_relacionado_con_bp UUID DEFAULT NULL,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_atributos JSONB DEFAULT '{}'::jsonb
) RETURNS tareas AS $$
DECLARE
  v_tarea tareas%ROWTYPE;
BEGIN
  -- Check permissions via RLS
  IF NOT can_user_v2('tareas', 'insert', p_organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Insert new tarea
  INSERT INTO tareas (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating tareas
CREATE OR REPLACE FUNCTION actualizar_tarea(
  p_tarea_id UUID,
  p_titulo TEXT DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL,
  p_prioridad prioridad_tarea_enum DEFAULT NULL,
  p_estado estado_tarea_enum DEFAULT NULL,
  p_oportunidad_id UUID DEFAULT NULL,
  p_asignado_a UUID DEFAULT NULL,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_atributos JSONB DEFAULT NULL
) RETURNS tareas AS $$
DECLARE
  v_tarea tareas%ROWTYPE;
BEGIN
  -- Get organization_id for permission check
  SELECT organizacion_id INTO v_tarea.organizacion_id
  FROM tareas WHERE id = p_tarea_id;

  -- Check permissions via RLS
  IF NOT can_user_v2('tareas', 'update', v_tarea.organizacion_id) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Update tarea
  UPDATE tareas
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant execute permissions to authenticated users
-- ============================================================================

GRANT EXECUTE ON FUNCTION crear_accion TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_accion TO authenticated;
GRANT EXECUTE ON FUNCTION crear_oportunidad TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_oportunidad TO authenticated;
GRANT EXECUTE ON FUNCTION crear_tarea TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_tarea TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION crear_accion IS 'Create a new club share/action with permission checking';
COMMENT ON FUNCTION actualizar_accion IS 'Update an existing club share/action with permission checking';
COMMENT ON FUNCTION crear_oportunidad IS 'Create a new opportunity with permission checking';
COMMENT ON FUNCTION actualizar_oportunidad IS 'Update an existing opportunity with permission checking';
COMMENT ON FUNCTION crear_tarea IS 'Create a new task with permission checking';
COMMENT ON FUNCTION actualizar_tarea IS 'Update an existing task with permission checking';
