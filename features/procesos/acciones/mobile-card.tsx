'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { ActorCell } from '@/components/ui/actor-cell'
import { ContactCell } from '@/components/ui/contact-cell'
import { formatShortDate } from '@/lib/format'
import type { AccionList } from '@/features/procesos/acciones/types/acciones-schema'

const estadoVariants: Record<string, string> = {
  disponible: 'bg-status-positive',
  asignada: 'bg-status-warning',
  arrendada: 'bg-status-neutral',
  bloqueada: 'bg-status-negative',
  inactiva: 'bg-muted',
}

const tipoActorVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  persona: "default",
  empresa: "secondary",
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
 * Shows action code, state, owner information, and contact details.
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

          {/* Owner section */}
          {accion.propietario_nombre_completo && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Propietario</span>
                {accion.propietario_tipo_actor && (
                  <Badge
                    variant={tipoActorVariants[accion.propietario_tipo_actor] || "outline"}
                    className="h-4 px-1 text-xs"
                  >
                    {accion.propietario_tipo_actor === "persona" ? "👤" : "🏢"}
                    <span className="ml-1 capitalize">{accion.propietario_tipo_actor}</span>
                  </Badge>
                )}
              </div>
              <ActorCell
                nombre={accion.propietario_nombre_completo}
                codigo={accion.propietario_codigo_bp || "-"}
                className="py-0"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {/* Plan Comercial */}
            {accion.propietario_plan_comercial && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Plan:</span>
                <Badge variant="metadata-outline" className="h-5">
                  {accion.propietario_plan_comercial}
                </Badge>
              </div>
            )}

            {/* Contact info */}
            {(accion.propietario_telefono_principal || accion.propietario_email_principal) && (
              <div>
                <span className="text-xs uppercase tracking-wide block mb-1">Contacto</span>
                <ContactCell
                  phone={accion.propietario_telefono_principal}
                  email={accion.propietario_email_principal}
                  className="py-0"
                />
              </div>
            )}

            {/* Since date */}
            {accion.propietario_fecha_inicio && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Desde:</span>
                <span>{formatShortDate(accion.propietario_fecha_inicio)}</span>
              </div>
            )}

            {/* Organization */}
            {accion.organizacion_nombre && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide shrink-0">Org:</span>
                <span className="truncate">{accion.organizacion_nombre}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
