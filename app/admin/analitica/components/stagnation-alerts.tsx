"use client"

import * as React from "react"
import { Hourglass, AlertTriangle, Clock, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface StagnationAlert {
    taskId: string
    taskTitle: string
    assignedTo: string | null
    stateChangeDate: string
    daysSinceChange: number
    thresholdExceeded: number
}

interface StagnationAlertsProps {
    alerts: StagnationAlert[]
    thresholdDays: number
}

export function StagnationAlerts({ alerts, thresholdDays }: StagnationAlertsProps) {
    const hasAlerts = alerts.length > 0

    // Get severity level
    const getSeverity = (thresholdExceeded: number) => {
        if (thresholdExceeded >= 3) return { level: 'critical', color: 'text-destructive', bg: 'bg-destructive/5', border: 'border-destructive/20' }
        if (thresholdExceeded >= 2) return { level: 'high', color: 'text-orange-600', bg: 'bg-orange-500/5', border: 'border-orange-500/20' }
        return { level: 'medium', color: 'text-amber-600', bg: 'bg-amber-500/5', border: 'border-amber-500/20' }
    }

    if (!hasAlerts) {
        return (
            <Card className="h-full border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Hourglass className="h-4 w-4" />
                        Alertas de Estancamiento
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[280px] text-center">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <Hourglass className="h-8 w-8 text-green-500/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sin estancamientos</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        No hay tareas en progreso que excedan el umbral de {thresholdDays.toFixed(0)} días.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const worstCase = alerts[0]

    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Hourglass className="h-4 w-4 text-amber-500" />
                        Alertas de Estancamiento
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 bg-amber-500/5 text-amber-600 border-amber-500/20">
                        {alerts.length} alertas
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Summary */}
                <div className="mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium">Umbral: {thresholdDays.toFixed(0)} días</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            2× mediana de resolución
                        </span>
                    </div>
                </div>

                {/* Alerts list */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {alerts.slice(0, 8).map((alert) => {
                        const severity = getSeverity(alert.thresholdExceeded)

                        return (
                            <div
                                key={alert.taskId}
                                className={cn(
                                    "p-2 rounded-lg border transition-colors hover:bg-muted/30",
                                    severity.border,
                                    severity.bg
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    <Avatar className="h-6 w-6 border border-border/50 shrink-0">
                                        <AvatarFallback className="bg-muted text-[10px]">
                                            {alert.assignedTo
                                                ? alert.assignedTo.split(' ').map(n => n[0]).join('')
                                                : '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{alert.taskTitle}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn("text-xs font-semibold", severity.color)}>
                                                {alert.daysSinceChange} días estancada
                                            </span>
                                            {alert.thresholdExceeded > 1 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    ({alert.thresholdExceeded}× el umbral)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Clock className={cn("h-4 w-4 shrink-0", severity.color)} />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {alerts.length > 8 && (
                    <div className="mt-3 pt-3 border-t border-border/50 text-center">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                            Ver {alerts.length - 8} alertas más
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
