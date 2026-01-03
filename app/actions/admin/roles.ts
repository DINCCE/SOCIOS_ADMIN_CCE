'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new role
 *
 * @param data - Role creation data
 * @returns Object with { success, message, role? }
 */
export async function createRole(data: {
  role: string
  description?: string
}) {
  const supabase = await createClient()

  const { data: roleData, error } = await supabase
    .from('roles')
    .insert({
      role: data.role,
      description: data.description
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating role:', error)
    return {
      success: false,
      message: `Error al crear rol: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')

  return {
    success: true,
    message: 'Rol creado correctamente',
    role: roleData
  }
}

/**
 * Update a role
 *
 * @param role - The role identifier
 * @param data - Partial role data to update
 * @returns Object with { success, message }
 */
export async function updateRole(
  role: string,
  data: {
    description?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('roles')
    .update(data)
    .eq('role', role)

  if (error) {
    console.error('Error updating role:', error)
    return {
      success: false,
      message: `Error al actualizar rol: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')

  return {
    success: true,
    message: 'Rol actualizado correctamente'
  }
}

/**
 * Delete a role
 *
 * @param role - The role identifier
 * @returns Object with { success, message }
 */
export async function deleteRole(role: string) {
  const supabase = await createClient()

  // Prevent deleting system roles
  if (['owner', 'admin', 'analyst', 'auditor'].includes(role)) {
    return {
      success: false,
      message: 'No se pueden eliminar los roles del sistema'
    }
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('role', role)

  if (error) {
    console.error('Error deleting role:', error)
    return {
      success: false,
      message: `Error al eliminar rol: ${error.message}`
    }
  }

  revalidatePath('/admin/roles')

  return {
    success: true,
    message: 'Rol eliminado correctamente'
  }
}

/**
 * List all roles
 *
 * @returns Array of roles or error
 */
export async function listRoles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('role', { ascending: true })

  if (error) {
    console.error('Error fetching roles:', error)
    return {
      success: false,
      message: `Error al obtener roles: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
