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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={AlertTriangle}
                label="Vencidas"
                value={stats.vencidas}
                color="text-destructive"
                bgColor="bg-destructive/10"
                borderColor="border-destructive/20"
            />
            <StatCard
                icon={Clock}
                label="Hoy"
                value={stats.hoy}
                color="text-chart-4"
                bgColor="bg-chart-4/10"
                borderColor="border-chart-4/20"
            />
            <StatCard
                icon={Calendar}
                label="Mañana"
                value={stats.manana}
                color="text-chart-2"
                bgColor="bg-chart-2/10"
                borderColor="border-chart-2/20"
            />
            <StatCard
                icon={Flame}
                label="Racha"
                value={`${stats.racha} días`}
                color="text-chart-3"
                bgColor="bg-chart-3/10"
                borderColor="border-chart-3/20"
            />
        </div>
    )
}

interface StatCardProps {
    icon: React.ElementType
    label: string
    value: string | number
    color: string
    bgColor: string
    borderColor: string
}

function StatCard({ icon: Icon, label, value, color, bgColor, borderColor }: StatCardProps) {
    return (
        <Card className={cn("border shadow-sm", borderColor)}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-2 rounded-lg", bgColor)}>
                    <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
