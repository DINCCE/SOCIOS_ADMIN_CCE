/**
 * Safely extract nested value from JSONB object with fallback
 * Prevents runtime errors when JSONB profiles are empty or missing fields
 */
export function extractJsonbField<T>(
  jsonbObj: Record<string, any> | null | undefined,
  field: string,
  fallback: T
): T {
  if (!jsonbObj || typeof jsonbObj !== 'object') {
    return fallback
  }
  return jsonbObj[field] ?? fallback
}

interface RawProfileData {
  perfil_identidad?: Record<string, any>
  perfil_profesional_corporativo?: Record<string, any>
  perfil_salud?: Record<string, any>
  perfil_redes?: Record<string, any>
  perfil_contacto?: Record<string, any>
  perfil_preferencias?: Record<string, any>
  [key: string]: any
}

/**
 * Extract all profile fields from dm_actores JSONB columns
 * Returns a safe object with null fallbacks for all nested fields
 */
export function extractPersonaProfiles(raw: RawProfileData) {
  const vitalStatus = extractJsonbField(raw.perfil_salud, 'estado_vital', 'vivo')

  // Validate vital status is one of the allowed values
  const validVitalStatus = ['vivo', 'fallecido', 'desconocido'].includes(vitalStatus)
    ? vitalStatus as 'vivo' | 'fallecido' | 'desconocido'
    : 'vivo'

  return {
    // From perfil_identidad
    nacionalidad: extractJsonbField(raw.perfil_identidad, 'nacionalidad', null),
    fecha_expedicion: extractJsonbField(raw.perfil_identidad, 'fecha_expedicion', null),
    lugar_expedicion: extractJsonbField(raw.perfil_identidad, 'lugar_expedicion', null),
    lugar_expedicion_id: extractJsonbField(raw.perfil_identidad, 'lugar_expedicion_id', null),
    lugar_nacimiento: extractJsonbField(raw.perfil_identidad, 'lugar_nacimiento', null),
    lugar_nacimiento_id: extractJsonbField(raw.perfil_identidad, 'lugar_nacimiento_id', null),

    // From perfil_profesional_corporativo
    ocupacion: extractJsonbField(raw.perfil_profesional_corporativo, 'ocupacion', null),
    profesion: extractJsonbField(raw.perfil_profesional_corporativo, 'profesion', null),
    nivel_educacion: extractJsonbField(raw.perfil_profesional_corporativo, 'nivel_educacion', null),

    // From perfil_salud
    tipo_sangre: extractJsonbField(raw.perfil_salud, 'tipo_sangre', null),
    eps: extractJsonbField(raw.perfil_salud, 'eps', null),

    // From perfil_redes
    linkedin_url: extractJsonbField(raw.perfil_redes, 'linkedin', null),
    facebook_url: extractJsonbField(raw.perfil_redes, 'facebook', null),
    instagram_handle: extractJsonbField(raw.perfil_redes, 'instagram', null),
    twitter_handle: extractJsonbField(raw.perfil_redes, 'twitter', null),
    foto_url: extractJsonbField(raw.perfil_redes, 'foto_url', null),
    whatsapp: extractJsonbField(raw.perfil_redes, 'whatsapp', null),

    // From perfil_contacto
    contacto_emergencia_id: extractJsonbField(raw.perfil_contacto, 'contacto_emergencia_id', null),
    relacion_emergencia: extractJsonbField(raw.perfil_contacto, 'relacion_emergencia', null),

    // Optional fields (from JSONB if available, with defaults)
    fecha_socio: extractJsonbField(raw.perfil_preferencias, 'fecha_socio', null),
    fecha_aniversario: extractJsonbField(raw.perfil_preferencias, 'fecha_aniversario', null),
    estado_vital: validVitalStatus,
  }
}
