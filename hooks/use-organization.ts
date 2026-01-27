'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to get the active organization ID for the current user.
 * Matches the logic in lib/supabase/server.ts
 */
export function useOrganization() {
    const supabase = createClient()

    return useQuery({
        queryKey: ['active-organization'],
        queryFn: async () => {
            // 1. Get user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) return null

            // 2. Query memberships
            const { data, error } = await supabase
                .from('config_organizacion_miembros')
                .select('organization_id')
                .eq('user_id', user.id)
                .is('eliminado_en', null)
                .limit(1)

            if (error || !data || data.length === 0) return null

            return data[0].organization_id as string
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    })
}
