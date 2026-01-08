-- Migration: Rename RLS Policies - config_roles_permisos
-- Date: 2026-01-08
-- Description: Rename 4 RLS policies to follow naming convention: {table_name}_{action}

-- ============================================================================
-- RENAME POLICIES
-- ============================================================================

-- Policy 1: role_permissions_delete → config_roles_permisos_delete
DROP POLICY IF EXISTS role_permissions_delete ON config_roles_permisos;
CREATE POLICY config_roles_permisos_delete ON config_roles_permisos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

-- Policy 2: role_permissions_insert → config_roles_permisos_insert
DROP POLICY IF EXISTS role_permissions_insert ON config_roles_permisos;
CREATE POLICY config_roles_permisos_insert ON config_roles_permisos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

-- Policy 3: role_permissions_read_org_filtered → config_roles_permisos_select_org_filtered
DROP POLICY IF EXISTS role_permissions_read_org_filtered ON config_roles_permisos;
CREATE POLICY config_roles_permisos_select_org_filtered ON config_roles_permisos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_roles r
      WHERE r.role = config_roles_permisos.role
        AND r.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT, 'member'::TEXT, 'viewer'::TEXT])
        AND r.eliminado_en IS NULL
    )
  );

-- Policy 4: role_permissions_update → config_roles_permisos_update
DROP POLICY IF EXISTS role_permissions_update ON config_roles_permisos;
CREATE POLICY config_roles_permisos_update ON config_roles_permisos
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
WHERE tablename = 'config_roles_permisos'
ORDER BY policyname;

-- Expected output:
-- tablename                | policyname                                    | cmd
-- ------------------------|-----------------------------------------------|-------
-- config_roles_permisos   | config_roles_permisos_delete                  | DELETE
-- config_roles_permisos   | config_roles_permisos_insert                  | INSERT
-- config_roles_permisos   | config_roles_permisos_select_org_filtered     | SELECT
-- config_roles_permisos   | config_roles_permisos_update                  | UPDATE

-- ============================================================================
-- ROLLBACK
-- ============================================================================

/*
-- To rollback, run:

DROP POLICY IF EXISTS config_roles_permisos_delete ON config_roles_permisos;
CREATE POLICY role_permissions_delete ON config_roles_permisos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

DROP POLICY IF EXISTS config_roles_permisos_insert ON config_roles_permisos;
CREATE POLICY role_permissions_insert ON config_roles_permisos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros om
      WHERE om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT])
    )
  );

DROP POLICY IF EXISTS config_roles_permisos_select_org_filtered ON config_roles_permisos;
CREATE POLICY role_permissions_read_org_filtered ON config_roles_permisos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_roles r
      WHERE r.role = config_roles_permisos.role
        AND r.role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT, 'member'::TEXT, 'viewer'::TEXT])
        AND r.eliminado_en IS NULL
    )
  );

DROP POLICY IF EXISTS config_roles_permisos_update ON config_roles_permisos;
CREATE POLICY role_permissions_update ON config_roles_permisos
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
