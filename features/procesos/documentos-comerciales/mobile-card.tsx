'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { NullCell } from '@/components/ui/null-cell'
import { formatShortDate } from '@/lib/format'
import type { DocumentoComercialView } from './columns'

const estadoVariants: Record<string, string> = {
  nueva: 'bg-status-positive',
  'en progreso': 'bg-status-warning',
  ganada: 'bg-status-positive',
  pérdida: 'bg-status-negative',
  descartada: 'bg-status-neutral',
}

interface DocComercialMobileCardProps {
  docComercial: DocumentoComercialView
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
}

/**
 * DocComercialMobileCard - Card layout for mobile display
 *
 * Displays essential doc comercial information in a mobile-friendly card format.
 * Shows code, type, status, estimated value, and applicant.
 */
export function DocComercialMobileCard({
  docComercial,
  isSelected,
  onToggleSelect,
  onClick,
}: DocComercialMobileCardProps) {
  const estado = docComercial.estado?.toLowerCase()
  const dotClassName = estadoVariants[estado] || 'bg-status-neutral'

  // Format the amount using Intl
  const formattedAmount = docComercial.monto_estimado
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(docComercial.monto_estimado)
    : null

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
          aria-label="Seleccionar documento comercial"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Code and Status badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CopyableCell value={docComercial.codigo} className="font-mono text-sm" />
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
            {docComercial.tipo && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Tipo:</span>
                <span className="truncate">{docComercial.tipo}</span>
              </div>
            )}

            {/* Applicant */}
            {docComercial.solicitante_nombre && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Solicitante:</span>
                <span className="truncate">{docComercial.solicitante_nombre}</span>
              </div>
            )}

            {/* Estimated amount */}
            {docComercial.monto_estimado && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Valor:</span>
                <span className="font-medium text-foreground">{formattedAmount}</span>
              </div>
            )}

            {/* Request date */}
            {docComercial.creado_en && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Solicitud:</span>
                <span>{formatShortDate(docComercial.creado_en)}</span>
              </div>
            )}

            {/* Responsible */}
            {docComercial.responsable_email ? (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Responsable:</span>
                <span className="truncate">{docComercial.responsable_email}</span>
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
