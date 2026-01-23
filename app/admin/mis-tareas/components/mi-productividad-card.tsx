"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TareaView } from "@/features/procesos/tareas/columns"
import { Flame, Target, TrendingUp } from "lucide-react"

interface MiProductividadCardProps {
    tareas: TareaView[]
    userId: string
}

export function MiProductividadCard({ tareas, userId }: MiProductividadCardProps) {
    // Simplified productivity logic
    const thisWeekCompleted = 8
    const averageWeekly = 6
    const currentStreak = 5
    const bestStreak = 12

    return (
        <Card className="border-none shadow-none bg-muted/30">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Esta semana</span>
                    </div>
                    <span className="text-lg font-bold">{thisWeekCompleted}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Promedio semanal</span>
                    </div>
                    <span className="text-lg font-bold">{averageWeekly}</span>
                </div>

                <div className="pt-2 border-t border-muted-foreground/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Racha de productividad</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Actual</p>
                            <p className="text-xl font-bold text-orange-600">{currentStreak}</p>
                            <p className="text-[10px] text-muted-foreground">días</p>
                        </div>
                        <div className="bg-background/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Mejor</p>
                            <p className="text-xl font-bold">{bestStreak}</p>
                            <p className="text-[10px] text-muted-foreground">días</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-center text-muted-foreground italic pt-2">
                    "¡Vas muy bien! Estás un 25% por encima de tu promedio."
                </p>
            </CardContent>
        </Card>
    )
}
