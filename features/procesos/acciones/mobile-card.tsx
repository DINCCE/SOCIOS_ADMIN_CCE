'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { formatShortDate } from '@/lib/format'
import type { AccionList } from '@/features/procesos/acciones/types/acciones-schema'

const estadoVariants: Record<string, string> = {
  disponible: 'bg-status-positive',
  asignada: 'bg-status-warning',
  arrendada: 'bg-status-neutral',
  bloqueada: 'bg-status-negative',
  inactiva: 'bg-muted',
}

interface AccionMobileCardProps {
  accion: AccionList
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
}

/**
 * AccionMobileCard - Card layout for mobile display
 *
 * Displays essential accion information in a mobile-friendly card format.
 * Shows code, state, organization, and creation date.
 */
export function AccionMobileCard({
  accion,
  isSelected,
  onToggleSelect,
  onClick,
}: AccionMobileCardProps) {
  const estado = accion.estado?.toLowerCase()
  const dotClassName = estadoVariants[estado] || 'bg-status-neutral'

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
          aria-label="Seleccionar acción"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Code and Status badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-medium text-base truncate font-mono">
              {accion.codigo_accion}
            </h3>
            <Badge
              variant="metadata-outline"
              dotClassName={dotClassName}
              showDot
              className="shrink-0"
            >
              {estado?.charAt(0).toUpperCase() + estado?.slice(1)}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {/* Organization */}
            {accion.organizacion_nombre && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Org:</span>
                <span className="truncate">{accion.organizacion_nombre}</span>
              </div>
            )}

            {/* Created date */}
            {accion.creado_en && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Creada:</span>
                <span>{formatShortDate(accion.creado_en)}</span>
              </div>
            )}

            {/* Created by */}
            {accion.creado_por_nombre && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Por:</span>
                <span className="truncate">{accion.creado_por_nombre}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
