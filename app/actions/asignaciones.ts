'use server'

import { createClient, getActiveOrganizationId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Argumentos para crear una asignación (camelCase para TypeScript)
 */
export interface CrearAsignacionParams {
  accionId: string
  asociadoId: string
  organizacionId: string
  tipoVinculo: 'propietario' | 'titular' | 'beneficiario' | 'intermediario'
  modalidad: 'propiedad' | 'comodato' | 'asignacion_corp' | 'convenio'
  planComercial: 'regular' | 'plan dorado' | 'joven ejecutivo' | 'honorifico'
  asignacionPadreId?: string | null
  notas?: string | null
  atributos?: Record<string, any> | null
}

/**
 * Argumentos para finalizar una asignación
 */
export interface FinalizarAsignacionParams {
  asignacionId: string
  motivo?: string | null
}

/**
 * Respuesta de una asignación (retornada por las RPCs)
 */
export interface AsignacionRecord {
  id: string
  accion_id: string
  asociado_id: string
  organizacion_id: string
  tipo_vinculo: 'propietario' | 'titular' | 'beneficiario' | 'intermediario'
  modalidad: 'propiedad' | 'comodato' | 'asignacion_corp' | 'convenio'
  plan_comercial: 'regular' | 'plan dorado' | 'joven ejecutivo' | 'honorifico'
  asignacion_padre_id: string | null
  subcodigo: string
  codigo_completo: string
  fecha_inicio: string
  fecha_fin: string | null
  es_vigente: boolean
  notas: string | null
  atributos: Record<string, any>
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Crea una nueva asignación de acción usando la RPC vn_asociados_crear_asignacion
 * Obtiene automáticamente el organizacion_id del usuario autenticado.
 *
 * @param params - Parámetros de la asignación en camelCase (sin organizacionId)
 * @returns La asignación creada como JSONB
 * @throws Error si la validación falla (ej: permisos, unicidad, jerarquía, estado de acción)
 *
 * @example
 * ```ts
 * const asignacion = await crearAsignacionConOrg({
 *   accionId: 'uuid-accion',
 *   asociadoId: 'uuid-asociado',
 *   tipoVinculo: 'propietario',
 *   modalidad: 'propiedad',
 *   planComercial: 'regular'
 * })
 * ```
 */
export async function crearAsignacionConOrg(
  params: Omit<CrearAsignacionParams, 'organizacionId'>
): Promise<AsignacionRecord> {
  const organizacionId = await getActiveOrganizationId()

  if (!organizacionId) {
    throw new Error('No se pudo determinar la organización del usuario')
  }

  return crearAsignacion({
    ...params,
    organizacionId,
  })
}

/**
 * Crea una nueva asignación de acción usando la RPC vn_asociados_crear_asignacion
 *
 * @param params - Parámetros de la asignación en camelCase
 * @returns La asignación creada como JSONB
 * @throws Error si la validación falla (ej: permisos, unicidad, jerarquía, estado de acción)
 *
 * @example
 * ```ts
 * const asignacion = await crearAsignacion({
 *   accionId: 'uuid-accion',
 *   asociadoId: 'uuid-asociado',
 *   organizacionId: 'uuid-org',
 *   tipoVinculo: 'propietario',
 *   modalidad: 'propiedad',
 *   planComercial: 'regular'
 * })
 * ```
 */
export async function crearAsignacion(
  params: CrearAsignacionParams
): Promise<AsignacionRecord> {
  const supabase = await createClient()

  try {
    // Mapear de camelCase a snake_case (parámetros de la RPC)
    const rpcParams = {
      p_accion_id: params.accionId,
      p_asociado_id: params.asociadoId,
      p_organizacion_id: params.organizacionId,
      p_tipo_vinculo: params.tipoVinculo,
      p_modalidad: params.modalidad,
      p_plan_comercial: params.planComercial,
      p_asignacion_padre_id: params.asignacionPadreId ?? null,
      p_notas: params.notas ?? null,
      p_atributos: params.atributos ?? {},
    }

    console.log('[crearAsignacion] Llamando RPC con params:', {
      ...rpcParams,
      p_asignacion_padre_id: rpcParams.p_asignacion_padre_id || '(no aplica)',
    })

    // Llamar a la RPC - si falla, Supabase lanzará un error con el mensaje de validación
    const { data, error } = await supabase.rpc(
      'vn_asociados_crear_asignacion',
      rpcParams
    )

    if (error) {
      console.error('[crearAsignacion] Error de Supabase:', error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('La RPC no retornó datos (data es null)')
    }

    console.log('[crearAsignacion] Asignación creada exitosamente:', {
      id: data.id,
      codigo_completo: data.codigo_completo,
      tipo_vinculo: data.tipo_vinculo,
    })

    // Revalidar paths para actualizar caché
    revalidatePath('/admin/socios/asignaciones')
    revalidatePath('/admin/socios/acciones')

    return data as AsignacionRecord
  } catch (error) {
    console.error('[crearAsignacion] Error creando asignación:', error)

    // Re-lanzar el error para que la UI pueda manejarlo
    throw error instanceof Error
      ? error
      : new Error('Error desconocido al crear la asignación')
  }
}

/**
 * Finaliza una asignación existente usando la RPC vn_asociados_finalizar_asignacion
 *
 * Establece fecha_fin = CURRENT_DATE y opcionalmente agrega un motivo a las notas.
 *
 * @param params - Parámetros para finalizar (asignacionId y motivo opcional)
 * @returns La asignación actualizada con fecha_fin establecida
 * @throws Error si la asignación no existe, ya está finalizada, o sin permisos
 *
 * @example
 * ```ts
 * const asignacionFinalizada = await finalizarAsignacion({
 *   asignacionId: 'uuid-asignacion',
 *   motivo: 'Venta de acción completada'
 * })
 * ```
 */
export async function finalizarAsignacion(
  params: FinalizarAsignacionParams
): Promise<AsignacionRecord> {
  const supabase = await createClient()

  try {
    // Mapear de camelCase a snake_case (parámetros de la RPC)
    const rpcParams = {
      p_asignacion_id: params.asignacionId,
      p_motivo: params.motivo ?? null,
    }

    console.log('[finalizarAsignacion] Llamando RPC con params:', {
      asignacionId: params.asignacionId,
      motivo: params.motivo || '(sin motivo)',
    })

    // Llamar a la RPC - si falla, Supabase lanzará un error con el mensaje de validación
    const { data, error } = await supabase.rpc(
      'vn_asociados_finalizar_asignacion',
      rpcParams
    )

    if (error) {
      console.error('[finalizarAsignacion] Error de Supabase:', error)
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('La RPC no retornó datos (data es null)')
    }

    console.log('[finalizarAsignacion] Asignación finalizada exitosamente:', {
      id: data.id,
      fecha_fin: data.fecha_fin,
      codigo_completo: data.codigo_completo,
    })

    // Revalidar paths para actualizar caché
    revalidatePath('/admin/socios/asignaciones')
    revalidatePath('/admin/socios/acciones')

    return data as AsignacionRecord
  } catch (error) {
    console.error('[finalizarAsignacion] Error finalizando asignación:', error)

    // Re-lanzar el error para que la UI pueda manejarlo
    throw error instanceof Error
      ? error
      : new Error('Error desconocido al finalizar la asignación')
  }
}

/**
 * Crea múltiples asignaciones en lote (batch)
 * Útil para crear varios beneficiarios de una vez
 *
 * @param asignaciones - Array de parámetros de asignación
 * @returns Array de asignaciones creadas
 * @throws Error si alguna asignación falla (rollback manual por transacción)
 *
 * @example
 * ```ts
 * const asignaciones = await crearAsignacionesBatch([
 *   { accionId: '...', asociadoId: '...', ... },
 *   { accionId: '...', asociadoId: '...', ... }
 * ])
 * ```
 */
export async function crearAsignacionesBatch(
  asignaciones: CrearAsignacionParams[]
): Promise<AsignacionRecord[]> {
  console.log(
    `[crearAsignacionesBatch] Creando ${asignaciones.length} asignaciones en lote`
  )

  const resultados: AsignacionRecord[] = []
  const errores: Array<{ index: number; error: string }> = []

  // Procesar secuencialmente (PostgreSQL ya maneja concurrencia con FOR UPDATE)
  for (let i = 0; i < asignaciones.length; i++) {
    try {
      const asignacion = await crearAsignacion(asignaciones[i])
      resultados.push(asignacion)
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido'
      errores.push({ index: i, error: errorMsg })
      console.error(
        `[crearAsignacionesBatch] Error en asignación ${i}:`,
        errorMsg
      )
    }
  }

  // Si hubo errores, reportar
  if (errores.length > 0) {
    console.warn(
      `[crearAsignacionesBatch] ${errores.length} de ${asignaciones.length} asignaciones fallaron`,
      errores
    )
    throw new Error(
      `Fallaron ${errores.length} de ${asignaciones.length} asignaciones. Primer error: ${errores[0].error}`
    )
  }

  console.log(
    `[crearAsignacionesBatch] Todas las asignaciones creadas exitosamente`
  )

  return resultados
}

// ============================================================================
// LOOKUP FUNCTIONS (para comboboxes de búsqueda)
// ============================================================================

/**
 * Resultado de búsqueda de acción
 */
export interface AccionBuscada {
  id: string
  codigo_accion: string
  estado: string
  organizacion_nombre?: string
}

/**
 * Resultado de búsqueda de actor
 */
export interface ActorBuscado {
  id: string
  codigo_bp: string
  nombre_completo: string
  identificacion: string
  email_principal?: string
  telefono_principal?: string
  foto_url?: string | null
  tipo_actor: string
}

/**
 * Busca acciones disponibles para asignar por organización
 * Obtiene automáticamente el organizacion_id del usuario autenticado.
 *
 * @param query - Texto de búsqueda (busca por código_accion)
 * @param tipoVinculo - Opcional: filtra acciones disponibles según el tipo de vinculo
 * @returns Objeto con { success, data }
 */
export async function buscarAccionesParaAsignar(
  query: string,
  tipoVinculo?: 'propietario' | 'titular' | 'beneficiario' | 'intermediario'
): Promise<{ success: boolean; data: AccionBuscada[] }> {
  const organizacionId = await getActiveOrganizationId()

  if (!organizacionId) {
    console.warn('[buscarAccionesParaAsignar] No organization ID found')
    return { success: false, data: [] }
  }

  const result = await buscarAccionesDisponibles(organizacionId, query, tipoVinculo)
  return { success: true, data: result }
}

/**
 * Busca acciones disponibles para asignar por organización
 *
 * @param organizacionId - ID de la organización
 * @param query - Texto de búsqueda (busca por código_accion). Si está vacío, devuelve las primeras 5
 * @param tipoVinculo - Opcional: filtra acciones disponibles según el tipo de vinculo
 *   - 'propietario' | 'titular': solo acciones con estado 'disponible'
 *   - 'beneficiario': acciones con estado 'asignada' o 'disponible'
 * @returns Array de acciones encontradas
 */
export async function buscarAccionesDisponibles(
  organizacionId: string,
  query: string,
  tipoVinculo?: 'propietario' | 'titular' | 'beneficiario' | 'intermediario'
): Promise<AccionBuscada[]> {
  const supabase = await createClient()

  try {
    // Determinar qué estados buscar según el tipo de vínculo
    let estadosPermitidos: string[] = ['disponible']
    if (tipoVinculo === 'beneficiario') {
      estadosPermitidos = ['asignada', 'disponible']
    }

    // Si no hay query, devolver las primeras 5 acciones disponibles
    if (!query || query.trim().length === 0) {
      const { data, error } = await supabase
        .from('v_acciones_org')
        .select('id, codigo_accion, estado, organizacion_nombre')
        .in('estado', estadosPermitidos)
        .order('codigo_accion', { ascending: true })
        .limit(5)

      if (error) {
        console.error('[buscarAccionesDisponibles] Error:', error)
        return []
      }

      return (data || []) as AccionBuscada[]
    }

    // Con query, buscar coincidencias
    const { data, error } = await supabase
      .from('v_acciones_org')
      .select('id, codigo_accion, estado, organizacion_nombre')
      .in('estado', estadosPermitidos)
      .or(`codigo_accion.ilike.%${query}%`)
      .order('codigo_accion', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[buscarAccionesDisponibles] Error:', error)
      return []
    }

    return (data || []) as AccionBuscada[]
  } catch (error) {
    console.error('[buscarAccionesDisponibles] Error buscando acciones:', error)
    return []
  }
}

/**
 * Busca actores/socios para asignar acciones
 * Obtiene automáticamente el organizacion_id del usuario autenticado.
 *
 * @param query - Texto de búsqueda (busca por nombre, documento o código)
 * @returns Objeto con { success, data }
 */
export async function buscarActoresParaAsignar(
  query: string
): Promise<{ success: boolean; data: ActorBuscado[] }> {
  const organizacionId = await getActiveOrganizationId()

  if (!organizacionId) {
    console.warn('[buscarActoresParaAsignar] No organization ID found')
    return { success: false, data: [] }
  }

  const result = await buscarActores(organizacionId, query)
  return { success: true, data: result }
}

/**
 * Busca actores/socios por organización para asignar acciones
 *
 * @param organizacionId - ID de la organización
 * @param query - Texto de búsqueda (busca por nombre, documento o código)
 * @returns Array de actores encontrados
 */
export async function buscarActores(
  organizacionId: string,
  query: string
): Promise<ActorBuscado[]> {
  const supabase = await createClient()

  try {
    const searchQuery = query.trim()

    // Buscar en v_actores_org (vista optimizada que ya incluye nombre_completo calculado)
    const { data, error } = await supabase
      .from('v_actores_org')
      .select(
        'id, codigo_bp, tipo_actor, num_documento, nombre_completo, email_principal, telefono_principal'
      )
      .or(
        `nombre_completo.ilike.%${searchQuery}%,codigo_bp.ilike.%${searchQuery}%,num_documento.ilike.%${searchQuery}%`
      )
      .order('codigo_bp', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[buscarActores] Error:', error)
      return []
    }

    // La vista ya incluye nombre_completo calculado, solo mapeamos al tipo
    return (data || []).map((actor) => ({
      id: actor.id,
      codigo_bp: actor.codigo_bp,
      tipo_actor: actor.tipo_actor,
      identificacion: actor.num_documento || actor.codigo_bp,
      nombre_completo: actor.nombre_completo,
      email_principal: actor.email_principal,
      telefono_principal: actor.telefono_principal,
      foto_url: null, // La vista v_actores_org no tiene foto_url
    })) as ActorBuscado[]
  } catch (error) {
    console.error('[buscarActores] Error buscando actores:', error)
    return []
  }
}
