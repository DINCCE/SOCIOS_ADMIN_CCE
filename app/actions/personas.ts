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
 * Search personas by name or document
 * Uses v_personas_org view as requested
 */
export async function buscarPersonas(term: string) {
  const supabase = await createClient()

  // Prevent empty search
  if (!term || term.length < 2) return []

  const { data, error } = await supabase
    .from('v_personas_completa')
    .select('id, nombre_completo, numero_documento, tipo_documento, foto_url')
    .or(`nombre_completo.ilike.%${term}%,numero_documento.ilike.%${term}%`)
    .limit(5)

  if (error) {
    console.error('Error searching personas:', error)
    return []
  }

  return data
}
