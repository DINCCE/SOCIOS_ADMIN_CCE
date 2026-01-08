/**
 * Database ENUM Types
 * Generated from current Supabase schema
 * Centralized location for all ENUM type definitions
 */

// =====================================================
// DM_ACTORES ENUMs
// =====================================================

export type TipoActorEnum = 'persona' | 'empresa'
export const TIPO_ACTOR_ENUM: TipoActorEnum[] = ['persona', 'empresa']

export type DmActorNaturalezaFiscal = 'natural' | 'jurídica'
export const DM_ACTOR_NATURALEZA_FISCAL: DmActorNaturalezaFiscal[] = ['natural', 'jurídica']

export type DmActorTipoDocumento = 'CC' | 'CE' | 'PA' | 'TI' | 'RC' | 'PEP' | 'PPT' | 'NIT'
export const DM_ACTOR_TIPO_DOCUMENTO: DmActorTipoDocumento[] = ['CC', 'CE', 'PA', 'TI', 'RC', 'PEP', 'PPT', 'NIT']

export type DmActorRegimenTributario =
  | 'responsable de iva'
  | 'no responsable de iva'
  | 'regimen simple tributacion'
  | 'gran contribuyente'
  | 'no sujeta a impuesto'
export const DM_ACTOR_REGIMEN_TRIBUTARIO: DmActorRegimenTributario[] = [
  'responsable de iva',
  'no responsable de iva',
  'regimen simple tributacion',
  'gran contribuyente',
  'no sujeta a impuesto',
]

export type DmActorEstado = 'activo' | 'inactivo' | 'bloqueado'
export const DM_ACTOR_ESTADO: DmActorEstado[] = ['activo', 'inactivo', 'bloqueado']

export type DmActorGenero = 'masculino' | 'femenino' | 'otro' | 'no aplica'
export const DM_ACTOR_GENERO: DmActorGenero[] = ['masculino', 'femenino', 'otro', 'no aplica']

export type DmActorEstadoCivil = 'soltero' | 'casado' | 'union libre' | 'divorciado' | 'viudo'
export const DM_ACTOR_ESTADO_CIVIL: DmActorEstadoCivil[] = ['soltero', 'casado', 'union libre', 'divorciado', 'viudo']

export type DmActoresNivelEducacion =
  | 'sin estudios'
  | 'primaria'
  | 'bachillerato'
  | 'técnica'
  | 'profesional'
  | 'especialización'
  | 'maestría'
  | 'doctorado'
export const DM_ACTORES_NIVEL_EDUCACION: DmActoresNivelEducacion[] = [
  'sin estudios',
  'primaria',
  'bachillerato',
  'técnica',
  'profesional',
  'especialización',
  'maestría',
  'doctorado',
]

export type DmActoresTipoRelacion = 'familiar' | 'laboral' | 'referencia' | 'membresía' | 'comercial' | 'otra'
export const DM_ACTORES_TIPO_RELACION: DmActoresTipoRelacion[] = [
  'familiar',
  'laboral',
  'referencia',
  'membresía',
  'comercial',
  'otra',
]

// =====================================================
// TR_DOC_COMERCIAL ENUMs
// =====================================================

export type TrDocComercialTipo = 'oportunidad' | 'oferta' | 'pedido_venta' | 'reserva'
export const TR_DOC_COMERCIAL_TIPO: TrDocComercialTipo[] = ['oportunidad', 'oferta', 'pedido_venta', 'reserva']

export type TrDocComercialSubtipo = 'sol_ingreso' | 'sol_retiro' | 'oferta_eventos' | 'pedido_eventos'
export const TR_DOC_COMERCIAL_SUBTIPO: TrDocComercialSubtipo[] = [
  'sol_ingreso',
  'sol_retiro',
  'oferta_eventos',
  'pedido_eventos',
]

export type TrDocComercialEstados = 'Nueva' | 'En Progreso' | 'Ganada' | 'Pérdida' | 'Descartada'
export const TR_DOC_COMERCIAL_ESTADOS: TrDocComercialEstados[] = ['Nueva', 'En Progreso', 'Ganada', 'Pérdida', 'Descartada']

// =====================================================
// TR_TAREAS ENUMs
// =====================================================

export type TrTareasEstado = 'Pendiente' | 'En Progreso' | 'Terminada' | 'Pausada' | 'Cancelada'
export const TR_TAREAS_ESTADO: TrTareasEstado[] = ['Pendiente', 'En Progreso', 'Terminada', 'Pausada', 'Cancelada']

export type TrTareasPrioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente'
export const TR_TAREAS_PRIORIDAD: TrTareasPrioridad[] = ['Baja', 'Media', 'Alta', 'Urgente']

// =====================================================
// DM_ACCIONES ENUMs
// =====================================================

export type DmAccionEstado = 'disponible' | 'asignada' | 'arrendada' | 'bloqueada' | 'inactiva'
export const DM_ACCION_ESTADO: DmAccionEstado[] = ['disponible', 'asignada', 'arrendada', 'bloqueada', 'inactiva']

// =====================================================
// CONFIG ENUMs
// =====================================================

export type ConfigMoneda =
  | 'COP'
  | 'MXN'
  | 'ARS'
  | 'BRL'
  | 'CLP'
  | 'PEN'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'JPY'
  | 'CHF'
  | 'AUD'
  | 'NZD'
  | 'CNY'
  | 'INR'
  | 'KRW'
  | 'SGD'
  | 'HKD'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'TRY'
  | 'ZAR'
  | 'RUB'
  | 'AED'
  | 'SAR'
  | 'ILS'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'HRK'
  | 'MYR'
  | 'THB'
  | 'IDR'
  | 'PHP'
  | 'VND'
  | 'TWD'
  | 'ISK'
export const CONFIG_MONEDA: ConfigMoneda[] = [
  'COP',
  'MXN',
  'ARS',
  'BRL',
  'CLP',
  'PEN',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'JPY',
  'CHF',
  'AUD',
  'NZD',
  'CNY',
  'INR',
  'KRW',
  'SGD',
  'HKD',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'TRY',
  'ZAR',
  'RUB',
  'AED',
  'SAR',
  'ILS',
  'CZK',
  'HUF',
  'RON',
  'BGN',
  'HRK',
  'MYR',
  'THB',
  'IDR',
  'PHP',
  'VND',
  'TWD',
  'ISK',
]

export type ConfigOrganizacionTipo = 'club' | 'asociacion' | 'federacion' | 'fundacion' | 'otro'
export const CONFIG_ORGANIZACION_TIPO: ConfigOrganizacionTipo[] = ['club', 'asociacion', 'federacion', 'fundacion', 'otro']

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get ENUM options for select inputs
 */
export function getEnumOptions<T extends string>(enumArray: T[]): { label: string; value: T }[] {
  return enumArray.map((value) => ({
    label: value,
    value,
  }))
}

/**
 * Format ENUM value for display (capitalize first letter, handle special cases)
 */
export function formatEnumValue(value: string): string {
  // Special cases for existing formats
  const specialCases: Record<string, string> = {
    'union libre': 'Unión Libre',
    'regimen simple tributacion': 'Régimen Simple Tributación',
    'no responsable de iva': 'No Responsable de IVA',
    'responsable de iva': 'Responsable de IVA',
    'gran contribuyente': 'Gran Contribuyente',
    'no sujeta a impuesto': 'No Sujeta a Impuesto',
    'sin estudios': 'Sin Estudios',
    'En Progreso': 'En Progreso',
  }

  if (specialCases[value]) {
    return specialCases[value]
  }

  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get badge color for status ENUMs
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    // Actor status
    activo: 'bg-green-100 text-green-800',
    inactivo: 'bg-gray-100 text-gray-800',
    bloqueado: 'bg-red-100 text-red-800',

    // Oportunidad status
    Nueva: 'bg-blue-100 text-blue-800',
    'En Progreso': 'bg-yellow-100 text-yellow-800',
    Ganada: 'bg-green-100 text-green-800',
    Pérdida: 'bg-red-100 text-red-800',
    Descartada: 'bg-gray-100 text-gray-800',

    // Tarea status
    Pendiente: 'bg-gray-100 text-gray-800',
    Terminada: 'bg-green-100 text-green-800',
    Pausada: 'bg-orange-100 text-orange-800',
    Cancelada: 'bg-red-100 text-red-800',

    // Tarea prioridad
    Baja: 'bg-blue-100 text-blue-800',
    Media: 'bg-yellow-100 text-yellow-800',
    Alta: 'bg-orange-100 text-orange-800',
    Urgente: 'bg-red-100 text-red-800',

    // Acción status
    disponible: 'bg-green-100 text-green-800',
    asignada: 'bg-blue-100 text-blue-800',
    arrendada: 'bg-purple-100 text-purple-800',
    bloqueada: 'bg-red-100 text-red-800',
    inactiva: 'bg-gray-100 text-gray-800',
  }

  return colorMap[status] || 'bg-gray-100 text-gray-800'
}
