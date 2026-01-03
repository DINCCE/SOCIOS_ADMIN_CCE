import { z } from "zod"

export const relationshipFormSchema = z.object({
    tipo_relacion: z.enum(["familiar", "laboral", "comercial", "otra"]),
    entidad_destino_id: z.string().min(1, "Debes seleccionar una persona o empresa."),
    rol_destino: z.string().min(2, {
        message: "Describe el rol (ej: Padre, Jefe).",
    }),
    rol_origen: z.string().min(2, {
        message: "Describe tu rol (ej: Hijo, Empleado).",
    }),
    fecha_inicio: z.date(),
    fecha_fin: z.date().optional().nullable(),
    esta_activo: z.boolean().optional(),
    metadata: z.object({
        cargo: z.string().optional(),
        departamento: z.string().optional(),
        es_acudiente: z.boolean().optional(),
        es_emergencia: z.boolean().optional(),
        notas: z.string().optional(),
    }).optional(),
})

export type RelationshipFormValues = z.infer<typeof relationshipFormSchema>
