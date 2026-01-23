import { z } from "zod"

export const tareaSchema = z.object({
  titulo: z.string()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z.string()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .nullable(),
  prioridad: z.enum(["Baja", "Media", "Alta", "Urgente"]).default("Media"),
  estado: z.enum(["Pendiente", "En Progreso", "Terminada", "Pausada", "Cancelada"]).default("Pendiente"),
  fecha_vencimiento: z.preprocess(
    (val) => (typeof val === "string" && val !== "" ? new Date(val) : val),
    z.date().optional().nullable()
  ),
  asignado_a: z.string().uuid().optional().nullable(),
  relacionado_con_bp: z.string().uuid().optional().nullable(),
  oportunidad_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
})

export type TareaFormValues = z.infer<typeof tareaSchema>
