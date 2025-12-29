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
    fecha_expedicion: z.string().optional().or(z.literal("")),
    lugar_expedicion: z.string().optional(),

    // Personal Info
    genero: z.enum(["masculino", "femenino", "otro", "no_especifica"]).optional().default("no_especifica"),
    fecha_nacimiento: z.string().optional().or(z.literal("")),
    lugar_nacimiento: z.string().optional(),
    nacionalidad: z.string().default("CO"),
    estado_civil: z.enum([
        "soltero",
        "casado",
        "union_libre",
        "divorciado",
        "viudo",
        "separado",
    ]).optional().or(z.literal("")),
    estado_vital: z.enum(["vivo", "fallecido", "desconocido"]).default("vivo"),

    // Professional & Education
    ocupacion: z.string().optional(),
    profesion: z.string().optional(),
    nivel_educacion: z.enum([
        "primaria",
        "bachillerato",
        "tecnico",
        "tecnologo",
        "pregrado",
        "posgrado",
        "maestria",
        "doctorado",
    ]).optional().or(z.literal("")),

    // Medical & Loyalty
    tipo_sangre: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().or(z.literal("")),
    eps: z.string().optional(),
    fecha_socio: z.string().optional().or(z.literal("")),
    fecha_aniversario: z.string().optional().or(z.literal("")),
    tags: z.array(z.string()).default([]),

    // Contact
    email_principal: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono_principal: z.string().optional().or(z.literal("")),
    email_secundario: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono_secundario: z.string().optional().or(z.literal("")),
    whatsapp: z.string().optional().or(z.literal("")),

    // Social
    linkedin_url: z.string().url("URL de LinkedIn inválida").optional().or(z.literal("")),
    facebook_url: z.string().url("URL de Facebook inválida").optional().or(z.literal("")),
    instagram_handle: z.string().optional(),
    twitter_handle: z.string().optional(),

    // Emergency Contact
    contacto_emergencia_id: z.string().uuid("ID de contacto inválido").optional().or(z.literal("")),
    relacion_emergencia: z.string().optional(),

    // Status (Business Partner field)
    estado: z.enum(["activo", "inactivo", "suspendido"]).default("activo"),
})

export type PersonFormValues = z.infer<typeof personSchema>
