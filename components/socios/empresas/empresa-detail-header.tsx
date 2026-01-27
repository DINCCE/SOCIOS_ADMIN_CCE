import { Building2, ChevronRight, Edit, MessageSquare, MoreVertical, Plus } from "lucide-react"
import { Empresa } from "@/features/socios/types/socios-schema"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EmpresaDetailHeaderProps {
    empresa: Empresa
}

export function EmpresaDetailHeader({ empresa }: EmpresaDetailHeaderProps) {

    return (
        <div className="space-y-4">
            {/* Main Identity Area */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
                        <AvatarImage src={empresa.logo_url || undefined} alt={empresa.razon_social} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                            <Building2 className="h-8 w-8" />
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight">{empresa.razon_social}</h1>
                            {empresa.estado && (
                                <Badge
                                    variant={empresa.estado === "activo" ? "status-active" : empresa.estado === "bloqueado" ? "status-destructive" : "status-warning"}
                                    showDot
                                >
                                    {empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
                                </Badge>
                            )}
                            {empresa.nombre_comercial && empresa.nombre_comercial !== empresa.razon_social && (
                                <span className="hidden sm:inline text-sm text-muted-foreground px-2 ml-1 border-l">
                                    &quot;{empresa.nombre_comercial}&quot;
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-medium text-muted-foreground/60">NIT:</span>
                            <span className="font-semibold">{empresa.nit_completo || empresa.num_documento}</span>
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
                            <DropdownMenuItem>
                                <ChevronRight className="h-4 w-4 mr-2" />
                                Ver Representante Legal
                            </DropdownMenuItem>
                            <DropdownMenuItem>Imprimir Certificado</DropdownMenuItem>
                            <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Suspender Empresa</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
