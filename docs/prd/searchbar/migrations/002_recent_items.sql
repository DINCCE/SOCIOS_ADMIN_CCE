-- Migration: 002_recent_items.sql
-- Goal: Track recently viewed items in global search for each user/organization

-- 1. Create the table
CREATE TABLE IF NOT EXISTS config_recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES config_organizaciones(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL, -- Flexible for different entity types
    entity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    route TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure uniqueness per user-org-entity to support upserts
    UNIQUE (user_id, organization_id, entity_id, entity_type)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_org ON config_recently_viewed(user_id, organization_id, viewed_at DESC);

-- 3. Enable RLS
ALTER TABLE config_recently_viewed ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can manage their own recent items"
ON config_recently_viewed
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() 
    AND organization_id IN (SELECT organization_id FROM config_organizacion_miembros WHERE user_id = auth.uid())
)
WITH CHECK (
    user_id = auth.uid() 
    AND organization_id IN (SELECT organization_id FROM config_organizacion_miembros WHERE user_id = auth.uid())
);

-- 5. RPC function to add a recent item (with upsert logic)
CREATE OR REPLACE FUNCTION add_recent_search_item(
    p_entity_id TEXT,
    p_entity_type TEXT,
    p_title TEXT,
    p_route TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_org_id UUID;
BEGIN
    -- Get current organization for the user
    -- Assuming the user has one active organization, otherwise this logic might need adjustment
    -- For now, we'll take the most recently created active membership
    SELECT organization_id INTO v_org_id
    FROM config_organizacion_miembros
    WHERE user_id = v_user_id
      AND eliminado_en IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'User must belong to an organization';
    END IF;

    INSERT INTO config_recently_viewed (
        user_id,
        organization_id,
        entity_id,
        entity_type,
        title,
        route,
        viewed_at
    )
    VALUES (
        v_user_id,
        v_org_id,
        p_entity_id,
        p_entity_type,
        p_title,
        p_route,
        now()
    )
    ON CONFLICT (user_id, organization_id, entity_id, entity_type)
    DO UPDATE SET
        viewed_at = EXCLUDED.viewed_at,
        title = EXCLUDED.title,
        route = EXCLUDED.route;

    -- Maintain limit: Keep only last 20 per user/org
    DELETE FROM config_recently_viewed
    WHERE id IN (
        SELECT id
        FROM config_recently_viewed
        WHERE user_id = v_user_id AND organization_id = v_org_id
        ORDER BY viewed_at DESC
        OFFSET 20
    );
END;
$$;

-- 6. RPC function to get recent items
CREATE OR REPLACE FUNCTION get_recent_search_items(
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    entity_id TEXT,
    entity_type TEXT,
    title TEXT,
    route TEXT,
    viewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        rv.entity_id,
        rv.entity_type,
        rv.title,
        rv.route,
        rv.viewed_at
    FROM config_recently_viewed rv
    WHERE rv.user_id = v_user_id
      -- Filter by active organization membership
      AND rv.organization_id IN (
          SELECT organization_id 
          FROM config_organizacion_miembros 
          WHERE user_id = v_user_id AND eliminado_en IS NULL
      )
    ORDER BY rv.viewed_at DESC
    LIMIT p_limit;
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION add_recent_search_item(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_search_items(INTEGER) TO authenticated;
