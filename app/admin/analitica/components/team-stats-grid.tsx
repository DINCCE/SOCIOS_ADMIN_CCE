"use client"

import * as React from "react"
import { ClipboardList, AlertTriangle, Clock, TrendingUp, HeartPulse } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TeamStatCardProps {
    label: string
    value: string | number
    icon?: React.ElementType
    trend?: number
    variant?: 'default' | 'success' | 'warning' | 'critical'
    onClick?: () => void
    insight?: string
}

function TeamStatCard({ label, value, trend, variant = 'default', onClick, insight }: Omit<TeamStatCardProps, 'icon'>) {
    const isCritical = variant === 'critical' && typeof value === 'number' && value > 0;

    return (
        <Card
            className={cn(
                "transition-all duration-200 border-border/50 shadow-sm",
                isCritical && "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/20",
                onClick && "cursor-pointer hover:shadow-md hover:scale-[1.01]"
            )}
            onClick={onClick}
        >
            <CardContent className="p-5">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        {trend !== undefined && (
                            <div className={cn(
                                "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-tighter",
                                trend >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                            )}>
                                {trend >= 0 ? '+' : ''}{trend}%
                            </div>
                        )}
                    </div>
                    <h3 className={cn(
                        "text-3xl font-semibold tracking-tight tabular-nums",
                        isCritical ? "text-red-600" : "text-foreground"
                    )}>
                        {value}
                    </h3>
                    {insight && (
                        <p className="text-[10px] text-muted-foreground mt-1">{insight}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

interface TeamStatsGridProps {
    stats: {
        total: number
        overdue: number
        inProgress: number
        completedThisWeek: number
        weeklyRate?: number
    }
    // Flow Health props
    flowHealthScore?: number
    flowHealthStatus?: 'healthy' | 'warning' | 'critical'
}

export function TeamStatsGrid({ stats, flowHealthScore, flowHealthStatus }: TeamStatsGridProps) {
    const getFlowHealthVariant = () => {
        switch (flowHealthStatus) {
            case 'healthy': return 'success'
            case 'warning': return 'warning'
            case 'critical': return 'critical'
            default: return 'default'
        }
    }

    const getFlowHealthText = () => {
        if (flowHealthScore === undefined) return 'N/A'
        return `${flowHealthScore >= 0 ? '+' : ''}${flowHealthScore}`
    }

    const getFlowHealthInsight = () => {
        if (flowHealthScore === undefined) return undefined
        if (flowHealthScore > 0) return 'Saldo positivo'
        if (flowHealthScore < 0) return 'Saldo negativo'
        return 'Equilibrado'
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TeamStatCard
                label="Total Pendientes"
                value={stats.total}
            />
            <TeamStatCard
                label="Vencidas"
                value={stats.overdue}
                variant={stats.overdue > 0 ? 'critical' : 'default'}
            />
            <TeamStatCard
                label="En Progreso"
                value={stats.inProgress}
            />
            {flowHealthScore !== undefined ? (
                <TeamStatCard
                    label="Salud del Flujo"
                    value={getFlowHealthText()}
                    variant={getFlowHealthVariant()}
                    insight={getFlowHealthInsight()}
                />
            ) : (
                <TeamStatCard
                    label="Completadas (Semana)"
                    value={stats.completedThisWeek}
                    variant="success"
                />
            )}
        </div>
    )
}
