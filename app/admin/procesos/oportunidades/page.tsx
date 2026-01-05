import { Suspense } from 'react'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { OportunidadesBoard } from '@/components/procesos/oportunidades/oportunidades-board'
import { OportunidadesList } from '@/components/procesos/oportunidades/oportunidades-list'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export default function OportunidadesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidades"
        description="Gestiona las oportunidades de negocio y solicitudes"
      >
        <ViewToggle defaultValue="list" />
      </PageHeader>

      <Suspense fallback={<OportunidadesSkeleton />}>
        <OportunidadesContent />
      </Suspense>
    </div>
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
