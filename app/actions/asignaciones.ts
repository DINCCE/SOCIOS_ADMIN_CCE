'use server'

import { createClient } from '@/lib/supabase/server'
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
