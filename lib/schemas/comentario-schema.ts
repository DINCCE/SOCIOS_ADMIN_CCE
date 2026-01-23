import { z } from 'zod'
import { TR_COMENTARIO_ENTIDAD_TIPO } from '@/lib/db-types'

export const comentarioSchema = z.object({
  entidad_tipo: z.enum(TR_COMENTARIO_ENTIDAD_TIPO),
  entidad_id: z.string().uuid(),
  contenido: z.string().min(1, 'El comentario no puede estar vacío'),
  es_interno: z.boolean().optional().default(false),
  es_resolucion: z.boolean().optional().default(false),
})

export const comentarioUpdateSchema = z.object({
  contenido: z.string().min(1, 'El comentario no puede estar vacío'),
})

export type ComentarioFormValues = z.infer<typeof comentarioSchema>
export type ComentarioUpdateValues = z.infer<typeof comentarioUpdateSchema>
