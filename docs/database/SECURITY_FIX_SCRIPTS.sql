-- ============================================================================
-- SECURITY FIX SCRIPTS
-- Individual scripts for manual execution if needed
-- Date: 2026-01-08
-- ============================================================================

-- -----------------------------------------------------------------------------
-- ISSUE #1: Fix config_ciudades RLS Policy (CRITICAL)
-- -----------------------------------------------------------------------------

-- Step 1: Remove insecure policy
DROP POLICY IF EXISTS geo_locations_read ON config_ciudades;

-- Step 2: Create new secure policy
CREATE POLICY config_ciudades_select ON config_ciudades
  FOR SELECT
  TO public
  USING (eliminado_en IS NULL);

-- Verification:
-- SELECT * FROM pg_policies WHERE tablename = 'config_ciudades';

-- -----------------------------------------------------------------------------
-- ISSUE #2: Add search_path to SECURITY DEFINER Functions (HIGH)
-- -----------------------------------------------------------------------------

-- Function 1: calcular_valor_total_oportunidad()
ALTER FUNCTION calcular_valor_total_oportunidad()
  SET search_path = pg_catalog, public;

-- Function 2: set_updated_at()
ALTER FUNCTION set_updated_at()
  SET search_path = pg_catalog, public;

-- Function 3: _normalize_civil_status()
ALTER FUNCTION _normalize_civil_status(text)
  SET search_path = pg_catalog, public;

-- Function 4: actualizar_timestamp_config()
ALTER FUNCTION actualizar_timestamp_config()
  SET search_path = pg_catalog, public;

-- Verification:
-- SELECT
--   proname,
--   proconfig
-- FROM pg_proc
-- WHERE proname IN ('calcular_valor_total_oportunidad', 'set_updated_at', '_normalize_civil_status', 'actualizar_timestamp_config')
-- AND proconfig IS NOT NULL;
