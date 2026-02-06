"use client"

import * as React from "react"
import { Gauge, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface StateBottleneck {
    state: string
    avgHours: number
    avgDays: number
    medianHours: number
    taskCount: number
    severity: 'fast' | 'normal' | 'slow' | 'blocked'
}

interface BottleneckHeatmapProps {
    data: StateBottleneck[]
}

export function BottleneckHeatmap({ data }: BottleneckHeatmapProps) {
    if (data.length === 0) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Cuellos de Botella por Estado
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
                    <Gauge className="h-10 w-10 text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-medium text-foreground">Sin datos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        No hay suficiente historial de cambios de estado.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const getSeverityConfig = (severity: StateBottleneck['severity']) => {
        switch (severity) {
            case 'fast':
                return {
                    bg: 'bg-green-500/10',
                    text: 'text-green-600',
                    border: 'border-green-500/20',
                    icon: CheckCircle2,
                    label: 'Flujo rápido'
                }
            case 'normal':
                return {
                    bg: 'bg-blue-500/10',
                    text: 'text-blue-600',
                    border: 'border-blue-500/20',
                    icon: Gauge,
                    label: 'Normal'
                }
            case 'slow':
                return {
                    bg: 'bg-orange-500/10',
                    text: 'text-orange-600',
                    border: 'border-orange-500/20',
                    icon: AlertCircle,
                    label: 'Lento'
                }
            case 'blocked':
                return {
                    bg: 'bg-red-500/10',
                    text: 'text-red-600',
                    border: 'border-red-500/20',
                    icon: AlertCircle,
                    label: 'Bloqueado'
                }
        }
    }

    const formatDuration = (days: number, hours: number) => {
        if (days >= 1) {
            return `${days.toFixed(1)}d`
        }
        return `${hours.toFixed(0)}h`
    }

    // Find the bottleneck (slowest state)
    const bottleneck = data.reduce((slowest, current) =>
        current.avgDays > slowest.avgDays ? current : slowest
    , data[0])

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Cuellos de Botella por Estado
                    </span>
                    {bottleneck.severity === 'blocked' || bottleneck.severity === 'slow' ? (
                        <Badge variant="outline" className={cn(
                            "text-[10px] h-5",
                            getSeverityConfig(bottleneck.severity).bg,
                            getSeverityConfig(bottleneck.severity).text,
                            getSeverityConfig(bottleneck.severity).border
                        )}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Cuello: {bottleneck.state}
                        </Badge>
                    ) : null}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* States grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.map((item) => {
                        const config = getSeverityConfig(item.severity)
                        const Icon = config.icon
                        const maxDays = Math.max(...data.map(d => d.avgDays))
                        const percentage = maxDays > 0 ? (item.avgDays / maxDays) * 100 : 0

                        return (
                            <div
                                key={item.state}
                                className={cn(
                                    "p-3 rounded-lg border transition-colors",
                                    config.bg,
                                    config.border
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {item.state}
                                    </span>
                                    <Icon className={cn("h-3.5 w-3.5", config.text)} />
                                </div>

                                <div className="mb-2">
                                    <span className={cn("text-lg font-bold", config.text)}>
                                        {formatDuration(item.avgDays, item.avgHours)}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        tiempo promedio
                                    </p>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                                    <div
                                        className={cn("h-full rounded-full", config.text.replace('text-', 'bg-'))}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{item.taskCount} tareas</span>
                                    <span>med: {formatDuration(item.medianHours / 24, item.medianHours)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Insight */}
                {bottleneck && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Cuello principal:</span>{" "}
                            <span className={cn("font-semibold", getSeverityConfig(bottleneck.severity).text)}>
                                {bottleneck.state}
                            </span>{" "}
                            con promedio de{" "}
                            <span className="font-semibold">
                                {formatDuration(bottleneck.avgDays, bottleneck.avgHours)}
                            </span>
                            . Las tareas pasan más tiempo aquí que en otros estados.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
