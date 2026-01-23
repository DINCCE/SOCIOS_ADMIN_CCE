import { z } from "zod"

export const docComercialSchema = z.object({
    // Required fields
    tipo: z.enum(["Solicitud Retiro", "Solicitud Ingreso"]),
    solicitante_id: z.string().uuid(),

    // Optional fields
    codigo: z.string().optional(), // Auto-generated server-side
    responsable_id: z.string().uuid().optional().or(z.literal("")),
    monto_estimado: z.number().optional(),
    notas: z.string().optional().or(z.literal("")),
    atributos: z.record(z.string(), z.unknown()).optional(),
})

export type DocComercialFormValues = z.infer<typeof docComercialSchema>
