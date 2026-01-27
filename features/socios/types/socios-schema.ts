import { z } from "zod"
import type {
  TipoActorEnum,
  DmActorNaturalezaFiscal,
  DmActorTipoDocumento,
  DmActorRegimenTributario,
  DmActorEstado,
  DmActorGenero,
  DmActorEstadoCivil,
  DmActoresNivelEducacion,
  DmActoresTipoRelacion
} from "@/lib/db-types"

/**
 * Schema for Persona list view (v_actores_org)
 * Simplified version for list/table display - optimized for v_actores_org view
 * Maps to v_actores_org view fields which has limited, calculated columns
 */
export const personaListSchema = z.object({
  // From v_actores_org view
  id: z.string().uuid(),
  codigo_bp: z.string(),
  nombre_completo: z.string(),
  num_documento: z.string().nullable(),
  tipo_actor: z.enum(["persona", "empresa"]),
  email_principal: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  estado_actor: z.enum(["activo", "inactivo", "bloqueado"]),
  organizacion_slug: z.string().nullable(),
  organizacion_nombre: z.string().nullable(),
  es_socio: z.boolean(),
  es_cliente: z.boolean(),
  es_proveedor: z.boolean(),
  eliminado_en: z.string().nullable(),
  // Optional: These may be added to view later via JOINs
  foto_url: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  // Audit fields
  creado_en: z.string(),
  creado_por_email: z.string().nullable(),
  creado_por_nombre: z.string().nullable(),
  actualizado_en: z.string().nullable(),
  actualizado_por_email: z.string().nullable(),
  actualizado_por_nombre: z.string().nullable(),
})

export type PersonaList = z.infer<typeof personaListSchema>

/**
 * Schema for Empresa list view (v_actores_org)
 * Simplified version for list/table display - optimized for v_actores_org view
 * Maps to v_actores_org view fields which has limited, calculated columns
 * Uses perfil_profesional_corporativo JSONB for extended company data
 */
export const empresaListSchema = z.object({
  // From v_actores_org view
  id: z.string().uuid(),
  codigo_bp: z.string(),
  num_documento: z.string().nullable(),
  digito_verificacion: z.number().nullable().optional(),
  razon_social: z.string().nullable(),
  nombre_comercial: z.string().nullable(),
  nat_fiscal: z.string().nullable(),
  tipo_actor: z.enum(["persona", "empresa"]),
  estado_actor: z.enum(["activo", "inactivo", "bloqueado"]),
  email_principal: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  telefono_secundario: z.string().nullable(),
  organizacion_slug: z.string().nullable(),
  organizacion_nombre: z.string().nullable(),
  es_socio: z.boolean(),
  es_cliente: z.boolean(),
  es_proveedor: z.boolean(),
  eliminado_en: z.string().nullable(),

  // From perfil_profesional_corporativo JSONB (extracted for convenience)
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
  whatsapp: z.string().nullable(),
  website: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
  instagram_handle: z.string().nullable(),
  twitter_handle: z.string().nullable(),
  logo_url: z.string().nullable(),
  ingresos_anuales: z.number().nullable(),
  numero_empleados: z.number().nullable(),

  // Audit fields
  creado_en: z.string(),
  creado_por_email: z.string().nullable(),
  creado_por_nombre: z.string().nullable(),
  actualizado_en: z.string().nullable(),
  actualizado_por_email: z.string().nullable(),
  actualizado_por_nombre: z.string().nullable(),

  // Computed fields
  nit_completo: z.string().nullable(), // Can be null if DV is missing
  nombre_representante_legal: z.string().nullable(),
  tags: z.array(z.string()).optional().default([]),
})

export type EmpresaList = z.infer<typeof empresaListSchema>

/**
 * Schema for Persona view (v_personas_completa)
 * Combines data from personas, business_partners, and organizations tables
 * IMPORTANT: Matches actual database schema
 * NOTE: Used for detail pages that query dm_actores directly
 */
export const personaSchema = z.object({
  // From dm_actores table (unified schema)
  id: z.string().uuid(),
  tipo_documento: z.enum(["CC", "CE", "PA", "TI", "RC", "PEP", "PPT", "NIT"]),
  numero_documento: z.string(),
  fecha_expedicion: z.string().nullable(),
  lugar_expedicion: z.string().nullable(), // Legacy text field (kept for backward compatibility)
  lugar_expedicion_id: z.string().uuid().nullable(), // New FK to config_ciudades
  primer_nombre: z.string(),
  segundo_nombre: z.string().nullable(),
  primer_apellido: z.string(),
  segundo_apellido: z.string().nullable(),
  genero: z.enum(["masculino", "femenino", "otro", "no aplica"]),
  fecha_nacimiento: z.string(),
  lugar_nacimiento: z.string().nullable(), // Legacy text field (kept for backward compatibility)
  lugar_nacimiento_id: z.string().uuid().nullable(), // New FK to config_ciudades
  nacionalidad: z.string().nullable(),
  estado_civil: z.enum(["soltero", "casado", "union libre", "divorciado", "viudo"]).nullable(),
  ocupacion: z.string().nullable(),
  profesion: z.string().nullable(),
  nivel_educacion: z.enum(["sin estudios", "primaria", "bachillerato", "técnica", "profesional", "especialización", "maestría", "doctorado"]).nullable(),
  tipo_sangre: z.string().nullable(),
  eps: z.string().nullable(),
  fecha_socio: z.string().nullable(),
  fecha_aniversario: z.string().nullable(),
  estado_vital: z.enum(["vivo", "fallecido", "desconocido"]).default("vivo"),
  tags: z.array(z.string()).default([]),
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
  perfil_intereses: z.record(z.string(), z.any()).default({}),
  perfil_preferencias: z.record(z.string(), z.any()).default({}),
  perfil_metricas: z.record(z.string(), z.any()).default({}),
  perfil_compliance: z.record(z.string(), z.any()).default({}),
  creado_en: z.string(),
  actualizado_en: z.string(),

  // From dm_actores table (business partner fields)
  organizacion_id: z.string().uuid(),
  tipo_actor: z.enum(["persona", "empresa"]),
  codigo_bp: z.string(),
  estado_actor: z.enum(["activo", "inactivo", "bloqueado"]),
  email_principal: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  bp_creado_en: z.string(),
  bp_actualizado_en: z.string(),
  eliminado_en: z.string().nullable(),

  // From config_organizaciones table
  organizacion_nombre: z.string(),

  // Computed fields
  nombre_completo: z.string(),
  nombre_contacto_emergencia: z.string().nullable(),
  deuda: z.number().optional().nullable(),

  // Alias fields for backward compatibility (mapped from dm_actores)
  codigo: z.string().optional(),  // Alias for codigo_bp
  estado: z.enum(["activo", "inactivo", "bloqueado"]).optional(),  // Alias for estado_actor
})

export type Persona = z.infer<typeof personaSchema>

/**
 * Schema for Empresa view (dm_actores table)
 * Matches actual database schema for company detail view
 * IMPORTANT: Both personas and empresas share dm_actores table
 */
export const empresaSchema = z.object({
  // Core identity (from dm_actores)
  id: z.string().uuid(),
  codigo_bp: z.string(),
  organizacion_id: z.string().uuid(),
  organizacion_nombre: z.string(),
  tipo_actor: z.literal("empresa"),
  nat_fiscal: z.literal("jurídica"),
  estado_actor: z.enum(["activo", "inactivo", "bloqueado"]),

  // Company names (from dm_actores)
  razon_social: z.string(),
  nombre_comercial: z.string().nullable(),

  // Document (from dm_actores)
  tipo_documento: z.literal("NIT"),
  num_documento: z.string(),
  digito_verificacion: z.number().nullable(),

  // Contact (from dm_actores)
  email_principal: z.string().nullable(),
  email_secundario: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  telefono_secundario: z.string().nullable(),

  // Company data from perfil_profesional_corporativo JSONB
  tipo_sociedad: z.string().nullable(),
  fecha_constitucion: z.string().nullable(),
  ciudad_constitucion: z.string().nullable(),
  pais_constitucion: z.string().nullable(),
  numero_registro: z.string().nullable(),
  codigo_ciiu: z.string().nullable(),
  sector_industria: z.string().nullable(),
  actividad_economica: z.string().nullable(),
  tamano_empresa: z.enum(["micro", "pequena", "mediana", "grande"]).nullable(),
  representante_legal_id: z.string().uuid().nullable(),
  cargo_representante: z.string().nullable(),
  ingresos_anuales: z.number().nullable(),
  numero_empleados: z.number().nullable(),

  // Digital presence from perfil_redes JSONB
  logo_url: z.string().nullable(),
  website: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
  instagram_handle: z.string().nullable(),
  twitter_handle: z.string().nullable(),
  whatsapp: z.string().nullable(),

  // Business classifications
  es_socio: z.boolean(),
  es_cliente: z.boolean(),
  es_proveedor: z.boolean(),

  // Metadata
  tags: z.array(z.string()).default([]),
  atributos: z.record(z.string(), z.any()).default({}),
  perfil_intereses: z.record(z.string(), z.any()).default({}),
  perfil_preferencias: z.record(z.string(), z.any()).default({}),
  perfil_metricas: z.record(z.string(), z.any()).default({}),
  perfil_compliance: z.record(z.string(), z.any()).default({}),

  // Computed fields
  nit_completo: z.string().nullable(),
  nombre_representante_legal: z.string().nullable(),

  // Timestamps
  creado_en: z.string(),
  actualizado_en: z.string(),
  eliminado_en: z.string().nullable(),

  // Alias fields for backward compatibility
  codigo: z.string().optional(), // Alias for codigo_bp
  estado: z.enum(["activo", "inactivo", "bloqueado"]).optional(), // Alias for estado_actor
})

export type Empresa = z.infer<typeof empresaSchema>

/**
 * Type for estado enum values
 */
export type EstadoSocio = "activo" | "inactivo" | "bloqueado"

/**
 * Type for tipo_documento enum values
 */
export type TipoDocumento = "CC" | "CE" | "PA" | "TI" | "RC" | "PEP" | "PPT" | "NIT"
