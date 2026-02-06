"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeeklyTrendData {
    week: string
    created: number
    completed: number
    netDifference?: number  // For sustainability
    isSustainable?: boolean  // For sustainability
}

interface WeeklyTrendChartProps {
    data: WeeklyTrendData[]
    showSustainability?: boolean  // New prop for flow health dashboard
}

const chartConfig = {
    created: {
        label: "Creadas",
        color: "var(--chart-2)",
    },
    completed: {
        label: "Completadas",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function WeeklyTrendChart({ data, showSustainability = false }: WeeklyTrendChartProps) {
    // Calculate sustainability stats
    const sustainabilityStats = React.useMemo(() => {
        if (!showSustainability) return null

        const weeksWithSustainability = data.filter(d => d.netDifference !== undefined)
        if (weeksWithSustainability.length === 0) return null

        const sustainableWeeks = weeksWithSustainability.filter(d => d.isSustainable).length
        const totalNetChange = weeksWithSustainability.reduce((sum, d) => sum + (d.netDifference || 0), 0)
        const avgWeeklyChange = totalNetChange / weeksWithSustainability.length

        return {
            sustainableWeeks,
            totalWeeks: weeksWithSustainability.length,
            sustainabilityRatio: sustainableWeeks / weeksWithSustainability.length,
            totalNetChange,
            avgWeeklyChange
        }
    }, [data, showSustainability])

    const getSustainabilityBadge = () => {
        if (!sustainabilityStats) return null

        const isOverallSustainable = sustainabilityStats.totalNetChange >= 0

        return (
            <Badge
                variant="outline"
                className={cn(
                    "text-[10px] h-5 gap-1",
                    isOverallSustainable
                        ? "bg-green-500/5 text-green-600 border-green-500/20"
                        : "bg-red-500/5 text-red-600 border-red-500/20"
                )}
            >
                {isOverallSustainable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {sustainabilityStats.totalNetChange > 0 ? '+' : ''}{sustainabilityStats.totalNetChange} net
            </Badge>
        )
    }

    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Tendencia semanal</span>
                    <div className="flex items-center gap-2">
                        {getSustainabilityBadge()}
                        <span className="text-[10px] font-bold opacity-50">4 semanas</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                        <XAxis
                            dataKey="week"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            fontSize={10}
                            fontWeight={500}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            fontSize={10}
                            fontWeight={500}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="created"
                            fill="var(--color-created)"
                            radius={[2, 2, 0, 0]}
                            barSize={24}
                        />
                        <Bar
                            dataKey="completed"
                            fill="var(--color-completed)"
                            radius={[2, 2, 0, 0]}
                            barSize={24}
                        />
                    </BarChart>
                </ChartContainer>

                {/* Weekly sustainability indicators */}
                {showSustainability && sustainabilityStats && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="grid grid-cols-4 gap-2">
                            {data.map((week) => {
                                const netDiff = week.netDifference
                                const isSustainable = week.isSustainable
                                const isNeutral = Math.abs(netDiff || 0) <= 1

                                if (netDiff === undefined) return null

                                return (
                                    <div
                                        key={week.week}
                                        className={cn(
                                            "text-center p-2 rounded",
                                            isNeutral
                                                ? "bg-muted/30"
                                                : isSustainable
                                                    ? "bg-green-500/5"
                                                    : "bg-red-500/5"
                                        )}
                                    >
                                        <p className="text-[10px] font-medium text-muted-foreground mb-1">
                                            {week.week === 'Actual' ? 'Esta' : week.week.replace('Sem ', 'S')}
                                        </p>
                                        <div className="flex items-center justify-center gap-1">
                                            {isNeutral ? (
                                                <Minus className="h-3 w-3 text-muted-foreground" />
                                            ) : isSustainable ? (
                                                <TrendingUp className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-600" />
                                            )}
                                            <span className={cn(
                                                "text-sm font-bold",
                                                isNeutral
                                                    ? "text-muted-foreground"
                                                    : isSustainable
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                            )}>
                                                {netDiff > 0 ? '+' : ''}{netDiff}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Sustainability insight */}
                        <div className="mt-3 p-2 rounded bg-muted/50">
                            <p className="text-[10px] text-muted-foreground">
                                <span className="font-medium">Sostenibilidad:</span>{" "}
                                {sustainabilityStats.sustainableWeeks} de {sustainabilityStats.totalWeeks} semanas con saldo positivo
                                ({(sustainabilityStats.sustainabilityRatio * 100).toFixed(0)}%)
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
