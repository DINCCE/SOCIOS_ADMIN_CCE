import { z } from "zod"

export const oportunidadSchema = z.object({
    // Required fields
    tipo: z.enum(["Solicitud Retiro", "Solicitud Ingreso"], {
        required_error: "El tipo de oportunidad es obligatorio",
    }),
    solicitante_id: z.string().uuid("Solicitante inválido"),

    // Optional fields
    codigo: z.string().optional(), // Auto-generated server-side
    responsable_id: z.string().uuid("Responsable inválido").optional().or(z.literal("")),
    monto_estimado: z.coerce.number().optional().or(z.literal(0)),
    notas: z.string().optional().or(z.literal("")),
    atributos: z.record(z.unknown()).optional().default({}),
})

export type OportunidadFormValues = z.infer<typeof oportunidadSchema>
