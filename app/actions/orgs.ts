'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setOrgCookie } from '@/lib/cookies'

export interface UserOrganization {
  id: string
  nombre: string
}

export async function getUserOrganizations(): Promise<{
  success: boolean
  organizations?: UserOrganization[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No authenticated user' }
  }

  const { data, error } = await supabase
    .from('config_organizacion_miembros')
    .select('organization_id, config_organizaciones(id, nombre)')
    .eq('user_id', user.id)
    .is('eliminado_en', null)

  if (error) {
    return { success: false, error: error.message }
  }

  const organizations: UserOrganization[] = data
    .map((item: any) => item.config_organizaciones)
    .filter(Boolean)

  return { success: true, organizations }
}

export async function selectOrganization(orgId: string) {
  await setOrgCookie(orgId)
  return { success: true }
}

export async function checkAndRedirect() {
  const result = await getUserOrganizations()

  if (!result.success || !result.organizations || result.organizations.length === 0) {
    redirect('/unauthorized')
  }

  // Case: 1 Org - Auto-select and set cookie
  if (result.organizations.length === 1) {
    const orgId = result.organizations[0].id
    await selectOrganization(orgId) // Writes cookie in Server Action
    redirect('/admin')
  }

  // Case: Multiple orgs - Show selection page
  redirect('/select-org')
}
