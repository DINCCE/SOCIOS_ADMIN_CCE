import { z } from "zod"

/**
 * Niveles educativos válidos
 */
export const NIVEL_EDUCACION_OPTIONS = [
  "sin estudios",
  "primaria",
  "bachillerato",
  "técnica",
  "profesional",
  "especialización",
  "maestría",
  "doctorado"
] as const

/**
 * Schema para el perfil_profesional_corporativo JSONB
 * Contiene datos profesionales y educativos
 */
export const perfilProfesionalSchema = z.object({
  ocupacion: z.string().max(200).nullable(),
  profesion: z.string().max(200).nullable(),
  nivel_educacion: z.enum(NIVEL_EDUCACION_OPTIONS).nullable(),
})

export type PerfilProfesional = z.infer<typeof perfilProfesionalSchema>
