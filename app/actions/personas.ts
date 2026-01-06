'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PersonFormValues } from '@/lib/schemas/person-schema'
import { translateDocumentType } from '@/lib/utils/document-type-mapper'

/**
 * Create persona from PersonFormValues (from new-person-sheet form)
 * Handles organization lookup and calling the RPC
 *
 * @param formData - Form data from new-person-sheet component
 * @returns Object with the RPC response { success, bp_id, codigo_bp, message, warnings }
 */
export async function crearPersonaFromPersonFormValues(
  formData: PersonFormValues
) {
  const supabase = await createClient()

  // 1. Get organization (current pattern: first org)
  // TODO: Replace with user session organization when profiles table exists
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  if (orgError || !orgData) {
    console.error('Error fetching organization:', orgError)
    return {
      success: false,
      message: 'No se encontró una organización activa para asociar la persona.',
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  // 2. Call existing crearPersonaFromForm directly with form data
  // The RPC now expects short codes (CC, CE, etc.) which are already in formData
  return crearPersonaFromForm({
    organizacionId: orgData.id,
    primerNombre: formData.primer_nombre,
    segundoNombre: formData.segundo_nombre || undefined,
    primerApellido: formData.primer_apellido,
    segundoApellido: formData.segundo_apellido || undefined,
    tipoDocumento: formData.tipo_documento,
    numeroDocumento: formData.numero_documento,
    emailPrincipal: formData.email_principal || undefined,
    telefonoPrincipal: formData.telefono_principal || undefined,
    fechaNacimiento: formData.fecha_nacimiento || undefined,
    genero: formData.genero || undefined,
    estadoCivil: formData.estado_civil || undefined,
    nacionalidad: formData.nacionalidad || undefined,
    lugarNacimiento: formData.lugar_nacimiento || undefined,
    ocupacion: formData.ocupacion || undefined,
    profesion: formData.profesion || undefined,
    nivelEducacion: formData.nivel_educacion || undefined,
    tipoSangre: formData.tipo_sangre || undefined,
    eps: formData.eps || undefined,
    fechaSocio: formData.fecha_socio || undefined,
    fechaAniversario: formData.fecha_aniversario || undefined,
    estadoVital: formData.estado_vital || undefined,
    tags: formData.tags || undefined,
    emailSecundario: formData.email_secundario || undefined,
    telefonoSecundario: formData.telefono_secundario || undefined,
    whatsapp: formData.whatsapp || undefined,
    linkedinUrl: formData.linkedin_url || undefined,
    facebookUrl: formData.facebook_url || undefined,
    instagramHandle: formData.instagram_handle || undefined,
    twitterHandle: formData.twitter_handle || undefined,
    contactoEmergenciaId: formData.contacto_emergencia_id || undefined,
    relacionEmergencia: formData.relacion_emergencia || undefined,
  })
}

/**
 * Simplified interface for creating a persona from form data
 * Transforms camelCase to snake_case for RPC parameters
 */
export async function crearPersonaFromForm(data: {
  organizacionId: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  tipoDocumento: string
  numeroDocumento: string
  emailPrincipal?: string
  telefonoPrincipal?: string
  fechaNacimiento?: string
  genero?: string
  estadoCivil?: string
  nacionalidad?: string
  lugarNacimiento?: string
  ocupacion?: string
  profesion?: string
  nivelEducacion?: string
  tipoSangre?: string
  eps?: string
  fechaSocio?: string
  fechaAniversario?: string
  estadoVital?: string
  tags?: string[]
  emailSecundario?: string
  telefonoSecundario?: string
  whatsapp?: string
  linkedinUrl?: string
  facebookUrl?: string
  instagramHandle?: string
  twitterHandle?: string
  contactoEmergenciaId?: string
  relacionEmergencia?: string
}) {
  const supabase = await createClient()

  // Call RPC with parameters that match the actual database function
  // Documentation: crear_persona(p_organizacion_id, p_primer_nombre, p_primer_apellido, p_tipo_documento, p_numero_documento, p_genero, p_fecha_nacimiento, p_email_principal, p_telefono_principal, ...)
  const { data: rpcResponse, error } = await supabase.rpc('crear_persona', {
    // Required parameters
    p_organizacion_id: data.organizacionId,
    p_primer_nombre: data.primerNombre,
    p_primer_apellido: data.primerApellido,
    p_tipo_documento: data.tipoDocumento,
    p_numero_documento: data.numeroDocumento,
    p_genero: data.genero,
    p_fecha_nacimiento: data.fechaNacimiento || null,
    p_email_principal: data.emailPrincipal,
    p_telefono_principal: data.telefonoPrincipal,
    p_fecha_expedicion: null,
    p_lugar_expedicion: null,
    // Optional parameters
    p_segundo_nombre: data.segundoNombre,
    p_segundo_apellido: data.segundoApellido,
    p_estado_civil: data.estadoCivil,
    p_nacionalidad: data.nacionalidad,
    p_lugar_nacimiento: data.lugarNacimiento,
    p_ocupacion: data.ocupacion,
    p_profesion: data.profesion,
    p_nivel_educacion: data.nivelEducacion,
    p_tipo_sangre: data.tipoSangre,
    p_eps: data.eps,
    p_fecha_socio: data.fechaSocio,
    p_fecha_aniversario: data.fechaAniversario,
    p_tags: data.tags,
    p_email_secundario: data.emailSecundario,
    p_telefono_secundario: data.telefonoSecundario,
    p_whatsapp: data.whatsapp,
    p_linkedin_url: data.linkedinUrl,
    p_facebook_url: data.facebookUrl,
    p_instagram_handle: data.instagramHandle,
    p_twitter_handle: data.twitterHandle,
    p_foto_url: null,
    p_contacto_emergencia_id: data.contactoEmergenciaId,
    p_relacion_emergencia: data.relacionEmergencia,
    // Note: JSONB fields (p_perfil_*) are omitted to use database DEFAULT '{}'::jsonb
  })

  if (error) {
    console.error('Error creating persona via RPC:', error)
    return {
      success: false,
      message: `Error de sistema: ${error.message}`,
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  // RPC returns a JSONB: { success, bp_id, codigo_bp, message, warnings }
  const result = rpcResponse as {
    success: boolean
    bp_id: string | null
    codigo_bp: string | null
    message: string
    warnings: string[] | null
  }

  if (result.success) {
    // Revalidate personas list page
    revalidatePath('/admin/socios/personas')
  }

  return result
}

/**
 * Update persona data
 *
 * @param id - The UUID of the persona
 * @param data - Partial persona data to update
 * @returns Object with { success, message, error? }
 */
export async function actualizarPersona(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('personas')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating persona:', error)
    return {
      success: false,
      message: `Error al actualizar: ${error.message}`,
      error
    }
  }

  // Revalidate both list and detail page
  revalidatePath('/admin/socios/personas')
  revalidatePath(`/admin/socios/personas/${id}`)

  return {
    success: true,
    message: 'Persona actualizada correctamente'
  }
}

/**
 * Update persona identity data (EditIdentityForm)
 * Updates: business_partners (document, names) + personas (biographical data)
 *
 * @param id - The UUID of the persona
 * @param data - Identity form data
 * @returns Object with { success, message }
 */
export async function updatePersonaIdentity(
  id: string,
  data: {
    tipo_documento: string
    numero_documento: string
    fecha_expedicion?: string | null
    lugar_expedicion?: string | null // Legacy text field (backward compatibility)
    lugar_expedicion_id?: string | null // New FK to geographic_locations
    primer_nombre: string
    segundo_nombre?: string | null
    primer_apellido: string
    segundo_apellido?: string | null
    genero: string
    fecha_nacimiento: string
    lugar_nacimiento?: string | null // Legacy text field (backward compatibility)
    lugar_nacimiento_id?: string | null // New FK to geographic_locations
    nacionalidad?: string | null
    estado_civil?: string | null
  }
) {
  const supabase = await createClient()

  // All identity fields are in personas table (CTI pattern)
  const { error } = await supabase
    .from('personas')
    .update({
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      fecha_expedicion: data.fecha_expedicion,
      lugar_expedicion: data.lugar_expedicion, // Legacy field (backward compatibility)
      lugar_expedicion_id: data.lugar_expedicion_id, // New FK to geographic_locations
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      genero: data.genero,
      fecha_nacimiento: data.fecha_nacimiento,
      lugar_nacimiento: data.lugar_nacimiento, // Legacy field (backward compatibility)
      lugar_nacimiento_id: data.lugar_nacimiento_id, // New FK to geographic_locations
      nacionalidad: data.nacionalidad,
      estado_civil: data.estado_civil,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating personas identity:', error)
    return {
      success: false,
      message: `Error al actualizar datos de identidad: ${error.message}`,
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/personas')
  revalidatePath(`/admin/socios/personas/${id}`)

  return {
    success: true,
    message: 'Datos de identidad actualizados correctamente',
  }
}

/**
 * Update persona profile data (EditProfileForm)
 * Updates: business_partners (status, contact) + personas (professional, dates)
 *
 * @param id - The UUID of the persona
 * @param data - Profile form data
 * @returns Object with { success, message }
 */
export async function updatePersonaProfile(
  id: string,
  data: {
    estado: string
    fecha_socio?: string | null
    fecha_aniversario?: string | null
    nivel_educacion?: string | null
    profesion?: string | null
    sector_industria?: string | null
    empresa_actual?: string | null
    cargo_actual?: string | null
    linkedin_url?: string | null
    email_principal?: string | null
    telefono_principal?: string | null
    email_secundario?: string | null
    telefono_secundario?: string | null
    instagram?: string | null
    twitter?: string | null
    facebook?: string | null
  }
) {
  const supabase = await createClient()

  // 1. Update business_partners (status and primary contact only)
  const { error: bpError } = await supabase
    .from('business_partners')
    .update({
      estado: data.estado,
      email_principal: data.email_principal,
      telefono_principal: data.telefono_principal,
    })
    .eq('id', id)

  if (bpError) {
    console.error('Error updating business_partners:', bpError)
    return {
      success: false,
      message: `Error al actualizar estado: ${bpError.message}`,
    }
  }

  // 2. Update personas (professional profile, dates, secondary contact, social networks)
  const { error: personaError } = await supabase
    .from('personas')
    .update({
      fecha_socio: data.fecha_socio,
      fecha_aniversario: data.fecha_aniversario,
      nivel_educacion: data.nivel_educacion,
      profesion: data.profesion,
      sector_industria: data.sector_industria,
      empresa_actual: data.empresa_actual,
      cargo_actual: data.cargo_actual,
      email_secundario: data.email_secundario,
      telefono_secundario: data.telefono_secundario,
      linkedin_url: data.linkedin_url,
      instagram_handle: data.instagram,
      twitter_handle: data.twitter,
      facebook_url: data.facebook,
    })
    .eq('id', id)

  if (personaError) {
    console.error('Error updating personas:', personaError)
    return {
      success: false,
      message: `Error al actualizar perfil: ${personaError.message}`,
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/personas')
  revalidatePath(`/admin/socios/personas/${id}`)

  return {
    success: true,
    message: 'Perfil actualizado correctamente',
  }
}

/**
 * Update persona security data (EditSecurityForm)
 * Updates: personas (medical info and emergency contact)
 *
 * @param id - The UUID of the persona
 * @param data - Security form data
 * @returns Object with { success, message }
 */
export async function updatePersonaSecurity(
  id: string,
  data: {
    tipo_sangre?: string | null
    eps?: string | null
    contacto_emergencia_id?: string | null
    relacion_emergencia?: string | null
  }
) {
  const supabase = await createClient()

  // Update personas (medical and emergency contact fields)
  const { error } = await supabase
    .from('personas')
    .update({
      tipo_sangre: data.tipo_sangre,
      eps: data.eps,
      contacto_emergencia_id: data.contacto_emergencia_id,
      relacion_emergencia: data.relacion_emergencia,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating personas security:', error)
    return {
      success: false,
      message: `Error al actualizar datos de seguridad: ${error.message}`,
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/personas')
  revalidatePath(`/admin/socios/personas/${id}`)

  return {
    success: true,
    message: 'Datos de salud y emergencia actualizados correctamente',
  }
}

/**
 * Soft delete a persona by setting eliminado_en timestamp
 * Also updates business_partners.eliminado_en for consistency
 *
 * @param id - The UUID of the persona to soft delete
 * @returns Object with { success, message, error? }
 */
export async function softDeletePersona(id: string) {
  const supabase = await createClient()

  // 1. Soft delete personas record
  const { error: personaError } = await supabase
    .from('personas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (personaError) {
    console.error('Error soft deleting persona:', personaError)
    return {
      success: false,
      message: `Error al eliminar persona: ${personaError.message}`,
      error: personaError
    }
  }

  // 2. Soft delete corresponding business_partners record
  const { error: bpError } = await supabase
    .from('business_partners')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (bpError) {
    console.error('Error soft deleting business_partner:', bpError)
    return {
      success: false,
      message: `Error al eliminar business partner: ${bpError.message}`,
      error: bpError
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/personas')
  revalidatePath(`/admin/socios/personas/${id}`)

  return {
    success: true,
    message: 'Persona eliminada correctamente'
  }
}

/**
 * Search for persons available to create a relationship with
 * Excludes persons that already have a relationship with the given bp_id
 *
 * @param bp_id - The business partner ID to check existing relationships
 * @param query - Search query (name or document number)
 * @param organizacion_id - Organization ID for filtering
 * @returns Array of available persons
 */
export async function buscarPersonasDisponiblesParaRelacion(
  bp_id: string,
  query: string,
  organizacion_id: string
) {
  const supabase = await createClient()

  // 1. Get existing relationship IDs for this bp
  const { data: relacionesExistentes } = await supabase
    .rpc('obtener_relaciones_bp', {
      p_bp_id: bp_id,
      p_solo_vigentes: true
    })

  // Extract all related bp_ids (both origen and destino)
  const bpIdsRelacionados = new Set<string>()
  relacionesExistentes?.forEach((rel: any) => {
    bpIdsRelacionados.add(rel.bp_origen_id)
    bpIdsRelacionados.add(rel.bp_destino_id)
  })

  // 2. Search personas using the optimized view
  const { data, error } = await supabase
    .from('v_actores_org')
    .select('*')
    .eq('organizacion_id', organizacion_id)
    .eq('tipo_actor', 'persona')
    .is('eliminado_en', null)
    .or(`codigo.ilike.%${query}%, nombre.ilike.%${query}%, identificacion.ilike.%${query}%`)
    .limit(50)

  if (error) {
    console.error('Error searching persons:', error)
    return { success: false, data: [] }
  }

  // 3. Transform and filter out persons already related
  const disponibles = data
    ?.filter((actor: any) => !bpIdsRelacionados.has(actor.id))
    .map((actor: any) => ({
      id: actor.id,
      codigo_bp: actor.codigo,
      nombre_completo: actor.nombre,
      identificacion: actor.identificacion,
      email_principal: actor.email_principal,
      telefono: actor.telefono_principal,
      tipo_actor: 'persona',
      foto_url: actor.foto_url // Note: We might need to ensure this is in the view if needed
    })) || []

  return {
    success: true,
    data: disponibles
  }
}
