"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, ArrowRight, Circle, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { obtenerHistorialTarea, type EstadoHistorialItem } from "@/app/actions/tareas-historial"
import { formatearDuracion } from "@/lib/schemas/estado-historial-schema"
import { tareasEstadoOptions } from "@/lib/table-filters"
import { cn } from "@/lib/utils"

interface TareaTimelineProps {
  tareaId: string
}

// State configuration matching the detail sheet
const ESTADO_CONFIG: Record<string, { label: string; dotClassName: string }> = {
  Pendiente: { label: "Pendiente", dotClassName: "bg-status-neutral" },
  "En Progreso": { label: "En Progreso", dotClassName: "bg-status-warning" },
  Terminada: { label: "Terminada", dotClassName: "bg-status-positive" },
  Pausada: { label: "Pausada", dotClassName: "bg-status-negative" },
  Cancelada: { label: "Cancelada", dotClassName: "bg-status-negative" },
}

// Get icon component for state
function getStateIcon(stateName: string) {
  return tareasEstadoOptions.find(opt => opt.value === stateName)?.icon
}

export function TareaTimeline({ tareaId }: TareaTimelineProps) {
  const queryClient = useQueryClient()

  const { data: historial = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tarea-historial", tareaId],
    queryFn: async () => {
      const result = await obtenerHistorialTarea(tareaId)
      return result.data || []
    },
    enabled: !!tareaId,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (historial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sin historial de cambios</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Los cambios de estado de la tarea aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Header con count y botón de refresh */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          HISTORIAL ({historial.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
        </Button>
      </div>

      {historial.map((entry, index) => (
        <TimelineItem key={entry.id} entry={entry} isLast={index === historial.length - 1} />
      ))}
    </div>
  )
}

interface TimelineItemProps {
  entry: EstadoHistorialItem
  isLast: boolean
}

function TimelineItem({ entry, isLast }: TimelineItemProps) {
  // Get state configurations
  const estadoAnteriorConfig = entry.estado_anterior ? ESTADO_CONFIG[entry.estado_anterior] : null
  const estadoNuevoConfig = ESTADO_CONFIG[entry.estado_nuevo]

  // Get icons for states
  const EstadoAnteriorIcon = entry.estado_anterior ? getStateIcon(entry.estado_anterior) : null
  const EstadoNuevoIcon = getStateIcon(entry.estado_nuevo)

  // Get initials for avatar
  const getInitials = (nombre?: string, apellido?: string) => {
    const name = [nombre, apellido].filter(Boolean).join(" ") || "U"
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const fullName = [entry.nombres, entry.apellidos].filter(Boolean).join(" ") || "Usuario"

  // Format the duration
  const duracionTexto = entry.duracion_segundos ? formatearDuracion(entry.duracion_segundos) : null

  return (
    <div className="flex gap-4 pb-6">
      {/* Vertical line - not for last item */}
      {!isLast && (
        <div className="absolute ml-4 mt-10 h-full w-px bg-border -z-10" style={{ height: "calc(100% + 0px)" }} />
      )}

      {/* Icon circle */}
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm shrink-0 relative z-10">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* State transition row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {/* Previous state */}
          {entry.estado_anterior && (
            <>
              <Badge
                variant="metadata-outline"
                dotClassName={estadoAnteriorConfig?.dotClassName}
                showDot
                className="text-xs"
              >
                {EstadoAnteriorIcon && <EstadoAnteriorIcon className="h-3 w-3 mr-1" />}
                {estadoAnteriorConfig?.label || entry.estado_anterior}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </>
          )}

          {/* New state */}
          <Badge
            variant="metadata-outline"
            dotClassName={estadoNuevoConfig?.dotClassName}
            showDot
            className="text-xs"
          >
            {EstadoNuevoIcon && <EstadoNuevoIcon className="h-3 w-3 mr-1" />}
            {estadoNuevoConfig?.label || entry.estado_nuevo}
          </Badge>

          {/* Duration badge */}
          {duracionTexto && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              duró {duracionTexto}
            </Badge>
          )}
        </div>

        {/* User and time row */}
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px] bg-muted">
              {getInitials(entry.nombres, entry.apellidos)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{fullName}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(entry.cambiado_en), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
