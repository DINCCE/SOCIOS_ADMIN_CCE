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
