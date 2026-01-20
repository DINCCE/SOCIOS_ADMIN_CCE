'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { NullCell } from '@/components/ui/null-cell'
import type { PersonaList } from '@/features/socios/types/socios-schema'

const estadoVariants: Record<string, string> = {
  activo: 'bg-status-positive',
  inactivo: 'bg-status-neutral',
  suspendido: 'bg-status-negative',
  mora: 'bg-status-warning',
}

interface PersonaMobileCardProps {
  persona: PersonaList
  isSelected: boolean
  onToggleSelect: () => void
  onClick: () => void
}

/**
 * PersonaMobileCard - Card layout for mobile display
 *
 * Displays essential persona information in a mobile-friendly card format.
 * Shows name, document, email, phone, and status badge.
 */
export function PersonaMobileCard({
  persona,
  isSelected,
  onToggleSelect,
  onClick,
}: PersonaMobileCardProps) {
  const estado = persona.estado_actor?.toLowerCase()
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
          aria-label="Seleccionar persona"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name and Status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-medium text-base truncate flex-1">
              {persona.nombre_completo}
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
            {/* Document */}
            {persona.num_documento && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Doc:</span>
                <span className="truncate">
                  {persona.num_documento}
                </span>
              </div>
            )}

            {/* Email */}
            {persona.email_principal ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Email:</span>
                <span className="truncate">
                  {persona.email_principal}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Email:</span>
                <NullCell />
              </div>
            )}

            {/* Phone */}
            {persona.telefono_principal ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="shrink-0 text-xs uppercase tracking-wide">Tel:</span>
                <span className="truncate">
                  {persona.telefono_principal}
                </span>
              </div>
            ) : null}
          </div>

          {/* Tags */}
          {persona.tags && persona.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {persona.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="metadata-outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {persona.tags.length > 3 && (
                <Badge variant="metadata-outline" className="text-xs">
                  +{persona.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
