'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a relationship between two business partners
 * Wrapper for RPC function crear_relacion_bp
 *
 * @param data - Relationship creation data
 * @returns Object with { success, message, relacion_id? }
 */
export async function crearRelacionFromForm(data: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
  descripcion?: string
  fecha_inicio?: string
  atributos?: Record<string, unknown>
}) {
  const supabase = await createClient()

  // Get organization from origen BP
  const { data: bpData } = await supabase
    .from('business_partners')
    .select('organizacion_id')
    .eq('id', data.bp_origen_id)
    .single()

  if (!bpData) {
    return {
      success: false,
      message: 'No se encontró el business partner de origen'
    }
  }

  // Call RPC function
  const { data: rpcResponse, error } = await supabase.rpc('crear_relacion_bp', {
    p_bp_origen_id: data.bp_origen_id,
    p_bp_destino_id: data.bp_destino_id,
    p_tipo_relacion: data.tipo_relacion,
    p_descripcion: data.descripcion,
    p_fecha_inicio: data.fecha_inicio || new Date().toISOString().split('T')[0],
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error creating relationship:', error)
    return {
      success: false,
      message: `Error al crear relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación creada correctamente',
    relacion_id: (rpcResponse as { id: string }).id
  }
}

/**
 * Update an existing relationship
 * Wrapper for RPC function actualizar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @param data - Partial relationship data to update
 * @returns Object with { success, message }
 */
export async function actualizarRelacion(
  relacion_id: string,
  data: {
    tipo_relacion?: 'familiar' | 'laboral' | 'referencia' | 'membresia' | 'comercial' | 'otra'
    descripcion?: string
    atributos?: Record<string, unknown>
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('actualizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_tipo_relacion: data.tipo_relacion,
    p_descripcion: data.descripcion,
    p_atributos: data.atributos
  })

  if (error) {
    console.error('Error updating relationship:', error)
    return {
      success: false,
      message: `Error al actualizar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación actualizada correctamente'
  }
}

/**
 * End a relationship by setting fecha_fin
 * Wrapper for RPC function finalizar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @param fecha_fin - End date (default: today)
 * @returns Object with { success, message }
 */
export async function finalizarRelacion(
  relacion_id: string,
  fecha_fin?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('finalizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_fecha_fin: fecha_fin || new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error finalizing relationship:', error)
    return {
      success: false,
      message: `Error al finalizar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación finalizada correctamente'
  }
}

/**
 * Soft delete a relationship
 * Wrapper for RPC function eliminar_relacion_bp
 *
 * @param relacion_id - The UUID of the relationship
 * @returns Object with { success, message }
 */
export async function eliminarRelacion(relacion_id: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('eliminar_relacion_bp', {
    p_relacion_id: relacion_id
  })

  if (error) {
    console.error('Error deleting relationship:', error)
    return {
      success: false,
      message: `Error al eliminar relación: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/relaciones')

  return {
    success: true,
    message: 'Relación eliminada correctamente'
  }
}

/**
 * Get all relationships for a business partner (bidirectional)
 * Wrapper for enhanced RPC function obtener_relaciones_bp
 *
 * @param bp_id - The UUID of the business partner
 * @param solo_vigentes - Return only active relationships (default: true)
 * @returns Array of relationships or error
 */
export async function obtenerRelaciones(
  bp_id: string,
  solo_vigentes: boolean = true
) {
  const supabase = await createClient()

  // Call enhanced RPC function that returns complete relationship + persona data
  const { data: relaciones, error: rpcError } = await supabase.rpc('obtener_relaciones_bp', {
    p_bp_id: bp_id,
    p_solo_actuales: solo_vigentes
  })

  if (rpcError) {
    console.error('❌ [obtenerRelaciones] Error:', rpcError)
    return {
      success: false,
      message: `Error al obtener relaciones: ${rpcError.message}`,
      data: null
    }
  }

  if (!relaciones || relaciones.length === 0) {
    return {
      success: true,
      data: []
    }
  }

  // Transform RPC result to match component expectations
  const enrichedData = relaciones.map((rel: any) => ({
    id: rel.id,
    bp_origen_id: rel.bp_origen_id,
    bp_destino_id: rel.bp_destino_id,
    tipo_relacion: rel.tipo_relacion,
    rol_origen: rel.rol_origen,
    rol_destino: rel.rol_destino,
    es_bidireccional: rel.es_bidireccional,
    fecha_inicio: rel.fecha_inicio,
    fecha_fin: rel.fecha_fin,
    es_actual: rel.es_actual,
    atributos: rel.atributos || {},
    notas: rel.notas,
    creado_en: rel.creado_en,
    actualizado_en: rel.actualizado_en,
    // Origen persona data
    origen_nombre_completo: rel.origen_nombre_completo || '',
    origen_primer_nombre: rel.origen_primer_nombre || '',
    origen_segundo_nombre: rel.origen_segundo_nombre || '',
    origen_primer_apellido: rel.origen_primer_apellido || '',
    origen_segundo_apellido: rel.origen_segundo_apellido || '',
    origen_identificacion: rel.origen_identificacion || '',
    origen_fecha_nacimiento: rel.origen_fecha_nacimiento || null,
    origen_foto: rel.origen_foto_url || null,
    origen_celular: rel.origen_whatsapp || null,
    origen_codigo_bp: rel.origen_codigo_bp || '',
    origen_email: rel.origen_email_principal || null,
    // Destino persona data
    destino_nombre_completo: rel.destino_nombre_completo || '',
    destino_primer_nombre: rel.destino_primer_nombre || '',
    destino_segundo_nombre: rel.destino_segundo_nombre || '',
    destino_primer_apellido: rel.destino_primer_apellido || '',
    destino_segundo_apellido: rel.destino_segundo_apellido || '',
    destino_identificacion: rel.destino_identificacion || '',
    destino_fecha_nacimiento: rel.destino_fecha_nacimiento || null,
    destino_foto: rel.destino_foto_url || null,
    destino_celular: rel.destino_whatsapp || null,
    destino_codigo_bp: rel.destino_codigo_bp || '',
    destino_email: rel.destino_email_principal || null,
  }))

  console.log(`✅ [obtenerRelaciones] ${enrichedData.length} relaciones obtenidas del RPC`)

  return {
    success: true,
    data: enrichedData
  }
}

/**
 * Link a family member using crear_relacion_bp
 * Wrapper specifically for family relationships
 *
 * @param data - Family linking data
 * @returns Object with { success, message, relacion_id? }
 */
export async function vincularFamiliar(data: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_parentesco: 'esposo_a' | 'hijo_a' | 'padre_madre' | 'hermano_a' | 'otro'
  descripcion?: string
}) {
  const supabase = await createClient()

  // Get organization from origen BP
  const { data: bpData } = await supabase
    .from('business_partners')
    .select('organizacion_id')
    .eq('id', data.bp_origen_id)
    .single()

  if (!bpData) {
    return {
      success: false,
      message: 'No se encontró el business partner de origen'
    }
  }

  // Store relationship type in atributos JSONB
  const atributos = {
    tipo_parentesco: data.tipo_parentesco,
    fecha_vinculacion: new Date().toISOString()
  }

  // Map parentesco to roles
  const parentescoToRoles: Record<string, { rol_origen: string; rol_destino: string }> = {
    esposo_a: { rol_origen: 'esposo/a', rol_destino: 'esposo/a' },
    hijo_a: { rol_origen: 'padre/madre', rol_destino: 'hijo/a' },
    padre_madre: { rol_origen: 'hijo/a', rol_destino: 'padre/madre' },
    hermano_a: { rol_origen: 'hermano/a', rol_destino: 'hermano/a' },
    otro: { rol_origen: 'familiar', rol_destino: 'familiar' }
  }

  const roles = parentescoToRoles[data.tipo_parentesco] || parentescoToRoles.otro

  const { data: rpcResponse, error } = await supabase.rpc('crear_relacion_bp', {
    p_organizacion_id: bpData.organizacion_id,
    p_bp_origen_id: data.bp_origen_id,
    p_bp_destino_id: data.bp_destino_id,
    p_tipo_relacion: 'familiar',
    p_rol_origen: roles.rol_origen,
    p_rol_destino: roles.rol_destino,
    p_es_bidireccional: true,
    p_fecha_inicio: new Date().toISOString().split('T')[0],
    p_atributos: atributos,
    p_notas: data.descripcion
  })

  if (error) {
    console.error('❌ [vincularFamiliar] Error linking family member:', error)
    console.error('❌ [vincularFamiliar] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return {
      success: false,
      message: `Error al vincular familiar: ${error.message}`
    }
  }

  const result = rpcResponse as { success: boolean; relacion_id?: string; message?: string }

  if (!result.success) {
    return {
      success: false,
      message: result.message || 'Error al vincular familiar'
    }
  }

  console.log('✅ [vincularFamiliar] Familiar vinculado exitosamente:', {
    relacion_id: result.relacion_id,
    bp_origen_id: data.bp_origen_id,
    bp_destino_id: data.bp_destino_id,
    tipo_parentesco: data.tipo_parentesco
  })

  revalidatePath(`/admin/socios/personas/${data.bp_origen_id}`)

  return {
    success: true,
    message: 'Familiar vinculado correctamente',
    relacion_id: result.relacion_id
  }
}

/**
 * Update family relationship type (parentesco)
 *
 * @param relacion_id - Relationship ID
 * @param tipo_parentesco - New relationship type
 * @returns Object with { success, message }
 */
export async function editarTipoParentesco(
  relacion_id: string,
  tipo_parentesco: 'esposo_a' | 'hijo_a' | 'padre_madre' | 'hermano_a' | 'otro'
) {
  const supabase = await createClient()

  // Get current relationship
  const { data: currentRel } = await supabase
    .from('bp_relaciones')
    .select('atributos')
    .eq('id', relacion_id)
    .single()

  if (!currentRel) {
    return {
      success: false,
      message: 'Relación no encontrada'
    }
  }

  // Update atributos with new tipo_parentesco
  const nuevosAtributos = {
    ...(currentRel.atributos as Record<string, unknown> || {}),
    tipo_parentesco,
    fecha_actualizacion: new Date().toISOString()
  }

  const { error } = await supabase.rpc('actualizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_atributos: nuevosAtributos
  })

  if (error) {
    console.error('Error updating relationship type:', error)
    return {
      success: false,
      message: `Error al actualizar parentesco: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/personas')

  return {
    success: true,
    message: 'Parentesco actualizado correctamente'
  }
}
