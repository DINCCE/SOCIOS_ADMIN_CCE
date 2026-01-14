import { createClient } from '@/lib/supabase/server'

/**
 * Check if a document number already exists in the organization
 * Calls RPC: dm_actores_documento_existe(p_organizacion_id, p_tipo_documento, p_num_documento, p_excluir_id)
 */
export async function checkDocumentoExists(
  organizacionId: string,
  tipoDocumento: string,
  numeroDocumento: string,
  excluirId?: string
): Promise<{ exists: boolean; actorId?: string; codigoBp?: string; nombre?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('dm_actores_documento_existe', {
    p_organizacion_id: organizacionId,
    p_tipo_documento: tipoDocumento,
    p_num_documento: numeroDocumento,
    p_excluir_id: excluirId || null,
  })

  if (error) {
    console.error('Error checking document:', error)
    return { exists: false }
  }

  const result = data as {
    doc_exists: boolean
    actor_id: string | null
    codigo_bp: string | null
    nombre_completo: string | null
  }[]

  if (result && result[0]?.doc_exists) {
    return {
      exists: true,
      actorId: result[0].actor_id || undefined,
      codigoBp: result[0].codigo_bp || undefined,
      nombre: result[0].nombre_completo || undefined,
    }
  }

  return { exists: false }
}

/**
 * Check if an email already exists in the organization
 * Calls RPC: dm_actores_email_existe(p_organizacion_id, p_email, p_excluir_id)
 */
export async function checkEmailExists(
  organizacionId: string,
  email: string,
  excluirId?: string
): Promise<{ exists: boolean; actorId?: string; codigoBp?: string; nombre?: string; emailEncontrado?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('dm_actores_email_existe', {
    p_organizacion_id: organizacionId,
    p_email: email,
    p_excluir_id: excluirId || null,
  })

  if (error) {
    console.error('Error checking email:', error)
    return { exists: false }
  }

  const result = data as {
    email_exists: boolean
    actor_id: string | null
    codigo_bp: string | null
    nombre_completo: string | null
    email_encontrado: string | null
  }[]

  if (result && result[0]?.email_exists) {
    return {
      exists: true,
      actorId: result[0].actor_id || undefined,
      codigoBp: result[0].codigo_bp || undefined,
      nombre: result[0].nombre_completo || undefined,
      emailEncontrado: result[0].email_encontrado || undefined,
    }
  }

  return { exists: false }
}

/**
 * Check if a phone number already exists in the organization
 * Calls RPC: dm_actores_telefono_existe(p_organizacion_id, p_telefono, p_excluir_id)
 */
export async function checkTelefonoExists(
  organizacionId: string,
  telefono: string,
  excluirId?: string
): Promise<{ exists: boolean; actorId?: string; codigoBp?: string; nombre?: string; telefonoEncontrado?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('dm_actores_telefono_existe', {
    p_organizacion_id: organizacionId,
    p_telefono: telefono,
    p_excluir_id: excluirId || null,
  })

  if (error) {
    console.error('Error checking phone:', error)
    return { exists: false }
  }

  const result = data as {
    phone_exists: boolean
    actor_id: string | null
    codigo_bp: string | null
    nombre_completo: string | null
    telefono_encontrado: string | null
  }[]

  if (result && result[0]?.phone_exists) {
    return {
      exists: true,
      actorId: result[0].actor_id || undefined,
      codigoBp: result[0].codigo_bp || undefined,
      nombre: result[0].nombre_completo || undefined,
      telefonoEncontrado: result[0].telefono_encontrado || undefined,
    }
  }

  return { exists: false }
}
