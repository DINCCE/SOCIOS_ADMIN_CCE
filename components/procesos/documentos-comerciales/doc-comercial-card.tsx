'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { DocumentoComercialView } from '@/features/procesos/documentos-comerciales/columns'
import type { EstadoDocComercial } from './doc-comerciales-board'

interface DocComercialCardProps {
  docComercial: DocumentoComercialView
  isDragging?: boolean
}

const ESTADO_CONFIG: Record<
  EstadoDocComercial,
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  Nueva: { label: 'Nueva', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
  'En Progreso': { label: 'En Progreso', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300' },
  Ganada: { label: 'Ganada', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
  Pérdida: { label: 'Pérdida', bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  Descartada: { label: 'Descartada', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
}

export function DocComercialCard({ docComercial, isDragging }: DocComercialCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: docComercial.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isDragging || isSortableDragging

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-3 cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:border-primary/50
        ${dragging ? 'shadow-xl rotate-2 scale-105' : ''}
      `}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {docComercial.codigo}
          </span>
          <span className={`text-xs shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border ${ESTADO_CONFIG[docComercial.estado as EstadoDocComercial].bgColor} ${ESTADO_CONFIG[docComercial.estado as EstadoDocComercial].textColor} ${ESTADO_CONFIG[docComercial.estado as EstadoDocComercial].borderColor}`}>
            {ESTADO_CONFIG[docComercial.estado as EstadoDocComercial].label}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium line-clamp-2">
            {docComercial.tipo}
          </p>
          <p className="text-xs text-muted-foreground">
            {docComercial.solicitante_codigo_bp} - {docComercial.solicitante_nombre_completo}
          </p>
        </div>

        {docComercial.monto_estimado && (
          <div className="pt-2 border-t">
            <p className="font-mono text-sm font-semibold text-right">
              {formatCurrency(docComercial.monto_estimado)}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
