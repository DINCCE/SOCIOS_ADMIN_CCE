-- Migration: Fix Security Audit Findings
-- Date: 2026-01-08
-- Description: Fix critical and high priority security issues found in database audit
-- Issues:
--   1. Remove overly permissive RLS policy on config_ciudades
--   2. Add search_path to SECURITY DEFINER functions

-- ============================================================================
-- ISSUE #1: Fix RLS Policy on config_ciudades (CRITICAL)
-- ============================================================================

-- Problem: Policy with USING (true) allows any authenticated user to see all cities
-- Solution: Replace with policy that only filters out deleted records
-- Reasoning: config_ciudades is a global catalog shared by all organizations

-- Step 1: Remove the insecure policy
DROP POLICY IF EXISTS geo_locations_read ON config_ciudades;

-- Step 2: Create new policy with appropriate filtering
CREATE POLICY config_ciudades_select ON config_ciudades
  FOR SELECT
  TO public  -- Allow both authenticated and anonymous users
  USING (eliminado_en IS NULL);  -- Only exclude deleted records

COMMENT ON POLICY config_ciudades_select ON config_ciudades IS
  'Allow read access to global cities catalog, excluding deleted records';

-- ============================================================================
-- ISSUE #2: Add search_path to SECURITY DEFINER Functions (HIGH)
-- ============================================================================

-- Problem: Functions with SECURITY DEFINER lack explicit search_path
-- Risk: Potential privilege escalation if search_path is manipulated
-- Solution: Set search_path to pg_catalog, public for all SECURITY DEFINER functions

-- Function 1: calcular_valor_total_oportunidad()
-- Used by: trigger on tr_doc_comercial for financial calculations
ALTER FUNCTION calcular_valor_total_oportunidad()
  SET search_path = pg_catalog, public;

COMMENT ON FUNCTION calcular_valor_total_oportunidad() IS
  'Calculate total value for commercial documents (SECURITY DEFINER with fixed search_path)';

-- Function 2: set_updated_at()
-- Used by: triggers on multiple tables to update actualizado_en timestamp
ALTER FUNCTION set_updated_at()
  SET search_path = pg_catalog, public;

COMMENT ON FUNCTION set_updated_at() IS
  'Auto-update actualizado_en timestamp (SECURITY DEFINER with fixed search_path)';

-- Function 3: _normalize_civil_status()
-- Used by: Normalization logic for civil status values
ALTER FUNCTION _normalize_civil_status(text)
  SET search_path = pg_catalog, public;

COMMENT ON FUNCTION _normalize_civil_status(text) IS
  'Normalize civil status values (SECURITY DEFINER with fixed search_path)';

-- Function 4: actualizar_timestamp_config()
-- Used by: triggers on config_* tables
ALTER FUNCTION actualizar_timestamp_config()
  SET search_path = pg_catalog, public;

COMMENT ON FUNCTION actualizar_timestamp_config() IS
  'Auto-update actualizado_en for config tables (SECURITY DEFINER with fixed search_path)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify config_ciudades policy
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'config_ciudades';

-- Expected result:
-- policyname              | cmd  | qual                  | with_check
-- ------------------------|------|-----------------------|------------
-- config_ciudades_select | SELECT | eliminado_en IS NULL | NULL

-- Verify functions have search_path set
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  CASE
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  proconfig AS search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'calcular_valor_total_oportunidad',
    'set_updated_at',
    '_normalize_civil_status',
    'actualizar_timestamp_config'
  )
ORDER BY p.proname;

-- Expected result should show search_path = '{search_path=pg_catalog, public}'

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback Issue #1 (config_ciudades policy):
/*
DROP POLICY IF EXISTS config_ciudades_select ON config_ciudades;

CREATE POLICY geo_locations_read ON config_ciudades
  FOR SELECT TO authenticated
  USING (true);
*/

-- To rollback Issue #2 (function search_path):
/*
ALTER FUNCTION calcular_valor_total_oportunidad() RESET search_path;
ALTER FUNCTION set_updated_at() RESET search_path;
ALTER FUNCTION _normalize_civil_status(text) RESET search_path;
ALTER FUNCTION actualizar_timestamp_config() RESET search_path;
*/
