-- Migration: Rename RLS Policies - config_organizaciones
-- Date: 2026-01-08
-- Description: Rename 5 RLS policies to follow naming convention: {table_name}_{action}

-- ============================================================================
-- RENAME POLICIES
-- ============================================================================

-- Policy 1: org_select → config_organizaciones_select
DROP POLICY IF EXISTS org_select ON config_organizaciones;
CREATE POLICY config_organizaciones_select ON config_organizaciones
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.organization_id = config_organizaciones.id
        AND m.user_id = auth.uid()
    )
  );

-- Policy 2: org_write → config_organizaciones_update
DROP POLICY IF EXISTS org_write ON config_organizaciones;
CREATE POLICY config_organizaciones_update ON config_organizaciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.organization_id = config_organizaciones.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.organization_id = config_organizaciones.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

-- Policy 3: orgs_delete → config_organizaciones_delete
DROP POLICY IF EXISTS orgs_delete ON config_organizaciones;
CREATE POLICY config_organizaciones_delete ON config_organizaciones
  FOR DELETE TO authenticated
  USING (is_org_owner_v2(id));

-- Policy 4: orgs_insert → config_organizaciones_insert
DROP POLICY IF EXISTS orgs_insert ON config_organizaciones;
CREATE POLICY config_organizaciones_insert ON config_organizaciones
  FOR INSERT WITH CHECK ((SELECT auth.role() AS role) = 'authenticated'::TEXT);

-- Policy 5: orgs_select → config_organizaciones_select_filtered
DROP POLICY IF EXISTS orgs_select ON config_organizaciones;
CREATE POLICY config_organizaciones_select_filtered ON config_organizaciones
  FOR SELECT TO authenticated
  USING (can_view_org_membership_v2(id));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies were renamed correctly
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'config_organizaciones'
ORDER BY policyname;

-- Expected output:
-- tablename                 | policyname                              | cmd
-- -------------------------|-----------------------------------------|-------
-- config_organizaciones    | config_organizaciones_delete            | DELETE
-- config_organizaciones    | config_organizaciones_insert            | INSERT
-- config_organizaciones    | config_organizaciones_select            | SELECT
-- config_organizaciones    | config_organizaciones_select_filtered   | SELECT
-- config_organizaciones    | config_organizaciones_update            | UPDATE

-- ============================================================================
-- ROLLBACK
-- ============================================================================

/*
-- To rollback, run:

DROP POLICY IF EXISTS config_organizaciones_select ON config_organizaciones;
CREATE POLICY org_select ON config_organizaciones
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL
    AND EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.organization_id = config_organizaciones.id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS config_organizaciones_update ON config_organizaciones;
CREATE POLICY org_write ON config_organizaciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.organization_id = config_organizaciones.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.organization_id = config_organizaciones.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS config_organizaciones_delete ON config_organizaciones;
CREATE POLICY orgs_delete ON config_organizaciones
  FOR DELETE TO authenticated
  USING (is_org_owner_v2(id));

DROP POLICY IF EXISTS config_organizaciones_insert ON config_organizaciones;
CREATE POLICY orgs_insert ON config_organizaciones
  FOR INSERT WITH CHECK ((SELECT auth.role() AS role) = 'authenticated'::TEXT);

DROP POLICY IF EXISTS config_organizaciones_select_filtered ON config_organizaciones;
CREATE POLICY orgs_select ON config_organizaciones
  FOR SELECT TO authenticated
  USING (can_view_org_membership_v2(id));
*/
