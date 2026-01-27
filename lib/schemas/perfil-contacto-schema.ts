import { z } from "zod"

/**
 * Opciones de parentesco para contacto de emergencia
 */
export const PARENTESCO_OPTIONS = [
  "conyuge",
  "padre",
  "madre",
  "hijo",
  "hermano",
  "amigo",
  "otro"
] as const

/**
 * Schema para el perfil_contacto JSONB
 * Contiene información de contacto de emergencia
 */
export const perfilContactoSchema = z.object({
  contacto_emergencia_id: z.string().uuid().nullable(),
  relacion_emergencia: z.enum(PARENTESCO_OPTIONS).nullable(),
})

export type PerfilContacto = z.infer<typeof perfilContactoSchema>
