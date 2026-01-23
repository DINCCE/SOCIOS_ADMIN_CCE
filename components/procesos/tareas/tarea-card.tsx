'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, XCircle, type LucideIcon } from 'lucide-react'
import type { TareaView } from '@/features/procesos/tareas/columns'
import type { TrTareasEstado, TrTareasPrioridad } from '@/lib/db-types'

type EstadoTarea = TrTareasEstado
type PrioridadTarea = TrTareasPrioridad

interface TareaCardProps {
  tarea: TareaView
  isDragging?: boolean
  onClick?: () => void
}

const ESTADO_CONFIG: Record<
  EstadoTarea,
  { label: string; icon: LucideIcon; bgColor: string; textColor: string; borderColor: string }
> = {
  Pendiente: { label: 'Pendiente', icon: Clock, bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
  'En Progreso': { label: 'En Progreso', icon: AlertCircle, bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300' },
  Terminada: { label: 'Terminada', icon: CheckCircle2, bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
  Pausada: { label: 'Pausada', icon: AlertTriangle, bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  Cancelada: { label: 'Cancelada', icon: XCircle, bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
}

const PRIORIDAD_CONFIG: Record<
  PrioridadTarea,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  Urgente: {
    label: 'Urgente',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: AlertCircle
  },
  Alta: {
    label: 'Alta',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: AlertTriangle
  },
  Media: {
    label: 'Media',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Clock
  },
  Baja: {
    label: 'Baja',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: Clock
  },
}

export function TareaCard({ tarea, isDragging, onClick }: TareaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: tarea.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isDragging || isSortableDragging
  const EstadoIcon = ESTADO_CONFIG[tarea.estado as EstadoTarea].icon
  const PrioridadIcon = PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].icon

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        p-3 cursor-grab active:cursor-grabbing
        transition-all duration-200
        hover:border-primary/50
        ${dragging ? 'shadow-xl rotate-2 scale-105' : ''}
        ${onClick ? 'hover:shadow-md' : ''}
      `}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`${PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].bgColor} p-1 rounded`}>
              <PrioridadIcon className={`h-3 w-3 ${PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].color}`} />
            </div>
            <p className="text-sm font-medium line-clamp-2 flex-1">
              {tarea.titulo}
            </p>
          </div>
          <span className={`text-xs shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${ESTADO_CONFIG[tarea.estado as EstadoTarea].bgColor} ${ESTADO_CONFIG[tarea.estado as EstadoTarea].textColor} ${ESTADO_CONFIG[tarea.estado as EstadoTarea].borderColor}`}>
            <EstadoIcon className="h-3 w-3" />
            {ESTADO_CONFIG[tarea.estado as EstadoTarea].label}
          </span>
        </div>

        {tarea.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {tarea.descripcion}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          {tarea.fecha_vencimiento && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(tarea.fecha_vencimiento).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          )}
          {tarea.asignado_email && (
            <Avatar className="h-6 w-6">
              <div className="h-full w-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {tarea.asignado_email.charAt(0).toUpperCase()}
              </div>
            </Avatar>
          )}
        </div>

        {(tarea.actor_relacionado_codigo_bp || tarea.doc_comercial_codigo) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {tarea.actor_relacionado_codigo_bp && (
              <span className="bg-muted px-1.5 py-0.5 rounded">
                {tarea.actor_relacionado_codigo_bp}
              </span>
            )}
            {tarea.doc_comercial_codigo && (
              <span className="bg-muted px-1.5 py-0.5 rounded">
                {tarea.doc_comercial_codigo}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
