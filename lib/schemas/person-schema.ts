import { z } from "zod"

export const personSchema = z.object({
    // Identity
    primer_nombre: z.string().min(1, "El primer nombre es obligatorio"),
    segundo_nombre: z.string().optional(),
    primer_apellido: z.string().min(1, "El primer apellido es obligatorio"),
    segundo_apellido: z.string().optional(),
    tipo_documento: z.enum([
        "CC",
        "CE",
        "TI",
        "PA",
        "RC",
        "NIT",
        "PEP",
        "PPT",
        "DNI",
        "NUIP",
    ]),
    numero_documento: z.string().min(3, "El número de documento es obligatorio"),
    fecha_expedicion: z.string().optional(), // Date input returns string "YYYY-MM-DD"
    lugar_expedicion: z.string().optional(),

    // Personal Info
    genero: z.enum(["masculino", "femenino", "otro", "no_especifica"]),
    fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    nacionalidad: z.string().default("CO"),
    estado_civil: z.enum([
        "soltero",
        "casado",
        "union_libre",
        "divorciado",
        "viudo",
        "separado",
    ]).optional(),

    // Contact
    email_principal: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono_principal: z.string().min(7, "Teléfono inválido").optional().or(z.literal("")),

    // Status (Business Partner field)
    estado: z.enum(["activo", "inactivo", "suspendido"]).default("activo"),
})

export type PersonFormValues = z.infer<typeof personSchema>
