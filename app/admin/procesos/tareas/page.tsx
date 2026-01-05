import { Suspense } from 'react'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { TareasBoard } from '@/components/procesos/tareas/tareas-board'
import { TareasList } from '@/components/procesos/tareas/tareas-list'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export default function TareasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Gestiona las tareas y actividades"
      >
        <ViewToggle defaultValue="list" />
      </PageHeader>

      <Suspense fallback={<TareasSkeleton />}>
        <TareasContent />
      </Suspense>
    </div>
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
