'use client'

import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { OportunidadCard } from './oportunidad-card'
import { OportunidadColumn } from './oportunidad-column'
import { actualizarOportunidad } from '@/app/actions/oportunidades'
import { toast } from 'sonner'
import type { Database } from '@/types_db'

export type OportunidadView = {
  id: string
  codigo: string
  tipo: string
  estado: string
  fecha_solicitud: string
  monto_estimado: number | null
  notas: string | null
  organizacion_id: string
  organizacion_nombre: string
  solicitante_id: string
  solicitante_codigo_bp: string
  solicitante_nombre: string
  responsable_id: string | null
  responsable_email: string | null
  creado_en: string
  eliminado_en: string | null
}

export type EstadoOportunidad = Database['public']['Enums']['estado_oportunidad_enum']

const COLUMN_CONFIG: Record<
  EstadoOportunidad,
  { label: string; color: string; isNegative: boolean }
> = {
  abierta: { label: 'Abierta', color: 'bg-blue-50 border-blue-200', isNegative: false },
  en_proceso: { label: 'En Proceso', color: 'bg-yellow-50 border-yellow-200', isNegative: false },
  ganada: { label: 'Ganada', color: 'bg-green-50 border-green-200', isNegative: false },
  perdida: { label: 'Perdida', color: 'bg-muted/30 border-muted/50', isNegative: true },
  cancelada: { label: 'Cancelada', color: 'bg-muted/30 border-muted/50', isNegative: true },
}

export function OportunidadesBoard() {
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

  const { data: oportunidades, isLoading } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('oportunidades_view')
        .select('*')
        .is('eliminado_en', null)
        .order('fecha_solicitud', { ascending: false })

      if (error) throw error
      return data as OportunidadView[]
    },
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const oportunidadId = active.id as string
    const newEstado = over.id as EstadoOportunidad

    const oportunidad = oportunidades?.find((o) => o.id === oportunidadId)
    if (!oportunidad || oportunidad.estado === newEstado) return

    // Optimistic update
    const previousOportunidades = oportunidades
    const updatedOportunidades = oportunidades?.map((o) =>
      o.id === oportunidadId ? { ...o, estado: newEstado } : o
    )

    try {
      const result = await actualizarOportunidad(oportunidadId, { estado: newEstado })

      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success('Estado actualizado correctamente')
    } catch (error) {
      // Rollback on error
      console.error('Error updating oportunidad:', error)
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

  const groupedOportunidades = oportunidades?.reduce((acc, oportunidad) => {
    const estado = oportunidad.estado as EstadoOportunidad
    if (!acc[estado]) {
      acc[estado] = []
    }
    acc[estado]!.push(oportunidad)
    return acc
  }, {} as Record<EstadoOportunidad, OportunidadView[]>)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {(Object.keys(COLUMN_CONFIG) as EstadoOportunidad[]).map((estado) => (
          <OportunidadColumn
            key={estado}
            estado={estado}
            config={COLUMN_CONFIG[estado]}
            oportunidades={groupedOportunidades?.[estado] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && oportunidades?.find((o) => o.id === activeId) && (
          <OportunidadCard
            oportunidad={oportunidades.find((o) => o.id === activeId)!}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
