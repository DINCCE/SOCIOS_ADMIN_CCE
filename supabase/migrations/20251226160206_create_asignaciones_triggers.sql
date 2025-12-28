-- ============================================================================
-- Migration: Triggers para asignaciones_acciones
-- Description: Trigger functions for automatic validations and codigo_completo
--              generation in asignaciones_acciones table
-- Author: Sistema
-- Date: 2025-12-26
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: actualizar_timestamp()
-- ============================================================================
-- This function should already exist in the project (used in other tables)
-- If it doesn't exist, create it here for global use

CREATE OR REPLACE FUNCTION public.actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.actualizar_timestamp() IS
  'Reusable function to automatically update the actualizado_en field in any table with audit fields.';

-- ============================================================================
-- 2. FUNCTION: generar_codigo_completo_asignacion()
-- ============================================================================
-- Automatically generates codigo_completo by concatenating codigo_accion + subcodigo
-- Similar to the generar_codigo_bp() pattern in the project

CREATE OR REPLACE FUNCTION public.generar_codigo_completo_asignacion()
RETURNS TRIGGER AS $$
DECLARE
  v_codigo_accion TEXT;
BEGIN
  -- Get codigo_accion from acciones table
  SELECT codigo_accion INTO v_codigo_accion
  FROM public.acciones
  WHERE id = NEW.accion_id;

  -- If action not found, raise error
  IF v_codigo_accion IS NULL THEN
    RAISE EXCEPTION 'No se encontro la accion con ID %', NEW.accion_id;
  END IF;

  -- Generate complete code (6 digits: 4 from action + 2 from subcode)
  NEW.codigo_completo := v_codigo_accion || NEW.subcodigo;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generar_codigo_completo_asignacion() IS
  'Automatically generates codigo_completo by concatenating codigo_accion (from acciones table) with subcodigo. Executed on BEFORE INSERT/UPDATE.';

-- ============================================================================
-- 3. FUNCTION: validar_asignacion_accion()
-- ============================================================================
-- Validates critical business rules before INSERT/UPDATE

CREATE OR REPLACE FUNCTION public.validar_asignacion_accion()
RETURNS TRIGGER AS $$
DECLARE
  v_es_persona BOOLEAN;
  v_existe_vigente BOOLEAN;
BEGIN
  -- ========================================================================
  -- VALIDATION 1: Correspondence tipo_asignacion <-> subcodigo
  -- ========================================================================
  IF NEW.tipo_asignacion = 'dueño' AND NEW.subcodigo != '00' THEN
    RAISE EXCEPTION 'El dueño debe tener subcodigo 00, se proporciono: %', NEW.subcodigo;
  END IF;

  IF NEW.tipo_asignacion = 'titular' AND NEW.subcodigo != '01' THEN
    RAISE EXCEPTION 'El titular debe tener subcodigo 01, se proporciono: %', NEW.subcodigo;
  END IF;

  IF NEW.tipo_asignacion = 'beneficiario' AND NEW.subcodigo::INTEGER < 2 THEN
    RAISE EXCEPTION 'Los beneficiarios deben tener subcodigo >= 02, se proporciono: %', NEW.subcodigo;
  END IF;

  -- ========================================================================
  -- VALIDATION 2: Titulares and beneficiarios must be personas
  -- ========================================================================
  IF NEW.tipo_asignacion IN ('titular', 'beneficiario') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.personas WHERE id = NEW.business_partner_id
    ) INTO v_es_persona;

    IF NOT v_es_persona THEN
      RAISE EXCEPTION 'Los titulares y beneficiarios deben ser personas fisicas, no empresas';
    END IF;
  END IF;

  -- ========================================================================
  -- VALIDATION 3: Uniqueness of active dueño/titular
  -- ========================================================================
  -- Only ONE active dueño and ONE active titular allowed per action
  -- Beneficiarios can be multiple
  IF NEW.tipo_asignacion IN ('dueño', 'titular') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.asignaciones_acciones
      WHERE accion_id = NEW.accion_id
        AND tipo_asignacion = NEW.tipo_asignacion
        AND fecha_fin IS NULL
        AND eliminado_en IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) INTO v_existe_vigente;

    IF v_existe_vigente THEN
      RAISE EXCEPTION 'Ya existe un % vigente para esta accion', NEW.tipo_asignacion;
    END IF;
  END IF;

  -- ========================================================================
  -- VALIDATION 4: subtipo_beneficiario required for beneficiarios
  -- ========================================================================
  -- Already validated by CHECK constraint in table, but reinforced here
  IF NEW.tipo_asignacion = 'beneficiario' AND NEW.subtipo_beneficiario IS NULL THEN
    RAISE EXCEPTION 'El subtipo_beneficiario es obligatorio para beneficiarios';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validar_asignacion_accion() IS
  'Validates business rules: (1) tipo<->subcodigo correspondence, (2) Titulares/beneficiarios are personas, (3) Uniqueness of active dueño/titular.';

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Trigger 1: Update timestamp on every UPDATE
CREATE TRIGGER trigger_actualizar_timestamp_asignaciones
  BEFORE UPDATE
  ON public.asignaciones_acciones
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_timestamp();

-- Trigger 2: Generate codigo_completo automatically
CREATE TRIGGER trigger_generar_codigo_completo
  BEFORE INSERT OR UPDATE OF accion_id, subcodigo
  ON public.asignaciones_acciones
  FOR EACH ROW
  EXECUTE FUNCTION public.generar_codigo_completo_asignacion();

-- Trigger 3: Validate business rules
CREATE TRIGGER trigger_validar_asignacion
  BEFORE INSERT OR UPDATE
  ON public.asignaciones_acciones
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_asignacion_accion();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Functions created: 3
-- Triggers created: 3
--
-- RESULT:
-- - actualizar_timestamp() - Auto-updates actualizado_en
-- - generar_codigo_completo_asignacion() - Generates codigo_completo (6 digits)
-- - validar_asignacion_accion() - Validates 4 critical business rules
--
-- TESTING:
-- See plan at /Users/oscarjavier/.claude/plans/twinkly-crafting-tulip.md
-- Section: "TESTING POST-MIGRACION - Test 1 y Test 2"
-- ============================================================================
