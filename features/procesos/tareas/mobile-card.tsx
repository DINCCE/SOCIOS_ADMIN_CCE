'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { TareaView } from '@/components/procesos/tareas/tareas-board'
import { formatShortDate } from '@/lib/format'

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  Pendiente: { label: 'Pendiente', variant: 'default', icon: Clock },
  'En Progreso': { label: 'En Progreso', variant: 'secondary', icon: AlertCircle },
  Pausada: { label: 'Pausada', variant: 'secondary', icon: AlertTriangle },
  Terminada: { label: 'Terminada', variant: 'default', icon: CheckCircle2 },
  Cancelada: { label: 'Cancelada', variant: 'outline', icon: XCircle },
}

const prioridadConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  Urgente: { label: 'Urgente', color: 'text-red-700', bgColor: 'bg-red-50', icon: AlertCircle },
  Alta: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-50', icon: AlertTriangle },
  Media: { label: 'Media', color: 'text-blue-700', bgColor: 'bg-blue-50', icon: Clock },
  Baja: { label: 'Baja', color: 'text-gray-700', bgColor: 'bg-gray-50', icon: Clock },
}

interface TareaMobileCardProps {
  tarea: TareaView
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
}

/**
 * TareaMobileCard - Card layout for mobile display
 *
 * Displays essential tarea information in a mobile-friendly card format.
 * Shows title, description, status, priority, due date, and assignee.
 */
export function TareaMobileCard({
  tarea,
  isSelected,
  onToggleSelect,
  onClick,
}: TareaMobileCardProps) {
  const EstadoIcon = estadoConfig[tarea.estado]?.icon || Clock
  const PrioridadIcon = prioridadConfig[tarea.prioridad]?.icon || Clock

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/50 transition-colors active:scale-[0.99] active:transition-transform"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 translate-y-[2px]"
          aria-label="Seleccionar tarea"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Priority indicator, Title, and Status badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`${prioridadConfig[tarea.prioridad]?.bgColor || 'bg-gray-50'} p-1 rounded shrink-0`}>
                <PrioridadIcon className={`h-3 w-3 ${prioridadConfig[tarea.prioridad]?.color || 'text-gray-700'}`} />
              </div>
              <h3 className="font-medium text-base truncate">{tarea.titulo}</h3>
            </div>
            <Badge variant={estadoConfig[tarea.estado]?.variant || 'default'} className="text-xs shrink-0">
              <EstadoIcon className="h-3 w-3 mr-1" />
              {estadoConfig[tarea.estado]?.label || tarea.estado}
            </Badge>
          </div>

          {/* Description */}
          {tarea.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {tarea.descripcion}
            </p>
          )}

          {/* Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {/* Due Date */}
            {tarea.fecha_vencimiento && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {formatShortDate(tarea.fecha_vencimiento)}
                </span>
              </div>
            )}

            {/* Assignee */}
            {tarea.asignado_nombre_completo ? (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Asignado a:</span>
                <span className="truncate">{tarea.asignado_nombre_completo}</span>
              </div>
            ) : null}
          </div>

          {/* Related items */}
          {(tarea.actor_relacionado_codigo_bp || tarea.doc_comercial_codigo) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tarea.actor_relacionado_codigo_bp && (
                <div className="bg-muted px-2 py-1 rounded text-xs">
                  {tarea.actor_relacionado_codigo_bp}
                </div>
              )}
              {tarea.doc_comercial_codigo && (
                <div className="bg-muted px-2 py-1 rounded text-xs">
                  {tarea.doc_comercial_codigo}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
