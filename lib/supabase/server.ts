import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

/**
 * Helper to get the active organization ID for the current user.
 * Uses direct query on memberships table (most reliable method).
 */
export async function getActiveOrganizationId() {
    const supabase = await createClient()

    // 1. Get user explicitly
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('[Organization Lookup] No session found:', userError?.message)
        return null
    }

    console.log('[Organization Lookup] User authenticated:', user.id)
    console.log('[Organization Lookup] User email:', user.email)

    // 2. Direct query on memberships (MÉTODO MÁS CONFIABLE)
    const { data: membershipData, error: memError } = await supabase
        .from('config_organizacion_miembros')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .is('eliminado_en', null)
        .limit(1)

    console.log('[Organization Lookup] Membership query result:', { data: membershipData, error: memError })

    if (memError) {
        console.error('[Organization Lookup] Membership query error:', memError)
        return null
    }

    if (membershipData && membershipData.length > 0) {
        const orgId = membershipData[0].organization_id
        console.log('[Organization Lookup] ✓ Found organization:', orgId, 'with role:', membershipData[0].role)
        return orgId
    }

    console.error('[Organization Lookup] ✗ No membership found for user:', user.id)
    return null
}
