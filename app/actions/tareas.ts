'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new tarea
 *
 * @param data - Tarea creation data
 * @returns Object with { success, message, tarea_id? }
 */
export async function crearTarea(data: {
  organizacion_id: string
  titulo: string
  descripcion?: string
  prioridad?: 'baja' | 'media' | 'alta' | 'critica'
  oportunidad_id?: string
  asignado_a?: string
  relacionado_con_bp?: string
  fecha_vencimiento?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  const { data: rpcResponse, error } = await supabase.rpc('crear_tarea', {
    p_organizacion_id: data.organizacion_id,
    p_titulo: data.titulo,
    p_descripcion: data.descripcion,
    p_prioridad: data.prioridad || 'media',
    p_oportunidad_id: data.oportunidad_id,
    p_asignado_a: data.asignado_a,
    p_relacionado_con_bp: data.relacionado_con_bp,
    p_fecha_vencimiento: data.fecha_vencimiento,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating tarea:', error)
    return {
      success: false,
      message: `Error al crear tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/tareas')

  return {
    success: true,
    message: 'Tarea creada correctamente',
    tarea_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update a tarea
 *
 * @param tarea_id - The UUID of tarea
 * @param data - Partial tarea data to update
 * @returns Object with { success, message }
 */
export async function actualizarTarea(
  tarea_id: string,
  data: {
    titulo?: string
    descripcion?: string
    prioridad?: 'baja' | 'media' | 'alta' | 'critica'
    estado?: 'pendiente' | 'en_progreso' | 'terminada' | 'pausada' | 'cancelada'
    oportunidad_id?: string
    asignado_a?: string
    fecha_vencimiento?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_tarea', {
    p_tarea_id: tarea_id,
    p_titulo: data.titulo,
    p_descripcion: data.descripcion,
    p_prioridad: data.prioridad,
    p_estado: data.estado,
    p_oportunidad_id: data.oportunidad_id,
    p_asignado_a: data.asignado_a,
    p_fecha_vencimiento: data.fecha_vencimiento,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating tarea:', error)
    return {
      success: false,
      message: `Error al actualizar tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/tareas')
  revalidatePath(`/admin/tareas/${tarea_id}`)

  return {
    success: true,
    message: 'Tarea actualizada correctamente'
  }
}

/**
 * Soft delete a tarea
 *
 * @param tarea_id - The UUID of tarea
 * @returns Object with { success, message }
 */
export async function softDeleteTarea(tarea_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tareas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', tarea_id)

  if (error) {
    console.error('Error soft deleting tarea:', error)
    return {
      success: false,
      message: `Error al eliminar tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/tareas')

  return {
    success: true,
    message: 'Tarea eliminada correctamente'
  }
}

/**
 * List all tareas for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @param filters - Optional filters (estado, prioridad, asignado_a)
 * @returns Array of tareas or error
 */
export async function listTareas(
  organizacion_id: string,
  filters?: {
    estado?: 'pendiente' | 'en_progreso' | 'terminada' | 'pausada' | 'cancelada'
    prioridad?: 'baja' | 'media' | 'alta' | 'critica'
    asignado_a?: string
    oportunidad_id?: string
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('tareas')
    .select(`
      *,
      oportunidad (
        id,
        codigo,
        tipo,
        estado
      ),
      asignado (
        id,
        email
      ),
      relacionado_con_bp (
        id,
        codigo_bp,
        tipo_actor,
        email_principal
      )
    `)
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .order('fecha_vencimiento', { ascending: true })

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.prioridad) {
    query = query.eq('prioridad', filters.prioridad)
  }

  if (filters?.asignado_a) {
    query = query.eq('asignado_a', filters.asignado_a)
  }

  if (filters?.oportunidad_id) {
    query = query.eq('oportunidad_id', filters.oportunidad_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tareas:', error)
    return {
      success: false,
      message: `Error al obtener tareas: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
