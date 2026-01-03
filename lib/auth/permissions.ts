import { createClient } from '@/lib/supabase/server'

/**
 * Check if current user has permission for a resource action
 *
 * @param resource - Table name (e.g., 'business_partners')
 * @param action - CRUD action (select, insert, update, delete)
 * @param organizacion_id - Organization ID
 * @returns Promise<boolean> - True if user has permission
 */
export async function checkPermission(
  resource: string,
  action: 'select' | 'insert' | 'update' | 'delete',
  organizacion_id: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('can_user_v2', {
    p_resource: resource,
    p_action: action,
    p_org: organizacion_id
  })

  if (error) {
    console.error('Error checking permission:', error)
    return false
  }

  return data || false
}

/**
 * Check if current user is admin or owner of organization
 *
 * @param organizacion_id - Organization ID
 * @returns Promise<boolean> - True if user is admin or owner
 */
export async function isAdmin(organizacion_id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('is_org_admin_v2', {
    p_org: organizacion_id
  })

  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }

  return data || false
}

/**
 * Check if current user is owner of organization
 *
 * @param organizacion_id - Organization ID
 * @returns Promise<boolean> - True if user is owner
 */
export async function isOwner(organizacion_id: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('is_org_owner_v2', {
    p_org: organizacion_id
  })

  if (error) {
    console.error('Error checking owner status:', error)
    return false
  }

  return data || false
}

/**
 * Get current user's role in an organization
 *
 * @param organizacion_id - Organization ID
 * @returns Promise<string | null> - Role or null
 */
export async function getUserRole(organizacion_id: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizacion_id)
    .single()

  if (error) {
    console.error('Error getting user role:', error)
    return null
  }

  return data?.role || null
}
