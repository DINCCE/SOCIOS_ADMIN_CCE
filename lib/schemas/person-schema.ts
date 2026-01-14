import { z } from "zod"
import { phoneSchema } from "@/schemas/telefono"

// Regex patterns
const SOLO_LETRAS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/
const SOLO_NUMEROS_REGEX = /^[0-9]+$/

export const personSchema = z
  .object({
    // Identity
    primer_nombre: z
      .string()
      .min(1, "El primer nombre es obligatorio")
      .regex(SOLO_LETRAS_REGEX, "El nombre solo puede contener letras"),
    segundo_nombre: z
      .string()
      .optional()
      .refine((val) => !val || SOLO_LETRAS_REGEX.test(val), {
        message: "El segundo nombre solo puede contener letras",
      }),
    primer_apellido: z
      .string()
      .min(1, "El primer apellido es obligatorio")
      .regex(SOLO_LETRAS_REGEX, "El apellido solo puede contener letras"),
    segundo_apellido: z
      .string()
      .optional()
      .refine((val) => !val || SOLO_LETRAS_REGEX.test(val), {
        message: "El segundo apellido solo puede contener letras",
      }),
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
    genero: z.string().min(1, "Selecciona un género"),
    fecha_nacimiento: z.preprocess(
      (val) => (typeof val === "string" && val !== "" ? new Date(val) : val),
      z.date({ message: "La fecha es obligatoria" }).max(new Date(), "La fecha no puede ser en el futuro")
    ),
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
    email_principal: z.string().min(1, "El correo electrónico es obligatorio").email("Correo inválido"),
    telefono_principal: phoneSchema.refine((val) => val !== null && val !== "", {
      message: "El teléfono es obligatorio",
    }),
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
  .superRefine((data, ctx) => {
    // Validate telefono_secundario: only numbers, max 10 digits
    if (data.telefono_secundario && data.telefono_secundario !== "") {
      if (!SOLO_NUMEROS_REGEX.test(data.telefono_secundario)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telefono_secundario"],
          message: "El teléfono solo puede contener números",
        })
      } else if (data.telefono_secundario.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telefono_secundario"],
          message: "El teléfono no puede tener más de 10 dígitos",
        })
      }
    }

    // Validate whatsapp: only numbers, max 10 digits
    if (data.whatsapp && data.whatsapp !== "") {
      if (!SOLO_NUMEROS_REGEX.test(data.whatsapp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp"],
          message: "El WhatsApp solo puede contener números",
        })
      } else if (data.whatsapp.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp"],
          message: "El WhatsApp no puede tener más de 10 dígitos",
        })
      }
    }

    // Validate numero_documento: for CC and CE, must be only numbers
    if ((data.tipo_documento === "CC" || data.tipo_documento === "CE") && data.numero_documento) {
      if (!SOLO_NUMEROS_REGEX.test(data.numero_documento)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numero_documento"],
          message: `Para ${data.tipo_documento}, el número de documento solo puede contener números`,
        })
      }
    }
  })

export type PersonFormValues = z.infer<typeof personSchema>
