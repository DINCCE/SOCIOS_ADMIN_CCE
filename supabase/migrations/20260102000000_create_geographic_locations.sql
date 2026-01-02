-- Migration: Geographic Locations System
-- Purpose: Create location database for smart city/place pickers
-- Date: 2026-01-02

-- Enable pg_trgm extension for trigram-based search (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create geographic_locations table
CREATE TABLE IF NOT EXISTS geographic_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Location hierarchy
    country_code TEXT NOT NULL,           -- ISO 3166-1 alpha-2 (CO, US, MX, etc.)
    country_name TEXT NOT NULL,           -- Colombia, United States, México
    state_code TEXT,                      -- State/department code (optional)
    state_name TEXT,                      -- Antioquia, California, etc.
    city_name TEXT NOT NULL,              -- Medellín, Bogotá, etc.

    -- Search optimization
    search_text TEXT GENERATED ALWAYS AS (
        city_name || ' ' ||
        COALESCE(state_name, '') || ' ' ||
        country_name
    ) STORED,

    -- Metadata
    timezone TEXT,                        -- America/Bogota, America/New_York
    latitude NUMERIC(10, 7),             -- For future map features
    longitude NUMERIC(10, 7),            -- For future map features

    -- Audit
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_geographic_locations_country ON geographic_locations(country_code);
CREATE INDEX idx_geographic_locations_city ON geographic_locations(city_name);

-- Trigram index for fuzzy search (CRITICAL for performance)
CREATE INDEX idx_geographic_locations_search_trgm ON geographic_locations USING gin(search_text gin_trgm_ops);

-- Auto-update timestamp trigger
CREATE TRIGGER actualizar_timestamp_geographic_locations
    BEFORE UPDATE ON geographic_locations
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- RLS: Public read access (locations are reference data, not sensitive)
ALTER TABLE geographic_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to locations"
    ON geographic_locations
    FOR SELECT
    USING (true);

-- Comment documentation
COMMENT ON TABLE geographic_locations IS 'Reference table for cities/places used in address and location pickers';
COMMENT ON COLUMN geographic_locations.search_text IS 'Generated full-text search column with trigram index for fast fuzzy matching';

-- Create search function with optimized query plan
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
    WHERE gl.search_text ILIKE '%' || search_term || '%'
    ORDER BY
        -- Priority 1: Exact city name match
        CASE WHEN gl.city_name ILIKE search_term THEN 0 ELSE 1 END,
        -- Priority 2: Colombian cities first (assuming main market)
        CASE WHEN gl.country_code = 'CO' THEN 0 ELSE 1 END,
        -- Priority 3: Alphabetical by country, then city
        gl.country_name ASC,
        gl.city_name ASC
    LIMIT 20; -- Performance limit for UI dropdown
END;
$$;

COMMENT ON FUNCTION search_locations(TEXT) IS 'Fuzzy search function for location picker - returns max 20 results ordered by relevance';

-- Seed sample data for Colombian cities (top 20 most populated)
INSERT INTO geographic_locations (country_code, country_name, state_code, state_name, city_name, timezone) VALUES
    ('CO', 'Colombia', 'ANT', 'Antioquia', 'Medellín', 'America/Bogota'),
    ('CO', 'Colombia', 'CUN', 'Cundinamarca', 'Bogotá', 'America/Bogota'),
    ('CO', 'Colombia', 'VAC', 'Valle del Cauca', 'Cali', 'America/Bogota'),
    ('CO', 'Colombia', 'ATL', 'Atlántico', 'Barranquilla', 'America/Bogota'),
    ('CO', 'Colombia', 'SAN', 'Santander', 'Bucaramanga', 'America/Bogota'),
    ('CO', 'Colombia', 'BOL', 'Bolívar', 'Cartagena', 'America/Bogota'),
    ('CO', 'Colombia', 'RIS', 'Risaralda', 'Pereira', 'America/Bogota'),
    ('CO', 'Colombia', 'CAL', 'Caldas', 'Manizales', 'America/Bogota'),
    ('CO', 'Colombia', 'TOL', 'Tolima', 'Ibagué', 'America/Bogota'),
    ('CO', 'Colombia', 'COR', 'Córdoba', 'Montería', 'America/Bogota'),
    ('CO', 'Colombia', 'HUI', 'Huila', 'Neiva', 'America/Bogota'),
    ('CO', 'Colombia', 'NSA', 'Norte de Santander', 'Cúcuta', 'America/Bogota'),
    ('CO', 'Colombia', 'VAC', 'Valle del Cauca', 'Palmira', 'America/Bogota'),
    ('CO', 'Colombia', 'ANT', 'Antioquia', 'Bello', 'America/Bogota'),
    ('CO', 'Colombia', 'VAC', 'Valle del Cauca', 'Buenaventura', 'America/Bogota'),
    ('CO', 'Colombia', 'ANT', 'Antioquia', 'Itagüí', 'America/Bogota'),
    ('CO', 'Colombia', 'MAG', 'Magdalena', 'Santa Marta', 'America/Bogota'),
    ('CO', 'Colombia', 'CUN', 'Cundinamarca', 'Soacha', 'America/Bogota'),
    ('CO', 'Colombia', 'CAU', 'Cauca', 'Popayán', 'America/Bogota'),
    ('CO', 'Colombia', 'QUI', 'Quindío', 'Armenia', 'America/Bogota'),
    ('CO', 'Colombia', 'VAC', 'Valle del Cauca', 'Tuluá', 'America/Bogota'),
    ('CO', 'Colombia', 'CUN', 'Cundinamarca', 'Facatativá', 'America/Bogota'),
    ('CO', 'Colombia', 'ANT', 'Antioquia', 'Envigado', 'America/Bogota')
ON CONFLICT DO NOTHING;
