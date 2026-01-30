import { AppSidebar } from '@/components/app-sidebar'
import { AdminContentWrapper } from '@/components/admin-content-wrapper'
import { AICompanion } from '@/components/ai-companion'
import { AICompanionProvider } from '@/features/ai-companion/hooks'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import type { UserRole } from '@/lib/auth/page-permissions'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's first organization and role
  const { data: membership } = await supabase
    .from('config_organizacion_miembros')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .is('eliminado_en', null)
    .limit(1)
    .single()

  const userRole = (membership?.role as UserRole) || null

  const userData = user
    ? {
      name: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar: user.user_metadata?.avatar_url || '',
      role: userRole,
    }
    : undefined

  return (
    <SidebarProvider>
      <AppSidebar
        user={userData}
        className="w-[18rem]"
      />
      <SidebarInset className="max-w-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>
        </header>
        <AICompanionProvider>
          <AdminContentWrapper>{children}</AdminContentWrapper>
          <AICompanion />
        </AICompanionProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
