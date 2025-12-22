import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | SOCIOS_ADMIN',
  description: 'Main dashboard for managing business partners',
}

export default function AdminPage() {
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
          <div className="text-sm text-muted-foreground">
            Total Business Partners
          </div>
          <div className="text-2xl font-semibold">0</div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
          <div className="text-sm text-muted-foreground">Personas</div>
          <div className="text-2xl font-semibold">0</div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
          <div className="text-sm text-muted-foreground">Empresas</div>
          <div className="text-2xl font-semibold">0</div>
        </div>
      </div>
      <div className="flex min-h-[100vh] flex-1 flex-col gap-4 rounded-xl bg-muted/50 p-4 md:min-h-min">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Welcome to SOCIOS ADMIN</h2>
          <p className="text-muted-foreground">
            Manage your business partners, organizations, and more from this
            dashboard.
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Quick Actions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by adding your first business partner or configuring
              your organization settings.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
