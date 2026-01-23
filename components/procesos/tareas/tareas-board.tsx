'use client'

import { useQueryClient } from '@tanstack/react-query'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState } from 'react'
import { TareaCard } from './tarea-card'
import { TareaColumn } from './tarea-column'
import { actualizarTarea } from '@/app/actions/tareas'
import { toast } from 'sonner'
import type { TareaView } from '@/features/procesos/tareas/columns'
import type { TrTareasEstado, TrTareasPrioridad } from '@/lib/db-types'

export type EstadoTarea = TrTareasEstado
export type PrioridadTarea = TrTareasPrioridad
export type { TareaView }

// Props interface for the board component
export interface TareasBoardProps {
  data: TareaView[]
  initialData: TareaView[]
  onTareaClick?: (tareaId: string) => void
}

// Order of columns in the Kanban board
export const COLUMN_ORDER: EstadoTarea[] = [
  'Pendiente',
  'En Progreso',
  'Terminada',
  'Pausada',
  'Cancelada',
]

const COLUMN_CONFIG: Record<
  EstadoTarea,
  { label: string; color: string; badgeColor: string; badgeBgColor: string }
> = {
  Pendiente: {
    label: 'Pendiente',
    color: 'bg-gray-50 border-gray-200',
    badgeColor: 'text-gray-700 border-gray-300',
    badgeBgColor: 'bg-gray-100'
  },
  'En Progreso': {
    label: 'En Progreso',
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'text-yellow-700 border-yellow-300',
    badgeBgColor: 'bg-yellow-100'
  },
  Terminada: {
    label: 'Terminada',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'text-green-700 border-green-300',
    badgeBgColor: 'bg-green-100'
  },
  Pausada: {
    label: 'Pausada',
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'text-orange-700 border-orange-300',
    badgeBgColor: 'bg-orange-100'
  },
  Cancelada: {
    label: 'Cancelada',
    color: 'bg-red-50 border-red-200',
    badgeColor: 'text-red-700 border-red-300',
    badgeBgColor: 'bg-red-100'
  },
}

export function TareasBoard({ data, initialData, onTareaClick }: TareasBoardProps) {
  const queryClient = useQueryClient()

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const tareaId = active.id as string
    const overId = over.id as string

    // Check if over.id is a valid estado (one of the column IDs)
    const validEstados: EstadoTarea[] = ['Pendiente', 'En Progreso', 'Pausada', 'Terminada', 'Cancelada']
    const newEstado = validEstados.includes(overId as EstadoTarea) ? overId as EstadoTarea : null

    // If not dropped on a valid column (e.g., dropped on another card), find the card's column
    const finalEstado = newEstado || (() => {
      const droppedOnCard = data?.find((t: TareaView) => t.id === overId)
      return droppedOnCard?.estado as EstadoTarea
    })()

    if (!finalEstado) return

    const tarea = data?.find((t: TareaView) => t.id === tareaId)
    if (!tarea || tarea.estado === finalEstado) return

    // Store previous data for rollback
    const previousData = data

    // Optimistic update - use tareas key to match parent
    queryClient.setQueryData(['tareas'], data?.map((t: TareaView) =>
      t.id === tareaId ? { ...t, estado: finalEstado } : t
    ))

    try {
      const result = await actualizarTarea(tareaId, { estado: finalEstado })

      if (!result.success) {
        throw new Error(result.message)
      }

      // Refetch to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: ['tareas'] })

      toast.success('Estado actualizado correctamente')
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(['tareas'], previousData)
      console.error('Error updating tarea:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const groupedTareas = data?.reduce((acc: Record<EstadoTarea, TareaView[]>, tarea: TareaView) => {
    const estado = tarea.estado as EstadoTarea
    if (!acc[estado]) {
      acc[estado] = []
    }
    acc[estado]!.push(tarea)
    return acc
  }, {} as Record<EstadoTarea, TareaView[]>)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((estado) => (
          <TareaColumn
            key={estado}
            estado={estado}
            config={COLUMN_CONFIG[estado]}
            tareas={groupedTareas?.[estado] || []}
            onTareaClick={onTareaClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && data?.find((t: TareaView) => t.id === activeId) && (
          <TareaCard
            tarea={data.find((t: TareaView) => t.id === activeId)!}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
