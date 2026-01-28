import { z } from "zod"

// Base schema for validation
const baseTareaSchema = z.object({
  titulo: z.string()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z.string()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .nullable(),
  prioridad: z.enum(["Baja", "Media", "Alta", "Urgente"]),
  estado: z.enum(["Pendiente", "En Progreso", "Terminada", "Pausada", "Cancelada"]),
  fecha_vencimiento: z.union([
    z.date(),
    z.string(),
    z.null(),
    z.undefined(),
  ]).optional().nullable(),
  asignado_a: z.string().uuid().optional().nullable(),
  relacionado_con_bp: z.string().uuid().optional().nullable(),
  oportunidad_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()),
})

export const tareaSchema = baseTareaSchema

// Form-specific schema - partial but with required fields reinstated
export const tareaFormSchema = baseTareaSchema.partial().required({
  titulo: true,
  prioridad: true,
  estado: true,
  tags: true,
})

export type TareaFormValues = z.infer<typeof tareaFormSchema>
