/**
 * Role-Based Access Control (RBAC) utilities
 * Centralized permission checking for UI and server-side
 */

import type { UserRole } from './page-permissions'
import { createClient } from '@/lib/supabase/server'

/**
 * Get user's role in the current organization
 */
export async function getCurrentUserRole(orgId: string): Promise<UserRole | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('config_organizacion_miembros')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .is('eliminado_en', null)
    .single()

  if (error || !data) return null

  return data.role as UserRole
}

/**
 * Get all organizations for current user with their roles
 */
export async function getUserOrganizations() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('config_organizacion_miembros')
    .select(`
      organization_id,
      role,
      organizacion:config_organizaciones(id, nombre)
    `)
    .eq('user_id', user.id)
    .is('eliminado_en', null)

  if (error) return []

  return (data || []).map(item => ({
    organizationId: item.organization_id,
    role: item.role as UserRole,
    organizationName: (item as any).organizacion?.nombre || 'Unknown',
  }))
}

/**
 * Check if user has specific permission for a resource
 */
export async function hasPermission(
  orgId: string,
  resource: string,
  action: 'select' | 'insert' | 'update' | 'delete'
): Promise<boolean> {
  const { checkPermission } = await import('@/lib/auth/permissions')
  return checkPermission(resource, action, orgId)
}

/**
 * Check multiple permissions at once
 */
export async function hasAllPermissions(
  orgId: string,
  permissions: Array<{ resource: string; action: 'select' | 'insert' | 'update' | 'delete' }>
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map(p => hasPermission(orgId, p.resource, p.action))
  )
  return results.every(r => r === true)
}

/**
 * Permission set for a role - for UI checks without DB calls
 * Note: These should match what's in config_roles_permisos
 */
export const ROLE_PERMISSIONS: Record<UserRole, {
  canDelete: boolean
  canUpdateConfig: boolean
  canManageUsers: boolean
}> = {
  owner: {
    canDelete: true,
    canUpdateConfig: true,
    canManageUsers: true,
  },
  admin: {
    canDelete: true,
    canUpdateConfig: false,
    canManageUsers: false,
  },
  analyst: {
    canDelete: false,
    canUpdateConfig: false,
    canManageUsers: false,
  },
  auditor: {
    canDelete: false,
    canUpdateConfig: false,
    canManageUsers: false,
  },
}

/**
 * Quick UI permission check based on role
 * For more granular checks, use hasPermission()
 */
export function canDelete(role: UserRole | null): boolean {
  return role ? ROLE_PERMISSIONS[role].canDelete : false
}

export function canUpdateConfig(role: UserRole | null): boolean {
  return role ? ROLE_PERMISSIONS[role].canUpdateConfig : false
}

export function canManageUsers(role: UserRole | null): boolean {
  return role ? ROLE_PERMISSIONS[role].canManageUsers : false
}
