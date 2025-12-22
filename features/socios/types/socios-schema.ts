import { z } from "zod"

/**
 * Schema for Persona view (v_personas_completa)
 * Combines data from personas, business_partners, and organizations tables
 * IMPORTANT: Matches actual database schema
 */
export const personaSchema = z.object({
  // From personas table
  id: z.string().uuid(),
  tipo_documento: z.enum(["CC", "CE", "PA", "TI", "RC"]),
  numero_documento: z.string(),
  fecha_expedicion: z.string().nullable(),
  lugar_expedicion: z.string().nullable(),
  primer_nombre: z.string(),
  segundo_nombre: z.string().nullable(),
  primer_apellido: z.string(),
  segundo_apellido: z.string().nullable(),
  genero: z.enum(["masculino", "femenino", "otro", "prefiero_no_decir"]),
  fecha_nacimiento: z.string(),
  lugar_nacimiento: z.string().nullable(),
  nacionalidad: z.string().nullable(),
  estado_civil: z.string().nullable(),
  ocupacion: z.string().nullable(),
  profesion: z.string().nullable(),
  nivel_educacion: z.string().nullable(),
  tipo_sangre: z.string().nullable(),
  email_secundario: z.string().nullable(),
  telefono_secundario: z.string().nullable(),
  whatsapp: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
  instagram_handle: z.string().nullable(),
  twitter_handle: z.string().nullable(),
  foto_url: z.string().nullable(),
  contacto_emergencia_id: z.string().uuid().nullable(),
  relacion_emergencia: z.string().nullable(),
  atributos: z.record(z.string(), z.any()).nullable(),
  creado_en: z.string(),
  actualizado_en: z.string(),

  // From business_partners table
  organizacion_id: z.string().uuid(),
  tipo_actor: z.enum(["persona", "empresa"]),
  codigo: z.string(),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
  email_principal: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  bp_creado_en: z.string(),
  bp_actualizado_en: z.string(),
  eliminado_en: z.string().nullable(),

  // From organizations table
  organizacion_nombre: z.string(),

  // Computed fields
  nombre_completo: z.string(),
  nombre_contacto_emergencia: z.string().nullable(),
})

export type Persona = z.infer<typeof personaSchema>

/**
 * Schema for Empresa view (v_empresas_completa)
 * Combines data from empresas, business_partners, and organizations tables
 * IMPORTANT: Matches actual database schema
 */
export const empresaSchema = z.object({
  // From empresas table
  id: z.string().uuid(),
  nit: z.string(),
  digito_verificacion: z.string(),
  razon_social: z.string(),
  nombre_comercial: z.string().nullable(),
  tipo_sociedad: z.string(),
  fecha_constitucion: z.string().nullable(),
  ciudad_constitucion: z.string().nullable(),
  pais_constitucion: z.string().nullable(),
  numero_registro: z.string().nullable(),
  codigo_ciiu: z.string().nullable(),
  sector_industria: z.string().nullable(),
  actividad_economica: z.string().nullable(),
  tamano_empresa: z.string().nullable(),
  representante_legal_id: z.string().uuid().nullable(),
  cargo_representante: z.string().nullable(),
  telefono_secundario: z.string().nullable(),
  whatsapp: z.string().nullable(),
  website: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
  instagram_handle: z.string().nullable(),
  twitter_handle: z.string().nullable(),
  logo_url: z.string().nullable(),
  ingresos_anuales: z.number().nullable(),
  numero_empleados: z.number().nullable(),
  atributos: z.record(z.string(), z.any()).nullable(),
  creado_en: z.string(),
  actualizado_en: z.string(),

  // From business_partners table
  organizacion_id: z.string().uuid(),
  tipo_actor: z.enum(["persona", "empresa"]),
  codigo: z.string(),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
  email_principal: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  bp_creado_en: z.string(),
  bp_actualizado_en: z.string(),
  eliminado_en: z.string().nullable(),

  // From organizations table
  organizacion_nombre: z.string(),

  // Computed fields
  nit_completo: z.string(),
  nombre_representante_legal: z.string().nullable(),
})

export type Empresa = z.infer<typeof empresaSchema>

/**
 * Type for estado enum values
 */
export type EstadoSocio = "activo" | "inactivo" | "suspendido"

/**
 * Type for tipo_documento enum values
 */
export type TipoDocumento = "CC" | "CE" | "PA" | "TI" | "RC"
