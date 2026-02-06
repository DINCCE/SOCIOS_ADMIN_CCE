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
    tags?: string[]
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
  if (data.tags !== undefined) updateData.tags = data.tags
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

  // Get current user for audit trail
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      message: 'Usuario no autenticado'
    }
  }

  // Use RPC function with SECURITY DEFINER to bypass RLS
  const { data, error } = await supabase.rpc('soft_delete_tarea_rpc', {
    p_tarea_id: tarea_id,
    p_user_id: user.id
  })

  if (error) {
    console.error('Error soft deleting tarea:', error)
    return {
      success: false,
      message: `Error al eliminar tarea: ${error.message}`
    }
  }

  // Check if the RPC returned an error
  if (data && !data.success) {
    return {
      success: false,
      message: data.message || 'Error al eliminar tarea'
    }
  }

  revalidatePath('/admin/procesos/tareas')
  revalidatePath('/admin/mis-tareas')

  return {
    success: true,
    message: data?.message || 'Tarea eliminada correctamente'
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
  revalidatePath("/admin/analitica")

  return { success: true, count: tareaIds.length }
}

/**
 * Bulk update priority for multiple tasks
 *
 * @param tareaIds - Array of task UUIDs
 * @param prioridad - New priority value (Baja, Media, Alta, Urgente)
 * @returns Object with { success, message }
 */
export async function actualizarPrioridadTareasMasivo(
  tareaIds: string[],
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tr_tareas")
    .update({
      prioridad,
      actualizado_en: new Date().toISOString()
    })
    .in("id", tareaIds)

  if (error) {
    console.error('Error updating task priority:', error)
    return { success: false, message: `Error al actualizar prioridad: ${error.message}` }
  }

  revalidatePath("/admin/procesos/tareas")
  revalidatePath("/admin/mis-tareas")

  return { success: true, message: `Prioridad actualizada para ${tareaIds.length} tareas` }
}

/**
 * Bulk update estado for multiple tasks
 *
 * @param tareaIds - Array of task UUIDs
 * @param estado - New estado value (Pendiente, En Progreso, Terminada, Pausada, Cancelada)
 * @returns Object with { success, message }
 */
export async function actualizarEstadoTareasMasivo(
  tareaIds: string[],
  estado: 'Pendiente' | 'En Progreso' | 'Terminada' | 'Pausada' | 'Cancelada'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tr_tareas")
    .update({
      estado,
      actualizado_en: new Date().toISOString()
    })
    .in("id", tareaIds)

  if (error) {
    console.error('Error updating task estado:', error)
    return { success: false, message: `Error al actualizar estado: ${error.message}` }
  }

  revalidatePath("/admin/procesos/tareas")
  revalidatePath("/admin/mis-tareas")

  return { success: true, message: `Estado actualizado para ${tareaIds.length} tareas` }
}

/**
 * Bulk update fecha_vencimiento for multiple tasks
 *
 * @param tareaIds - Array of task UUIDs
 * @param fechaVencimiento - New fecha_vencimiento value (ISO string or null to clear)
 * @returns Object with { success, message }
 */
export async function actualizarFechaVencimientoTareasMasivo(
  tareaIds: string[],
  fechaVencimiento: string | null
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tr_tareas")
    .update({
      fecha_vencimiento: fechaVencimiento,
      actualizado_en: new Date().toISOString()
    })
    .in("id", tareaIds)

  if (error) {
    console.error('Error updating task fecha_vencimiento:', error)
    return { success: false, message: `Error al actualizar fecha de vencimiento: ${error.message}` }
  }

  revalidatePath("/admin/procesos/tareas")
  revalidatePath("/admin/mis-tareas")

  return { success: true, message: `Fecha de vencimiento actualizada para ${tareaIds.length} tareas` }
}

/**
 * Update task position within a column (Kanban vertical sorting)
 * Reorders all tasks in the same column to maintain consistent positions
 *
 * @param args - Object with tareaId, nuevaPosicion, and estado
 * @returns Object with { success, message }
 */
export async function actualizarPosicionTarea(args: {
  tareaId: string
  nuevaPosicion: number
  estado: string
  organizacion_id?: string
}) {
  const supabase = await createClient()

  // Get organization_id from task if not provided
  let orgId = args.organizacion_id
  if (!orgId) {
    const { data: tarea } = await supabase
      .from('tr_tareas')
      .select('organizacion_id')
      .eq('id', args.tareaId)
      .single()
    orgId = tarea?.organizacion_id
  }

  if (!orgId) {
    return { success: false, message: 'No se pudo determinar la organización' }
  }

  // Get all tasks in the same column (same org, same estado, not deleted)
  // Ordered by current position
  const { data: tareasEnColumna, error: fetchError } = await supabase
    .from('tr_tareas')
    .select('id, posicion_orden')
    .eq('organizacion_id', orgId)
    .eq('estado', args.estado)
    .is('eliminado_en', null)
    .order('posicion_orden', { ascending: true })

  if (fetchError) {
    console.error('Error fetching tareas en columna:', fetchError)
    return { success: false, message: `Error al obtener tareas: ${fetchError.message}` }
  }

  if (!tareasEnColumna || tareasEnColumna.length === 0) {
    return { success: false, message: 'No se encontraron tareas en la columna' }
  }

  // Find the current position of the task being moved
  let currentIndex = tareasEnColumna.findIndex(t => t.id === args.tareaId)

  // If task not found in target column, it's a cross-column move
  if (currentIndex === -1) {
    // Fetch the task from its current column
    const { data: tareaActual } = await supabase
      .from('tr_tareas')
      .select('id, estado, posicion_orden')
      .eq('id', args.tareaId)
      .single()

    if (!tareaActual) {
      return { success: false, message: 'Tarea no encontrada' }
    }

    // Add the task to the array at the desired position
    tareasEnColumna.splice(args.nuevaPosicion, 0, {
      id: tareaActual.id,
      posicion_orden: tareaActual.posicion_orden
    })
  } else {
    // Same-column move: remove from current position first
    const [tareaMovida] = tareasEnColumna.splice(currentIndex, 1)
    // Insert at new position
    tareasEnColumna.splice(args.nuevaPosicion, 0, tareaMovida)
  }

  // Update positions for all tasks in the column
  const updates = tareasEnColumna.map((tarea, index) => ({
    id: tarea.id,
    posicion_orden: index,
    estado: args.estado  // Include estado for cross-column moves
  }))

  // Update each task position individually to avoid RLS issues with upsert
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('tr_tareas')
      .update({
        posicion_orden: update.posicion_orden,
        estado: update.estado,  // Update estado for cross-column moves
        actualizado_en: new Date().toISOString()
      })
      .eq('id', update.id)

    if (updateError) {
      console.error('Error updating posicion_orden:', updateError)
      return { success: false, message: `Error al actualizar posición: ${updateError.message}` }
    }
  }

  revalidatePath("/admin/procesos/tareas")
  revalidatePath("/admin/mis-tareas")

  return {
    success: true,
    message: 'Posición actualizada correctamente'
  }
}
