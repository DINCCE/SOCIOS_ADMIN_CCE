'use client'

import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { TareaCard } from './tarea-card'
import { TareaColumn } from './tarea-column'
import { actualizarTarea } from '@/app/actions/tareas'
import { toast } from 'sonner'
import type { Database } from '@/types_db'

export type TareaView = {
  id: string
  codigo_tarea: string | null
  titulo: string
  descripcion: string | null
  estado: string
  prioridad: string
  fecha_vencimiento: string | null
  organizacion_id: string
  organizacion_nombre: string
  asignado_a: string | null
  asignado_email: string | null
  asignado_nombre: string | null
  oportunidad_id: string | null
  oportunidad_codigo: string | null
  oportunidad_estado: string | null
  relacionado_con_bp: string | null
  relacionado_codigo_bp: string | null
  relacionado_nombre: string | null
  creado_en: string
  eliminado_en: string | null
}

export type EstadoTarea = Database['public']['Enums']['estado_tarea_enum']

export type PrioridadTarea = Database['public']['Enums']['prioridad_tarea_enum']

const COLUMN_CONFIG: Record<
  EstadoTarea,
  { label: string; color: string; isNegative: boolean }
> = {
  pendiente: { label: 'Pendiente', color: 'bg-blue-50 border-blue-200', isNegative: false },
  en_progreso: { label: 'En Progreso', color: 'bg-yellow-50 border-yellow-200', isNegative: false },
  bloqueada: { label: 'Bloqueada', color: 'bg-orange-50 border-orange-200', isNegative: false },
  hecha: { label: 'Hecha', color: 'bg-green-50 border-green-200', isNegative: false },
  cancelada: { label: 'Cancelada', color: 'bg-muted/30 border-muted/50', isNegative: true },
}

export function TareasBoard() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const { data: tareas, isLoading } = useQuery({
    queryKey: ['tareas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tareas_view')
        .select('*')
        .is('eliminado_en', null)
        .order('fecha_vencimiento', { ascending: true })

      if (error) throw error
      return data as TareaView[]
    },
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const tareaId = active.id as string
    const newEstado = over.id as EstadoTarea

    const tarea = tareas?.find((t) => t.id === tareaId)
    if (!tarea || tarea.estado === newEstado) return

    try {
      const result = await actualizarTarea(tareaId, { estado: newEstado })

      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success('Estado actualizado correctamente')
    } catch (error) {
      console.error('Error updating tarea:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  if (view !== 'board') return null
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.keys(COLUMN_CONFIG).map((estado) => (
          <div key={estado} className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const groupedTareas = tareas?.reduce((acc, tarea) => {
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
        {(Object.keys(COLUMN_CONFIG) as EstadoTarea[]).map((estado) => (
          <TareaColumn
            key={estado}
            estado={estado}
            config={COLUMN_CONFIG[estado]}
            tareas={groupedTareas?.[estado] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && tareas?.find((t) => t.id === activeId) && (
          <TareaCard
            tarea={tareas.find((t) => t.id === activeId)!}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
