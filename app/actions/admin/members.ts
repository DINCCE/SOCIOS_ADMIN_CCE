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

/**
 * Update user's daily focus tasks
 * 
 * @param user_id - The UUID of the user
 * @param organization_id - The UUID of the organization
 * @param focusData - Object containing fecha and tareas (array of task UUIDs)
 */
export async function updateUserFocus(
  user_id: string,
  organization_id: string,
  focusData: { fecha: string; tareas: string[] }
) {
  const supabase = await createClient()

  // First get current attributes to merge
  const { data: member } = await supabase
    .from('config_organizacion_miembros')
    .select('atributos')
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)
    .single()

  const attributes = member?.atributos || {}
  const newAttributes = {
    ...attributes,
    foco_diario: focusData
  }

  const { error } = await supabase
    .from('config_organizacion_miembros')
    .update({ atributos: newAttributes })
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)

  if (error) {
    console.error('Error updating focus:', error)
    return { success: false, message: `Error al actualizar foco: ${error.message}` }
  }

  revalidatePath('/admin/mis-tareas')
  return { success: true, message: 'Foco actualizado correctamente' }
}

/**
 * Get user's daily focus
 */
export async function getUserFocus(user_id: string, organization_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('config_organizacion_miembros')
    .select('atributos')
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)
    .single()

  if (error) {
    console.error('Error getting focus:', error)
    return { success: false, data: null }
  }

  return {
    success: true,
    data: data?.atributos?.foco_diario || null
  }
}
