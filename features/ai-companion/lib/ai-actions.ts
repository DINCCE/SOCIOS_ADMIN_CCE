'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    // Map entity to table
    const tableMap: Record<string, string> = {
      personas: 'dm_actores',
      empresas: 'dm_actores',
      tareas: 'tr_tareas',
      acciones: 'dm_acciones',
      doc_comerciales: 'tr_doc_comercial',
    }

    const table = tableMap[params.entity]
    if (!table) {
      return { success: false, error: `Unknown entity: ${params.entity}` }
    }

    let dbQuery = supabase
      .from(table)
      .select('*')
      .is('eliminado_en', null)
      .limit(15)

    // Apply tipo_actor filter for personas/empresas
    if (params.entity === 'personas') {
      dbQuery = dbQuery.eq('tipo_actor', 'persona')
    } else if (params.entity === 'empresas') {
      dbQuery = dbQuery.eq('tipo_actor', 'empresa')
    }

    // Apply text search based on entity type
    if (params.query) {
      if (params.entity === 'personas' || params.entity === 'empresas') {
        dbQuery = dbQuery.ilike('nombre_completo', `%${params.query}%`)
      } else if (params.entity === 'tareas' || params.entity === 'doc_comerciales') {
        dbQuery = dbQuery.ilike('titulo', `%${params.query}%`)
      } else if (params.entity === 'acciones') {
        dbQuery = dbQuery.ilike('codigo_accion', `%${params.query}%`)
      }
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
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente'
  fecha_vencimiento?: string
  asignado_id?: string
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .single()

    if (!membership) return { success: false, error: 'No organization found' }

    const { data: tarea, error } = await supabase
      .from('tr_tareas')
      .insert({
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad || 'Media',
        fecha_vencimiento: data.fecha_vencimiento,
        asignado_id: data.asignado_id,
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/procesos/tareas')

    return {
      success: true,
      data: tarea,
      message: `Tarea "${data.titulo}" creada exitosamente`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Create Doc Comercial action
export async function aiCreateDocComercial(data: {
  tipo: 'oportunidad' | 'oferta' | 'pedido_venta' | 'reserva'
  titulo: string
  solicitante_id: string
  valor_estimado?: number
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .single()

    if (!membership) return { success: false, error: 'No organization found' }

    const { data: doc, error } = await supabase
      .from('tr_doc_comercial')
      .insert({
        tipo: data.tipo,
        titulo: data.titulo,
        solicitante_id: data.solicitante_id,
        monto_estimado: data.valor_estimado,
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/procesos/posventas-socio/oportunidades')

    return {
      success: true,
      data: doc,
      message: `Documento comercial "${data.titulo}" creado exitosamente`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Create Persona action
export async function aiCreatePersona(data: {
  primer_nombre: string
  primer_apellido: string
  num_documento?: string
  email_principal?: string
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .single()

    if (!membership) return { success: false, error: 'No organization found' }

    const { data: persona, error } = await supabase
      .from('dm_actores')
      .insert({
        tipo_actor: 'persona',
        primer_nombre: data.primer_nombre,
        primer_apellido: data.primer_apellido,
        num_documento: data.num_documento,
        email_principal: data.email_principal,
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/socios/actores')

    return {
      success: true,
      data: persona,
      message: `Persona "${data.primer_nombre} ${data.primer_apellido}" creada exitosamente`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Create Empresa action
export async function aiCreateEmpresa(data: {
  razon_social: string
  num_documento?: string
  email_principal?: string
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .single()

    if (!membership) return { success: false, error: 'No organization found' }

    const { data: empresa, error } = await supabase
      .from('dm_actores')
      .insert({
        tipo_actor: 'empresa',
        razon_social: data.razon_social,
        num_documento: data.num_documento,
        email_principal: data.email_principal,
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/socios/actores')

    return {
      success: true,
      data: empresa,
      message: `Empresa "${data.razon_social}" creada exitosamente`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Assign Familiar (Relation) action
export async function aiAsignarFamiliar(data: {
  actor_origen_id: string
  actor_destino_id: string
  tipo_relacion: 'familiar' | 'laboral' | 'referencia' | 'membresía' | 'comercial'
  rol_origen: string
  rol_destino: string
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .single()

    if (!membership) return { success: false, error: 'No organization found' }

    const { data: relacion, error } = await supabase
      .from('vn_relaciones_actores')
      .insert({
        bp_origen_id: data.actor_origen_id,
        bp_destino_id: data.actor_destino_id,
        tipo_relacion: data.tipo_relacion,
        rol_origen: data.rol_origen,
        rol_destino: data.rol_destino,
        organizacion_id: membership.organization_id,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/socios/actores')

    return {
      success: true,
      data: relacion,
      message: `Relación creada exitosamente`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Assign Accion (Share) action
export async function aiAsignarAccion(data: {
  accion_id: string
  actor_id: string
  tipo_vinculo: 'propietario' | 'titular' | 'beneficiario'
}) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: membership } = await supabase
      .from('config_organizacion_miembros')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('eliminado_en', null)
      .single()

    if (!membership) return { success: false, error: 'No organization found' }

    // Use RPC function for share assignment as per project guidelines
    const { data: result, error } = await supabase.rpc('vn_asociados_crear_asignacion', {
      p_accion_id: data.accion_id,
      p_asociado_id: data.actor_id,
      p_organizacion_id: membership.organization_id,
      p_tipo_vinculo: data.tipo_vinculo,
      p_modalidad: 'propiedad', // Default modality
      p_plan_comercial: 'regular', // Default plan
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/socios/acciones')

    return {
      success: true,
      data: result,
      message: `Acción asignada exitosamente`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get summary action
export async function aiGetSummary(params: {
  entity: string
  filters?: Record<string, unknown>
}) {
  const supabase = await createClient()

  try {
    // Map entity to table
    const tableMap: Record<string, string> = {
      personas: 'dm_actores',
      empresas: 'dm_actores',
      tareas: 'tr_tareas',
      acciones: 'dm_acciones',
      doc_comerciales: 'tr_doc_comercial',
    }

    const table = tableMap[params.entity]
    if (!table) return { success: false, error: `Unknown entity: ${params.entity}` }

    let dbQuery = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .is('eliminado_en', null)

    if (params.entity === 'personas') dbQuery = dbQuery.eq('tipo_actor', 'persona')
    else if (params.entity === 'empresas') dbQuery = dbQuery.eq('tipo_actor', 'empresa')

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') dbQuery = dbQuery.eq(key, value)
      })
    }

    const { count, error } = await dbQuery
    if (error) return { success: false, error: error.message }

    return {
      success: true,
      entity: params.entity,
      count: count || 0,
      message: `Se encontraron ${count} ${params.entity}`,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
