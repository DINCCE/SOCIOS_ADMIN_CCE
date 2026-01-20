'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { NullCell } from '@/components/ui/null-cell'
import { formatShortDate } from '@/lib/format'
import { FormattedNumber } from '@/components/ui/formatted-number'
import type { OportunidadView } from '@/components/procesos/oportunidades/oportunidades-board'

const estadoVariants: Record<string, string> = {
  nueva: 'bg-status-positive',
  'en progreso': 'bg-status-warning',
  ganada: 'bg-status-positive',
  pérdida: 'bg-status-negative',
  descartada: 'bg-status-neutral',
}

interface OportunidadMobileCardProps {
  oportunidad: OportunidadView
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
}

/**
 * OportunidadMobileCard - Card layout for mobile display
 *
 * Displays essential oportunidad information in a mobile-friendly card format.
 * Shows code, name, stage, status, estimated value, and applicant.
 */
export function OportunidadMobileCard({
  oportunidad,
  isSelected,
  onToggleSelect,
  onClick,
}: OportunidadMobileCardProps) {
  const estado = oportunidad.estado?.toLowerCase()
  const dotClassName = estadoVariants[estado] || 'bg-status-neutral'

  // Format the amount
  const formattedAmount = oportunidad.monto_estimado ? (
    <FormattedNumber value={oportunidad.monto_estimado} type="currency" style="compact" />
  ) : null

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
          aria-label="Seleccionar oportunidad"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Code and Status badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CopyableCell value={oportunidad.codigo} className="font-mono text-sm" />
            </div>
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
            {/* Type */}
            {oportunidad.tipo && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Tipo:</span>
                <span className="truncate">{oportunidad.tipo}</span>
              </div>
            )}

            {/* Applicant */}
            {oportunidad.solicitante_nombre && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Solicitante:</span>
                <span className="truncate">{oportunidad.solicitante_nombre}</span>
              </div>
            )}

            {/* Estimated amount */}
            {oportunidad.monto_estimado && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Valor:</span>
                <span className="font-medium text-foreground">{formattedAmount}</span>
              </div>
            )}

            {/* Request date */}
            {oportunidad.fecha_solicitud && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Solicitud:</span>
                <span>{formatShortDate(oportunidad.fecha_solicitud)}</span>
              </div>
            )}

            {/* Responsible */}
            {oportunidad.responsable_email ? (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Responsable:</span>
                <span className="truncate">{oportunidad.responsable_email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Responsable:</span>
                <NullCell />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
