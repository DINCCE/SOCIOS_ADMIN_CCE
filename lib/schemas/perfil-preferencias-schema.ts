import { z } from "zod"

/**
 * Schema para el perfil_preferencias JSONB
 * Contiene fechas y preferencias del socio
 */
export const perfilPreferenciasSchema = z.object({
  fecha_socio: z.string().datetime().nullable(),
  fecha_aniversario: z.string().datetime().nullable(),
})

export type PerfilPreferencias = z.infer<typeof perfilPreferenciasSchema>
