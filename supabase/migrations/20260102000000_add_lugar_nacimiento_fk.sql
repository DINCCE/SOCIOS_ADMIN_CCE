-- Migration: Add geographic location FK to personas table
-- Purpose: Connect personas to existing geographic_locations table
-- Date: 2026-01-02

-- Add FK column if it doesn't exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'personas'
        AND column_name = 'lugar_nacimiento_id'
    ) THEN
        ALTER TABLE personas
            ADD COLUMN lugar_nacimiento_id UUID REFERENCES geographic_locations(id);

        CREATE INDEX idx_personas_lugar_nacimiento_id
            ON personas(lugar_nacimiento_id);

        COMMENT ON COLUMN personas.lugar_nacimiento_id IS 'FK to geographic_locations - Structured birth place reference (replaces lugar_nacimiento text field)';
    END IF;
END $$;

-- Create search function if it doesn't exist
CREATE OR REPLACE FUNCTION search_locations(search_term TEXT)
RETURNS TABLE (
    id UUID,
    country_code TEXT,
    country_name TEXT,
    state_code TEXT,
    state_name TEXT,
    city_name TEXT,
    timezone TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Early exit if search term is too short
    IF LENGTH(TRIM(search_term)) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        gl.id,
        gl.country_code,
        gl.country_name,
        gl.state_code,
        gl.state_name,
        gl.city_name,
        gl.timezone
    FROM geographic_locations gl
    WHERE
        gl.city_name ILIKE '%' || search_term || '%'
        OR gl.state_name ILIKE '%' || search_term || '%'
        OR gl.country_name ILIKE '%' || search_term || '%'
    ORDER BY
        -- Priority 1: Exact city name match
        CASE WHEN gl.city_name ILIKE search_term THEN 0 ELSE 1 END,
        -- Priority 2: Colombian cities first
        CASE WHEN gl.country_code = 'CO' THEN 0 ELSE 1 END,
        -- Priority 3: Alphabetical by country, then city
        gl.country_name ASC,
        gl.city_name ASC
    LIMIT 20;
END;
$$;

COMMENT ON FUNCTION search_locations(TEXT) IS 'Search function for location picker - returns max 20 results ordered by relevance';
