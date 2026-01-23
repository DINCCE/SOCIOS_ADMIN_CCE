'use client'

import { useQueryClient } from '@tanstack/react-query'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState } from 'react'
import { DocComercialCard } from './doc-comercial-card'
import { DocComercialColumn } from './doc-comercial-column'
import { actualizarDocComercial } from '@/app/actions/doc-comerciales'
import { toast } from 'sonner'
import type { DocumentoComercialView } from '@/features/procesos/documentos-comerciales/columns'
import type { TrDocComercialEstados } from '@/lib/db-types'

export type EstadoDocComercial = TrDocComercialEstados

// Props interface for the board component
export interface DocComercialesBoardProps {
  data: DocumentoComercialView[]
  initialData: DocumentoComercialView[]
}

// Order of columns in the Kanban board
export const COLUMN_ORDER: EstadoDocComercial[] = [
  'Nueva',
  'En Progreso',
  'Ganada',
  'Pérdida',
  'Descartada',
]

const COLUMN_CONFIG: Record<
  EstadoDocComercial,
  { label: string; color: string; badgeColor: string; badgeBgColor: string }
> = {
  Nueva: {
    label: 'Nueva',
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
  Ganada: {
    label: 'Ganada',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'text-green-700 border-green-300',
    badgeBgColor: 'bg-green-100'
  },
  Pérdida: {
    label: 'Pérdida',
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'text-orange-700 border-orange-300',
    badgeBgColor: 'bg-orange-100'
  },
  Descartada: {
    label: 'Descartada',
    color: 'bg-red-50 border-red-200',
    badgeColor: 'text-red-700 border-red-300',
    badgeBgColor: 'bg-red-100'
  },
}

export function DocComercialesBoard({ data, initialData }: DocComercialesBoardProps) {
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

    const docComercialId = active.id as string
    const overId = over.id as string

    // Check if over.id is a valid estado (one of the column IDs)
    const validEstados: EstadoDocComercial[] = ['Nueva', 'En Progreso', 'Ganada', 'Pérdida', 'Descartada']
    const newEstado = validEstados.includes(overId as EstadoDocComercial) ? overId as EstadoDocComercial : null

    // If not dropped on a valid column (e.g., dropped on another card), find the card's column
    const finalEstado = newEstado || (() => {
      const droppedOnCard = data?.find((o: DocumentoComercialView) => o.id === overId)
      return droppedOnCard?.estado as EstadoDocComercial
    })()

    if (!finalEstado) return

    const docComercial = data?.find((o: DocumentoComercialView) => o.id === docComercialId)
    if (!docComercial || docComercial.estado === finalEstado) return

    // Store previous data for rollback
    const previousData = data

    // Optimistic update - use doc_comerciales key to match parent
    queryClient.setQueryData(['doc_comerciales'], data?.map((o: DocumentoComercialView) =>
      o.id === docComercialId ? { ...o, estado: finalEstado } : o
    ))

    try {
      const result = await actualizarDocComercial(docComercialId, { estado: finalEstado })

      if (!result.success) {
        throw new Error(result.message)
      }

      // Refetch to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: ['doc_comerciales'] })

      toast.success('Estado actualizado correctamente')
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(['doc_comerciales'], previousData)
      console.error('Error updating document:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const groupedDocComerciales = data?.reduce((acc: Record<EstadoDocComercial, DocumentoComercialView[]>, doc: DocumentoComercialView) => {
    const estado = doc.estado as EstadoDocComercial
    if (!acc[estado]) {
      acc[estado] = []
    }
    acc[estado]!.push(doc)
    return acc
  }, {} as Record<EstadoDocComercial, DocumentoComercialView[]>)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((estado) => (
          <DocComercialColumn
            key={estado}
            estado={estado}
            config={COLUMN_CONFIG[estado]}
            docComerciales={groupedDocComerciales?.[estado] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && data?.find((o: DocumentoComercialView) => o.id === activeId) && (
          <DocComercialCard
            docComercial={data.find((o: DocumentoComercialView) => o.id === activeId)!}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
