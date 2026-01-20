import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserCellProps {
    nombre: string
    email: string
    avatar?: string | null
    className?: string
}

/**
 * UserCell - Componente especializado para mostrar campos de config_organizacion_miembros/auth.users
 *
 * Estándar de visualización:
 * - Avatar: Foto del usuario o iniciales generadas del nombre
 * - Título principal: nombre_completo del usuario
 * - Subtítulo: email del usuario
 *
 * Uso típico en columnas de tablas que mapean campos de vistas:
 * - asignado_nombre_completo + asignado_email
 * - responsable_nombre_completo + responsable_email
 * - creado_por_nombre + creado_por_email
 *
 * @example
 * ```tsx
 * <UserCell
 *   nombre={row.original.asignado_nombre_completo}
 *   email={row.original.asignado_email}
 *   avatar={row.original.asignado_avatar_url}
 *   className="min-w-[200px] flex-1"
 * />
 * ```
 */
export function UserCell({ nombre, email, avatar, className }: UserCellProps) {
    const initials = nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)

    return (
        <div className={cn("flex items-center gap-3 py-1", className)}>
            <Avatar className="h-8 w-8 border border-slate-200/60 shadow-sm shrink-0">
                {avatar && <AvatarImage src={avatar} alt={nombre} />}
                <AvatarFallback className="text-[10px]">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 space-y-0.5">
                <span className="truncate font-medium text-sm text-foreground leading-tight">
                    {nombre}
                </span>
                <span className="truncate text-xs text-slate-500 leading-tight">
                    {email}
                </span>
            </div>
        </div>
    )
}
