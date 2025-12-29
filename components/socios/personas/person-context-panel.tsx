import { Users, Bell, AlertCircle, Heart, Star } from "lucide-react"
import { Persona } from "@/features/socios/types/socios-schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PersonContextPanelProps {
    persona: Persona
}

export function PersonContextPanel({ persona }: PersonContextPanelProps) {
    return (
        <div className="space-y-6">
            {/* 1. Centro de Avisos e Información Crítica */}
            <Card className="border-orange-200 bg-orange-50/10 shadow-sm">
                <CardHeader className="pb-3 border-b border-orange-100/50 mb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                        <Bell className="h-4 w-4" />
                        Avisos Importantes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                    <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-white p-3 text-xs shadow-sm">
                        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold text-orange-900">Documentación Pendiente</p>
                            <p className="text-orange-800/70 leading-relaxed">Falta copia de carnet de salud vigente para el archivo físico del club.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-white p-3 text-xs shadow-sm">
                        <Star className="h-4 w-4 text-blue-500 shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold text-blue-900">Membresía Próxima a Vencer</p>
                            <p className="text-blue-800/70 leading-relaxed">La anualidad vence en 15 días. Generar factura de renovación.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Estatus del Socio (Sidebar Context) */}
            <Card className="border-muted/60 bg-muted/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        Estado y Control
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Último Ingreso</span>
                        <span className="font-medium text-foreground">Hoy, 10:45 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Deuda Pendiente</span>
                        <span className="font-bold text-red-600">$0.00</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Categoría</span>
                        <Badge variant="metadata-outline">TITULAR</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
