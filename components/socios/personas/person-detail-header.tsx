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
                    <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                        <AvatarImage src={persona.foto_url || undefined} alt={persona.nombre_completo} />
                        <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{persona.nombre_completo}</h1>
                            <Badge
                                variant={persona.estado === "activo" ? "secondary" : persona.estado === "suspendido" ? "status-destructive" : "status-muted"}
                                className={cn(persona.estado === "activo" && "rounded-full font-medium px-3")}
                                showDot={persona.estado !== "activo"}
                            >
                                {persona.estado.charAt(0).toUpperCase() + persona.estado.slice(1)}
                            </Badge>
                            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground/60 px-2 ml-2 border-l">
                                <span className="font-semibold text-foreground/80 uppercase tracking-wider text-[10px]">Titular</span>
                                <span className="text-border">|</span>
                                <span className={cn(
                                    "font-semibold",
                                    (persona.deuda ?? 0) > 0 ? "text-red-500" : "text-emerald-600"
                                )}>
                                    Deuda: ${(persona.deuda ?? 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{persona.tipo_documento} {persona.numero_documento}</span>
                            <span className="opacity-40">•</span>
                            <span>{persona.codigo}</span>
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
