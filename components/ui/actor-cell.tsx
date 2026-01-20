import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ActorCellProps {
    nombre: string
    codigo: string
    foto?: string | null
    className?: string
}

/**
 * ActorCell - Componente especializado para mostrar campos de dm_actores
 *
 * Estándar de visualización:
 * - Avatar: Foto del actor o iniciales generadas del nombre
 * - Título principal: nombre_completo del actor
 * - Subtítulo: codigo_bp del actor
 *
 * Uso típico en columnas de tablas que mapean campos de vistas:
 * - asociado_nombre_completo + asociado_codigo_bp
 * - solicitante_nombre_completo + solicitante_codigo_bp
 * - actor_relacionado_nombre_completo + actor_relacionado_codigo_bp
 *
 * @example
 * ```tsx
 * <ActorCell
 *   nombre={row.original.asociado_nombre_completo}
 *   codigo={row.original.asociado_codigo_bp}
 *   foto={row.original.asociado_foto_url}
 *   className="min-w-[200px] flex-1"
 * />
 * ```
 */
export function ActorCell({ nombre, codigo, foto, className }: ActorCellProps) {
    const initials = nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)

    return (
        <div className={cn("flex items-center gap-3 py-1", className)}>
            <Avatar className="h-8 w-8 border border-slate-200/60 shadow-sm shrink-0">
                {foto && <AvatarImage src={foto} alt={nombre} />}
                <AvatarFallback className="text-[10px]">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 space-y-0.5">
                <span className="truncate font-medium text-sm text-foreground leading-tight">
                    {nombre}
                </span>
                <span className="truncate text-xs text-slate-500 leading-tight">
                    {codigo}
                </span>
            </div>
        </div>
    )
}
