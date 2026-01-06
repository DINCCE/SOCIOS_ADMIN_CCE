import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userData = user
    ? {
      name: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar: user.user_metadata?.avatar_url || '',
    }
    : undefined

  return (
    <SidebarProvider>
      <AppSidebar
        user={userData}
        className="w-[21rem]"
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
