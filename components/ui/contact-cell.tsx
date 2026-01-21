import * as React from "react"
import { cn } from "@/lib/utils"

interface ContactCellProps {
  phone?: string | null
  email?: string | null
  className?: string
}

/**
 * ContactCell - Componente para mostrar información de contacto sin avatar
 *
 * Variación de IdentityCell sin el componente Avatar.
 * Utilizado cuando solo se necesita mostrar información de contacto
 * sin identificar visualmente a una persona o entidad.
 *
 * Estándar de visualización:
 * - Línea 1: Número de teléfono (font-medium, text-sm)
 * - Línea 2: Email (text-xs, text-slate-500)
 *
 * @example
 * ```tsx
 * <ContactCell
 *   phone={propietario_telefono_principal}
 *   email={propietario_email_principal}
 *   className="min-w-[200px] flex-1"
 * />
 * ```
 */
export function ContactCell({ phone, email, className }: ContactCellProps) {
  return (
    <div className={cn("flex flex-col min-w-0 space-y-0.5 py-1", className)}>
      <span className="truncate font-medium text-sm text-foreground leading-tight">
        {phone || "Sin teléfono"}
      </span>
      {email && (
        <span className="truncate text-xs text-slate-500 leading-tight">
          {email}
        </span>
      )}
    </div>
  )
}
