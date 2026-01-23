"use client"

import * as React from "react"
import { ClipboardList, AlertTriangle, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TeamStatCardProps {
    label: string
    value: string | number
    icon: React.ElementType
    trend?: number
    variant?: 'default' | 'success' | 'warning' | 'critical'
    onClick?: () => void
}

function TeamStatCard({ label, value, icon: Icon, trend, variant = 'default', onClick }: TeamStatCardProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success': return "text-green-600 dark:text-green-400"
            case 'warning': return "text-amber-600 dark:text-amber-400"
            case 'critical': return "text-red-600 dark:text-red-400"
            default: return "text-primary"
        }
    }

    const getBgStyles = () => {
        switch (variant) {
            case 'success': return "bg-green-500/10"
            case 'warning': return "bg-amber-500/10"
            case 'critical': return "bg-red-500/10"
            default: return "bg-primary/10"
        }
    }

    return (
        <Card
            className={cn(
                "transition-all duration-200",
                onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg", getBgStyles())}>
                        <Icon className={cn("h-5 w-5", getVariantStyles())} />
                    </div>
                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                            trend >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        )}>
                            {trend >= 0 ? '+' : ''}{trend}%
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
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
}

export function TeamStatsGrid({ stats }: TeamStatsGridProps) {
    const rate = stats.weeklyRate || 0
    const rateVariant = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'critical'

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TeamStatCard
                label="Total Pendientes"
                value={stats.total}
                icon={ClipboardList}
            />
            <TeamStatCard
                label="Vencidas"
                value={stats.overdue}
                icon={AlertTriangle}
                variant={stats.overdue > 0 ? 'critical' : 'default'}
            />
            <TeamStatCard
                label="En Progreso"
                value={stats.inProgress}
                icon={Clock}
            />
            <TeamStatCard
                label="Completadas (Semana)"
                value={stats.completedThisWeek}
                icon={TrendingUp}
                variant="success"
            />
        </div>
    )
}
