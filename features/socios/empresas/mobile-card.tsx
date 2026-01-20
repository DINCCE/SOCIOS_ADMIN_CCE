'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { NullCell } from '@/components/ui/null-cell'
import type { EmpresaList } from '@/features/socios/types/socios-schema'

const estadoVariants: Record<string, string> = {
  activo: 'bg-status-positive',
  inactivo: 'bg-status-neutral',
  bloqueado: 'bg-status-negative',
}

interface EmpresaMobileCardProps {
  empresa: EmpresaList
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
}

/**
 * EmpresaMobileCard - Card layout for mobile display
 *
 * Displays essential empresa information in a mobile-friendly card format.
 * Shows commercial name, NIT, email, phone, and status badge.
 */
export function EmpresaMobileCard({
  empresa,
  isSelected,
  onToggleSelect,
  onClick,
}: EmpresaMobileCardProps) {
  const estado = empresa.estado_actor?.toLowerCase()
  const dotClassName = estadoVariants[estado] || 'bg-status-neutral'

  // Use nombre_comercial if available, otherwise razon_social, otherwise codigo_bp
  const displayName = empresa.nombre_comercial || empresa.razon_social || empresa.codigo_bp

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
          aria-label="Seleccionar empresa"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name and Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-medium text-base truncate flex-1">
              {displayName}
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
          <div className="space-y-2 text-sm">
            {/* NIT */}
            {empresa.num_documento && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">NIT:</span>
                <span className="truncate">
                  {empresa.nit_completo || empresa.num_documento}
                </span>
              </div>
            )}

            {/* Email */}
            {empresa.email_principal ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Email:</span>
                <span className="truncate">
                  {empresa.email_principal}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Email:</span>
                <NullCell />
              </div>
            )}

            {/* Phone */}
            {empresa.telefono_principal ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Tel:</span>
                <span className="truncate">
                  {empresa.telefono_principal}
                </span>
              </div>
            ) : null}
          </div>

          {/* Tags */}
          {empresa.tags && empresa.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {empresa.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="metadata-outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {empresa.tags.length > 3 && (
                <Badge variant="metadata-outline" className="text-xs">
                  +{empresa.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Business Type Indicators */}
          <div className="flex gap-2 mt-3">
            {empresa.es_socio && (
              <Badge variant="outline" className="text-xs">Socio</Badge>
            )}
            {empresa.es_cliente && (
              <Badge variant="outline" className="text-xs">Cliente</Badge>
            )}
            {empresa.es_proveedor && (
              <Badge variant="outline" className="text-xs">Proveedor</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
