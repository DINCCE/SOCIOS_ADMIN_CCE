'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Search for business partners (actores) by code or name
 * Used in the Nueva Doc.Comercial drawer for solicitante selection
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
 * Create a new Documento Comercial
 *
 * @param data - Doc.Comercial creation data
 * @returns Object with { success, message, doc_comercial_id? }
 */
export async function crearDocComercial(data: {
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
    console.error('Error creating doc comercial:', error)
    return {
      success: false,
      message: `Error al crear documento comercial: ${error.message}`
    }
  }

  // Update tags separately if provided
  const docComercialId = (rpcResponse as { id: string }).id
  if (data.tags && data.tags.length > 0) {
    const { error: tagsError } = await supabase
      .from('tr_doc_comercial')
      .update({ tags: data.tags })
      .eq('id', docComercialId)

    if (tagsError) {
      console.error('Error updating tags:', tagsError)
      // Don't fail the whole operation if tags fail, just log it
    }
  }

  revalidatePath('/admin/procesos/documentos-comerciales')

  return {
    success: true,
    message: 'Documento comercial creado correctamente',
    doc_comercial_id: docComercialId
  }
}

/**
 * Update an Documento Comercial
 *
 * @param doc_comercial_id - The UUID of document
 * @param data - Partial doc data to update
 * @returns Object with { success, message }
 */
export async function actualizarDocComercial(
  doc_comercial_id: string,
  data: {
    estado?: 'nueva' | 'en_progreso' | 'ganada' | 'perdida' | 'descartada' | 'Nueva' | 'En Progreso' | 'Ganada' | 'Pérdida' | 'Descartada'
    responsable_id?: string
    monto_estimado?: number
    notas?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    actualizado_en: new Date().toISOString()
  }

  if (data.estado !== undefined) updateData.estado = data.estado
  if (data.responsable_id !== undefined) updateData.responsable_id = data.responsable_id
  if (data.monto_estimado !== undefined) updateData.monto_estimado = data.monto_estimado
  if (data.notas !== undefined) updateData.notas = data.notas
  if (data.atributos !== undefined) updateData.atributos = data.atributos

  const { error } = await supabase
    .from('tr_doc_comercial')
    .update(updateData)
    .eq('id', doc_comercial_id)

  if (error) {
    console.error('Error updating document:', error)
    return {
      success: false,
      message: `Error al actualizar documento comercial: ${error.message}`
    }
  }

  revalidatePath('/admin/procesos/documentos-comerciales')
  revalidatePath(`/admin/documentos-comerciales/${doc_comercial_id}`)

  return {
    success: true,
    message: 'Documento comercial actualizado correctamente'
  }
}

/**
 * Soft delete an Documento Comercial
 *
 * @param doc_comercial_id - The UUID of document
 * @returns Object with { success, message }
 */
export async function softDeleteDocComercial(doc_comercial_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tr_doc_comercial')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', doc_comercial_id)

  if (error) {
    console.error('Error soft deleting document:', error)
    return {
      success: false,
      message: `Error al eliminar documento comercial: ${error.message}`
    }
  }

  revalidatePath('/admin/procesos/documentos-comerciales')

  return {
    success: true,
    message: 'Documento comercial eliminado correctamente'
  }
}

/**
 * List all Documentos Comerciales for an organization
 *
 * @param organizacion_id - The UUID of the organization
 * @param filters - Optional filters (estado, tipo)
 * @returns Array of docs or error
 */
export async function listDocComerciales(
  organizacion_id: string,
  filters?: {
    estado?: 'nueva' | 'en_progreso' | 'ganada' | 'perdida' | 'descartada'
    tipo?: 'Solicitud Retiro' | 'Solicitud Ingreso'
  }
) {
  const supabase = await createClient()

  let query = supabase
    .from('tr_doc_comercial')
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
    console.error('Error fetching documents:', error)
    return {
      success: false,
      message: `Error al obtener documentos comerciales: ${error.message}`,
      data: null
    }
  }

  return {
    success: true,
    data
  }
}
