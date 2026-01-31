import type { DropResult } from '@hello-pangea/dnd'

export type ColumnId = string
export type CardId = string

// Configuration for column appearance
export interface ColumnConfig {
  label: string
  bgColor: string          // e.g., 'bg-gray-50'
  textColor: string        // e.g., 'text-gray-700'
  borderColor: string      // e.g., 'border-gray-200'
  badgeColor: string       // e.g., 'bg-gray-100'
  badgeTextColor: string   // e.g., 'text-gray-700'
}

// A column in the kanban board
export interface KanbanColumn {
  id: ColumnId
  title: string
  cardIds: CardId[]
  config: ColumnConfig
}

// Generic card data
export interface KanbanCard<T = unknown> {
  id: CardId
  data: T                  // Domain-specific data (TareaView, DocumentoComercialView, etc.)
}

// Props for the generic board
export interface GenericKanbanBoardProps<T = unknown> {
  columns: KanbanColumn[]
  cards: Record<CardId, KanbanCard<T>>
  onDragEnd: (result: DropResult) => void | Promise<void>
  renderCard: (card: KanbanCard<T>, isDragging?: boolean) => React.ReactNode
  onCardClick?: (cardId: CardId) => void
  isDragDisabled?: (cardId: CardId) => boolean
  className?: string
}

// Configuration object for creating boards
export interface KanbanBoardConfig<TColumnId extends string> {
  columnIds: readonly TColumnId[]
  getColumnConfig: (columnId: TColumnId) => ColumnConfig
}
