import type { TareaView } from '@/features/procesos/tareas/columns'
import type { ColumnConfig, KanbanBoardConfig, KanbanColumn, KanbanCard } from '@/components/kanban/types'

export type TareaEstado = 'Pendiente' | 'En Progreso' | 'Terminada' | 'Pausada' | 'Cancelada'

export const TAREAS_COLUMN_ORDER: readonly TareaEstado[] = [
  'Pendiente',
  'En Progreso',
  'Pausada',
  'Terminada',
  'Cancelada',
] as const

export const TAREAS_COLUMN_CONFIG: Record<TareaEstado, ColumnConfig> = {
  Pendiente: {
    label: 'Pendiente',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    badgeColor: 'bg-gray-100',
    badgeTextColor: 'text-gray-700',
  },
  'En Progreso': {
    label: 'En Progreso',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-100',
    badgeTextColor: 'text-yellow-700',
  },
  Pausada: {
    label: 'Pausada',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    badgeColor: 'bg-orange-100',
    badgeTextColor: 'text-orange-700',
  },
  Terminada: {
    label: 'Terminada',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    badgeColor: 'bg-green-100',
    badgeTextColor: 'text-green-700',
  },
  Cancelada: {
    label: 'Cancelada',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-100',
    badgeTextColor: 'text-red-700',
  },
}

/**
 * Convert TareaView[] to the format expected by GenericKanbanBoard
 */
export function tareasToKanbanData(tareas: TareaView[]): {
  columns: KanbanColumn[]
  cards: Record<string, KanbanCard<TareaView>>
} {
  const columnsMap = new Map<TareaEstado, KanbanColumn>()
  const cards: Record<string, KanbanCard<TareaView>> = {}

  // Initialize columns
  for (const columnId of TAREAS_COLUMN_ORDER) {
    columnsMap.set(columnId, {
      id: columnId,
      title: columnId,
      cardIds: [],
      config: TAREAS_COLUMN_CONFIG[columnId],
    })
  }

  // Group tareas by estado
  for (const tarea of tareas) {
    const estado = tarea.estado as TareaEstado
    const column = columnsMap.get(estado)
    if (column) {
      column.cardIds.push(tarea.id)
      cards[tarea.id] = { id: tarea.id, data: tarea }
    }
  }

  return {
    columns: Array.from(columnsMap.values()),
    cards,
  }
}

/**
 * Handle drag end for tareas - updates both estado (column) and posicion_orden (vertical)
 */
export async function handleTareasDragEnd(
  result: import('@hello-pangea/dnd').DropResult,
  onUpdate: (tareaId: string, newEstado: TareaEstado) => Promise<{ success: boolean; message?: string }>,
  onReorder?: (tareaId: string, newPosition: number, estado: TareaEstado) => Promise<{ success: boolean; message?: string }>
) {
  const { destination, source, draggableId } = result

  // No destination - dropped outside
  if (!destination) return

  // Same position - no change
  if (destination.droppableId === source.droppableId && destination.index === source.index) {
    return
  }

  // Vertical reorder (same column, different index)
  if (destination.droppableId === source.droppableId && destination.index !== source.index) {
    const estado = destination.droppableId as TareaEstado
    if (onReorder) {
      await onReorder(draggableId, destination.index, estado)
    }
    return
  }

  // Horizontal move (different column) - update estado
  if (destination.droppableId !== source.droppableId) {
    const newEstado = destination.droppableId as TareaEstado
    await onUpdate(draggableId, newEstado)
  }
}

export function getTareasKanbanConfig(): KanbanBoardConfig<TareaEstado> {
  return {
    columnIds: TAREAS_COLUMN_ORDER,
    getColumnConfig: (columnId) => TAREAS_COLUMN_CONFIG[columnId],
  }
}
