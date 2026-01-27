import { z } from "zod"

/**
 * Schema para el perfil_redes JSONB
 * Contiene redes sociales y presencia digital
 */
export const perfilRedesSchema = z.object({
  linkedin: z.string().url().nullable().or(z.literal("")),
  facebook: z.string().url().nullable().or(z.literal("")),
  instagram: z.string().regex(/^@?[\w.]+$/).nullable(),
  twitter: z.string().regex(/^@?[\w.]+$/).nullable(),
  foto_url: z.string().url().nullable(),
  whatsapp: z.string().regex(/^\+?\d{10,15}$/).nullable(),
})

export type PerfilRedes = z.infer<typeof perfilRedesSchema>
