-- Migration: Add Geographic Location Foreign Keys to Personas
-- Purpose: Replace text-based location fields with UUID references
-- Date: 2026-01-02

-- Add new UUID column for place of birth
ALTER TABLE personas
    ADD COLUMN IF NOT EXISTS lugar_nacimiento_id UUID REFERENCES geographic_locations(id);

-- Create index for FK lookup
CREATE INDEX IF NOT EXISTS idx_personas_lugar_nacimiento_id
    ON personas(lugar_nacimiento_id);

-- Comment documentation
COMMENT ON COLUMN personas.lugar_nacimiento_id IS 'FK to geographic_locations - Structured birth place reference (replaces lugar_nacimiento text field)';

-- Note: We keep the old lugar_nacimiento TEXT field for backward compatibility during migration
-- It can be dropped in a future migration after data migration is complete
-- For now, forms should write to BOTH fields (old text + new UUID) for safety
