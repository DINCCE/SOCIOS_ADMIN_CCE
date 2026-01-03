'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new oportunidad
 *
 * @param data - Oportunidad creation data
 * @returns Object with { success, message, oportunidad_id? }
 */
export async function crearOportunidad(data: {
  organizacion_id: string
  codigo: string
  tipo: 'Solicitud Retiro' | 'Solicitud Ingreso'
  solicitante_id: string
  responsable_id?: string
  monto_estimado?: number
  notas?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: rpcResponse, error } = await supabase.rpc('crear_oportunidad', {
    p_organizacion_id: data.organizacion_id,
    p_codigo: data.codigo,
    p_tipo: data.tipo,
    p_solicitante_id: data.solicitante_id,
    p_responsable_id: data.responsable_id,
    p_monto_estimado: data.monto_estimado,
    p_notas: data.notas,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating oportunidad:', error)
    return {
      success: false,
      message: `Error al crear oportunidad: ${error.message}`
    }
  }

  revalidatePath('/admin/oportunidades')

  return {
    success: true,
    message: 'Oportunidad creada correctamente',
    oportunidad_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an oportunidad
 *
 * @param oportunidad_id - The UUID of oportunidad
 * @param data - Partial oportunidad data to update
 * @returns Object with { success, message }
 */
export async function actualizarOportunidad(
  oportunidad_id: string,
  data: {
    estado?: 'abierta' | 'en_proceso' | 'ganada' | 'perdida' | 'cancelada'
    responsable_id?: string
    monto_estimado?: number
    notas?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_oportunidad', {
    p_oportunidad_id: oportunidad_id,
    p_estado: data.estado,
    p_responsable_id: data.responsable_id,
    p_monto_estimado: data.monto_estimado,
    p_notas: data.notas,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating oportunidad:', error)
    return {
      success: false,
      message: `Error al actualizar oportunidad: ${error.message}`
    }
  }

  revalidatePath('/admin/oportunidades')
  revalidatePath(`/admin/oportunidades/${oportunidad_id}`)

  return {
    success: true,
    message: 'Oportunidad actualizada correctamente'
  }
}

/**
 * Soft delete an oportunidad
 *
 * @param oportunidad_id - The UUID of oportunidad
 * @returns Object with { success, message }
 */
export async function softDeleteOportunidad(oportunidad_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('oportunidades')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', oportunidad_id)

  if (error) {
    console.error('Error soft deleting oportunidad:', error)
    return {
      success: false,
      message: `Error al eliminar oportunidad: ${error.message}`
    }
  }

  revalidatePath('/admin/oportunidades')

  return {
    success: true,
    message: 'Oportunidad eliminada correctamente'
  }
}

/**
 * List all oportunidades for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @param filters - Optional filters (estado, tipo)
 * @returns Array of oportunidades or error
 */
export async function listOportunidades(
  organizacion_id: string,
  filters?: {
    estado?: 'abierta' | 'en_proceso' | 'ganada' | 'perdida' | 'cancelada'
    tipo?: 'Solicitud Retiro' | 'Solicitud Ingreso'
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('oportunidades')
    .select(`
      *,
      solicitante (
        id,
        codigo_bp,
        tipo_actor,
        email_principal
      ),
      responsable (
        id,
        email
      )
    `)
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .order('fecha_solicitud', { ascending: false })

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching oportunidades:', error)
    return {
      success: false,
      message: `Error al obtener oportunidades: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
