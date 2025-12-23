/**
 * Document Type Code Mapper
 *
 * Translates SHORT document type codes (used in UI forms)
 * to LONG document type codes (expected by database RPC functions)
 *
 * Usage:
 * ```typescript
 * const longCode = translateDocumentType('CC') // Returns 'cedula_ciudadania'
 * ```
 */

export const DOCUMENT_TYPE_MAP: Record<string, string> = {
  CC: 'cedula_ciudadania',
  CE: 'cedula_extranjeria',
  TI: 'tarjeta_identidad',
  PA: 'pasaporte',
  RC: 'registro_civil',
  NIT: 'nit',
  PEP: 'pep',
  PPT: 'permiso_especial_permanencia',
  DNI: 'cedula_ciudadania', // Alias for CC (common in some regions)
  NUIP: 'cedula_ciudadania', // Alias for CC (Colombia's unified ID)
}

/**
 * Translates a SHORT document type code to LONG format
 *
 * @param shortCode - SHORT code from UI form (e.g., 'CC', 'CE')
 * @returns LONG code for database (e.g., 'cedula_ciudadania')
 * @throws Error if shortCode is not recognized
 */
export function translateDocumentType(shortCode: string): string {
  const longCode = DOCUMENT_TYPE_MAP[shortCode]
  if (!longCode) {
    throw new Error(`Unknown document type code: ${shortCode}`)
  }
  return longCode
}

/**
 * Reverse map: LONG codes to SHORT codes
 * Used for displaying data from database in UI forms
 */
export const REVERSE_DOCUMENT_TYPE_MAP: Record<string, string> = {
  cedula_ciudadania: 'CC',
  cedula_extranjeria: 'CE',
  tarjeta_identidad: 'TI',
  pasaporte: 'PA',
  registro_civil: 'RC',
  nit: 'NIT',
  pep: 'PEP',
  permiso_especial_permanencia: 'PPT',
  nit_extranjero: 'NIT', // Map to NIT for display
  carnet_diplomatico: 'PA', // Map to passport for display
}

/**
 * Translates a LONG document type code to SHORT format
 * Useful when displaying database values in forms
 *
 * @param longCode - LONG code from database
 * @returns SHORT code for UI (e.g., 'CC')
 * @throws Error if longCode is not recognized
 */
export function reverseTranslateDocumentType(longCode: string): string {
  const shortCode = REVERSE_DOCUMENT_TYPE_MAP[longCode]
  if (!shortCode) {
    throw new Error(`Unknown document type: ${longCode}`)
  }
  return shortCode
}
