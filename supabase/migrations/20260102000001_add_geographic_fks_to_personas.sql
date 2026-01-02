-- Migration: Add geographic location FKs to personas
-- Purpose: Add UUID foreign keys for structured location references
-- Date: 2026-01-02

-- Add lugar_nacimiento_id column
ALTER TABLE personas
    ADD COLUMN IF NOT EXISTS lugar_nacimiento_id UUID REFERENCES geographic_locations(id);

-- Add lugar_expedicion_id column
ALTER TABLE personas
    ADD COLUMN IF NOT EXISTS lugar_expedicion_id UUID REFERENCES geographic_locations(id);

-- Create indexes for FK lookups
CREATE INDEX IF NOT EXISTS idx_personas_lugar_nacimiento_id
    ON personas(lugar_nacimiento_id);

CREATE INDEX IF NOT EXISTS idx_personas_lugar_expedicion_id
    ON personas(lugar_expedicion_id);

-- Add comments
COMMENT ON COLUMN personas.lugar_nacimiento_id IS 'FK to geographic_locations - Structured birth place reference';
COMMENT ON COLUMN personas.lugar_expedicion_id IS 'FK to geographic_locations - Structured expedition place reference';
