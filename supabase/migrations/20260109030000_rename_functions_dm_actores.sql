-- Migration: Rename Functions - dm_actores
-- Date: 2026-01-08
-- Description: Rename functions to follow naming convention: {table_name}_{action}

-- ============================================================================
-- RENAME FUNCTIONS
-- ============================================================================

-- Function 1: soft_delete_bp → dm_actores_soft_delete
-- Create new function with new name
CREATE OR REPLACE FUNCTION dm_actores_soft_delete(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE dm_actores
    SET eliminado_en = NOW(),
        eliminado_por = auth.uid()
    WHERE id = p_id;
  END IF;
END;
$$;

-- Keep old function as wrapper for backward compatibility
CREATE OR REPLACE FUNCTION soft_delete_bp(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM dm_actores_soft_delete(p_id);
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
  AND proname IN ('dm_actores_soft_delete', 'soft_delete_bp')
ORDER BY proname;

-- Expected output:
-- function_name              | arguments                      | security_type
-- --------------------------|--------------------------------|-------------------
-- dm_actores_soft_delete    | p_id uuid DEFAULT NULL::uuid   | SECURITY DEFINER
-- soft_delete_bp            | p_id uuid DEFAULT NULL::uuid   | SECURITY DEFINER (wrapper)

-- ============================================================================
-- ROLLBACK
-- ============================================================================

/*
-- To rollback, run:

DROP FUNCTION IF EXISTS dm_actores_soft_delete(uuid);

-- Restore original soft_delete_bp function
CREATE OR REPLACE FUNCTION soft_delete_bp(p_id uuid DEFAULT NULL::uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE dm_actores
    SET eliminado_en = NOW(),
        eliminado_por = auth.uid()
    WHERE id = p_id;
  END IF;
END;
$$;
*/
