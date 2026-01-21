'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggle tags para múltiples actores (personas o empresas)
 *
 * @param actorIds - Array de IDs de los actores a actualizar
 * @param tag - Etiqueta a agregar o remover
 * @param add - true para agregar, false para remover
 */
export async function toggleTagsForActores(
  actorIds: string[],
  tag: string,
  add: boolean
) {
  const supabase = await createClient()

  try {
    // Obtener los datos actuales de los actores
    const { data: actores, error: fetchError } = await supabase
      .from('dm_actores')
      .select('id, tags')
      .in('id', actorIds)

    if (fetchError) {
      console.error('Error fetching actores:', fetchError)
      return { success: false, message: 'Error al obtener los actores' }
    }

    // Actualizar cada actor
    const updatePromises = (actores || []).map(async (actor) => {
      const currentTags = (actor.tags as string[]) || []
      let newTags: string[]

      if (add) {
        // Agregar etiqueta si no existe
        newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag]
      } else {
        // Remover etiqueta
        newTags = currentTags.filter((t) => t !== tag)
      }

      return supabase
        .from('dm_actores')
        .update({ tags: newTags })
        .eq('id', actor.id)
    })

    await Promise.all(updatePromises)

    // Revalidar paths
    revalidatePath('/admin/socios/personas')
    revalidatePath('/admin/socios/empresas')

    return {
      success: true,
      message: add
        ? `Etiqueta "${tag}" agregada a ${actorIds.length} actores`
        : `Etiqueta "${tag}" removida de ${actorIds.length} actores`,
    }
  } catch (error) {
    console.error('Error in toggleTagsForActores:', error)
    return { success: false, message: 'Error al actualizar etiquetas' }
  }
}

/**
 * Crear una nueva etiqueta y asignarla a múltiples actores
 *
 * @param actorIds - Array de IDs de los actores a actualizar
 * @param tag - Nueva etiqueta a crear y asignar
 */
export async function createAndAssignTag(
  actorIds: string[],
  tag: string
) {
  const supabase = await createClient()

  try {
    // Validar que la etiqueta no esté vacía
    if (!tag.trim()) {
      return { success: false, message: 'La etiqueta no puede estar vacía' }
    }

    // Normalizar la etiqueta (trim y lowercase si prefieres)
    const normalizedTag = tag.trim()

    // Obtener los datos actuales de los actores
    const { data: actores, error: fetchError } = await supabase
      .from('dm_actores')
      .select('id, tags')
      .in('id', actorIds)

    if (fetchError) {
      console.error('Error fetching actores:', fetchError)
      return { success: false, message: 'Error al obtener los actores' }
    }

    // Actualizar cada actor agregando la nueva etiqueta
    const updatePromises = (actores || []).map(async (actor) => {
      const currentTags = (actor.tags as string[]) || []
      // Solo agregar si no existe
      const newTags = currentTags.includes(normalizedTag)
        ? currentTags
        : [...currentTags, normalizedTag]

      return supabase
        .from('dm_actores')
        .update({ tags: newTags })
        .eq('id', actor.id)
    })

    await Promise.all(updatePromises)

    // Revalidar paths
    revalidatePath('/admin/socios/personas')
    revalidatePath('/admin/socios/empresas')

    return {
      success: true,
      message: `Etiqueta "${normalizedTag}" creada y asignada a ${actorIds.length} actores`,
    }
  } catch (error) {
    console.error('Error in createAndAssignTag:', error)
    return { success: false, message: 'Error al crear etiqueta' }
  }
}

// ============================================================================
// TAREAS (tr_tareas)
// ============================================================================

/**
 * Toggle tags para múltiples tareas
 *
 * @param tareaIds - Array de IDs de las tareas a actualizar
 * @param tag - Etiqueta a agregar o remover
 * @param add - true para agregar, false para remover
 */
export async function toggleTagsForTareas(
  tareaIds: string[],
  tag: string,
  add: boolean
) {
  const supabase = await createClient()

  try {
    // Obtener los datos actuales de las tareas
    const { data: tareas, error: fetchError } = await supabase
      .from('tr_tareas')
      .select('id, tags')
      .in('id', tareaIds)

    if (fetchError) {
      console.error('Error fetching tareas:', fetchError)
      return { success: false, message: 'Error al obtener las tareas' }
    }

    // Actualizar cada tarea
    const updatePromises = (tareas || []).map(async (tarea) => {
      const currentTags = (tarea.tags as string[]) || []
      let newTags: string[]

      if (add) {
        // Agregar etiqueta si no existe
        newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag]
      } else {
        // Remover etiqueta
        newTags = currentTags.filter((t) => t !== tag)
      }

      return supabase
        .from('tr_tareas')
        .update({ tags: newTags })
        .eq('id', tarea.id)
    })

    await Promise.all(updatePromises)

    // Revalidar paths
    revalidatePath('/admin/procesos/tareas')

    return {
      success: true,
      message: add
        ? `Etiqueta "${tag}" agregada a ${tareaIds.length} tareas`
        : `Etiqueta "${tag}" removida de ${tareaIds.length} tareas`,
    }
  } catch (error) {
    console.error('Error in toggleTagsForTareas:', error)
    return { success: false, message: 'Error al actualizar etiquetas' }
  }
}

/**
 * Crear una nueva etiqueta y asignarla a múltiples tareas
 *
 * @param tareaIds - Array de IDs de las tareas a actualizar
 * @param tag - Nueva etiqueta a crear y asignar
 */
export async function createAndAssignTagForTareas(
  tareaIds: string[],
  tag: string
) {
  const supabase = await createClient()

  try {
    if (!tag.trim()) {
      return { success: false, message: 'La etiqueta no puede estar vacía' }
    }

    const normalizedTag = tag.trim()

    const { data: tareas, error: fetchError } = await supabase
      .from('tr_tareas')
      .select('id, tags')
      .in('id', tareaIds)

    if (fetchError) {
      console.error('Error fetching tareas:', fetchError)
      return { success: false, message: 'Error al obtener las tareas' }
    }

    const updatePromises = (tareas || []).map(async (tarea) => {
      const currentTags = (tarea.tags as string[]) || []
      const newTags = currentTags.includes(normalizedTag)
        ? currentTags
        : [...currentTags, normalizedTag]

      return supabase
        .from('tr_tareas')
        .update({ tags: newTags })
        .eq('id', tarea.id)
    })

    await Promise.all(updatePromises)

    revalidatePath('/admin/procesos/tareas')

    return {
      success: true,
      message: `Etiqueta "${normalizedTag}" creada y asignada a ${tareaIds.length} tareas`,
    }
  } catch (error) {
    console.error('Error in createAndAssignTagForTareas:', error)
    return { success: false, message: 'Error al crear etiqueta' }
  }
}

// ============================================================================
// DOCUMENTOS COMERCIALES (tr_doc_comercial - oportunidades)
// ============================================================================

/**
 * Toggle tags para múltiples documentos comerciales (oportunidades, ofertas, etc.)
 *
 * @param documentoIds - Array de IDs de los documentos a actualizar
 * @param tag - Etiqueta a agregar o remover
 * @param add - true para agregar, false para remover
 */
export async function toggleTagsForDocumentos(
  documentoIds: string[],
  tag: string,
  add: boolean
) {
  const supabase = await createClient()

  try {
    // Obtener los datos actuales de los documentos
    const { data: documentos, error: fetchError } = await supabase
      .from('tr_doc_comercial')
      .select('id, tags')
      .in('id', documentoIds)

    if (fetchError) {
      console.error('Error fetching documentos:', fetchError)
      return { success: false, message: 'Error al obtener los documentos' }
    }

    // Actualizar cada documento
    const updatePromises = (documentos || []).map(async (documento) => {
      const currentTags = (documento.tags as string[]) || []
      let newTags: string[]

      if (add) {
        // Agregar etiqueta si no existe
        newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag]
      } else {
        // Remover etiqueta
        newTags = currentTags.filter((t) => t !== tag)
      }

      return supabase
        .from('tr_doc_comercial')
        .update({ tags: newTags })
        .eq('id', documento.id)
    })

    await Promise.all(updatePromises)

    // Revalidar paths
    revalidatePath('/admin/procesos/oportunidades')

    return {
      success: true,
      message: add
        ? `Etiqueta "${tag}" agregada a ${documentoIds.length} documentos`
        : `Etiqueta "${tag}" removida de ${documentoIds.length} documentos`,
    }
  } catch (error) {
    console.error('Error in toggleTagsForDocumentos:', error)
    return { success: false, message: 'Error al actualizar etiquetas' }
  }
}

/**
 * Crear una nueva etiqueta y asignarla a múltiples documentos comerciales
 *
 * @param documentoIds - Array de IDs de los documentos a actualizar
 * @param tag - Nueva etiqueta a crear y asignar
 */
export async function createAndAssignTagForDocumentos(
  documentoIds: string[],
  tag: string
) {
  const supabase = await createClient()

  try {
    if (!tag.trim()) {
      return { success: false, message: 'La etiqueta no puede estar vacía' }
    }

    const normalizedTag = tag.trim()

    const { data: documentos, error: fetchError } = await supabase
      .from('tr_doc_comercial')
      .select('id, tags')
      .in('id', documentoIds)

    if (fetchError) {
      console.error('Error fetching documentos:', fetchError)
      return { success: false, message: 'Error al obtener los documentos' }
    }

    const updatePromises = (documentos || []).map(async (documento) => {
      const currentTags = (documento.tags as string[]) || []
      const newTags = currentTags.includes(normalizedTag)
        ? currentTags
        : [...currentTags, normalizedTag]

      return supabase
        .from('tr_doc_comercial')
        .update({ tags: newTags })
        .eq('id', documento.id)
    })

    await Promise.all(updatePromises)

    revalidatePath('/admin/procesos/oportunidades')

    return {
      success: true,
      message: `Etiqueta "${normalizedTag}" creada y asignada a ${documentoIds.length} documentos`,
    }
  } catch (error) {
    console.error('Error in createAndAssignTagForDocumentos:', error)
    return { success: false, message: 'Error al crear etiqueta' }
  }
}

// ============================================================================
// ACCIONES (dm_acciones)
// ============================================================================

/**
 * Toggle tags para múltiples acciones
 *
 * @param accionIds - Array de IDs de las acciones a actualizar
 * @param tag - Etiqueta a agregar o remover
 * @param add - true para agregar, false para remover
 */
export async function toggleTagsForAcciones(
  accionIds: string[],
  tag: string,
  add: boolean
) {
  const supabase = await createClient()

  try {
    // Obtener los datos actuales de las acciones
    const { data: acciones, error: fetchError } = await supabase
      .from('dm_acciones')
      .select('id, tags')
      .in('id', accionIds)

    if (fetchError) {
      console.error('Error fetching acciones:', fetchError)
      return { success: false, message: 'Error al obtener las acciones' }
    }

    // Actualizar cada acción
    const updatePromises = (acciones || []).map(async (accion) => {
      const currentTags = (accion.tags as string[]) || []
      let newTags: string[]

      if (add) {
        // Agregar etiqueta si no existe
        newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag]
      } else {
        // Remover etiqueta
        newTags = currentTags.filter((t) => t !== tag)
      }

      return supabase
        .from('dm_acciones')
        .update({ tags: newTags })
        .eq('id', accion.id)
    })

    await Promise.all(updatePromises)

    // Revalidar paths
    revalidatePath('/admin/procesos/acciones')

    return {
      success: true,
      message: add
        ? `Etiqueta "${tag}" agregada a ${accionIds.length} acciones`
        : `Etiqueta "${tag}" removida de ${accionIds.length} acciones`,
    }
  } catch (error) {
    console.error('Error in toggleTagsForAcciones:', error)
    return { success: false, message: 'Error al actualizar etiquetas' }
  }
}

/**
 * Crear una nueva etiqueta y asignarla a múltiples acciones
 *
 * @param accionIds - Array de IDs de las acciones a actualizar
 * @param tag - Nueva etiqueta a crear y asignar
 */
export async function createAndAssignTagForAcciones(
  accionIds: string[],
  tag: string
) {
  const supabase = await createClient()

  try {
    if (!tag.trim()) {
      return { success: false, message: 'La etiqueta no puede estar vacía' }
    }

    const normalizedTag = tag.trim()

    const { data: acciones, error: fetchError } = await supabase
      .from('dm_acciones')
      .select('id, tags')
      .in('id', accionIds)

    if (fetchError) {
      console.error('Error fetching acciones:', fetchError)
      return { success: false, message: 'Error al obtener las acciones' }
    }

    const updatePromises = (acciones || []).map(async (accion) => {
      const currentTags = (accion.tags as string[]) || []
      const newTags = currentTags.includes(normalizedTag)
        ? currentTags
        : [...currentTags, normalizedTag]

      return supabase
        .from('dm_acciones')
        .update({ tags: newTags })
        .eq('id', accion.id)
    })

    await Promise.all(updatePromises)

    revalidatePath('/admin/procesos/acciones')

    return {
      success: true,
      message: `Etiqueta "${normalizedTag}" creada y asignada a ${accionIds.length} acciones`,
    }
  } catch (error) {
    console.error('Error in createAndAssignTagForAcciones:', error)
    return { success: false, message: 'Error al crear etiqueta' }
  }
}
