import { PageShell, PageDetailLayout, PageDetailSidebar, PageDetailMain } from "@/components/shell"
import { AccionDetailHeader } from "@/components/procesos/acciones/accion-detail-header"
import { AccionIdentityPanel } from "@/components/procesos/acciones/accion-identity-panel"
import { AccionTabsContent } from "@/components/procesos/acciones/accion-tabs-content"
import { createMockAccionDetail } from "@/features/procesos/acciones/types/acciones-schema"

interface AccionPageProps {
  params: Promise<{ id: string }>
}

export default async function AccionDetailPage({ params }: AccionPageProps) {
  const { id } = await params

  // Use mock data for now (will be replaced with DB query later)
  const accion = createMockAccionDetail(id)

  return (
    <PageShell>
      {/* Header area with custom AccionDetailHeader */}
      <div className="px-6 py-4 shrink-0 border-b border-border/60">
        <AccionDetailHeader accion={accion} />
      </div>

      {/* Two-column layout with ScrollArea */}
      <PageDetailLayout>
        <PageDetailSidebar>
          <AccionIdentityPanel accion={accion} />
        </PageDetailSidebar>
        <PageDetailMain>
          <AccionTabsContent accion={accion} />
        </PageDetailMain>
      </PageDetailLayout>
    </PageShell>
  )
}
