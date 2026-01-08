-- ============================================================================
-- ROLLBACK SCRIPTS - Naming Convention Changes
-- Date: 2026-01-08
-- Description: Scripts to revert naming convention changes if needed
-- ============================================================================

-- These scripts allow you to rollback either individual changes or all changes
-- Use them in case of issues or unexpected behavior after deployment

-- ============================================================================
-- INDIVIDUAL ROLLBACK SCRIPTS
-- ============================================================================

-- Rollback dm_actores policies
/*
DROP POLICY IF EXISTS dm_actores_select ON dm_actores;
CREATE POLICY bp_select ON dm_actores
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.organization_id = dm_actores.organizacion_id
        AND om.user_id = auth.uid()
    )
  );
*/

-- Rollback tr_doc_comercial policies
/*
DROP POLICY IF EXISTS tr_doc_comercial_select ON tr_doc_comercial;
CREATE POLICY oportunidades_select ON tr_doc_comercial
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = tr_doc_comercial.organizacion_id
    )
  );
*/

-- Rollback tr_tareas policies
/*
DROP POLICY IF EXISTS tr_tareas_select ON tr_tareas;
CREATE POLICY tareas_select ON tr_tareas
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = tr_tareas.organizacion_id
    )
  );
*/

-- Rollback dm_actores functions
/*
DROP FUNCTION IF EXISTS dm_actores_soft_delete(uuid);
CREATE FUNCTION soft_delete_bp(p_id uuid DEFAULT NULL::uuid)
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

DROP FUNCTION IF EXISTS dm_actores_generar_codigo();
-- Restore original trigger function from backup
*/

-- ============================================================================
-- COMPLETE ROLLBACK (ALL CHANGES)
-- ============================================================================

-- This script restores ALL policies and functions from the backup table
-- Use ONLY if you need to rollback the entire migration

/*
-- Step 1: Drop all current policies that were renamed
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE '%\_%' -- Only drop policies with new naming convention
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I',
      policy_record.policyname,
      policy_record.tablename);
  END LOOP;
END $$;

-- Step 2: Restore all policies from backup
DO $$
DECLARE
  backup_record RECORD;
BEGIN
  FOR backup_record IN
    SELECT * FROM audit.rls_policies_backup
    WHERE backup_timestamp = (
      SELECT MAX(backup_timestamp) FROM audit.rls_policies_backup
    )
    ORDER BY tablename, policyname
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO %s USING (%s)',
      backup_record.policyname,
      backup_record.tablename,
      backup_record.cmd,
      CASE
        WHEN backup_record.roles = ARRAY['public']::TEXT[] THEN 'public'
        WHEN backup_record.roles = ARRAY['authenticated']::TEXT[] THEN 'authenticated'
        ELSE 'authenticated'
      END,
      backup_record.qual
    );
  END LOOP;
END $$;

-- Step 3: Drop all renamed functions
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND proname LIKE '%\_%' -- Only drop functions with new naming convention
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_record.proname);
  END LOOP;
END $$;

-- Step 4: Restore all functions from backup
DO $$
DECLARE
  backup_record RECORD;
BEGIN
  FOR backup_record IN
    SELECT * FROM audit.functions_backup
    WHERE backup_timestamp = (
      SELECT MAX(backup_timestamp) FROM audit.functions_backup
    )
    ORDER BY function_name
  LOOP
    -- Execute the original function definition
    EXECUTE backup_record.function_definition;
  END LOOP;
END $$;
*/

-- ============================================================================
-- VERIFICATION AFTER ROLLBACK
-- ============================================================================

-- Verify policies were restored
/*
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
*/

-- Verify functions were restored
/*
SELECT
  proname as function_name,
  CASE
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY proname;
*/

-- ============================================================================
-- SAFE ROLLBACK PROCEDURE
-- ============================================================================

-- This is a safer alternative that creates a restore function first
-- You can call this function to perform the rollback

/*
CREATE OR REPLACE FUNCTION audit.rollback_naming_changes()
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
DECLARE
  v_results JSONB := '{}'::JSONB;
  v_policies_restored INTEGER := 0;
  v_functions_restored INTEGER := 0;
BEGIN
  -- Log rollback start
  v_results := jsonb_set(v_results, '{status}', to_jsonb('started'));
  v_results := jsonb_set(v_results, '{timestamp}', to_jsonb(NOW()));

  -- Restore policies
  FOR backup_record IN
    SELECT * FROM audit.rls_policies_backup
    WHERE backup_timestamp = (
      SELECT MAX(backup_timestamp) FROM audit.rls_policies_backup
    )
  LOOP
    BEGIN
      -- Drop existing policy if exists
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I',
        backup_record.policyname,
        backup_record.tablename);

      -- Recreate policy from backup
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR %s TO %s USING (%s)',
        backup_record.policyname,
        backup_record.tablename,
        backup_record.cmd,
        CASE
          WHEN backup_record.roles = ARRAY['public']::TEXT[] THEN 'public'
          WHEN backup_record.roles = ARRAY['authenticated']::TEXT[] THEN 'authenticated'
          ELSE 'authenticated'
        END,
        backup_record.qual
      );

      v_policies_restored := v_policies_restored + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue
      v_results := jsonb_set(
        v_results,
        '{errors}',
        (v_results->'errors') || format('Policy %s on %s: %s',
          backup_record.policyname,
          backup_record.tablename,
          SQLERRM)::JSONB
      );
    END;
  END LOOP;

  -- Restore functions
  FOR backup_record IN
    SELECT * FROM audit.functions_backup
    WHERE backup_timestamp = (
      SELECT MAX(backup_timestamp) FROM audit.functions_backup
    )
  LOOP
    BEGIN
      -- Drop existing function if exists
      EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE',
        backup_record.function_name);

      -- Recreate function from backup
      EXECUTE backup_record.function_definition;

      v_functions_restored := v_functions_restored + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue
      v_results := jsonb_set(
        v_results,
        '{errors}',
        (v_results->'errors') || format('Function %s: %s',
          backup_record.function_name,
          SQLERRM)::JSONB
      );
    END;
  END LOOP;

  -- Set results
  v_results := jsonb_set(v_results, '{status}', to_jsonb('completed'));
  v_results := jsonb_set(v_results, '{policies_restored}', to_jsonb(v_policies_restored));
  v_results := jsonb_set(v_results, '{functions_restored}', to_jsonb(v_functions_restored));

  RETURN v_results;
END;
$$;

-- To execute rollback, call:
-- SELECT audit.rollback_naming_changes();
*/

-- ============================================================================
-- NOTES AND WARNINGS
-- ============================================================================

-- IMPORTANT: Before running rollback scripts:
-- 1. Make sure you have a recent database backup
-- 2. Test rollback in development/staging environment first
-- 3. Notify users of potential downtime
-- 4. Monitor application logs after rollback

-- Recommended rollback procedure:
-- 1. Stop application server
-- 2. Run rollback script
-- 3. Verify with SELECT queries above
-- 4. Restart application server
-- 5. Test critical functionality
-- 6. Monitor for errors

-- If rollback fails:
-- 1. Check audit.rls_policies_backup and audit.functions_backup tables exist
-- 2. Verify they have data (SELECT COUNT(*) FROM audit.rls_policies_backup)
-- 3. Contact database administrator
-- 4. Consider restoring from full database backup
