"use client"

import * as React from "react"
import { Tag, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface TagFocusMetric {
    tag: string
    count: number
    percentage: number
}

interface FocusSpecialtySectionProps {
    tagMetrics: TagFocusMetric[]
    totalTasks: number
}

export function FocusSpecialtySection({ tagMetrics, totalTasks }: FocusSpecialtySectionProps) {
    const taggedCount = tagMetrics.reduce((sum, m) => sum + m.count, 0)
    const untaggedCount = totalTasks - taggedCount
    const untaggedPercentage = totalTasks > 0 ? (untaggedCount / totalTasks) * 100 : 0

    // Find the dominant tag
    const dominantTag = tagMetrics[0]
    const isConcentrated = dominantTag && dominantTag.percentage > 40

    if (totalTasks === 0) {
        return (
            <Card className="h-full border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Foco y Especialidad
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Tag className="h-10 w-10 text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-medium text-foreground">Sin datos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        No hay tareas para analizar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Foco y Especialidad
                    </span>
                    {isConcentrated && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Enfocado
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Dominant tag highlight */}
                    {dominantTag && dominantTag.percentage > 20 && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <span className="text-sm font-medium">{dominantTag.tag}</span>
                                </div>
                                <span className="text-lg font-bold text-primary">
                                    {dominantTag.percentage.toFixed(0)}%
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(dominantTag.percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tag list */}
                    <div className="space-y-2">
                        {tagMetrics.slice(0, 6).map((metric, index) => {
                            const colors = [
                                'bg-primary',
                                'bg-blue-500',
                                'bg-purple-500',
                                'bg-pink-500',
                                'bg-orange-500',
                                'bg-teal-500',
                            ]
                            const color = colors[index % colors.length]

                            return (
                                <div key={metric.tag} className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                        color
                                    )} />
                                    <span className="text-sm text-muted-foreground truncate flex-1">
                                        {metric.tag}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {metric.count}
                                        </span>
                                        <span className="text-sm font-semibold tabular-nums min-w-[3rem] text-right">
                                            {metric.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Untagged tasks */}
                        {untaggedCount > 0 && (
                            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                                <div className="h-1.5 w-1.5 rounded-full bg-muted shrink-0" />
                                <span className="text-sm text-muted-foreground truncate flex-1">
                                    Sin etiqueta
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {untaggedCount}
                                    </span>
                                    <span className="text-sm font-semibold tabular-nums min-w-[3rem] text-right">
                                        {untaggedPercentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary insight */}
                    {tagMetrics.length >= 3 && (
                        <div className="pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Insight:</span> Las top 3 etiquetas representan el{" "}
                                <span className="font-semibold text-foreground">
                                    {tagMetrics.slice(0, 3).reduce((sum, m) => sum + m.percentage, 0).toFixed(0)}%
                                </span>{" "}
                                del trabajo.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
