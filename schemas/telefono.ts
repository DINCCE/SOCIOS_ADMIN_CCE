import { z } from "zod"
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js"

/**
 * Zod schema for international phone numbers with E.164 validation
 *
 * Database Rule: telefono_principal IS NULL OR telefono_principal ~ '^\+[1-9][0-9]{6,14}$'
 *
 * Transformations:
 * - Empty string → null (for IS NULL check)
 * - Valid input → E.164 format (+573001234567)
 */

// Custom refinement for phone validation
const isValidE164Phone = (value: string | null): boolean => {
  if (!value) return true
  try {
    return isValidPhoneNumber(value)
  } catch {
    return false
  }
}

const matchesDbPattern = (value: string | null): boolean => {
  if (!value) return true
  const dbPattern = /^\+[1-9][0-9]{6,14}$/
  return dbPattern.test(value)
}

const normalizeToE164 = (value: string | null): string | null => {
  if (!value) return null
  try {
    const phoneNumber = parsePhoneNumber(value)
    return phoneNumber.number
  } catch {
    return value
  }
}

export const phoneSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    // Transform empty string to null
    if (!val || val.trim() === "") return null
    return val
  })
  .refine(isValidE164Phone, {
    message: "Formato de teléfono inválido. Use formato internacional (+57 300 123 4567)",
  })
  .refine(matchesDbPattern, {
    message: "El teléfono debe tener entre 7 y 15 dígitos incluyendo el código de país (+57)",
  })
  .transform(normalizeToE164)

/**
 * Helper to create a phone field schema with optional label
 */
export const createPhoneFieldSchema = (fieldName: string = "teléfono") => phoneSchema

/**
 * Extract country code from phone number
 */
export const extractCountryCode = (phone: string | null): string | null => {
  if (!phone) return null
  try {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber.country || null
  } catch {
    return null
  }
}

/**
 * Format phone for display (national format)
 */
export const formatPhoneDisplay = (phone: string | null): string => {
  if (!phone) return ""
  try {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber.formatNational()
  } catch {
    return phone
  }
}
