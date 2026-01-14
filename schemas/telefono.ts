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
export const phoneSchema = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    // Transform empty string to null for database IS NULL check
    if (!value || value.trim() === "") {
      return null
    }
    return value
  })
  .refine(
    (value) => {
      // Allow null (empty field)
      if (!value) return true

      // Validate E.164 format with libphonenumber-js
      try {
        return isValidPhoneNumber(value)
      } catch {
        return false
      }
    },
    {
      message: "Formato de teléfono inválido. Use formato internacional (+57 300 123 4567)",
    }
  )
  .refine(
    (value) => {
      // Allow null
      if (!value) return true

      // Validate against database regex: ^\+[1-9][0-9]{6,14}$
      const dbPattern = /^\+[1-9][0-9]{6,14}$/
      return dbPattern.test(value)
    },
    {
      message: "El teléfono debe tener entre 7 y 15 dígitos incluyendo el código de país (+57)",
    }
  )
  .transform((value) => {
    // Normalize to E.164 format
    if (!value) return null

    try {
      const phoneNumber = parsePhoneNumber(value)
      return phoneNumber.number // Returns E.164 format
    } catch {
      return value
    }
  }) as z.ZodType<string | null, z.ZodTypeDef, string | null | undefined>

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
