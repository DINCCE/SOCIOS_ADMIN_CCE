'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrearEmpresaParams } from '@/types/business-partners'
import type { CompanyFormValues } from '@/lib/schemas/company-schema'

/**
 * Create empresa from CompanyFormValues (from new-company-sheet form)
 * Handles organization lookup and calling the RPC
 *
 * @param formData - Form data from new-company-sheet component
 * @returns Object with the RPC response { success, bp_id, codigo_bp, message, warnings }
 */
export async function crearEmpresaFromCompanyFormValues(
  formData: CompanyFormValues
) {
  const supabase = await createClient()

  // 1. Get organization (current pattern: first org)
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  if (orgError || !orgData) {
    console.error('Error fetching organization:', orgError)
    return {
      success: false,
      message: 'No se encontró una organización activa para asociar la empresa.',
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  // 2. Call the main crearEmpresa function
  return crearEmpresa({
    p_organizacion_id: orgData.id,
    p_razon_social: formData.razon_social,
    p_nit: formData.nit,
    p_tipo_sociedad: formData.tipo_sociedad,
    p_email_principal: formData.email_principal,
    p_telefono_principal: formData.telefono_principal,
    p_nombre_comercial: formData.nombre_comercial || undefined,
    p_digito_verificacion: formData.digito_verificacion || undefined,
    p_fecha_constitucion: formData.fecha_constitucion || undefined,
    p_ciudad_constitucion: formData.ciudad_constitucion || undefined,
    p_sector_industria: formData.sector_industria || undefined,
    p_actividad_economica: formData.actividad_economica || undefined,
    p_tamano_empresa: formData.tamano_empresa || undefined,
    p_email_secundario: formData.email_secundario || undefined,
    p_telefono_secundario: formData.telefono_secundario || undefined,
    p_whatsapp: formData.whatsapp || undefined,
    p_website: formData.website || undefined,
    p_representante_legal_id: formData.representante_legal_id || undefined,
  })
}

/**
 * Server action to create a new empresa business partner
 * Uses Supabase RPC function to handle CTI pattern atomically
 *
 * @param params - Empresa creation parameters (matches RPC function signature)
 * @returns Object with RPC response
 */
export async function crearEmpresa(params: CrearEmpresaParams) {
  const supabase = await createClient()

  // Call the RPC function
  const { data: rpcResponse, error } = await supabase.rpc('crear_empresa', params)

  if (error) {
    console.error('Error creating empresa via RPC:', error)
    return {
      success: false,
      message: `Error de sistema: ${error.message}`,
      bp_id: null,
      codigo_bp: null,
      warnings: null,
    }
  }

  const result = rpcResponse as {
    success: boolean
    bp_id: string | null
    codigo_bp: string | null
    message: string
    warnings: string[] | null
  }

  if (result.success) {
    // Revalidate empresas list page
    revalidatePath('/admin/socios/empresas')
  }

  return result
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
    .from('empresas')
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
 * Also updates business_partners.eliminado_en for consistency
 *
 * @param id - The UUID of the empresa to soft delete
 * @returns Object with { success, message, error? }
 */
export async function softDeleteEmpresa(id: string) {
  const supabase = await createClient()

  // 1. Soft delete empresas record
  const { error: empresaError } = await supabase
    .from('empresas')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', id)

  if (empresaError) {
    console.error('Error soft deleting empresa:', empresaError)
    return {
      success: false,
      message: `Error al eliminar empresa: ${empresaError.message}`,
      error: empresaError
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
  revalidatePath('/admin/socios/empresas')

  return {
    success: true,
    message: 'Empresa eliminada correctamente'
  }
}
