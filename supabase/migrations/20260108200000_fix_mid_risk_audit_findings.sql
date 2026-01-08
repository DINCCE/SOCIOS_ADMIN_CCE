-- =====================================================
-- Migration: Fix Mid Risk Database Audit Findings
-- Date: 2026-01-08
-- Description:
--   1. Fix function overload conflicts (soft_delete_oportunidades, gen_codigo_oportunidad)
--   2. Standardize search_path in can_view_org_membership_v2
--   3. Create missing ENUMs (tipo_organizacion_enum, estado_accion_enum)
--   4. Remove unused indexes (17 indexes total)
-- =====================================================

-- =====================================================
-- STEP 1: Fix soft_delete_oportunidades overload conflict
-- =====================================================

-- 1.1 Drop the trigger temporarily to avoid dependency issues
DROP TRIGGER IF EXISTS soft_delete_oportunidades ON tr_doc_comercial;

-- 1.2 Recreate the trigger function with proper SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.soft_delete_oportunidades()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.eliminado_en := now();
  NEW.eliminado_por := auth.uid();
  RETURN NEW;
END;
$function$;

-- 1.3 Drop the procedural variant to avoid overload
DROP FUNCTION IF EXISTS public.soft_delete_oportunidades(p_id uuid);

-- 1.4 Create renamed procedural variant
CREATE OR REPLACE FUNCTION public.soft_delete_oportunidad_by_id(p_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE tr_doc_comercial
    SET eliminado_en = NOW(),
        eliminado_por = auth.uid()
    WHERE id = p_id;
  END IF;
END;
$function$;

-- 1.5 Recreate the trigger
CREATE TRIGGER soft_delete_oportunidades
  BEFORE DELETE ON tr_doc_comercial
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_oportunidades();

-- =====================================================
-- STEP 2: Fix gen_codigo_oportunidad overload conflict
-- =====================================================

-- 2.1 Drop the trigger temporarily
DROP TRIGGER IF EXISTS trg_set_codigo_oportunidad ON tr_doc_comercial;

-- 2.2 Recreate the trigger function with proper SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.gen_codigo_oportunidad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  nextval_int bigint;
BEGIN
  IF NEW.codigo IS NULL THEN
    nextval_int := nextval('public.seq_oportunidad_codigo');
    NEW.codigo := 'OP-' || lpad(nextval_int::text, 10, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- 2.3 Drop the function variant to avoid overload
DROP FUNCTION IF EXISTS public.gen_codigo_oportunidad(p_organizacion_id uuid);

-- 2.4 Create renamed function variant
CREATE OR REPLACE FUNCTION public.generar_codigo_oportunidad(p_organizacion_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_seq_num bigint;
  v_codigo text;
BEGIN
  -- Get next sequence number for this organization
  SELECT COALESCE(MAX(substring(codigo from 'OPP[0-9]+'::text)::bigint), 0) + 1
  INTO v_seq_num
  FROM tr_doc_comercial
  WHERE organizacion_id = p_organizacion_id;

  -- Generate codigo: OPP + sequence number (zero-padded to 6 digits)
  v_codigo := 'OPP' || LPAD(v_seq_num::text, 6, '0');

  RETURN v_codigo;
END;
$function$;

-- 2.5 Recreate the trigger
CREATE TRIGGER trg_set_codigo_oportunidad
  BEFORE INSERT ON tr_doc_comercial
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL)
  EXECUTE FUNCTION public.gen_codigo_oportunidad();

-- =====================================================
-- STEP 3: Fix can_view_org_membership_v2 search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_view_org_membership_v2(p_org uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.config_organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = can_view_org_membership_v2.p_org
  );
END;
$function$;

-- =====================================================
-- STEP 4: Create tipo_organizacion_enum
-- =====================================================

-- 4.1 Create the ENUM type
CREATE TYPE tipo_organizacion_enum AS ENUM (
  'club',
  'asociacion',
  'federacion',
  'fundacion',
  'otro'
);

-- 4.2 Add comment
COMMENT ON TYPE tipo_organizacion_enum IS 'Enumeración de tipos de organizaciones';

-- 4.3 Drop the default before converting
ALTER TABLE config_organizaciones
  ALTER COLUMN tipo DROP DEFAULT;

-- 4.4 Convert the column (using USING clause for data conversion)
ALTER TABLE config_organizaciones
  ALTER COLUMN tipo TYPE tipo_organizacion_enum
  USING tipo::text::tipo_organizacion_enum;

-- 4.5 Update the default
ALTER TABLE config_organizaciones
  ALTER COLUMN tipo SET DEFAULT 'club'::tipo_organizacion_enum;

-- =====================================================
-- STEP 5: Create estado_accion_enum
-- =====================================================

-- 5.1 Create the ENUM type
CREATE TYPE estado_accion_enum AS ENUM (
  'disponible',
  'asignada',
  'arrendada',
  'bloqueada',
  'inactiva'
);

-- 5.2 Add comment
COMMENT ON TYPE estado_accion_enum IS 'Enumeración de estados para acciones/mensajes en el sistema';

-- 5.3 Convert the column
ALTER TABLE dm_acciones
  ALTER COLUMN estado TYPE estado_accion_enum
  USING estado::estado_accion_enum;

-- 5.4 Update the default
ALTER TABLE dm_acciones
  ALTER COLUMN estado SET DEFAULT 'disponible'::estado_accion_enum;

-- =====================================================
-- STEP 6: Remove unused indexes from dm_actores (9 indexes)
-- =====================================================

-- 6.1 Drop redundant duplicates
DROP INDEX IF EXISTS idx_bp_org;

DROP INDEX IF EXISTS idx_business_partners_organizacion_id;

-- 6.2 Drop unused composite and partial indexes
DROP INDEX IF EXISTS idx_dm_actores_activos;

DROP INDEX IF EXISTS idx_dm_actores_tipo_actor_activos;

DROP INDEX IF EXISTS idx_dm_actores_documento_activos;

DROP INDEX IF EXISTS idx_dm_actores_ciudad_id;

-- 6.3 Drop audit field indexes (rarely filtered)
DROP INDEX IF EXISTS idx_business_partners_creado_por;

DROP INDEX IF EXISTS idx_business_partners_actualizado_por;

DROP INDEX IF EXISTS idx_business_partners_eliminado_por;

-- =====================================================
-- STEP 7: Remove unused indexes from config_ciudades (8 indexes)
-- =====================================================

-- 7.1 Drop redundant specific-field GIN indexes
-- (covered by geographic_locations_trgm_idx)
DROP INDEX IF EXISTS idx_geo_locations_search_text_trgm;

DROP INDEX IF EXISTS idx_geo_locations_city_name_trgm;

DROP INDEX IF EXISTS idx_geo_locations_state_name_trgm;

DROP INDEX IF EXISTS idx_geo_locations_city_code_trgm;

DROP INDEX IF EXISTS idx_geo_locations_country_name_trgm;

-- 7.2 Drop unused FTS index
DROP INDEX IF EXISTS geographic_locations_fts_idx;

-- 7.3 Drop unused partial indexes
DROP INDEX IF EXISTS idx_config_ciudades_activas;

DROP INDEX IF EXISTS idx_config_ciudades_search;

-- NOTE: Keep geographic_locations_trgm_idx for general search capability
