'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EstadoDocComercial } from './doc-comerciales-board'
import type { DocumentoComercialView } from '@/features/procesos/documentos-comerciales/columns'
import { DocComercialCard } from './doc-comercial-card'

interface DocComercialColumnProps {
  estado: EstadoDocComercial
  config: {
    label: string
    color: string
  }
  docComerciales: DocumentoComercialView[]
}

export function DocComercialColumn({ estado, config, docComerciales }: DocComercialColumnProps) {
  const { setNodeRef } = useDroppable({
    id: estado,
  })

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div
        className={`p-3 rounded-t-lg border-b-2 font-medium text-sm ${config.color}`}
      >
        <div className="flex items-center justify-between">
          <span>{config.label}</span>
          <span className="text-xs opacity-60">{docComerciales.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 rounded-b-lg border bg-background/50 backdrop-blur-sm`}
      >
        <SortableContext items={docComerciales.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {docComerciales.map((docComercial) => (
            <DocComercialCard key={docComercial.id} docComercial={docComercial} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
