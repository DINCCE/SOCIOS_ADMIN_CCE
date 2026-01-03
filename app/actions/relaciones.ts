'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a relationship between two business partners
 * Wrapper for RPC function crear_relacion_bp
 *
 * @param data - Relationship creation data
 * @returns Object with { success, message, relacion_id? }
 */
export async function crearRelacionFromForm(data: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
  descripcion?: string
  fecha_inicio?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  // Get organization from origen BP
  const { data: bpData } = await supabase
    .from('business_partners')
    .select('organizacion_id')
    .eq('id', data.bp_origen_id)
    .single()

  if (!bpData) {
    return {
      success: false,
      message: 'No se encontró el business partner de origen'
    }
  }

  // Call RPC function
  const { data: rpcResponse, error } = await supabase.rpc('crear_relacion_bp', {
    p_bp_origen_id: data.bp_origen_id,
    p_bp_destino_id: data.bp_destino_id,
    p_tipo_relacion: data.tipo_relacion,
    p_descripcion: data.descripcion,
    p_fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating relationship:', error)
    return {
      success: false,
      message: `Error al crear relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación creada correctamente',
    relacion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an existing relationship
 * Wrapper for RPC function actualizar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @param data - Partial relationship data to update
 * @returns Object with { success, message }
 */
export async function actualizarRelacion(
  relacion_id: string,
  data: {
    tipo_relacion?: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
    descripcion?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_tipo_relacion: data.tipo_relacion,
    p_descripcion: data.descripcion,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating relationship:', error)
    return {
      success: false,
      message: `Error al actualizar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación actualizada correctamente'
  }
}

/**
 * End a relationship by setting fecha_fin
 * Wrapper for RPC function finalizar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @param fecha_fin - End date (default: today)
 * @returns Object with { success, message }
 */
export async function finalizarRelacion(
  relacion_id: string,
  fecha_fin?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('finalizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_fecha_fin: fecha_fin || new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error finalizing relationship:', error)
    return {
      success: false,
      message: `Error al finalizar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación finalizada correctamente'
  }
}

/**
 * Soft delete a relationship
 * Wrapper for RPC function eliminar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @returns Object with { success, message }
 */
export async function eliminarRelacion(relacion_id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('eliminar_relacion_bp', {
    p_relacion_id: relacion_id
  })

  if (error) {
    console.error('Error deleting relationship:', error)
    return {
      success: false,
      message: `Error al eliminar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación eliminada correctamente'
  }
}

/**
 * Get all relationships for a business partner (bidirectional)
 * Wrapper for RPC function obtener_relaciones_bp
 *
 * @param bp_id - The UUID of the business partner
 * @param solo_vigentes - Return only active relationships (default: true)
 * @returns Array of relationships or error
 */
export async function obtenerRelaciones(
  bp_id: string,
  solo_vigentes: boolean = true
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('obtener_relaciones_bp', {
    p_bp_id: bp_id,
    p_solo_vigentes: solo_vigentes
  })

  if (error) {
    console.error('Error fetching relationships:', error)
    return {
      success: false,
      message: `Error al obtener relaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
