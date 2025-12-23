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
  // Add other optional fields if needed: emailSecundario, telefonoSecundario, whatsapp, ocupacion, profesion, nivelEducacion
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
    p_fecha_nacimiento: data.fechaNacimiento,
    p_email_principal: data.emailPrincipal,
    p_telefono_principal: data.telefonoPrincipal,
    // Optional parameters
    p_segundo_nombre: data.segundoNombre,
    p_segundo_apellido: data.segundoApellido,
    p_estado_civil: data.estadoCivil,
    p_nacionalidad: data.nacionalidad,
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
