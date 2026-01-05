'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { OportunidadView } from './oportunidades-board'
import { EstadoOportunidad } from './oportunidades-board'

interface OportunidadCardProps {
  oportunidad: OportunidadView
  isDragging?: boolean
}

const ESTADO_CONFIG: Record<
  EstadoOportunidad,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  abierta: { label: 'Abierta', variant: 'default' },
  en_proceso: { label: 'En Proceso', variant: 'secondary' },
  ganada: { label: 'Ganada', variant: 'default' },
  perdida: { label: 'Perdida', variant: 'destructive' },
  cancelada: { label: 'Cancelada', variant: 'outline' },
}

export function OportunidadCard({ oportunidad, isDragging }: OportunidadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: oportunidad.id })

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
            {oportunidad.codigo}
          </span>
          <Badge variant={ESTADO_CONFIG[oportunidad.estado as EstadoOportunidad].variant} className="text-xs">
            {ESTADO_CONFIG[oportunidad.estado as EstadoOportunidad].label}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium line-clamp-2">
            {oportunidad.tipo}
          </p>
          <p className="text-xs text-muted-foreground">
            {oportunidad.solicitante_codigo_bp} - {oportunidad.solicitante_nombre}
          </p>
        </div>

        {oportunidad.monto_estimado && (
          <div className="pt-2 border-t">
            <p className="font-mono text-sm font-semibold text-right">
              {formatCurrency(oportunidad.monto_estimado)}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
