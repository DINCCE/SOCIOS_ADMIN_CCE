/**
 * Validation utilities
 * Provides reusable validation functions and error handling
 */

import { z } from 'zod'

/**
 * Generic validation result type
 */
export type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: z.ZodError
  message?: string
}

/**
 * Validate data against a Zod schema
 * Returns a standardized validation result
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      errors: result.error,
      message: formatValidationErrors(result.error),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(error: z.ZodError): string {
  const errors = error.issues.map((err) => {
    const path = err.path.length > 0 ? err.path.join('.') : 'Campo'
    return `${path}: ${err.message}`
  })

  return errors.join('. ')
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (Colombian format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?\d{10,15}$/
  return phoneRegex.test(phone)
}

/**
 * Validate NIT (Colombian tax ID format)
 */
export function validateNIT(nit: string): boolean {
  // NIT format: 9-10 digits followed by optional check digit
  const nitRegex = /^\d{9,10}-?\d?$/
  return nitRegex.test(nit)
}

/**
 * Validate document number based on type
 */
export function validateDocumentNumber(
  tipoDocumento: string,
  numeroDocumento: string
): boolean {
  const documentPatterns: Record<string, RegExp> = {
    CC: /^\d{7,10}$/, // Cédula de Ciudadanía
    CE: /^\d{6,10}$/, // Cédula de Extranjería
    TI: /^\d{6,12}$/, // Tarjeta de Identidad
    PA: /^\d{6,12}$/, // Pasaporte
    RC: /^\d{6,12}$/, // Registro Civil
    NIT: /^\d{9,10}-?\d?$/, // Número de Identificación Tributaria
    PEP: /^\d{6,12}$/, // Permiso Especial de Permanencia
    PPT: /^\d{6,12}$/, // Permiso por Protección Temporal
    DNI: /^\d{8}$/, // Documento Nacional de Identidad (Perú)
    NUIP: /^\d{11,12}$/, // Número Único de Identificación Personal
  }

  const pattern = documentPatterns[tipoDocumento]
  return pattern ? pattern.test(numeroDocumento) : false
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  return dateRegex.test(date)
}

/**
 * Validate that a date is not in the future
 */
export function validateNotFutureDate(date: string): boolean {
  const inputDate = new Date(date)
  const today = new Date()
  return inputDate <= today
}

/**
 * Validate that a date is not in the past (for future dates like membership)
 */
export function validateNotPastDate(date: string, daysInPast: number = 0): boolean {
  const inputDate = new Date(date)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() - daysInPast)
  return inputDate >= minDate
}
