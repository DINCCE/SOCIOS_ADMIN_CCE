import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronRight, Edit, MessageSquare, MoreVertical, Plus } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PersonDetailHeaderProps {
    persona: Persona
}

export function PersonDetailHeader({ persona }: PersonDetailHeaderProps) {
    const initials = `${persona.primer_nombre[0]}${persona.primer_apellido[0]}`

    return (
        <div className="space-y-4">
            {/* Main Identity Area */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
                        <AvatarImage src={persona.foto_url || undefined} alt={persona.nombre_completo} />
                        <AvatarFallback className="text-xl">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight">{persona.nombre_completo}</h1>
                            {persona.estado && (
                                <Badge
                                    variant={persona.estado === "activo" ? "status-active" : persona.estado === "bloqueado" ? "status-destructive" : "status-warning"}
                                    showDot
                                >
                                    {persona.estado.charAt(0).toUpperCase() + persona.estado.slice(1)}
                                </Badge>
                            )}
                            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground/60 px-2 ml-2 border-l">
                                <span className="font-semibold text-foreground/80 uppercase tracking-wider text-[10px]">Titular</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-medium text-muted-foreground/60">ID Socio:</span>
                            <span className="font-semibold">{persona.codigo || persona.codigo_bp}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Actividad</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Acción</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Imprimir Carnet</DropdownMenuItem>
                            <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Suspender Socio</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
