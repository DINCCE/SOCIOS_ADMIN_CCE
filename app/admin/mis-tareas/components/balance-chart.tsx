"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { TareaView } from "@/features/procesos/tareas/columns"
import { subDays, format, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface BalanceChartProps {
    tareas: TareaView[]
}

const chartConfig = {
    created: {
        label: "Creadas",
        color: "hsl(var(--chart-2))",
    },
    completed: {
        label: "Terminadas",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

export function BalanceChart({ tareas }: BalanceChartProps) {
    // Calculate last 7 days data
    const weeklyData = React.useMemo(() => {
        const today = new Date()
        const days = []

        // Generate last 7 days (starting from 6 days ago to today)
        for (let i = 6; i >= 0; i--) {
            const currentDay = subDays(today, i)
            const dayName = format(currentDay, "EEE", { locale: es })
            // Take first letter and capitalize
            const dayLabel = dayName.charAt(0).toUpperCase()

            // Count tasks created on this day
            const created = tareas.filter(t => {
                if (!t.creado_en) return false
                const createdDate = parseISO(t.creado_en)
                return isSameDay(createdDate, currentDay)
            }).length

            // Count tasks completed on this day
            const completed = tareas.filter(t => {
                if (t.estado !== "Terminada") return false
                const dateToCheck = t.actualizado_en || t.creado_en
                if (!dateToCheck) return false
                const updatedDate = parseISO(dateToCheck)
                return isSameDay(updatedDate, currentDay)
            }).length

            days.push({
                day: dayLabel,
                fullDate: format(currentDay, "yyyy-MM-dd"),
                created,
                completed,
                balance: completed - created,
            })
        }

        return days
    }, [tareas])

    // Calculate totals for KPIs
    const totals = React.useMemo(() => {
        const totalCreated = weeklyData.reduce((sum, day) => sum + day.created, 0)
        const totalCompleted = weeklyData.reduce((sum, day) => sum + day.completed, 0)
        const ratio = totalCreated > 0 ? (totalCompleted / totalCreated) : 0
        const netBalance = totalCompleted - totalCreated

        return {
            totalCreated,
            totalCompleted,
            ratio: ratio.toFixed(1),
            netBalance,
        }
    }, [weeklyData])

    // Calculate trend (last 3 days vs previous 3 days)
    const trend = React.useMemo(() => {
        const last3Days = weeklyData.slice(-3)
        const prev3Days = weeklyData.slice(-6, -3)

        const last3Balance = last3Days.reduce((sum, day) => sum + day.balance, 0)
        const prev3Balance = prev3Days.reduce((sum, day) => sum + day.balance, 0)

        if (last3Balance > prev3Balance) return "up"
        if (last3Balance < prev3Balance) return "down"
        return "neutral"
    }, [weeklyData])

    const getTrendIcon = () => {
        switch (trend) {
            case "up":
                return <TrendingUp className="h-3 w-3 text-status-positive" />
            case "down":
                return <TrendingDown className="h-3 w-3 text-status-negative" />
            default:
                return <Minus className="h-3 w-3 text-muted-foreground" />
        }
    }

    return (
        <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-4 space-y-4">
                {/* Header with KPIs */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground">Balance semanal</h3>
                        {getTrendIcon()}
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <KPIBox
                            label="Creadas"
                            value={totals.totalCreated.toString()}
                            color="text-chart-2"
                            subtext="últimos 7d"
                        />
                        <KPIBox
                            label="Terminadas"
                            value={totals.totalCompleted.toString()}
                            color="text-chart-1"
                            subtext="últimos 7d"
                        />
                        <KPIBox
                            label="Ratio"
                            value={`${totals.ratio}x`}
                            color={Number(totals.ratio) >= 1 ? "text-status-positive" : "text-status-negative"}
                            subtext="term/creadas"
                        />
                    </div>
                </div>

                {/* Chart - Grouped bars side by side */}
                <div className="h-[140px] w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                accessibilityLayer
                                data={weeklyData}
                                margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis hide />
                                <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                                <Bar
                                    dataKey="created"
                                    fill="var(--color-created)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={8}
                                />
                                <Bar
                                    dataKey="completed"
                                    fill="var(--color-completed)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={8}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />
                        <span>Creadas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]" />
                        <span>Terminadas</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface KPIBoxProps {
    label: string
    value: string
    color: string
    subtext: string
}

function KPIBox({ label, value, color, subtext }: KPIBoxProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-md bg-muted/30 px-2 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={cn("text-lg font-bold leading-tight", color)}>{value}</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">{subtext}</p>
        </div>
    )
}
