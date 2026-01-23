'use server'

import { createClient, getActiveOrganizationId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new tarea
 *
 * @param data - Tarea creation data
 * @returns Object with { success, message, tarea_id? }
 */
export async function crearTarea(data: {
  organizacion_id?: string  // Optional - will use getActiveOrganizationId() if not provided
  titulo: string
  descripcion?: string
  prioridad?: 'baja' | 'media' | 'alta' | 'critica'
  oportunidad_id?: string
  asignado_a?: string
  relacionado_con_bp?: string
  fecha_vencimiento?: string
  tags?: string[]
}) {
  const supabase = await createClient()

  // Use provided org_id or get from context (following pattern from personas.ts)
  let orgId = data.organizacion_id
  if (!orgId) {
    orgId = await getActiveOrganizationId()
    if (!orgId) {
      return { success: false, message: 'No se encontró una organización activa' }
    }
  }

  // Map form priority values to database enum values
  // Form uses lowercase, DB uses capitalized (Baja, Media, Alta, Urgente)
  const prioridadMap = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta',
    'critica': 'Urgente'
  }

  const { data: newTarea, error } = await supabase
    .from('tr_tareas')
    .insert({
      organizacion_id: orgId,
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      prioridad: prioridadMap[data.prioridad as keyof typeof prioridadMap] || 'Media',
      estado: 'Pendiente',  // Default state for new tasks
      fecha_vencimiento: data.fecha_vencimiento || null,
      doc_comercial_id: data.oportunidad_id || null,
      asignado_id: data.asignado_a || null,
      actor_relacionado_id: data.relacionado_con_bp || null,
      tags: data.tags || [],
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating tarea:', error)
    return { success: false, message: `Error al crear tarea: ${error.message}` }
  }

  revalidatePath('/admin/procesos/tareas')

  return {
    success: true,
    message: 'Tarea creada correctamente',
    tarea_id: newTarea.id
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
    prioridad?: 'baja' | 'media' | 'alta' | 'critica' | 'Baja' | 'Media' | 'Alta' | 'Urgente'
    estado?: 'pendiente' | 'en_progreso' | 'terminada' | 'pausada' | 'cancelada' | 'Pendiente' | 'En Progreso' | 'Terminada' | 'Pausada' | 'Cancelada'
    oportunidad_id?: string
    asignado_a?: string
    fecha_vencimiento?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    actualizado_en: new Date().toISOString()
  }

  if (data.titulo !== undefined) updateData.titulo = data.titulo
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
  if (data.prioridad !== undefined) updateData.prioridad = data.prioridad
  if (data.estado !== undefined) updateData.estado = data.estado
  if (data.oportunidad_id !== undefined) updateData.doc_comercial_id = data.oportunidad_id
  if (data.asignado_a !== undefined) updateData.asignado_id = data.asignado_a
  if (data.fecha_vencimiento !== undefined) updateData.fecha_vencimiento = data.fecha_vencimiento
  if (data.atributos !== undefined) updateData.atributos = data.atributos

  const { error } = await supabase
    .from('tr_tareas')
    .update(updateData)
    .eq('id', tarea_id)

  if (error) {
    console.error('Error updating tarea:', error)
    return {
      success: false,
      message: `Error al actualizar tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/procesos/tareas')
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
    .from('tr_tareas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', tarea_id)

  if (error) {
    console.error('Error soft deleting tarea:', error)
    return {
      success: false,
      message: `Error al eliminar tarea: ${error.message}`
    }
  }

  revalidatePath('/admin/procesos/tareas')

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
    .from('tr_tareas')
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

/**
 * Search for organization members (config_organizacion_miembros + auth.users)
 * Used for asignado_a (responsable) selection
 *
 * @param query - Search query (nombres, apellidos, email)
 * @param organizacion_id - Organization ID for filtering
 * @returns Object with { success, data }
 */
export async function buscarMiembrosOrganizacion(query: string, organizacion_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('config_organizacion_miembros')
    .select(`
      user_id,
      organization_id,
      role,
      nombres,
      apellidos,
      email,
      telefono,
      cargo
    `)
    .eq('organization_id', organizacion_id)
    .is('eliminado_en', null)
    .or(`nombres.ilike.%${query}%,apellidos.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20)

  if (error) {
    console.error('Error searching miembros:', error)
    return { success: false, data: [] }
  }

  return { success: true, data: data || [] }
}

/**
 * Search for commercial documents (tr_doc_comercial)
 * Used for oportunidad_id (documento asociado) selection
 *
 * @param query - Search query (codigo, titulo)
 * @param organizacion_id - Organization ID for filtering
 * @returns Object with { success, data }
 */
export async function buscarDocumentosComerciales(query: string, organizacion_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tr_doc_comercial')
    .select(`
      id,
      codigo,
      tipo,
      estado,
      titulo,
      fecha_doc,
      solicitante_id
    `)
    .eq('organizacion_id', organizacion_id)
    .is('eliminado_en', null)
    .or(`codigo.ilike.%${query}%,titulo.ilike.%${query}%`)
    .order('fecha_doc', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error searching documentos:', error)
    return { success: false, data: [] }
  }

  return { success: true, data: data || [] }
}

/**
 * Bulk reassign tasks to a new user
 *
 * @param tareaIds - Array of task UUIDs
 * @param nuevoAsignadoId - UUID of the new assignee
 * @returns Object with { success, message, count? }
 */
export async function reasignarTareasMasivo(
  tareaIds: string[],
  nuevoAsignadoId: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tr_tareas")
    .update({
      asignado_id: nuevoAsignadoId,
      actualizado_en: new Date().toISOString()
    })
    .in("id", tareaIds)

  if (error) {
    console.error('Error reassigning tasks:', error)
    return { success: false, message: `Error al reasignar tareas: ${error.message}` }
  }

  revalidatePath("/admin/procesos/tareas")
  revalidatePath("/admin/procesos/tareas/dashboard")

  return { success: true, count: tareaIds.length }
}
