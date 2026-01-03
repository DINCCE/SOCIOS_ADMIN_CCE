'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new geographic location
 *
 * @param data - Location creation data
 * @returns Object with { success, message, location_id? }
 */
export async function createLocation(data: {
  country_code: string
  country_name: string
  state_name?: string
  city_name: string
  city_code?: string
}) {
  const supabase = await createClient()

  const search_text = `${data.city_name}, ${data.state_name || ''}, ${data.country_name}`.toLowerCase()

  const { data: locationData, error } = await supabase
    .from('geographic_locations')
    .insert({
      country_code: data.country_code,
      country_name: data.country_name,
      state_name: data.state_name,
      city_name: data.city_name,
      city_code: data.city_code,
      search_text
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating location:', error)
    return {
      success: false,
      message: `Error al crear ubicación: ${error.message}`
    }
  }

  revalidatePath('/admin/locations')

  return {
    success: true,
    message: 'Ubicación creada correctamente',
    location_id: locationData.id
  }
}

/**
 * Update a geographic location
 *
 * @param location_id - The UUID of location
 * @param data - Partial location data to update
 * @returns Object with { success, message }
 */
export async function updateLocation(
  location_id: string,
  data: Partial<{
    country_code: string
    country_name: string
    state_name: string
    city_name: string
    city_code: string
  }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('geographic_locations')
    .update(data)
    .eq('id', location_id)

  if (error) {
    console.error('Error updating location:', error)
    return {
      success: false,
      message: `Error al actualizar ubicación: ${error.message}`
    }
  }

  revalidatePath('/admin/locations')

  return {
    success: true,
    message: 'Ubicación actualizada correctamente'
  }
}

/**
 * Soft delete a geographic location
 *
 * @param location_id - The UUID of location
 * @returns Object with { success, message }
 */
export async function softDeleteLocation(location_id: string) {
  const supabase = await createClient()

  // Note: geographic_locations doesn't have eliminado_en field
  // This would require schema modification
  // For now, we'll skip this function

  return {
    success: false,
    message: 'La eliminación de ubicaciones no está implementada'
  }
}

/**
 * Search locations by term
 *
 * @param searchTerm - The search term
 * @param limit - Maximum results (default: 20)
 * @returns Array of locations or error
 */
export async function searchLocations(searchTerm: string, limit: number = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('geographic_locations')
    .select('*')
    .ilike('search_text', `%${searchTerm}%`)
    .limit(limit)
    .order('city_name', { ascending: true })

  if (error) {
    console.error('Error searching locations:', error)
    return {
      success: false,
      message: `Error al buscar ubicaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
