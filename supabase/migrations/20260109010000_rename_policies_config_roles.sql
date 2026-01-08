-- Migration: Rename RLS Policies - config_roles
-- Date: 2026-01-08
-- Description: Rename 4 RLS policies to follow naming convention: {table_name}_{action}

-- ============================================================================
-- RENAME POLICIES
-- ============================================================================

-- Policy 1: roles_delete → config_roles_delete
DROP POLICY IF EXISTS roles_delete ON config_roles;
CREATE POLICY config_roles_delete ON config_roles
  FOR DELETE TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    ))
    AND (role <> 'owner'::TEXT)
  );

-- Policy 2: roles_insert → config_roles_insert
DROP POLICY IF EXISTS roles_insert ON config_roles;
CREATE POLICY config_roles_insert ON config_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

-- Policy 3: roles_read_org_filtered → config_roles_select_org_filtered
DROP POLICY IF EXISTS roles_read_org_filtered ON config_roles;
CREATE POLICY config_roles_select_org_filtered ON config_roles
  FOR SELECT TO authenticated
  USING (role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT, 'member'::TEXT, 'viewer'::TEXT]));

-- Policy 4: roles_update → config_roles_update
DROP POLICY IF EXISTS roles_update ON config_roles;
CREATE POLICY config_roles_update ON config_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies were renamed correctly
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'config_roles'
ORDER BY policyname;

-- Expected output:
-- tablename       | policyname                           | cmd
-- ---------------|--------------------------------------|-------
-- config_roles   | config_roles_delete                  | DELETE
-- config_roles   | config_roles_insert                  | INSERT
-- config_roles   | config_roles_select_org_filtered     | SELECT
-- config_roles   | config_roles_update                  | UPDATE

-- ============================================================================
-- ROLLBACK
-- ============================================================================

/*
-- To rollback, run:

DROP POLICY IF EXISTS config_roles_delete ON config_roles;
CREATE POLICY roles_delete ON config_roles
  FOR DELETE TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    ))
    AND (role <> 'owner'::TEXT)
  );

DROP POLICY IF EXISTS config_roles_insert ON config_roles;
CREATE POLICY roles_insert ON config_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

DROP POLICY IF EXISTS config_roles_select_org_filtered ON config_roles;
CREATE POLICY roles_read_org_filtered ON config_roles
  FOR SELECT TO authenticated
  USING (role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT, 'member'::TEXT, 'viewer'::TEXT]));

DROP POLICY IF EXISTS config_roles_update ON config_roles;
CREATE POLICY roles_update ON config_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );
*/
