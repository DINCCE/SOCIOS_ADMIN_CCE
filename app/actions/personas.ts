'use server'

import { createClient, getActiveOrganizationId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PersonFormValues } from '@/lib/schemas/person-schema'

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
  console.log('[crearPersona] Iniciando creación de persona con formData:', formData)

  const supabase = await createClient()

  console.log('[crearPersona] Cliente Supabase creado correctamente')

  // 1. Obtener organización activa del usuario
  const organizacionId = await getActiveOrganizationId()

  console.log('[crearPersona] Organización ID obtenida:', organizacionId)

  if (!organizacionId) {
    console.error('[crearPersona] ERROR: No se encontró organización ID')
    return {
      success: false,
      message: 'No se encontró una organización activa para asociar la persona. Verifique su sesión.',
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  console.log('[crearPersona] Organización válida, continuando con creación...')

  // 2. Call existing crearPersonaFromForm directly with form data
  // The RPC now expects short codes (CC, CE, etc.) which are already in formData
  return crearPersonaFromForm({
    organizacionId: organizacionId,
    primerNombre: formData.primer_nombre,
    segundoNombre: formData.segundo_nombre || undefined,
    primerApellido: formData.primer_apellido,
    segundoApellido: formData.segundo_apellido || undefined,
    tipoDocumento: formData.tipo_documento,
    numeroDocumento: formData.numero_documento,
    emailPrincipal: formData.email_principal || undefined,
    telefonoPrincipal: (formData.telefono_principal as string | null) ?? undefined,
    fechaNacimiento: formData.fecha_nacimiento ? formData.fecha_nacimiento.toISOString().split('T')[0] : undefined,
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
    estado: formData.estado,
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
  estado?: string
}) {
  const supabase = await createClient()

  // RPC validations before creating
  // 1. Check document uniqueness
  const { data: docCheck } = await supabase.rpc('dm_actores_documento_existe', {
    p_organizacion_id: data.organizacionId,
    p_tipo_documento: data.tipoDocumento,
    p_num_documento: data.numeroDocumento,
    p_excluir_id: null,
  })

  const docResult = docCheck as {
    doc_exists: boolean
    actor_id: string | null
    codigo_bp: string | null
    nombre_completo: string | null
  }[] | null

  if (docResult && docResult[0]?.doc_exists) {
    return {
      success: false,
      message: `Documento ya registrado para ${docResult[0].nombre_completo} (${docResult[0].codigo_bp})`,
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  // 2. Check email uniqueness (if provided)
  if (data.emailPrincipal && data.emailPrincipal !== '') {
    const { data: emailCheck } = await supabase.rpc('dm_actores_email_existe', {
      p_organizacion_id: data.organizacionId,
      p_email: data.emailPrincipal,
      p_excluir_id: null,
    })

    const emailResult = emailCheck as {
      email_exists: boolean
      actor_id: string | null
      codigo_bp: string | null
      nombre_completo: string | null
      email_encontrado: string | null
    }[] | null

    if (emailResult && emailResult[0]?.email_exists) {
      return {
        success: false,
        message: `Email ya registrado para ${emailResult[0].nombre_completo} (${emailResult[0].codigo_bp})`,
        bp_id: null,
        codigo_bp: null,
        warnings: null,
      }
    }
  }

  // 3. Check phone uniqueness (if provided)
  if (data.telefonoPrincipal && data.telefonoPrincipal !== '') {
    const { data: phoneCheck } = await supabase.rpc('dm_actores_telefono_existe', {
      p_organizacion_id: data.organizacionId,
      p_telefono: data.telefonoPrincipal,
      p_excluir_id: null,
    })

    const phoneResult = phoneCheck as {
      phone_exists: boolean
      actor_id: string | null
      codigo_bp: string | null
      nombre_completo: string | null
      telefono_encontrado: string | null
    }[] | null

    if (phoneResult && phoneResult[0]?.phone_exists) {
      return {
        success: false,
        message: `Teléfono ya registrado para ${phoneResult[0].nombre_completo} (${phoneResult[0].codigo_bp})`,
        bp_id: null,
        codigo_bp: null,
        warnings: null,
      }
    }
  }

  // Crear la persona usando INSERT directo a dm_actores (CRUD estándar de Supabase)
  // La tabla dm_actores usa el patrón CTI y contiene tanto personas como empresas
  const { data: newPersona, error: insertError } = await supabase
    .from('dm_actores')
    .insert({
      organizacion_id: data.organizacionId,
      tipo_actor: 'persona',
      tipo_documento: data.tipoDocumento,
      num_documento: data.numeroDocumento,
      primer_nombre: data.primerNombre,
      segundo_nombre: data.segundoNombre || null,
      primer_apellido: data.primerApellido,
      segundo_apellido: data.segundoApellido || null,
      email_principal: data.emailPrincipal || null,
      telefono_principal: data.telefonoPrincipal || null,
      fecha_nacimiento: data.fechaNacimiento || null,
      genero_actor: data.genero || null,
      estado_civil: data.estadoCivil || null,
      es_socio: true, // Por defecto, las personas creadas son socios
      estado_actor: 'activo',
      // Campos opcionales adicionales
      email_secundario: data.emailSecundario || null,
      telefono_secundario: data.telefonoSecundario || null,
      // Perfiles JSONB
      perfil_identidad: {
        nacionalidad: data.nacionalidad || 'CO',
        lugar_nacimiento: data.lugarNacimiento || null,
      },
      perfil_profesional_corporativo: {
        ocupacion: data.ocupacion || null,
        profesion: data.profesion || null,
        nivel_educacion: data.nivelEducacion || null,
      },
      perfil_salud: {
        eps: data.eps || null,
        tipo_sangre: data.tipoSangre || null,
      },
      perfil_contacto: {
        contacto_emergencia_id: data.contactoEmergenciaId || null,
        relacion_emergencia: data.relacionEmergencia || null,
      },
      perfil_redes: {
        linkedin: data.linkedinUrl || null,
        facebook: data.facebookUrl || null,
        instagram: data.instagramHandle || null,
        twitter: data.twitterHandle || null,
      },
      perfil_intereses: {
        tags: data.tags || [],
      },
    })
    .select()
    .single()

  // Handle errors
  if (insertError) {
    console.error('Error inserting persona:', insertError)

    // Check for specific database errors
    if (insertError.message.includes('duplicate key') || insertError.message.includes('already exists')) {
      return {
        success: false,
        message: 'Ya existe una persona con ese número de documento.',
        bp_id: null,
        codigo_bp: null,
        warnings: null,
      }
    }

    return {
      success: false,
      message: `Error al crear la persona: ${insertError.message}`,
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  revalidatePath('/admin/socios/personas')

  return {
    success: true,
    message: 'Persona creada exitosamente',
    bp_id: newPersona.id,
    codigo_bp: newPersona.codigo_bp,
    warnings: null,
  }
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
    .from('dm_actores')
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
  revalidatePath('/admin/socios/actores')
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
    .from('dm_actores')
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
  revalidatePath('/admin/socios/actores')
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
    .from('dm_actores')
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
    .from('dm_actores')
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
  revalidatePath('/admin/socios/actores')
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
    .from('dm_actores')
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
  revalidatePath('/admin/socios/actores')
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
    .from('dm_actores')
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
    .from('dm_actores')
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
  revalidatePath('/admin/socios/actores')
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

// ...

interface ActorView {
  id: string
  codigo: string
  nombre: string
  identificacion: string
  email_principal: string | null
  telefono_principal: string | null
  foto_url: string | null
  organizacion_id: string
  tipo_actor: string
  eliminado_en: string | null
  [key: string]: unknown
}

export async function buscarPersonasDisponiblesParaRelacion(
  bp_id: string,
  query: string,
  organizacion_id: string
) {
  const supabase = await createClient()

  // 1. Obtener IDs relacionados para excluir (yo mismo + relaciones existentes)
  // Usamos vn_relaciones_actores para identificar quiénes ya tienen un vínculo
  const { data: relaciones } = await supabase
    .from('vn_relaciones_actores')
    .select('bp_origen_id, bp_destino_id')
    .or(`bp_origen_id.eq.${bp_id},bp_destino_id.eq.${bp_id}`)
    .is('eliminado_en', null)
    .is('fecha_fin', null)

  const idsExcluidos = new Set<string>([bp_id])
  relaciones?.forEach(rel => {
    idsExcluidos.add(rel.bp_origen_id)
    idsExcluidos.add(rel.bp_destino_id)
  })

  // 2. Buscar en dm_actores filtrando por tipo_actor = persona
  // No excluimos de la query para poder mostrar "Ya vinculado" en la UI
  const { data, error } = await supabase
    .from('dm_actores')
    .select('id, codigo_bp, num_documento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono_principal')
    .eq('organizacion_id', organizacion_id)
    .eq('tipo_actor', 'persona')
    .is('eliminado_en', null)
    .or(`num_documento.ilike.%${query}%,primer_nombre.ilike.%${query}%,segundo_nombre.ilike.%${query}%,primer_apellido.ilike.%${query}%,segundo_apellido.ilike.%${query}%`)
    .limit(20)

  if (error) {
    console.error('Error searching available persons:', error)
    return { success: false, data: [] }
  }

  // 3. Mapear resultados a la estructura esperada por el Combobox
  const disponibles = (data || [])
    .filter(actor => actor.id !== bp_id) // Excluirse a sí mismo siempre
    .map((actor) => ({
      id: actor.id,
      codigo_bp: actor.codigo_bp,
      nombre_completo: `${actor.primer_nombre} ${actor.segundo_nombre || ''} ${actor.primer_apellido} ${actor.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim(),
      identificacion: actor.num_documento,
      telefono: actor.telefono_principal,
      tipo_actor: 'persona',
      foto_url: null,
      already_linked: idsExcluidos.has(actor.id)
    }))

  return {
    success: true,
    data: disponibles
  }
}
