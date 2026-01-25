"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, Calendar, Flame } from "lucide-react"
import { TareaView } from "@/features/procesos/tareas/columns"
import { cn } from "@/lib/utils"

interface PersonalStatsProps {
    tareas: TareaView[]
}

export function PersonalStats({ tareas }: PersonalStatsProps) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const stats = {
        vencidas: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < today).length,
        hoy: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= today && new Date(t.fecha_vencimiento) < tomorrow).length,
        manana: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= tomorrow && new Date(t.fecha_vencimiento) < dayAfterTomorrow).length,
        racha: 5, // Mocked for now, will implement logic later
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <StatCard
                icon={AlertTriangle}
                label="Vencidas"
                value={stats.vencidas}
                color="text-destructive"
            />
            <StatCard
                icon={Clock}
                label="Hoy"
                value={stats.hoy}
                color="text-foreground"
            />
            <StatCard
                icon={Calendar}
                label="Mañana"
                value={stats.manana}
                color="text-foreground"
            />
            <StatCard
                icon={Flame}
                label="Racha"
                value={`${stats.racha} días`}
                color="text-foreground"
            />
        </div>
    )
}

interface StatCardProps {
    icon: React.ElementType
    label: string
    value: string | number
    color: string
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
    return (
        <Card className="border shadow-sm">
            <CardContent className="p-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className={cn("text-xl font-bold leading-tight", color)}>{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
