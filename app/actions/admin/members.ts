'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Add a member to an organization
 *
 * @param data - Member creation data
 * @returns Object with { success, message }
 */
export async function addMember(data: {
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'analyst' | 'auditor'
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('config_organizacion_miembros')
    .insert({
      user_id: data.user_id,
      organization_id: data.organization_id,
      role: data.role
    })

  if (error) {
    console.error('Error adding member:', error)
    return {
      success: false,
      message: `Error al agregar miembro: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${data.organization_id}/members`)

  return {
    success: true,
    message: 'Miembro agregado correctamente'
  }
}

/**
 * Update a member's role
 *
 * @param user_id - The UUID of the user
 * @param organization_id - The UUID of the organization
 * @param role - New role
 * @returns Object with { success, message }
 */
export async function updateMemberRole(
  user_id: string,
  organization_id: string,
  role: 'owner' | 'admin' | 'analyst' | 'auditor'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('config_organizacion_miembros')
    .update({ role })
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)

  if (error) {
    console.error('Error updating member role:', error)
    return {
      success: false,
      message: `Error al actualizar rol: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organization_id}/members`)

  return {
    success: true,
    message: 'Rol actualizado correctamente'
  }
}

/**
 * Remove a member from an organization
 *
 * @param user_id - The UUID of the user
 * @param organization_id - The UUID of the organization
 * @returns Object with { success, message }
 */
export async function removeMember(
  user_id: string,
  organization_id: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('config_organizacion_miembros')
    .delete()
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)

  if (error) {
    console.error('Error removing member:', error)
    return {
      success: false,
      message: `Error al eliminar miembro: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organization_id}/members`)

  return {
    success: true,
    message: 'Miembro eliminado correctamente'
  }
}

/**
 * List all members of an organization
 *
 * @param organization_id - The UUID of the organization
 * @returns Array of members or error
 */
export async function listMembers(organization_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('config_organizacion_miembros')
    .select(`
      *,
      user:auth.users (
        id,
        email,
        created_at
      )
    `)
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching members:', error)
    return {
      success: false,
      message: `Error al obtener miembros: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
