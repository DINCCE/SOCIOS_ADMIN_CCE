'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EstadoOportunidad } from './oportunidades-board'
import type { OportunidadView } from './oportunidades-board'
import { OportunidadCard } from './oportunidad-card'

interface OportunidadColumnProps {
  estado: EstadoOportunidad
  config: {
    label: string
    color: string
    isNegative: boolean
  }
  oportunidades: OportunidadView[]
}

export function OportunidadColumn({ estado, config, oportunidades }: OportunidadColumnProps) {
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
          <span className="text-xs opacity-60">{oportunidades.length}</span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 rounded-b-lg border bg-background/50 backdrop-blur-sm ${
          config.isNegative ? 'bg-muted/20' : ''
        }`}
      >
        <SortableContext items={oportunidades.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {oportunidades.map((oportunidad) => (
            <OportunidadCard key={oportunidad.id} oportunidad={oportunidad} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
