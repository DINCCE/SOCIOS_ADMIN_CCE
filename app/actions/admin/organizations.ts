'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new organization
 *
 * @param data - Organization creation data
 * @returns Object with { success, message, organization_id? }
 */
export async function createOrganization(data: {
  nombre: string
  slug: string
  tipo?: string
  organizacion_padre_id?: string
  email?: string
  telefono?: string
  website?: string
  direccion?: Record<string, unknown>
  configuracion?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: orgData, error } = await supabase
    .from('organizations')
    .insert({
      nombre: data.nombre,
      slug: data.slug,
      tipo: data.tipo || 'club',
      organizacion_padre_id: data.organizacion_padre_id,
      email: data.email,
      telefono: data.telefono,
      website: data.website,
      direccion: data.direccion,
      configuracion: data.configuracion
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating organization:', error)
    return {
      success: false,
      message: `Error al crear organización: ${error.message}`
    }
  }

  // Creator is automatically assigned as 'owner' via trigger
  revalidatePath('/admin/organizations')

  return {
    success: true,
    message: 'Organización creada correctamente',
    organization_id: orgData.id
  }
}

/**
 * Update an organization
 *
 * @param organization_id - The UUID of the organization
 * @param data - Partial organization data to update
 * @returns Object with { success, message }
 */
export async function updateOrganization(
  organization_id: string,
  data: Partial<{
    nombre: string
    slug: string
    tipo: string
    organizacion_padre_id: string
    email: string
    telefono: string
    website: string
    direccion: Record<string, unknown>
    configuracion: Record<string, unknown>
  }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', organization_id)

  if (error) {
    console.error('Error updating organization:', error)
    return {
      success: false,
      message: `Error al actualizar organización: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${organization_id}`)

  return {
    success: true,
    message: 'Organización actualizada correctamente'
  }
}

/**
 * Soft delete an organization
 *
 * @param organization_id - The UUID of the organization
 * @returns Object with { success, message }
 */
export async function softDeleteOrganization(organization_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organizations')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', organization_id)

  if (error) {
    console.error('Error soft deleting organization:', error)
    return {
      success: false,
      message: `Error al eliminar organización: ${error.message}`
    }
  }

  revalidatePath('/admin/organizations')

  return {
    success: true,
    message: 'Organización eliminada correctamente'
  }
}

/**
 * List all organizations accessible to current user
 *
 * @returns Array of organizations or error
 */
export async function listOrganizations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .is('eliminado_en', null)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching organizations:', error)
    return {
      success: false,
      message: `Error al obtener organizaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
