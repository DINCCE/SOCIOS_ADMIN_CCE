-- Migration: Create missing ENUM types for low-risk audit findings
-- Based on AUDIT.md Low Risk Finding #1
-- Date: 2026-01-08

-- =====================================================
-- 1. CREATE ENUM FOR dm_acciones.estado
-- =====================================================

-- Create estado_accion_enum
CREATE TYPE estado_accion_enum AS ENUM (
  'disponible',    -- Action available for assignment
  'asignada',      -- Action assigned to a member
  'arrendada',     -- Action rented out
  'bloqueada',     -- Action blocked (temporarily or permanently)
  'inactiva'       -- Action inactive/retired
);

-- Convert dm_acciones.estado to ENUM
ALTER TABLE dm_acciones
  ALTER COLUMN estado
    SET DATA TYPE estado_accion_enum
    USING estado::estado_accion_enum;

-- Update default value to use ENUM
ALTER TABLE dm_acciones
  ALTER COLUMN estado
    SET DEFAULT 'disponible'::estado_accion_enum;

-- =====================================================
-- 2. CREATE ENUM FOR config_organizaciones.tipo
-- =====================================================

-- Create tipo_organizacion_enum
CREATE TYPE tipo_organizacion_enum AS ENUM (
  'club',              -- Sports/Social club
  'sede',              -- Branch/location
  'division',          -- Division within organization
  'asociacion',        -- Association
  'fundacion',         -- Foundation
  'cooperativa',       -- Cooperative
  'empresa',           -- Corporation/company
  'otra'               -- Other type
);

-- Convert config_organizaciones.tipo to ENUM
ALTER TABLE config_organizaciones
  ALTER COLUMN tipo
    SET DATA TYPE tipo_organizacion_enum
    USING tipo::tipo_organizacion_enum;

-- Update default value to use ENUM
ALTER TABLE config_organizaciones
  ALTER COLUMN tipo
    SET DEFAULT 'club'::tipo_organizacion_enum;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify ENUMs created successfully
SELECT typname FROM pg_type WHERE typname IN ('estado_accion_enum', 'tipo_organizacion_enum');

-- Verify data conversion in dm_acciones
SELECT estado, COUNT(*) as count
FROM dm_acciones
WHERE eliminado_en IS NULL
GROUP BY estado
ORDER BY estado;

-- Verify data conversion in config_organizaciones
SELECT tipo, COUNT(*) as count
FROM config_organizaciones
WHERE eliminado_en IS NULL
GROUP BY tipo
ORDER BY tipo;
