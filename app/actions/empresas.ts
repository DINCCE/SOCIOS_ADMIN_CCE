'use server'

import { createClient, getActiveOrganizationId } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CompanyFormValues } from '@/lib/schemas/company-schema'

/**
 * Create empresa from CompanyFormValues (from new-company-sheet form)
 * Handles organization lookup and direct insert to dm_actores
 *
 * @param formData - Form data from new-company-sheet component
 * @returns Object with the response { success, bp_id, codigo_bp, message, warnings }
 */
export async function crearEmpresaFromCompanyFormValues(
  formData: CompanyFormValues
) {
  console.log('[crearEmpresa] Iniciando creación de empresa con formData:', formData)

  const supabase = await createClient()

  // 1. Obtener organización activa del usuario
  const organizacionId = await getActiveOrganizationId()

  console.log('[crearEmpresa] Organización ID obtenida:', organizacionId)

  if (!organizacionId) {
    console.error('[crearEmpresa] ERROR: No se encontró organización ID')
    return {
      success: false,
      message: 'No se encontró una organización activa para asociar la empresa. Verifique su sesión.',
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  console.log('[crearEmpresa] Organización válida, continuando con creación...')

  // 2. Validaciones RPC (revisar si existen funciones similares para empresas)
  // - dm_actores_documento_existe (para NIT)
  // - dm_actores_email_existe
  // - dm_actores_telefono_existe

  // Check document uniqueness
  const { data: docCheck } = await supabase.rpc('dm_actores_documento_existe', {
    p_organizacion_id: organizacionId,
    p_tipo_documento: 'NIT',
    p_num_documento: formData.nit,
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
      message: `NIT ya registrado para ${docResult[0].nombre_completo || docResult[0].codigo_bp}`,
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  // Check email uniqueness (if provided)
  if (formData.email_principal && formData.email_principal !== '') {
    const { data: emailCheck } = await supabase.rpc('dm_actores_email_existe', {
      p_organizacion_id: organizacionId,
      p_email: formData.email_principal,
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

  // Check phone uniqueness (if provided)
  if (formData.telefono_principal && formData.telefono_principal !== '') {
    const { data: phoneCheck } = await supabase.rpc('dm_actores_telefono_existe', {
      p_organizacion_id: organizacionId,
      p_telefono: formData.telefono_principal,
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

  // 3. Insert directo a dm_actores con tipo_actor = 'empresa'
  const { data: newEmpresa, error: insertError } = await supabase
    .from('dm_actores')
    .insert({
      organizacion_id: organizacionId,
      tipo_actor: 'empresa', // DIFERENTE: 'empresa' en lugar de 'persona'
      nat_fiscal: 'jurídica',
      tipo_documento: 'NIT',
      num_documento: formData.nit,
      digito_verificacion: formData.digito_verificacion ? parseInt(formData.digito_verificacion) : null,
      razon_social: formData.razon_social,
      nombre_comercial: formData.nombre_comercial || null,
      email_principal: formData.email_principal || null,
      telefono_principal: formData.telefono_principal || null,
      es_socio: true,
      estado_actor: 'activo',
      // Perfil profesional/corporativo para datos de empresa
      perfil_profesional_corporativo: {
        tipo_sociedad: formData.tipo_sociedad,
        sector_industria: formData.sector_industria || null,
        actividad_economica: formData.actividad_economica || null,
        tamano_empresa: formData.tamano_empresa || null,
      },
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting empresa:', insertError)

    // Check for specific database errors
    if (insertError.message.includes('duplicate key') || insertError.message.includes('already exists')) {
      return {
        success: false,
        message: 'Ya existe una empresa con ese NIT.',
        bp_id: null,
        codigo_bp: null,
        warnings: null,
      }
    }

    return {
      success: false,
      message: `Error al crear la empresa: ${insertError.message}`,
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  revalidatePath('/admin/socios/empresas')

  return {
    success: true,
    message: 'Empresa creada exitosamente',
    bp_id: newEmpresa.id,
    codigo_bp: newEmpresa.codigo_bp,
    warnings: null,
  }
}

/**
 * Update empresa data
 *
 * @param id - The UUID of the empresa
 * @param data - Partial empresa data to update
 * @returns Object with { success, message, error? }
 */
export async function actualizarEmpresa(
  id: string,
  data: Partial<{
    razon_social: string
    nombre_comercial: string
    nit: string
    digito_verificacion: string
    tipo_sociedad: string
    fecha_constitucion: string
    ciudad_constitucion: string
    pais_constitucion: string
    numero_registro: string
    codigo_ciiu: string
    sector_industria: string
    actividad_economica: string
    tamano_empresa: string
    representante_legal_id: string
    cargo_representante: string
    email_secundario: string
    telefono_secundario: string
    whatsapp: string
    website: string
    linkedin_url: string
    facebook_url: string
    instagram_handle: string
    twitter_handle: string
    logo_url: string
    ingresos_anuales: number
    numero_empleados: number
    atributos: Record<string, unknown>
  }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dm_actores')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating empresa:', error)
    return {
      success: false,
      message: `Error al actualizar empresa: ${error.message}`,
      error
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/empresas')

  return {
    success: true,
    message: 'Empresa actualizada correctamente'
  }
}

/**
 * Soft delete an empresa by setting eliminado_en timestamp
 * Also updates dm_actores.eliminado_en for consistency
 *
 * @param id - The UUID of the empresa to soft delete
 * @returns Object with { success, message, error? }
 */
export async function softDeleteEmpresa(id: string) {
  const supabase = await createClient()

  // Soft delete empresa record (dm_actores)
  const { error } = await supabase
    .from('dm_actores')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error soft deleting empresa:', error)
    return {
      success: false,
      message: `Error al eliminar empresa: ${error.message}`,
      error
    }
  }

  // Revalidate pages
  revalidatePath('/admin/socios/empresas')

  return {
    success: true,
    message: 'Empresa eliminada correctamente'
  }
}
