'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TrComentarioEntidadTipo } from '@/lib/db-types'

export type EntidadTipo = TrComentarioEntidadTipo

/**
 * Crear un nuevo comentario
 *
 * @param data - Comentario creation data
 * @returns Object with { success, message, comentario_id? }
 */
export async function crearComentario(data: {
  entidad_tipo: EntidadTipo
  entidad_id: string
  contenido: string
  es_interno?: boolean
  es_resolucion?: boolean
}) {
  const supabase = await createClient()

  // Obtener organización activa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No autenticado' }
  }

  const { data: orgMember } = await supabase
    .from('config_organizacion_miembros')
    .select('organization_id')
    .eq('user_id', user.id)
    .is('eliminado_en', null)
    .single()

  if (!orgMember?.organization_id) {
    return { success: false, message: 'No se encontró una organización activa' }
  }

  const { data: comentario, error } = await supabase
    .from('tr_comentarios')
    .insert({
      entidad_tipo: data.entidad_tipo,
      entidad_id: data.entidad_id,
      contenido: data.contenido,
      es_interno: data.es_interno ?? false,
      es_resolucion: data.es_resolucion ?? false,
      organizacion_id: orgMember.organization_id,
      creado_por: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating comentario:', error)
    return { success: false, message: error.message }
  }

  // Revalidar paths relevantes
  revalidatePath('/admin/procesos/tareas')
  revalidatePath('/admin/procesos/documentos-comerciales')

  return { success: true, comentario_id: comentario.id }
}

/**
 * Obtener comentarios de una entidad
 *
 * @param entidad_tipo - Tipo de entidad
 * @param entidad_id - UUID de la entidad
 * @returns Object with { success, message, data }
 */
export async function obtenerComentarios(
  entidad_tipo: EntidadTipo,
  entidad_id: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_comentarios_org')
    .select('*')
    .eq('entidad_tipo', entidad_tipo)
    .eq('entidad_id', entidad_id)
    .order('creado_en', { ascending: false })

  if (error) {
    console.error('Error fetching comentarios:', error)
    return { success: false, message: error.message, data: [] }
  }

  return { success: true, data }
}

/**
 * Actualizar un comentario
 *
 * @param comentario_id - UUID del comentario
 * @param contenido - Nuevo contenido
 * @returns Object with { success, message }
 */
export async function actualizarComentario(
  comentario_id: string,
  contenido: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tr_comentarios')
    .update({
      contenido,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', comentario_id)

  if (error) {
    console.error('Error updating comentario:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/admin/procesos/tareas')
  revalidatePath('/admin/procesos/documentos-comerciales')

  return { success: true, message: 'Comentario actualizado correctamente' }
}

/**
 * Eliminar un comentario (soft delete)
 *
 * @param comentario_id - UUID del comentario
 * @returns Object with { success, message }
 */
export async function eliminarComentario(comentario_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tr_comentarios')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', comentario_id)

  if (error) {
    console.error('Error deleting comentario:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/admin/procesos/tareas')
  revalidatePath('/admin/procesos/documentos-comerciales')

  return { success: true, message: 'Comentario eliminado correctamente' }
}
