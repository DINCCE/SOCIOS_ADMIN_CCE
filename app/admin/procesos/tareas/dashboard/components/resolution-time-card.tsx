"use client"

import * as React from "react"
import { Timer, TrendingDown, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
            <Card className="h-full border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Tiempos de resolución
                    </CardTitle>
                </CardHeader>
                <CardContent 
                    className="flex flex-col items-center justify-center h-[300px] text-center p-6 relative"
                    style={{
                        backgroundImage: `radial-gradient(hsl(var(--muted-foreground)/0.15) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}
                >
                    <div className="bg-background/80 backdrop-blur-sm p-8 rounded-xl border border-border/50 shadow-sm flex flex-col items-center">
                        <Clock className="h-10 w-10 text-muted-foreground/20 mb-4" />
                        <p className="text-sm font-medium text-foreground">Sin datos</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[180px]">
                            Se requieren tareas completadas para calcular métricas.
                        </p>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium" asChild>
                            <a href="/admin/procesos/tareas">Ver tareas</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Tiempos de resolución
                    </div>
                    {stats.trend !== undefined && (
                        <div className={cn(
                            "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-tighter",
                            stats.trend <= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        )}>
                            {stats.trend <= 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                            {Math.abs(stats.trend).toFixed(1)}d
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest opacity-70">Promedio</p>
                        <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatDays(stats.average)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest opacity-70">Mediana</p>
                        <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatDays(stats.median)}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <h4 className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 opacity-70 tracking-widest">
                        Por prioridad
                        <div className="h-px flex-1 bg-border/50" />
                    </h4>
                    {stats.byPriority.map((item) => (
                        <div key={item.priority} className="flex items-center justify-between group">
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors w-16">{item.priority}</span>
                            <div className="flex items-center gap-3 flex-1 px-4">
                                <div className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden relative">
                                    <div
                                        className={cn(
                                            "absolute top-0 left-0 h-full rounded-full transition-all duration-700",
                                            item.priority === 'Urgente' || item.priority === 'Critica' ? "bg-[var(--chart-4)]" :
                                                item.priority === 'Alta' ? "bg-[var(--chart-3)]" :
                                                    item.priority === 'Media' ? "bg-[var(--chart-2)]" : "bg-[var(--chart-5)]"
                                        )}
                                        style={{ width: `${Math.min((item.days / (stats.average * 2)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs font-semibold tabular-nums w-10 text-right">{formatDays(item.days)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
