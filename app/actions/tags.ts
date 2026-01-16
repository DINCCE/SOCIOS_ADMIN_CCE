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
