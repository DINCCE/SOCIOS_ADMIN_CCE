"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TareaView } from "@/features/procesos/tareas/columns"
import { cn } from "@/lib/utils"

interface MiSemanaCardProps {
    tareas: TareaView[]
}

export function MiSemanaCard({ tareas }: MiSemanaCardProps) {
    const days = ["L", "M", "M", "J", "V", "S", "D"]

    // Logic to calculate tasks per day would go here
    // For now, we'll use some mock data derived from current week
    const mockWeeklyData = [
        { day: "L", completed: 2, added: 1 },
        { day: "M", completed: 3, added: 2 },
        { day: "M", completed: 1, added: 0 },
        { day: "J", completed: 4, added: 3 },
        { day: "V", completed: 2, added: 1 },
        { day: "S", completed: 0, added: 0 },
        { day: "D", completed: 0, added: 0 },
    ]

    const maxVal = Math.max(...mockWeeklyData.map(d => Math.max(d.completed, d.added))) || 1

    return (
        <Card className="border-none shadow-none bg-muted/30">
            <CardContent className="p-4">
                <div className="flex items-end justify-between h-32 gap-2">
                    {mockWeeklyData.map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex justify-center gap-0.5 items-end h-20">
                                <div
                                    className="w-2 bg-primary/40 rounded-t-sm"
                                    style={{ height: `${(data.added / maxVal) * 100}%` }}
                                />
                                <div
                                    className="w-2 bg-primary rounded-t-sm"
                                    style={{ height: `${(data.completed / maxVal) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">{data.day}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-sm" />
                        <span>Completadas</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary/40 rounded-sm" />
                        <span>Asignadas</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
