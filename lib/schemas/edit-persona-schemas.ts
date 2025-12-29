import { z } from "zod"

// --- 1. Información Personal ---
export const personalInfoSchema = z.object({
    genero: z.enum(["masculino", "femenino", "otro"]).nullable().optional(),
    fecha_nacimiento: z.string().nullable().optional(),
    lugar_nacimiento: z.string().nullable().optional(),
    estado_civil: z.enum(["soltero", "casado", "union_libre", "divorciado", "viudo"]).nullable().optional(),
    fecha_aniversario: z.string().nullable().optional(),
})

// --- 2. Vínculo Institucional ---
export const institutionalSchema = z.object({
    fecha_socio: z.string().nullable().optional(),
    estado: z.enum(["activo", "inactivo", "mora"]).optional(),
    estado_vital: z.enum(["vivo", "fallecido", "desconocido"]).optional(),
    tags: z.array(z.string()).optional(),
})

// --- 3. Perfil Profesional ---
export const professionalSchema = z.object({
    nivel_educacion: z.string().nullable().optional(),
    profesion: z.string().nullable().optional(),
    ocupacion: z.string().nullable().optional(),
})

// --- 4. Salud y Médica ---
export const healthSchema = z.object({
    tipo_sangre: z.string().nullable().optional(),
    eps: z.string().nullable().optional(),
    // perfil_intereses is complex, simplified for now
})

// --- 5. Contacto de Emergencia ---
export const emergencySchema = z.object({
    nombre_contacto_emergencia: z.string().nullable().optional(),
    relacion_emergencia: z.string().nullable().optional(),
    protocolo_emergencia: z.string().nullable().optional(),
})

// --- 6. Residencia (perfil_preferencias) ---
export const residenceSchema = z.object({
    direccion: z.string().nullable().optional(),
    barrio: z.string().nullable().optional(),
    ciudad: z.string().nullable().optional(),
})

// --- 7. Ecosistema Digital ---
export const digitalSchema = z.object({
    email_secundario: z.string().email("Email inválido").nullable().or(z.literal("")).optional(),
    whatsapp: z.string().nullable().optional(),
    linkedin_url: z.string().url("URL de LinkedIn inválida").nullable().or(z.literal("")).optional(),
    facebook_url: z.string().url("URL de Facebook inválida").nullable().or(z.literal("")).optional(),
    instagram_handle: z.string().nullable().optional(),
})

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>
export type InstitutionalValues = z.infer<typeof institutionalSchema>
export type ProfessionalValues = z.infer<typeof professionalSchema>
export type HealthValues = z.infer<typeof healthSchema>
export type EmergencyValues = z.infer<typeof emergencySchema>
export type ResidenceValues = z.infer<typeof residenceSchema>
export type DigitalValues = z.infer<typeof digitalSchema>
