import { z } from "zod"
import { phoneSchema } from "@/schemas/telefono"

export const companySchema = z.object({
    // Required fields
    razon_social: z.string().min(1, "La razón social es obligatoria"),
    nit: z.string().regex(/^[0-9]{7,12}$/, "El NIT debe contener solo números (7-12 dígitos)"),
    digito_verificacion: z.string().length(1, "El dígito de verificación es un solo número").optional().or(z.literal("")),
    tipo_sociedad: z.string().min(1, "El tipo de sociedad es obligatorio"),

    // Email: usar misma validación que person-schema
    email_principal: z.string().min(1, "El correo electrónico es obligatorio").email("Correo inválido"),

    // Teléfono: usar phoneSchema international E.164
    telefono_principal: phoneSchema.refine((val) => val !== null && val !== "", {
        message: "El teléfono es obligatorio",
    }),

    // Optional fields
    nombre_comercial: z.string().optional().or(z.literal("")),
    fecha_constitucion: z.string().optional().or(z.literal("")),
    ciudad_constitucion: z.string().optional().or(z.literal("")),
    pais_constitucion: z.string().default("CO").optional().or(z.literal("")),
    numero_registro: z.string().optional().or(z.literal("")),
    codigo_ciiu: z.string().optional().or(z.literal("")),
    sector_industria: z.string().optional().or(z.literal("")),
    actividad_economica: z.string().optional().or(z.literal("")),
    tamano_empresa: z.enum(["micro", "pequena", "mediana", "grande", ""]).optional().or(z.literal("")),
    representante_legal_id: z.string().uuid("ID de representante legal inválido").optional().or(z.literal("")),
    cargo_representante: z.string().optional().or(z.literal("")),
    email_secundario: z.string().email("Email secundario inválido").optional().or(z.literal("")),
    telefono_secundario: z.string().regex(/^[0-9]{10}$/, "El teléfono secundario debe tener 10 dígitos").optional().or(z.literal("")),
    whatsapp: z.string().regex(/^[0-9]{10}$/, "WhatsApp debe tener 10 dígitos").optional().or(z.literal("")),
    website: z.string().url("Sitio web inválido").optional().or(z.literal("")),
    linkedin_url: z.string().url("URL de LinkedIn inválido").optional().or(z.literal("")),
    facebook_url: z.string().url("URL de Facebook inválido").optional().or(z.literal("")),
    instagram_handle: z.string().optional().or(z.literal("")),
    twitter_handle: z.string().optional().or(z.literal("")),
    logo_url: z.string().url("URL de logo inválido").optional().or(z.literal("")),
    ingresos_anuales: z.coerce.number().optional().or(z.literal(0)),
    numero_empleados: z.coerce.number().int().optional().or(z.literal(0)),

    // Status (shared bp field)
    estado: z.enum(["activo", "inactivo", "suspendido"]).default("activo"),
})

export type CompanyFormValues = z.infer<typeof companySchema>
