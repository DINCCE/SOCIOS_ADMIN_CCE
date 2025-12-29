// Business Partners Type Definitions
// Used for RPC function parameters and form validation

export interface CrearPersonaParams {
  p_organizacion_id: string
  p_primer_nombre: string
  p_primer_apellido: string
  p_tipo_documento: string
  p_numero_documento: string
  p_genero: string
  p_fecha_nacimiento: string
  p_email_principal?: string
  p_telefono_principal?: string
  p_segundo_nombre?: string
  p_segundo_apellido?: string
  p_tipo_sangre?: string
  p_eps?: string
  p_fecha_socio?: string
  p_fecha_aniversario?: string
  p_tags?: string[]
  p_nacionalidad?: string
  p_email_secundario?: string
  p_telefono_secundario?: string
  p_whatsapp?: string
}

export interface CrearEmpresaParams {
  p_organizacion_id: string
  p_razon_social: string
  p_nit: string
  p_tipo_sociedad: string
  p_email_principal: string
  p_telefono_principal: string
  p_nombre_comercial?: string
  p_digito_verificacion?: string
  p_fecha_constitucion?: string
  p_ciudad_constitucion?: string
  p_sector_industria?: string
  p_actividad_economica?: string
  p_tamano_empresa?: string
  p_email_secundario?: string
  p_telefono_secundario?: string
  p_whatsapp?: string
  p_website?: string
  p_representante_legal_id?: string
}

// Enum Types

export type TipoDocumento =
  | 'cedula_ciudadania'
  | 'cedula_extranjeria'
  | 'pasaporte'
  | 'tarjeta_identidad'
  | 'registro_civil'
  | 'nit'
  | 'nit_extranjero'
  | 'carnet_diplomatico'
  | 'pep'
  | 'permiso_especial_permanencia'

export type TipoSociedad =
  | 'sociedad_anonima'
  | 'sociedad_limitada'
  | 'sociedad_comandita_simple'
  | 'sociedad_comandita_acciones'
  | 'sociedad_colectiva'
  | 'sociedad_acciones_simplificada'
  | 'empresa_unipersonal'
  | 'empresa_asociativa_trabajo'
  | 'entidad_sin_animo_lucro'
  | 'cooperativa'

export type EstadoBusinessPartner =
  | 'activo'
  | 'inactivo'
  | 'prospecto'
  | 'suspendido'
  | 'bloqueado'

export type TipoActor = 'persona' | 'empresa'

// Helper constants for dropdowns and validation

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'cedula_ciudadania', label: 'Cédula de Ciudadanía' },
  { value: 'cedula_extranjeria', label: 'Cédula de Extranjería' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'tarjeta_identidad', label: 'Tarjeta de Identidad' },
  { value: 'registro_civil', label: 'Registro Civil' },
  { value: 'nit', label: 'NIT' },
  { value: 'nit_extranjero', label: 'NIT Extranjero' },
  { value: 'carnet_diplomatico', label: 'Carnet Diplomático' },
  { value: 'pep', label: 'PEP' },
  {
    value: 'permiso_especial_permanencia',
    label: 'Permiso Especial de Permanencia',
  },
]

export const TIPOS_SOCIEDAD: { value: TipoSociedad; label: string }[] = [
  { value: 'sociedad_anonima', label: 'Sociedad Anónima (S.A.)' },
  { value: 'sociedad_limitada', label: 'Sociedad Limitada (Ltda.)' },
  { value: 'sociedad_comandita_simple', label: 'Sociedad en Comandita Simple' },
  {
    value: 'sociedad_comandita_acciones',
    label: 'Sociedad en Comandita por Acciones',
  },
  { value: 'sociedad_colectiva', label: 'Sociedad Colectiva' },
  {
    value: 'sociedad_acciones_simplificada',
    label: 'Sociedad por Acciones Simplificada (S.A.S.)',
  },
  { value: 'empresa_unipersonal', label: 'Empresa Unipersonal' },
  {
    value: 'empresa_asociativa_trabajo',
    label: 'Empresa Asociativa de Trabajo',
  },
  {
    value: 'entidad_sin_animo_lucro',
    label: 'Entidad Sin Ánimo de Lucro',
  },
  { value: 'cooperativa', label: 'Cooperativa' },
]

export const ESTADOS_BUSINESS_PARTNER: {
  value: EstadoBusinessPartner
  label: string
}[] = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'prospecto', label: 'Prospecto' },
    { value: 'suspendido', label: 'Suspendido' },
    { value: 'bloqueado', label: 'Bloqueado' },
  ]

// Structured JSONB types

export interface Direccion {
  calle?: string
  barrio?: string
  ciudad?: string
  departamento?: string
  codigo_postal?: string
  pais?: string
  complemento?: string
}

export interface ContactoEmergencia {
  nombre: string
  parentesco: string
  telefono: string
  email?: string
}

export interface RepresentanteLegal {
  nombre: string
  identificacion: string
  cargo: string
  telefono?: string
  email?: string
}

export interface InformacionBancaria {
  banco: string
  tipo_cuenta: 'Ahorros' | 'Corriente'
  numero_cuenta: string
  certificacion_bancaria_url?: string
}

export interface Accionista {
  nombre: string
  identificacion: string
  porcentaje_participacion: number
  email?: string
  telefono?: string
}

export interface MiembroJunta {
  nombre: string
  identificacion: string
  cargo: string
  email?: string
  telefono?: string
}
