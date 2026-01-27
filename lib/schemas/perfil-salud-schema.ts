import { z } from "zod"

/**
 * Opciones de tipo de sangre válidas
 */
export const TIPO_SANGRE_OPTIONS = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-"
] as const

/**
 * Opciones de estado vital válidas
 */
export const ESTADO_VITAL_OPTIONS = [
  "vivo",
  "fallecido",
  "desconocido"
] as const

/**
 * Schema para el perfil_salud JSONB
 * Contiene información médica y de salud
 */
export const perfilSaludSchema = z.object({
  tipo_sangre: z.enum(TIPO_SANGRE_OPTIONS).nullable(),
  eps: z.string().max(200).nullable(),
  estado_vital: z.enum(ESTADO_VITAL_OPTIONS).default("vivo"),
})

export type PerfilSalud = z.infer<typeof perfilSaludSchema>
