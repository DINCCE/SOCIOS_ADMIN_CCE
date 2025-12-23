import { z } from "zod"

export const companySchema = z.object({
    // Required fields
    razon_social: z.string().min(1, "La razón social es obligatoria"),
    nit: z.string().regex(/^[0-9]{7,12}$/, "El NIT debe contener solo números (7-12 dígitos)"),
    tipo_sociedad: z.string().min(1, "El tipo de sociedad es obligatorio"),
    email_principal: z.string().email("Email principal inválido"),
    telefono_principal: z.string().regex(/^[0-9]{10}$/, "El teléfono principal debe tener exactamente 10 dígitos"),

    // Optional fields
    nombre_comercial: z.string().optional(),
    fecha_constitucion: z.string().optional().or(z.literal("")),
    ciudad_constitucion: z.string().optional(),
    sector_industria: z.string().optional(),
    actividad_economica: z.string().optional(),
    tamano_empresa: z.enum(["micro", "pequena", "mediana", "grande"]).optional().or(z.literal("")),
    email_secundario: z.string().email("Email secundario inválido").optional().or(z.literal("")),
    telefono_secundario: z.string().regex(/^[0-9]{10}$/, "El teléfono secundario debe tener 10 dígitos").optional().or(z.literal("")),
    whatsapp: z.string().regex(/^[0-9]{10}$/, "WhatsApp debe tener 10 dígitos").optional().or(z.literal("")),
    website: z.string().url("Sitio web inválido").optional().or(z.literal("")),
    representante_legal_id: z.string().uuid("ID de representante legal inválido").optional().or(z.literal("")),

    // Status (shared bp field)
    estado: z.enum(["activo", "inactivo", "suspendido"]).default("activo"),
})

export type CompanyFormValues = z.infer<typeof companySchema>
