import { z } from "zod"

/**
 * Schema para el perfil_identidad JSONB
 * Contiene datos de identidad personal, documento y ubicación
 */
export const perfilIdentidadSchema = z.object({
  nacionalidad: z.string().max(100).nullable(),
  fecha_expedicion: z.string().datetime().nullable(),
  lugar_expedicion: z.string().max(200).nullable(),
  lugar_expedicion_id: z.string().uuid().nullable(),
  lugar_nacimiento: z.string().max(200).nullable(),
  lugar_nacimiento_id: z.string().uuid().nullable(),
})

export type PerfilIdentidad = z.infer<typeof perfilIdentidadSchema>
