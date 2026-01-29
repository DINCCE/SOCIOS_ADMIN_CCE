'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Server Actions for AI Tools
 *
 * These actions execute the actual database operations requested by AI tools.
 */

// Navigation action - returns data for the client to navigate
export async function aiNavigate(params: {
  path: string
  entity: string
  entityId?: string
}) {
  return {
    success: true,
    navigateTo: params.entityId ? `${params.path}/${params.entityId}` : params.path,
  }
}

// Search action - performs database search
export async function aiSearch(params: {
  entity: string
  query?: string
  filters?: Record<string, unknown>
}) {
  const supabase = await createClient()

  try {
    let query = supabase

    // Map entity to table
    const tableMap: Record<string, string> = {
      personas: 'dm_actores',
      empresas: 'dm_actores',
      tareas: 'tr_doc_comercial',
      acciones: 'dm_acciones',
    }

    const table = tableMap[params.entity]
    if (!table) {
      return { success: false, error: `Unknown entity: ${params.entity}` }
    }

    let dbQuery = query
      .from(table)
      .select('*')
      .is('eliminado_en', null)
      .limit(10)

    // Apply tipo_actor filter for personas/empresas
    if (params.entity === 'personas') {
      dbQuery = dbQuery.eq('tipo_actor', 'persona')
    } else if (params.entity === 'empresas') {
      dbQuery = dbQuery.eq('tipo_actor', 'empresa')
    }

    // Apply text search if provided
    if (params.query) {
      dbQuery = dbQuery.ilike('nombre', `%${params.query}%`)
    }

    // Apply additional filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          dbQuery = dbQuery.eq(key, value)
        }
      })
    }

    const { data, error } = await dbQuery

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      results: data,
      count: data?.length || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Create tarea action
export async function aiCreateTarea(data: {
  titulo: string
  descripcion?: string
  prioridad?: 'baja' | 'media' | 'alta'
  fecha_vencimiento?: string
  asignado_a?: string
}) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .limit(1)
      .single()

    if (!membership) {
      return { success: false, error: 'No organization found' }
    }

    // Create tarea
    const { data: tarea, error } = await supabase
      .from('tr_doc_comercial')
      .insert({
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad || 'media',
        fecha_vencimiento: data.fecha_vencimiento,
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/procesos/tareas')

    return {
      success: true,
      data: tarea,
      message: `Tarea "${data.titulo}" creada exitosamente`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Create acción action
export async function aiCreateAccion(data: {
  tipo_acción: string
  descripcion: string
  actor_id?: string
  fecha_accion?: string
}) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .limit(1)
      .single()

    if (!membership) {
      return { success: false, error: 'No organization found' }
    }

    // Create acción
    const { data: accion, error } = await supabase
      .from('dm_acciones')
      .insert({
        tipo_accion: data.tipo_acción,
        descripcion: data.descripcion,
        actor_id: data.actor_id,
        fecha_accion: data.fecha_accion || new Date().toISOString(),
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/socios/actores')

    return {
      success: true,
      data: accion,
      message: `Acción registrada exitosamente`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Get summary action
export async function aiGetSummary(params: {
  entity: string
  filters?: Record<string, unknown>
}) {
  const supabase = await createClient()

  try {
    let query = supabase

    // Map entity to table
    const tableMap: Record<string, string> = {
      personas: 'dm_actores',
      empresas: 'dm_actores',
      tareas: 'tr_doc_comercial',
      acciones: 'dm_acciones',
    }

    const table = tableMap[params.entity]
    if (!table) {
      return { success: false, error: `Unknown entity: ${params.entity}` }
    }

    let dbQuery = query
      .from(table)
      .select('*', { count: 'exact', head: true })
      .is('eliminado_en', null)

    // Apply tipo_actor filter for personas/empresas
    if (params.entity === 'personas') {
      dbQuery = dbQuery.eq('tipo_actor', 'persona')
    } else if (params.entity === 'empresas') {
      dbQuery = dbQuery.eq('tipo_actor', 'empresa')
    }

    // Apply additional filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          dbQuery = dbQuery.eq(key, value)
        }
      })
    }

    const { count, error } = await dbQuery

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      entity: params.entity,
      count: count || 0,
      message: `Se encontraron ${count} ${params.entity}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
