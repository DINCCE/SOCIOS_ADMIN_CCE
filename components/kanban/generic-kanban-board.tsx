'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import type { GenericKanbanBoardProps, KanbanColumn } from './types'

export function GenericKanbanBoard<T = unknown>({
  columns,
  cards,
  onDragEnd,
  renderCard,
  onCardClick,
  isDragDisabled,
  className,
}: GenericKanbanBoardProps<T>) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4', className)}>
        {columns.map((column) => (
          <GenericKanbanColumn
            key={column.id}
            column={column}
            cards={cards}
            renderCard={renderCard}
            onCardClick={onCardClick}
            isDragDisabled={isDragDisabled}
          />
        ))}
      </div>
    </DragDropContext>
  )
}

function GenericKanbanColumn<T = unknown>({
  column,
  cards,
  renderCard,
  onCardClick,
  isDragDisabled,
}: {
  column: KanbanColumn
  cards: Record<string, { id: string; data: T }>
  renderCard: (card: { id: string; data: T }, isDragging?: boolean) => React.ReactNode
  onCardClick?: (cardId: string) => void
  isDragDisabled?: (cardId: string) => boolean
}) {
  const { config } = column

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Column Header */}
      <div className={cn('p-3 rounded-t-lg border-b-2 font-medium text-sm', config.bgColor, config.borderColor)}>
        <div className="flex items-center justify-between">
          <span className={config.textColor}>{config.label}</span>
          <span className={cn('text-xs opacity-60', config.textColor)}>{column.cardIds.length}</span>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-3 space-y-3 rounded-b-lg border bg-background/50 min-h-[200px]',
              snapshot.isDraggingOver && 'border-primary/50 bg-background/70'
            )}
          >
            {column.cardIds.map((cardId, index) => {
              const card = cards[cardId]
              if (!card) return null

              return (
                <Draggable
                  key={cardId}
                  draggableId={cardId}
                  index={index}
                  isDragDisabled={isDragDisabled?.(cardId)}
                >
                  {(provided, snapshot) => {
                    const content = (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => !snapshot.isDragging && onCardClick?.(cardId)}
                        className={cn(
                          'cursor-grab active:cursor-grabbing outline-none',
                          snapshot.isDragging && 'z-[9999]'
                        )}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        {renderCard(card, snapshot.isDragging)}
                      </div>
                    )

                    if (snapshot.isDragging) {
                      return createPortal(content, document.body)
                    }

                    return content
                  }}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
