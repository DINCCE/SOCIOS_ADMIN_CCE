'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Search for business partners (actores) by code or name
 * Used in the Nueva Oportunidad drawer for solicitante selection
 *
 * @param query - Search query (codigo or nombre)
 * @param organizacion_id - Organization ID for filtering
 * @returns Object with { success, data }
 */
export async function buscarActores(query: string, organizacion_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_actores_org')
    .select('*')
    .eq('organizacion_id', organizacion_id)
    .or(`codigo.ilike.%${query}%, nombre.ilike.%${query}%, identificacion.ilike.%${query}%`)
    .order('codigo')
    .limit(20)

  if (error) {
    console.error('Error searching actores:', error)
    return { success: false, data: [] }
  }

  return { success: true, data: data || [] }
}

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
  tags?: string[]
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

  // Update tags separately if provided
  const oportunidadId = (rpcResponse as { id: string }).id
  if (data.tags && data.tags.length > 0) {
    const { error: tagsError } = await supabase
      .from('oportunidades')
      .update({ tags: data.tags })
      .eq('id', oportunidadId)

    if (tagsError) {
      console.error('Error updating tags:', tagsError)
      // Don't fail the whole operation if tags fail, just log it
    }
  }

  revalidatePath('/admin/oportunidades')

  return {
    success: true,
    message: 'Oportunidad creada correctamente',
    oportunidad_id: oportunidadId
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
    estado?: 'nueva' | 'en_progreso' | 'ganada' | 'perdida' | 'descartada'
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
    estado?: 'nueva' | 'en_progreso' | 'ganada' | 'perdida' | 'descartada'
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
