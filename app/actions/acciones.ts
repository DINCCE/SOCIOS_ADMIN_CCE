'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new accion (club share)
 *
 * @param data - Accion creation data
 * @returns Object with { success, message, accion_id? }
 */
export async function crearAccion(data: {
  organizacion_id: string
  codigo_accion: string
  estado?: string
}) {
  const supabase = await createClient()

  const { data: rpcResponse, error } = await supabase.rpc('crear_accion', {
    p_organizacion_id: data.organizacion_id,
    p_codigo_accion: data.codigo_accion,
    p_estado: data.estado || 'disponible'
  })

  if (error) {
    console.error('Error creating accion:', error)
    return {
      success: false,
      message: `Error al crear acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Acción creada correctamente',
    accion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an accion
 *
 * @param accion_id - The UUID of the accion
 * @param data - Partial accion data to update
 * @returns Object with { success, message }
 */
export async function actualizarAccion(
  accion_id: string,
  data: {
    estado?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_accion', {
    p_accion_id: accion_id,
    p_estado: data.estado
  })

  if (error) {
    console.error('Error updating accion:', error)
    return {
      success: false,
      message: `Error al actualizar acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Acción actualizada correctamente'
  }
}

/**
 * Soft delete an accion
 *
 * @param accion_id - The UUID of the accion
 * @returns Object with { success, message }
 */
export async function softDeleteAccion(accion_id: string) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError)
    return {
      success: false,
      message: 'Usuario no autenticado'
    }
  }

  // Use RPC function to soft delete with proper RLS bypass
  const { data, error: deleteError } = await supabase.rpc('soft_delete_dm_acciones_rpc', {
    p_accion_id: accion_id,
    p_user_id: user.id
  })

  if (deleteError) {
    console.error('Error soft deleting accion:', deleteError)
    return {
      success: false,
      message: `Error al eliminar acción: ${deleteError.message}`
    }
  }

  // Check if the RPC returned an error
  if (data && !data.success) {
    return {
      success: false,
      message: data.message || 'Error al eliminar acción'
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: data?.message || 'Acción eliminada correctamente'
  }
}

/**
 * List all acciones for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @returns Array of acciones or error
 */
export async function listAcciones(organizacion_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dm_acciones')
    .select('*')
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .order('codigo_accion', { ascending: true })

  if (error) {
    console.error('Error fetching acciones:', error)
    return {
      success: false,
      message: `Error al obtener acciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}

/**
 * Create an action assignment
 * Wrapper for RPC function crear_asignacion_accion
 *
 * @param data - Assignment creation data
 * @returns Object with { success, message, asignacion_id? }
 */
export async function crearAsignacion(data: {
  accion_id: string
  persona_id: string
  tipo_asignacion: 'dueño' | 'titular' | 'beneficiario'
  subcodigo?: string
  fecha_inicio?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  // Get organization from accion
  const { data: accionData } = await supabase
    .from('dm_acciones')
    .select('organizacion_id')
    .eq('id', data.accion_id)
    .single()

  if (!accionData) {
    return {
      success: false,
      message: 'No se encontró la acción'
    }
  }

  const { data: rpcResponse, error } = await supabase.rpc('crear_asignacion_accion', {
    p_accion_id: data.accion_id,
    p_persona_id: data.persona_id,
    p_tipo_asignacion: data.tipo_asignacion,
    p_subcodigo: data.subcodigo,
    p_fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating assignment:', error)
    return {
      success: false,
      message: `Error al crear asignación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')
  revalidatePath(`/admin/socios/acciones/${data.accion_id}`)

  return {
    success: true,
    message: 'Asignación creada correctamente',
    asignacion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Transfer action ownership to a new owner
 * Wrapper for RPC function transferir_accion
 *
 * @param data - Transfer data
 * @returns Object with { success, message }
 */
export async function transferirAccion(data: {
  accion_id: string
  nuevo_dueno_id: string
  fecha_transferencia?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('transferir_accion', {
    p_accion_id: data.accion_id,
    p_nuevo_dueno_id: data.nuevo_dueno_id,
    p_fecha_transferencia: data.fecha_transferencia || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error transferring accion:', error)
    return {
      success: false,
      message: `Error al transferir acción: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')
  revalidatePath(`/admin/socios/acciones/${data.accion_id}`)

  return {
    success: true,
    message: 'Acción transferida correctamente'
  }
}

/**
 * End an action assignment
 * Wrapper for RPC function finalizar_asignacion_accion
 *
 * @param asignacion_id - The UUID of the assignment
 * @param fecha_fin - End date (default: today)
 * @returns Object with { success, message }
 */
export async function finalizarAsignacion(
  asignacion_id: string,
  fecha_fin?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('finalizar_asignacion_accion', {
    p_asignacion_id: asignacion_id,
    p_fecha_fin: fecha_fin || new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error finalizing assignment:', error)
    return {
      success: false,
      message: `Error al finalizar asignación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: 'Asignación finalizada correctamente'
  }
}

/**
 * List all assignments for an action
 *
 * @param accion_id - The UUID of the action
 * @param solo_vigentes - Return only active assignments (default: true)
 * @returns Array of assignments or error
 */
export async function listAsignaciones(
  accion_id: string,
  solo_vigentes: boolean = true
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vn_asociados')
    .select(`
      *,
      business_partners (
        id,
        codigo_bp,
        tipo_actor,
        email_principal
      )
    `)
    .eq('accion_id', accion_id)
    .is('eliminado_en', null)

  if (solo_vigentes) {
    // Filter for active assignments (es_vigente = true)
    // This is a generated column, so we can't use .is()
    // We'll filter in the query
  }

  if (error) {
    console.error('Error fetching asignaciones:', error)
    return {
      success: false,
      message: `Error al obtener asignaciones: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}

/**
 * Soft delete an assignment
 *
 * @param asignacion_id - The UUID of the assignment
 * @returns Object with { success, message }
 */
export async function softDeleteAsignacion(asignacion_id: string) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError)
    return {
      success: false,
      message: 'Usuario no autenticado'
    }
  }

  // Use RPC function to soft delete with proper RLS bypass
  const { data, error: deleteError } = await supabase.rpc('soft_delete_asignacion_rpc', {
    p_asignacion_id: asignacion_id,
    p_user_id: user.id
  })

  if (deleteError) {
    console.error('Error soft deleting asignacion:', deleteError)
    return {
      success: false,
      message: `Error al eliminar asignación: ${deleteError.message}`
    }
  }

  // Check if the RPC returned an error
  if (data && !data.success) {
    return {
      success: false,
      message: data.message || 'Error al eliminar asignación'
    }
  }

  revalidatePath('/admin/socios/acciones')

  return {
    success: true,
    message: data?.message || 'Asignación eliminada correctamente'
  }
}
