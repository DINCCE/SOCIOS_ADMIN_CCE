import { z } from "zod"

/**
 * Schema for Accion list view
 * Optimized for table display - based on v_acciones_org view
 */
export const accionListSchema = z.object({
  id: z.string().uuid(),
  organizacion_id: z.string().uuid(),
  organizacion_nombre: z.string().nullable(),
  codigo_accion: z.string(),
  estado: z.enum(["disponible", "asignada", "arrendada", "bloqueada", "inactiva"]),
  creado_en: z.string(),
  actualizado_en: z.string().nullable(),
  eliminado_en: z.string().nullable(),
})

export type AccionList = z.infer<typeof accionListSchema>
