// Types para el historial de estados unificado (tr_estados_historial)

/**
 * Tipos de entidades soportadas en el historial de estados
 */
export type EntidadTipo = 'tarea' | 'doc_comercial'

/**
 * Registro individual del historial de cambios de estado
 */
export interface EstadoHistorial {
  id: string
  entidad_tipo: EntidadTipo
  entidad_id: string
  estado_anterior: string | null
  estado_nuevo: string
  cambiado_en: string
  usuario_id: string | null
  organizacion_id: string
  duracion_segundos: number | null
}

/**
 * Historial extendido con información del usuario que hizo el cambio
 */
export interface EstadoHistorialConUsuario extends EstadoHistorial {
  cambiado_por_email?: string
}

/**
 * Estadísticas de tiempo por estado (para las vistas v_tareas_tiempo_por_estado y v_doc_comercial_tiempo_por_estado)
 */
export interface TiempoPorEstado {
  organizacion_id: string
  estado_nuevo: string
  numero_cambios: number
  avg_horas: number
  avg_dias: number
  min_horas: number
  max_horas: number
  median_horas: number
}

/**
 * Detalle del historial de una tarea específica (desde v_tarea_historial_detalle)
 */
export interface TareaHistorialDetalle {
  id: string
  tarea_id: string
  cambio_estado: string
  horas_en_estado: number
  dias_en_estado: number
  cambiado_en: string
  cambiado_por_email?: string
  tarea_titulo?: string
  codigo_tarea?: string
}

/**
 * Formatea la duración en segundos a formato legible con días, horas y minutos
 */
export function formatearDuracion(segundos: number | null): string {
  if (!segundos) return '-'

  const dias = Math.floor(segundos / 86400)
  const horas = Math.floor((segundos % 86400) / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)

  if (dias > 0) {
    return `${dias}d ${horas}h`
  }
  if (horas > 0) {
    return `${horas}h ${minutos}m`
  }
  return `${minutos}m`
}

/**
 * Formatea la duración en días
 */
export function formatearDuracionDias(segundos: number | null): string {
  if (!segundos) return '-'

  const dias = Math.floor(segundos / 86400)
  const horas = Math.floor((segundos % 86400) / 3600)

  if (dias > 0) {
    return `${dias}d ${horas}h`
  }
  return `${horas}h`
}
