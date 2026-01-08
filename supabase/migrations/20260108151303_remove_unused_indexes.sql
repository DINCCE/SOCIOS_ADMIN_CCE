-- Migration: Remove unused indexes to reduce storage
-- Based on pg_stat_user_indexes analysis (idx_scan = 0)
-- Date: 2026-01-08
-- Expected savings: ~3.3 MB (77% reduction in index size)

-- =====================================================
-- 1. config_ciudades - Remove trigram search indexes (not implemented)
--    Savings: ~3 MB
-- =====================================================

-- Trigram indexes for unimplemented search functionality
DROP INDEX IF EXISTS geographic_locations_trgm_idx;           -- 872 KB
DROP INDEX IF EXISTS idx_geo_locations_search_text_trgm;      -- 808 KB
DROP INDEX IF EXISTS idx_geo_locations_city_name_trgm;         -- 384 KB
DROP INDEX IF EXISTS idx_geo_locations_country_name_trgm;      -- 264 KB
DROP INDEX IF EXISTS idx_geo_locations_state_name_trgm;        -- 264 KB
DROP INDEX IF EXISTS idx_geo_locations_city_code_trgm;         -- 224 KB

-- Full-text search index (unused)
DROP INDEX IF EXISTS geographic_locations_fts_idx;             -- 184 KB

-- Redundant composite index (covered by other indexes)
DROP INDEX IF EXISTS idx_config_ciudades_search;               -- 88 KB
DROP INDEX IF EXISTS idx_config_ciudades_activas;              -- 80 KB

-- =====================================================
-- 2. tr_doc_comercial - Remove redundant single-column indexes
--    Savings: ~146 KB
-- =====================================================

DROP INDEX IF EXISTS idx_oportunidades_valor_total;            -- Covered by composite
DROP INDEX IF EXISTS idx_oportunidades_asociado;               -- Covered by composite
DROP INDEX IF EXISTS idx_oportunidades_pagador;                -- Covered by composite
DROP INDEX IF EXISTS idx_oportunidades_activos;                -- Covered by composite
DROP INDEX IF EXISTS idx_oportunidades_responsable;            -- Covered by composite
DROP INDEX IF EXISTS idx_oportunidades_organizacion;           -- Covered by composite
DROP INDEX IF EXISTS idx_oportunidades_estado;                 -- Covered by composite

-- =====================================================
-- 3. dm_acciones - Remove all unused indexes (small table)
--    Savings: ~96 KB
-- =====================================================

DROP INDEX IF EXISTS idx_acciones_creado_por;                  -- 16 KB
DROP INDEX IF EXISTS idx_acciones_actualizado_por;             -- 16 KB
DROP INDEX IF EXISTS idx_acciones_eliminado_por;               -- 16 KB
DROP INDEX IF EXISTS idx_acciones_org;                         -- 16 KB
DROP INDEX IF EXISTS idx_dm_acciones_activas;                  -- 16 KB
DROP INDEX IF EXISTS idx_acciones_organizacion_id;             -- 16 KB

-- =====================================================
-- 4. config_organizaciones - Remove unused indexes (1 record)
--    Savings: ~128 KB
-- =====================================================

DROP INDEX IF EXISTS idx_config_organizaciones_activas;        -- 16 KB
DROP INDEX IF EXISTS idx_config_organizaciones_nombre_activas; -- 16 KB
DROP INDEX IF EXISTS idx_organizations_creado_por;             -- 16 KB
DROP INDEX IF EXISTS idx_organizations_actualizado_por;        -- 16 KB
DROP INDEX IF EXISTS idx_organizations_eliminado_por;          -- 16 KB
DROP INDEX IF EXISTS idx_orgs_eliminado;                       -- 16 KB

-- NOTE: organizations_slug_key is a unique constraint - kept for data integrity

-- =====================================================
-- 5. tr_tareas - KEEP ALL INDEXES (per user preference)
-- =====================================================
-- Table is empty but indexes pre-created for when data is added
-- No changes to tr_tareas indexes

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check storage savings after cleanup
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size('public.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size('public.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 10;

-- Verify no unused indexes remain (except PK, UK, FK, and kept indexes)
SELECT
    relname::text as table_name,
    indexrelname::text as index_name,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey'
    AND indexrelname NOT LIKE '%_key'
    AND indexrelname NOT LIKE '%_fkey'
ORDER BY table_name;
