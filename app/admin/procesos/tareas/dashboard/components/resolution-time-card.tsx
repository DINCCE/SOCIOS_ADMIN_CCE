"use client"

import * as React from "react"
import { Timer, TrendingDown, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ResolutionTimeStats {
    average: number
    median: number
    byPriority: Array<{
        priority: string
        days: number
    }>
    trend?: number // difference in days vs previous period
}

interface ResolutionTimeCardProps {
    stats: ResolutionTimeStats
}

export function ResolutionTimeCard({ stats }: ResolutionTimeCardProps) {
    const formatDays = (days: number) => {
        if (days < 1) {
            const hours = Math.round(days * 24)
            return `${hours}h`
        }
        return `${days.toFixed(1)}d`
    }

    if (!stats.byPriority || stats.byPriority.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Timer className="h-5 w-5 text-muted-foreground" />
                        Tiempos de Resolución
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                    <Clock className="h-12 w-12 opacity-10 mb-4" />
                    No hay suficientes tareas completadas
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-indigo-500" />
                        Tiempos de Resolución
                    </div>
                    {stats.trend !== undefined && (
                        <div className={cn(
                            "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                            stats.trend <= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        )}>
                            {stats.trend <= 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                            {Math.abs(stats.trend).toFixed(1)}d vs anterior
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Promedio</p>
                        <p className="text-2xl font-bold mt-1">{formatDays(stats.average)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Mediana</p>
                        <p className="text-2xl font-bold mt-1">{formatDays(stats.median)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest border-b pb-1">Por Prioridad</h4>
                    {stats.byPriority.map((item) => (
                        <div key={item.priority} className="flex items-center justify-between">
                            <span className="text-xs font-medium">{item.priority}</span>
                            <div className="flex items-center gap-3 flex-1 px-4">
                                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            item.priority === 'Urgente' || item.priority === 'Critica' ? "bg-red-500" :
                                                item.priority === 'Alta' ? "bg-amber-500" :
                                                    item.priority === 'Media' ? "bg-blue-500" : "bg-slate-400"
                                        )}
                                        style={{ width: `${Math.min((item.days / (stats.average * 2)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs font-bold tabular-nums w-8 text-right">{formatDays(item.days)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
