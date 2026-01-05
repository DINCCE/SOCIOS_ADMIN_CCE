import { Suspense } from 'react'
import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { TareasBoard } from '@/components/procesos/tareas/tareas-board'
import { TareasList } from '@/components/procesos/tareas/tareas-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function TareasPage() {
  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Tareas"
        description="Gestiona las tareas y actividades"
      />

      {/* Toolbar */}
      <PageToolbar
        right={<ViewToggle defaultValue="list" />}
      />

      {/* Content */}
      <PageContent>
        <Suspense fallback={<TareasSkeleton />}>
          <TareasContent />
        </Suspense>
      </PageContent>
    </PageShell>
  )
}

function TareasContent() {
  return (
    <>
      <TareasBoard />
      <TareasList />
    </>
  )
}

function TareasSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
