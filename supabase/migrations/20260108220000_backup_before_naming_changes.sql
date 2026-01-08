-- Migration: Backup Before Naming Changes
-- Date: 2026-01-08
-- Description: Complete backup of all RLS policies and functions before naming convention changes
-- This migration creates a backup table with all current policies and functions

-- ============================================================================
-- CREATE BACKUP TABLE
-- ============================================================================

-- Create schema for audit/backup if it doesn't exist
CREATE SCHEMA IF NOT EXISTS audit;

-- Create backup table for policies
CREATE TABLE IF NOT EXISTS audit.rls_policies_backup (
  id BIGSERIAL PRIMARY KEY,
  backup_timestamp TIMESTAMPTZ DEFAULT NOW(),
  schemaname TEXT,
  tablename TEXT,
  policyname TEXT,
  cmd TEXT,
  qual TEXT,
  with_check TEXT,
  roles TEXT[]
);

-- Create backup table for functions
CREATE TABLE IF NOT EXISTS audit.functions_backup (
  id BIGSERIAL PRIMARY KEY,
  backup_timestamp TIMESTAMPTZ DEFAULT NOW(),
  schemaname TEXT,
  function_name TEXT,
  arguments TEXT,
  return_type TEXT,
  function_definition TEXT,
  security_type TEXT,
  language TEXT,
  search_path TEXT[]
);

-- ============================================================================
-- BACKUP ALL RLS POLICIES
-- ============================================================================

-- Insert all current RLS policies into backup table
INSERT INTO audit.rls_policies (
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check,
  roles
)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd::TEXT,
  qual::TEXT,
  with_check::TEXT,
  roles::TEXT[]
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- BACKUP ALL FUNCTIONS
-- ============================================================================

-- Insert all current functions into backup table
INSERT INTO audit.functions_backup (
  schemaname,
  function_name,
  arguments,
  return_type,
  function_definition,
  security_type,
  language,
  search_path
)
SELECT
  n.nspname AS schemaname,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_functiondef(p.oid) AS function_definition,
  CASE
    WHEN p.prosecdef THEN 'SECURITY DEFINER'::TEXT
    ELSE 'SECURITY INVOKER'::TEXT
  END AS security_type,
  l.lanname AS language,
  p.proconfig AS search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify backup was successful
SELECT
  'RLS Policies Backup' AS backup_type,
  COUNT(*) AS total_records
FROM audit.rls_policies
WHERE backup_timestamp = NOW();

SELECT
  'Functions Backup' AS backup_type,
  COUNT(*) AS total_records
FROM audit.functions_backup
WHERE backup_timestamp = NOW();

-- Show summary of what was backed up
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM audit.rls_policies
WHERE backup_timestamp = NOW()
GROUP BY tablename
ORDER BY tablename;

SELECT
  function_name,
  security_type,
  language
FROM audit.functions_backup
WHERE backup_timestamp = NOW()
ORDER BY function_name;

-- ============================================================================
-- CREATE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE audit.rls_policies_backup IS
  'Backup table containing all RLS policies before naming convention changes.
  Created: 2026-01-08
  Use for rollback if needed';

COMMENT ON TABLE audit.functions_backup IS
  'Backup table containing all functions before naming convention changes.
  Created: 2026-01-08
  Use for rollback if needed';

COMMENT ON SCHEMA audit IS
  'Schema for audit trails and backups before database changes';

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- Expected output:
-- RLS Policies Backup: 27 records
-- Functions Backup: 43 records

-- Tables with policies:
-- config_ciudades: 1
-- config_organizacion_miembros: 2
-- config_organizaciones: 5
-- config_roles: 4
-- config_roles_permisos: 4
-- dm_acciones: 4
-- dm_actores: 1
-- tr_doc_comercial: 1
-- tr_tareas: 1
-- vn_asociados: 4
-- vn_relaciones_actores: 4

-- Total: 27 policies + 43 functions = 70 objects backed up
