'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EstadoTarea } from './tareas-board'
import type { TareaView } from './tareas-board'
import { TareaCard } from './tarea-card'

interface TareaColumnProps {
  estado: EstadoTarea
  config: {
    label: string
    color: string
    isNegative: boolean
  }
  tareas: TareaView[]
}

export function TareaColumn({ estado, config, tareas }: TareaColumnProps) {
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
          <span className="text-xs opacity-60">{tareas.length}</span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 rounded-b-lg border bg-background/50 backdrop-blur-sm ${
          config.isNegative ? 'bg-muted/20' : ''
        }`}
      >
        <SortableContext items={tareas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tareas.map((tarea) => (
            <TareaCard key={tarea.id} tarea={tarea} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
