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
    .from('dm_actores')
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
export interface EnrichedRelationship {
  id: string
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: string
  rol_origen: string
  rol_destino: string
  es_bidireccional: boolean
  fecha_inicio: string
  fecha_fin: string | null
  es_actual: boolean
  atributos: Record<string, unknown>
  notas: string | null
  creado_en: string
  actualizado_en: string
  origen_nombre_completo: string
  origen_primer_nombre: string
  origen_segundo_nombre: string
  origen_primer_apellido: string
  origen_segundo_apellido: string
  origen_identificacion: string
  origen_fecha_nacimiento: string | null
  origen_foto: string | null
  origen_celular: string | null
  origen_codigo_bp: string
  origen_email: string | null
  destino_nombre_completo: string
  destino_primer_nombre: string
  destino_segundo_nombre: string
  destino_primer_apellido: string
  destino_segundo_apellido: string
  destino_identificacion: string
  destino_fecha_nacimiento: string | null
  destino_foto: string | null
  destino_celular: string | null
  destino_codigo_bp: string
  destino_email: string | null
}

interface RawRelationshipRPC {
  id: string
  bp_origen_id: string
  bp_destino_id: string
  tipo_relacion: string
  rol_origen: string
  rol_destino: string
  es_bidireccional: boolean
  fecha_inicio: string
  fecha_fin: string | null
  es_actual: boolean
  atributos: Record<string, unknown>
  notas: string | null
  creado_en: string
  actualizado_en: string
  // Dynamic fields from RPC
  origen_nombre_completo?: string
  origen_primer_nombre?: string
  origen_segundo_nombre?: string
  origen_primer_apellido?: string
  origen_segundo_apellido?: string
  origen_identificacion?: string
  origen_fecha_nacimiento?: string
  origen_foto_url?: string
  origen_whatsapp?: string
  origen_codigo_bp?: string
  origen_email_principal?: string
  destino_nombre_completo?: string
  destino_primer_nombre?: string
  destino_segundo_nombre?: string
  destino_primer_apellido?: string
  destino_segundo_apellido?: string
  destino_identificacion?: string
  destino_fecha_nacimiento?: string
  destino_foto_url?: string
  destino_whatsapp?: string
  destino_codigo_bp?: string
  destino_email_principal?: string
  [key: string]: unknown
}

/**
 * Get all relationships for a business partner (bidirectional)
 * Uses native Supabase CRUD on vn_relaciones_actores
 *
 * @param bp_id - The UUID of the business partner
 * @param solo_vigentes - Return only active relationships (default: true)
 * @returns Array of relationships or error
 */
export async function obtenerRelaciones(
  bp_id: string,
  solo_vigentes: boolean = true
): Promise<{ success: boolean; message?: string; data?: EnrichedRelationship[] }> {
  console.log(`🔍 [obtenerRelaciones] Buscando relaciones para actor: ${bp_id}`)
  const supabase = await createClient()

  // Consulta simple sobre la tabla de vinculación uniéndola con actores
  // Seleccionamos campos específicos para evitar ambigüedades
  let queryBuilder = supabase
    .from('vn_relaciones_actores')
    .select(`
      id,
      bp_origen_id,
      bp_destino_id,
      tipo_relacion,
      rol_origen,
      rol_destino,
      es_bidireccional,
      fecha_inicio,
      fecha_fin,
      es_actual,
      atributos,
      notas,
      creado_en,
      actualizado_en,
      origen:dm_actores!bp_origen_id(
        id,
        codigo_bp,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        num_documento,
        fecha_nacimiento,
        telefono_principal,
        email_principal
      ),
      destino:dm_actores!bp_destino_id(
        id,
        codigo_bp,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        num_documento,
        fecha_nacimiento,
        telefono_principal,
        email_principal
      )
    `)
    .or(`bp_origen_id.eq.${bp_id},bp_destino_id.eq.${bp_id}`)
    .is('eliminado_en', null)

  // Filtro de vigencia: Usamos fecha_fin ya que es_actual es una columna generada
  if (solo_vigentes) {
    queryBuilder = queryBuilder.is('fecha_fin', null)
  }

  const { data: relaciones, error } = await queryBuilder

  if (error) {
    console.error('❌ [obtenerRelaciones] Error de base de datos:', error)
    return {
      success: false,
      message: `Error al obtener relaciones: ${error.message}`
    }
  }

  if (!relaciones) {
    console.log('ℹ️ [obtenerRelaciones] No se encontraron relaciones')
    return { success: true, data: [] }
  }

  console.log(`✅ [obtenerRelaciones] Se encontraron ${relaciones.length} relaciones`)

  // Transformar a la estructura EnrichedRelationship esperada por la UI
  const enrichedData: EnrichedRelationship[] = relaciones.map((rel: any) => {
    const buildName = (actor: any) =>
      `${actor.primer_nombre} ${actor.segundo_nombre || ''} ${actor.primer_apellido} ${actor.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()

    const origin = Array.isArray(rel.origen) ? rel.origen[0] : rel.origen
    const destination = Array.isArray(rel.destino) ? rel.destino[0] : rel.destino

    return {
      id: rel.id,
      bp_origen_id: rel.bp_origen_id,
      bp_destino_id: rel.bp_destino_id,
      tipo_relacion: rel.tipo_relacion,
      rol_origen: rel.rol_origen,
      rol_destino: rel.rol_destino,
      es_bidireccional: rel.es_bidireccional,
      fecha_inicio: rel.fecha_inicio,
      fecha_fin: rel.fecha_fin,
      es_actual: rel.es_actual ?? (rel.fecha_fin === null),
      atributos: rel.atributos || {},
      notas: rel.notas,
      creado_en: rel.creado_en,
      actualizado_en: rel.actualizado_en,
      // Origen data
      origen_nombre_completo: origin ? buildName(origin) : '',
      origen_primer_nombre: origin?.primer_nombre || '',
      origen_segundo_nombre: origin?.segundo_nombre || '',
      origen_primer_apellido: origin?.primer_apellido || '',
      origen_segundo_apellido: origin?.segundo_apellido || '',
      origen_identificacion: origin?.num_documento || '',
      origen_fecha_nacimiento: origin?.fecha_nacimiento || null,
      origen_foto: null,
      origen_celular: origin?.telefono_principal || null,
      origen_codigo_bp: origin?.codigo_bp || '',
      origen_email: origin?.email_principal || null,
      // Destino data
      destino_nombre_completo: destination ? buildName(destination) : '',
      destino_primer_nombre: destination?.primer_nombre || '',
      destino_segundo_nombre: destination?.segundo_nombre || '',
      destino_primer_apellido: destination?.primer_apellido || '',
      destino_segundo_apellido: destination?.segundo_apellido || '',
      destino_identificacion: destination?.num_documento || '',
      destino_fecha_nacimiento: destination?.fecha_nacimiento || null,
      destino_foto: null,
      destino_celular: destination?.telefono_principal || null,
      destino_codigo_bp: destination?.codigo_bp || '',
      destino_email: destination?.email_principal || null,
    }
  })

  return {
    success: true,
    data: enrichedData
  }
}

/**
 * Link a family member using native Supabase CRUD
 * Implements strict business rules for unique roles
 *
 * @param data - Family linking data
 * @returns Object with { success, message, relacion_id? }
 */
export async function vincularFamiliar(data: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_parentesco: 'cónyuge' | 'hijo/a' | 'padre' | 'madre' | 'hermano/a' | 'suegro' | 'suegra' | 'yerno' | 'nuera' | 'otro'
  descripcion?: string
}) {
  console.log('🔗 [vincularFamiliar] Iniciando vinculación:', data)
  const supabase = await createClient()

  const { data: bpData } = await supabase
    .from('dm_actores')
    .select('organizacion_id, genero_actor')
    .eq('id', data.bp_origen_id)
    .single()

  if (!bpData) {
    return { success: false, message: 'No se encontró el actor de origen' }
  }

  // 2. Definir roles y si el parentesco es único
  const uniqueRoles = ['cónyuge', 'padre', 'madre', 'suegro', 'suegra']
  const isUnique = uniqueRoles.includes(data.tipo_parentesco)

  // Determinar roles recíprocos basados en el género del origen (quien está viendo el perfil)
  const genero = bpData.genero_actor
  const soyPadreMadre = genero === 'masculino' ? 'padre' : genero === 'femenino' ? 'madre' : 'otro'
  const soyYernoNuera = genero === 'masculino' ? 'yerno' : genero === 'femenino' ? 'nuera' : 'otro'
  const soySuegroSuegra = genero === 'masculino' ? 'suegro' : genero === 'femenino' ? 'suegra' : 'otro'

  const parentescoToRoles: Record<string, { rol_origen: string; rol_destino: string }> = {
    cónyuge: { rol_origen: 'cónyuge', rol_destino: 'cónyuge' },
    "hijo/a": { rol_origen: soyPadreMadre, rol_destino: 'hijo/a' },
    padre: { rol_origen: 'hijo/a', rol_destino: 'padre' },
    madre: { rol_origen: 'hijo/a', rol_destino: 'madre' },
    suegro: { rol_origen: soyYernoNuera, rol_destino: 'suegro' },
    suegra: { rol_origen: soyYernoNuera, rol_destino: 'suegra' },
    yerno: { rol_origen: soySuegroSuegra, rol_destino: 'yerno' },
    nuera: { rol_origen: soySuegroSuegra, rol_destino: 'nuera' },
    "hermano/a": { rol_origen: 'hermano/a', rol_destino: 'hermano/a' },
    otro: { rol_origen: 'otro', rol_destino: 'otro' }
  }

  const roles = parentescoToRoles[data.tipo_parentesco] || parentescoToRoles.otro

  // 3. Si el rol es único, invalidar anteriores (soft delete)
  if (isUnique) {
    console.log(`🛡️ [vincularFamiliar] Verificando rol único: ${data.tipo_parentesco}`)
    // Buscamos si ya existe una relación activa del mismo tipo para este origen
    // Nota: attributes->>tipo_parentesco depende de cómo se guarda
    const { data: existingRels } = await supabase
      .from('vn_relaciones_actores')
      .select('id')
      .eq('bp_origen_id', data.bp_origen_id)
      .eq('tipo_relacion', 'familiar')
      .eq('es_actual', true)
      .filter('atributos->>tipo_parentesco', 'eq', data.tipo_parentesco)

    if (existingRels && existingRels.length > 0) {
      console.log(`♻️ [vincularFamiliar] Invalidando ${existingRels.length} relación(es) anterior(es)`)
      const idsToInvalidate = existingRels.map(r => r.id)
      await supabase
        .from('vn_relaciones_actores')
        .update({
          fecha_fin: new Date().toISOString().split('T')[0]
        })
        .in('id', idsToInvalidate)
    }
  }

  // 4. Crear la nueva relación
  const now = new Date().toISOString()
  const { data: newRel, error } = await supabase
    .from('vn_relaciones_actores')
    .insert({
      organizacion_id: bpData.organizacion_id,
      bp_origen_id: data.bp_origen_id,
      bp_destino_id: data.bp_destino_id,
      tipo_relacion: 'familiar',
      rol_origen: roles.rol_origen,
      rol_destino: roles.rol_destino,
      es_bidireccional: true,
      fecha_inicio: now.split('T')[0],
      notas: data.descripcion || null,
      atributos: {
        tipo_parentesco: data.tipo_parentesco,
        fecha_vinculacion: now
      }
    })
    .select('id')
    .single()

  if (error) {
    console.error('❌ [vincularFamiliar] Error:', error)
    return { success: false, message: `Error al vincular: ${error.message}` }
  }

  console.log('✅ [vincularFamiliar] Éxito:', newRel.id)
  revalidatePath(`/admin/socios/personas/${data.bp_origen_id}`)

  return {
    success: true,
    message: 'Familiar vinculado correctamente',
    relacion_id: newRel.id
  }
}

/**
 * Update family relationship type (parentesco) using native Supabase CRUD
 * Implements strict business rules for unique roles
 *
 * @param relacion_id - Relationship ID
 * @param tipo_parentesco - New relationship type
 * @returns Object with { success, message }
 */
export async function editarTipoParentesco(
  relacion_id: string,
  tipo_parentesco: 'cónyuge' | 'hijo/a' | 'padre' | 'madre' | 'hermano/a' | 'suegro' | 'suegra' | 'yerno' | 'nuera' | 'otro'
) {
  console.log(`✏️ [editarTipoParentesco] Editando relación ${relacion_id} a ${tipo_parentesco}`)
  const supabase = await createClient()

  // 1. Obtener la relación actual para saber el origen
  const { data: currentRel } = await supabase
    .from('vn_relaciones_actores')
    .select(`
      bp_origen_id, 
      atributos,
      origen:dm_actores!bp_origen_id(genero_actor)
    `)
    .eq('id', relacion_id)
    .single()

  if (!currentRel) {
    return { success: false, message: 'Relación no encontrada' }
  }

  const bp_origen_id = currentRel.bp_origen_id
  const uniqueRoles = ['cónyuge', 'padre', 'madre', 'suegro', 'suegra']
  const isUnique = uniqueRoles.includes(tipo_parentesco)

  // 2. Si el nuevo rol es único, invalidar otros activos del mismo tipo (excepto este)
  if (isUnique) {
    const { data: existingRels } = await supabase
      .from('vn_relaciones_actores')
      .select('id')
      .eq('bp_origen_id', bp_origen_id)
      .eq('tipo_relacion', 'familiar')
      .eq('es_actual', true)
      .neq('id', relacion_id)
      .filter('atributos->>tipo_parentesco', 'eq', tipo_parentesco)

    if (existingRels && existingRels.length > 0) {
      console.log(`♻️ [editarTipoParentesco] Reemplazando rol único anterior`)
      await supabase
        .from('vn_relaciones_actores')
        .update({
          fecha_fin: new Date().toISOString().split('T')[0]
        })
        .in('id', existingRels.map(r => r.id))
    }
  }

  // 3. Mapeo de roles basado en el género del origen
  const originActor = Array.isArray(currentRel.origen) ? currentRel.origen[0] : currentRel.origen
  const genero = (originActor as any)?.genero_actor
  const soyPadreMadre = genero === 'masculino' ? 'padre' : genero === 'femenino' ? 'madre' : 'otro'
  const soyYernoNuera = genero === 'masculino' ? 'yerno' : genero === 'femenino' ? 'nuera' : 'otro'
  const soySuegroSuegra = genero === 'masculino' ? 'suegro' : genero === 'femenino' ? 'suegra' : 'otro'

  const parentescoToRoles: Record<string, { rol_origen: string; rol_destino: string }> = {
    cónyuge: { rol_origen: 'cónyuge', rol_destino: 'cónyuge' },
    "hijo/a": { rol_origen: soyPadreMadre, rol_destino: 'hijo/a' },
    padre: { rol_origen: 'hijo/a', rol_destino: 'padre' },
    madre: { rol_origen: 'hijo/a', rol_destino: 'madre' },
    suegro: { rol_origen: soyYernoNuera, rol_destino: 'suegro' },
    suegra: { rol_origen: soyYernoNuera, rol_destino: 'suegra' },
    yerno: { rol_origen: soySuegroSuegra, rol_destino: 'yerno' },
    nuera: { rol_origen: soySuegroSuegra, rol_destino: 'nuera' },
    "hermano/a": { rol_origen: 'hermano/a', rol_destino: 'hermano/a' },
    otro: { rol_origen: 'otro', rol_destino: 'otro' }
  }
  const roles = parentescoToRoles[tipo_parentesco] || parentescoToRoles.otro

  // 4. Actualizar registro
  const { error } = await supabase
    .from('vn_relaciones_actores')
    .update({
      rol_origen: roles.rol_origen,
      rol_destino: roles.rol_destino,
      atributos: {
        ...(currentRel.atributos as Record<string, unknown> || {}),
        tipo_parentesco,
        fecha_actualizacion: new Date().toISOString()
      }
    })
    .eq('id', relacion_id)

  if (error) {
    console.error('❌ [editarTipoParentesco] Error:', error)
    return { success: false, message: `Error al actualizar: ${error.message}` }
  }

  revalidatePath(`/admin/socios/personas/${bp_origen_id}`)
  return { success: true, message: 'Parentesco actualizado correctamente' }
}
