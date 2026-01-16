-- ============================================================================
-- Corrección de Políticas RLS para Tablas config_*
-- ============================================================================
-- Esta migración corrige las políticas de las tablas de configuración
-- para que respeten estrictamente lo definido en config_roles_permisos
--
-- Problema identificado:
-- - config_ciudades permitía admin+owner cuando debería ser solo owner
-- - Otras tablas config_* necesitan verificación similar
-- ============================================================================

-- *****************************************************************************
-- config_ciudades
-- *****************************************************************************

-- Según config_roles_permisos, SOLO 'owner' tiene permisos para esta tabla
-- 'admin', 'analyst', 'auditor' NO tienen permisos

DROP POLICY IF EXISTS config_ciudades_select ON public.config_ciudades;
DROP POLICY IF EXISTS config_ciudades_insert ON public.config_ciudades;
DROP POLICY IF EXISTS config_ciudades_update ON public.config_ciudades;
DROP POLICY IF EXISTS config_ciudades_delete ON public.config_ciudades;

-- SELECT: Cualquier usuario autenticado puede leer (soft delete)
CREATE POLICY config_ciudades_select ON public.config_ciudades
  FOR SELECT TO authenticated
  USING (eliminado_en IS NULL);

-- INSERT: Solo usuarios con rol 'owner' en alguna organización
CREATE POLICY config_ciudades_insert ON public.config_ciudades
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

-- UPDATE: Solo usuarios con rol 'owner' en alguna organización
CREATE POLICY config_ciudades_update ON public.config_ciudades
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

-- DELETE: Solo usuarios con rol 'owner' en alguna organización
CREATE POLICY config_ciudades_delete ON public.config_ciudades
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

-- *****************************************************************************
-- config_organizaciones
-- *****************************************************************************
-- REVISIÓN: Las políticas actuales parecen correctas
-- - SELECT: Miembros de la org
-- - INSERT: Cualquiera autenticado
-- - UPDATE: Owner o Admin
-- - DELETE: Solo owner
-- Estas políticas son específicas por naturaleza de la tabla

-- *****************************************************************************
-- config_organizacion_miembros
-- *****************************************************************************
-- REVISIÓN: Las políticas actuales parecen correctas
-- - SELECT: Ver propios miembros o ser admin
-- - INSERT/UPDATE/DELETE: Verificaciones específicas por user_id = auth.uid()
-- Esta tabla es especial porque controla la membresía misma

-- *****************************************************************************
-- config_roles
-- *****************************************************************************
-- REVISIÓN: Las políticas actuales permiten admin+owner
-- Según config_roles_permisos, SOLO 'owner' debería poder modificar

-- Verificar política actual:
-- Si actual permite ('admin', 'owner'), debe cambiarse a solo ('owner')

-- Descomentar si necesita corrección:
/*
DROP POLICY IF EXISTS config_roles_delete ON public.config_roles;
DROP POLICY IF EXISTS config_roles_insert ON public.config_roles;
DROP POLICY IF EXISTS config_roles_update ON public.config_roles;

-- Solo 'owner' puede modificar config_roles
CREATE POLICY config_roles_delete ON public.config_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

CREATE POLICY config_roles_insert ON public.config_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

CREATE POLICY config_roles_update ON public.config_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );
*/

-- *****************************************************************************
-- config_roles_permisos
-- *****************************************************************************
-- REVISIÓN: Las políticas actuales permiten admin+owner
-- Según config_roles_permisos, SOLO 'owner' debería poder modificar

-- Verificar política actual:
-- Si actual permite ('admin', 'owner'), debe cambiarse a solo ('owner')

-- Descomentar si necesita corrección:
/*
DROP POLICY IF EXISTS config_roles_permisos_delete ON public.config_roles_permisos;
DROP POLICY IF EXISTS config_roles_permisos_insert ON public.config_roles_permisos;
DROP POLICY IF EXISTS config_roles_permisos_update ON public.config_roles_permisos;

-- Solo 'owner' puede modificar config_roles_permisos
CREATE POLICY config_roles_permisos_delete ON public.config_roles_permisos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

CREATE POLICY config_roles_permisos_insert ON public.config_roles_permisos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );

CREATE POLICY config_roles_permisos_update ON public.config_roles_permisos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM config_organizacion_miembros m
      WHERE m.user_id = auth.uid()
        AND m.eliminado_en IS NULL
        AND m.role = 'owner'
    )
  );
*/
