"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Relationship } from "./mock-relationships"
import { MoreHorizontal, Pencil, Trash2, Eye, Building2, User } from "lucide-react"

interface RelationshipRowProps {
    relationship: Relationship
}

export function RelationshipRow({ relationship }: RelationshipRowProps) {
    const isEmpresa = relationship.tipo === 'empresa'
    const isInactive = !relationship.activo

    return (
        <div className={cn(
            "group flex items-center justify-between py-3 px-4 hover:bg-muted/30 transition-colors border-b last:border-0 h-16",
            isInactive && "opacity-70 grayscale-[0.3]"
        )}>
            {/* LEFT: Avatar + Info */}
            <div className="flex items-center gap-4 min-w-0">
                {/* Avatar Area */}
                <div className="shrink-0">
                    {isEmpresa ? (
                        /* Square Avatar for Companies */
                        <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-md border border-slate-200">
                            {relationship.avatarUrl ? (
                                <img
                                    src={relationship.avatarUrl}
                                    alt={relationship.nombre}
                                    className="h-full w-full object-cover rounded-md"
                                />
                            ) : (
                                <Building2 className="h-5 w-5 text-slate-400" />
                            )}
                        </div>
                    ) : (
                        /* Circular Avatar for Persons */
                        <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarImage src={relationship.avatarUrl || undefined} />
                            <AvatarFallback>
                                <User className="h-4 w-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>

                {/* Text Info */}
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate text-foreground leading-tight">
                        {relationship.nombre}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-medium">
                            {relationship.rolRelativo}
                        </span>

                        {/* Status for Inactive */}
                        {isInactive && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                                Finalizado: {relationship.fechaFin || "N/A"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Badges + Actions */}
            <div className="flex items-center gap-6 pl-4">
                {/* Badges Area (Hidden on very small screens) */}
                <div className="hidden sm:flex items-center gap-2">
                    {relationship.badges.map((badge, i) => (
                        <Badge key={i} variant="outline" className="text-muted-foreground font-normal text-[11px] h-5 px-2">
                            {badge}
                        </Badge>
                    ))}
                </div>

                {/* Actions Menu (Visible on Hover/Focus) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menú de acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" /> Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Pencil className="mr-2 h-4 w-4" /> Editar relación
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
