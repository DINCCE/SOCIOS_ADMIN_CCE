import { Suspense } from 'react'
import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { OportunidadesBoard } from '@/components/procesos/oportunidades/oportunidades-board'
import { OportunidadesList } from '@/components/procesos/oportunidades/oportunidades-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function OportunidadesPage() {
  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Oportunidades"
        description="Gestiona las oportunidades de negocio y solicitudes"
      />

      {/* Toolbar */}
      <PageToolbar
        right={<ViewToggle defaultValue="list" />}
      />

      {/* Content */}
      <PageContent>
        <Suspense fallback={<OportunidadesSkeleton />}>
          <OportunidadesContent />
        </Suspense>
      </PageContent>
    </PageShell>
  )
}

function OportunidadesContent() {
  return (
    <>
      <OportunidadesBoard />
      <OportunidadesList />
    </>
  )
}

function OportunidadesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}
