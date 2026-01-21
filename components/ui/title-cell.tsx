import * as React from "react"
import { cn } from "@/lib/utils"

interface TitleCellProps {
  title: string
  subtitle?: string | null
  className?: string
}

/**
 * TitleCell - Componente para mostrar título con subtítulo sin avatar
 *
 * Variación de IdentityCell/ContactCell para documentos y entidades.
 * Utilizado cuando se necesita mostrar título principal con código o
 * identificador secundario sin el componente Avatar.
 *
 * Estándar de visualización:
 * - Línea 1: Título (font-medium, text-sm)
 * - Línea 2: Subtítulo/código (text-xs, text-slate-500, font-mono)
 *
 * @example
 * ```tsx
 * <TitleCell
 *   title={row.getValue('titulo')}
 *   subtitle={row.getValue('codigo')}
 *   className="min-w-[250px] flex-1"
 * />
 * ```
 */
export function TitleCell({ title, subtitle, className }: TitleCellProps) {
  return (
    <div className={cn("flex flex-col min-w-0 space-y-0.5 py-1", className)}>
      <span className="truncate font-medium text-sm text-foreground leading-tight">
        {title || "Sin título"}
      </span>
      {subtitle && (
        <span className="truncate text-xs text-slate-500 leading-tight font-mono">
          {subtitle}
        </span>
      )}
    </div>
  )
}
