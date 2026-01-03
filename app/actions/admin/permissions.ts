'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Grant a permission to a role
 *
 * @param data - Permission creation data
 * @returns Object with { success, message }
 */
export async function grantPermission(data: {
  role: string
  resource: string
  action: 'select' | 'insert' | 'update' | 'delete'
  allow?: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('role_permissions')
    .insert({
      role: data.role,
      resource: data.resource,
      action: data.action,
      allow: data.allow !== undefined ? data.allow : true
    })

  if (error) {
    console.error('Error granting permission:', error)
    return {
      success: false,
      message: `Error al otorgar permiso: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')
  revalidatePath(`/admin/roles/${data.role}/permissions`)

  return {
    success: true,
    message: 'Permiso otorgado correctamente'
  }
}

/**
 * Revoke a permission from a role
 *
 * @param role - The role identifier
 * @param resource - The resource name
 * @param action - The action type
 * @returns Object with { success, message }
 */
export async function revokePermission(
  role: string,
  resource: string,
  action: 'select' | 'insert' | 'update' | 'delete'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role', role)
    .eq('resource', resource)
    .eq('action', action)

  if (error) {
    console.error('Error revoking permission:', error)
    return {
      success: false,
      message: `Error al revocar permiso: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')
  revalidatePath(`/admin/roles/${role}/permissions`)

  return {
    success: true,
    message: 'Permiso revocado correctamente'
  }
}

/**
 * List all permissions for a role
 *
 * @param role - The role identifier
 * @returns Array of permissions or error
 */
export async function listPermissions(role: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', role)
    .order('resource', { ascending: true })

  if (error) {
    console.error('Error fetching permissions:', error)
    return {
      success: false,
      message: `Error al obtener permisos: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}

/**
 * List all permissions across all roles
 *
 * @returns Array of all permissions or error
 */
export async function listAllPermissions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .order('role', { ascending: true })

  if (error) {
    console.error('Error fetching all permissions:', error)
    return {
      success: false,
      message: `Error al obtener todos los permisos: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
