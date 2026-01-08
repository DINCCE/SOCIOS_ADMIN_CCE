-- Migration: Rename RLS Policies - config_organizacion_miembros
-- Date: 2026-01-08
-- Description: Rename 2 RLS policies to follow naming convention: {table_name}_{action}

-- ============================================================================
-- RENAME POLICIES
-- ============================================================================

-- Policy 1: om_select_visible → config_organizacion_miembros_select_visible
DROP POLICY IF EXISTS om_select_visible ON config_organizacion_miembros;
CREATE POLICY config_organizacion_miembros_select_visible ON config_organizacion_miembros
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM config_organizacion_miembros om2
        WHERE om2.organization_id = config_organizacion_miembros.organization_id
          AND om2.user_id = auth.uid()
          AND om2.eliminado_en IS NULL
          AND om2.role IN ('owner', 'admin')
      )
    )
  );

-- Policy 2: om_update_own_preferences → config_organizacion_miembros_update_own_preferences
DROP POLICY IF EXISTS om_update_own_preferences ON config_organizacion_miembros;
CREATE POLICY config_organizacion_miembros_update_own_preferences ON config_organizacion_miembros
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies were renamed correctly
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'config_organizacion_miembros'
ORDER BY policyname;

-- Expected output:
-- tablename                       | policyname                                            | cmd
-- -------------------------------|-------------------------------------------------------|-------
-- config_organizacion_miembros   | config_organizacion_miembros_select_visible           | SELECT
-- config_organizacion_miembros   | config_organizacion_miembros_update_own_preferences   | UPDATE

-- ============================================================================
-- ROLLBACK
-- ============================================================================

/*
-- To rollback, run:

DROP POLICY IF EXISTS config_organizacion_miembros_select_visible ON config_organizacion_miembros;
CREATE POLICY om_select_visible ON config_organizacion_miembros
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM config_organizacion_miembros om2
        WHERE om2.organization_id = config_organizacion_miembros.organization_id
          AND om2.user_id = auth.uid()
          AND om2.eliminado_en IS NULL
          AND om2.role IN ('owner', 'admin')
      )
    )
  );

DROP POLICY IF EXISTS config_organizacion_miembros_update_own_preferences ON config_organizacion_miembros;
CREATE POLICY om_update_own_preferences ON config_organizacion_miembros
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
*/
