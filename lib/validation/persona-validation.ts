/**
 * Persona validation schemas
 * Zod schemas for person-related data validation
 */

import { z } from 'zod'

/**
 * Document type enum
 */
export const documentTypeSchema = z.enum([
  'CC', // Cédula de Ciudadanía
  'CE', // Cédula de Extranjería
  'TI', // Tarjeta de Identidad
  'PA', // Pasaporte
  'RC', // Registro Civil
  'NIT', // Número de Identificación Tributaria
  'PEP', // Permiso Especial de Permanencia
  'PPT', // Permiso por Protección Temporal
  'DNI', // Documento Nacional de Identidad (Perú)
  'NUIP', // Número Único de Identificación Personal
])

/**
 * Gender enum
 */
export const genderSchema = z.enum(['masculino', 'femenino', 'otro', 'no_especifica'])

/**
 * Civil status enum
 */
export const civilStatusSchema = z.enum([
  'soltero',
  'casado',
  'union_libre',
  'divorciado',
  'viudo',
  'separado',
])

/**
 * Vital status enum
 */
export const vitalStatusSchema = z.enum(['vivo', 'fallecido', 'desconocido'])

/**
 * Education level enum
 */
export const educationLevelSchema = z.enum([
  'primaria',
  'bachillerato',
  'tecnico',
  'tecnologo',
  'pregrado',
  'posgrado',
  'maestria',
  'doctorado',
])

/**
 * Blood type enum
 */
export const bloodTypeSchema = z.enum([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
])

/**
 * Persona creation schema
 */
export const personaCreateSchema = z.object({
  // Required fields
  primer_nombre: z.string().min(2, 'El primer nombre debe tener al menos 2 caracteres').max(100),
  primer_apellido: z.string().min(2, 'El primer apellido debe tener al menos 2 caracteres').max(100),
  tipo_documento: documentTypeSchema,
  numero_documento: z.string().min(3, 'El número de documento es obligatorio').max(20),

  // Optional identity fields
  segundo_nombre: z.string().max(100).optional(),
  segundo_apellido: z.string().max(100).optional(),
  fecha_expedicion: z.string().optional(),
  lugar_expedicion: z.string().max(200).optional(),
  lugar_expedicion_id: z.string().uuid().optional(),

  // Personal info
  genero: genderSchema.optional(),
  fecha_nacimiento: z.string().optional(),
  lugar_nacimiento: z.string().max(200).optional(),
  lugar_nacimiento_id: z.string().uuid().optional(),
  nacionalidad: z.string().max(100).optional().default('CO'),
  estado_civil: civilStatusSchema.optional(),
  ocupacion: z.string().max(200).optional(),
  profesion: z.string().max(200).optional(),
  nivel_educacion: educationLevelSchema.optional(),

  // Medical & loyalty
  tipo_sangre: bloodTypeSchema.optional(),
  eps: z.string().max(200).optional(),
  fecha_socio: z.string().optional(),
  fecha_aniversario: z.string().optional(),
  estado_vital: vitalStatusSchema.optional(),

  // Contact
  email_principal: z.string().email('Email principal inválido').optional(),
  telefono_principal: z.string().max(50).optional(),
  email_secundario: z.string().email('Email secundario inválido').optional(),
  telefono_secundario: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),

  // Social
  linkedin_url: z.string().url('URL de LinkedIn inválida').optional(),
  facebook_url: z.string().url('URL de Facebook inválida').optional(),
  instagram_handle: z.string().max(100).optional(),
  twitter_handle: z.string().max(100).optional(),

  // Emergency contact
  contacto_emergencia_id: z.string().uuid('ID de contacto inválido').optional(),
  relacion_emergencia: z.string().max(100).optional(),

  // Tags
  tags: z.array(z.string()).max(20).optional(),

  // Business partner status
  estado: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
})

/**
 * Persona identity update schema
 */
export const personaIdentityUpdateSchema = z.object({
  tipo_documento: documentTypeSchema,
  numero_documento: z.string().min(3).max(20),
  fecha_expedicion: z.string().optional(),
  lugar_expedicion: z.string().max(200).optional(),
  lugar_expedicion_id: z.string().uuid().optional(),
  primer_nombre: z.string().min(2).max(100),
  segundo_nombre: z.string().max(100).optional(),
  primer_apellido: z.string().min(2).max(100),
  segundo_apellido: z.string().max(100).optional(),
  genero: genderSchema,
  fecha_nacimiento: z.string(),
  lugar_nacimiento: z.string().max(200).optional(),
  lugar_nacimiento_id: z.string().uuid().optional(),
  nacionalidad: z.string().max(100).optional(),
  estado_civil: civilStatusSchema.optional(),
})

/**
 * Persona profile update schema
 */
export const personaProfileUpdateSchema = z.object({
  estado: z.enum(['activo', 'inactivo', 'suspendido']),
  fecha_socio: z.string().optional(),
  fecha_aniversario: z.string().optional(),
  nivel_educacion: educationLevelSchema.optional(),
  profesion: z.string().max(200).optional(),
  sector_industria: z.string().max(200).optional(),
  empresa_actual: z.string().max(200).optional(),
  cargo_actual: z.string().max(200).optional(),
  linkedin_url: z.string().url('URL de LinkedIn inválida').optional(),
  email_principal: z.string().email('Email inválido').optional(),
  telefono_principal: z.string().max(50).optional(),
  email_secundario: z.string().email('Email inválido').optional(),
  telefono_secundario: z.string().max(50).optional(),
  instagram: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  facebook: z.string().url('URL de Facebook inválida').optional(),
})

/**
 * Persona security update schema
 */
export const personaSecurityUpdateSchema = z.object({
  tipo_sangre: bloodTypeSchema.optional(),
  eps: z.string().max(200).optional(),
  contacto_emergencia_id: z.string().uuid('ID de contacto inválido').optional(),
  relacion_emergencia: z.string().max(100).optional(),
})

/**
 * Validate persona creation data
 */
export function validatePersonaCreate(data: unknown) {
  return personaCreateSchema.safeParse(data)
}

/**
 * Validate persona identity update data
 */
export function validatePersonaIdentityUpdate(data: unknown) {
  return personaIdentityUpdateSchema.safeParse(data)
}

/**
 * Validate persona profile update data
 */
export function validatePersonaProfileUpdate(data: unknown) {
  return personaProfileUpdateSchema.safeParse(data)
}

/**
 * Validate persona security update data
 */
export function validatePersonaSecurityUpdate(data: unknown) {
  return personaSecurityUpdateSchema.safeParse(data)
}
