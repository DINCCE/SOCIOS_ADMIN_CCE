"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
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

interface WeeklyCompletionChartProps {
    tareas: TareaView[]
}

const chartConfig = {
    completed: {
        label: "Completadas",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function WeeklyCompletionChart({ tareas }: WeeklyCompletionChartProps) {
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

            // Count tasks completed on this day
            const completed = tareas.filter(t => {
                if (t.estado !== "Terminada") return false
                // Use actualizado_en if available, otherwise creado_en
                const dateToCheck = t.actualizado_en || t.creado_en
                if (!dateToCheck) return false
                const updatedDate = parseISO(dateToCheck)
                return isSameDay(updatedDate, currentDay)
            }).length

            days.push({
                day: dayLabel,
                fullDate: format(currentDay, "yyyy-MM-dd"),
                completed,
            })
        }

        return days
    }, [tareas])

    // Calculate total for KPI
    const totalCompleted = React.useMemo(() => {
        return weeklyData.reduce((sum, day) => sum + day.completed, 0)
    }, [weeklyData])

    return (
        <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-4 space-y-4">
                {/* Header with KPI */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-foreground">Tu ritmo (7 días)</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Tareas completadas</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
                        <p className="text-[10px] text-muted-foreground">total</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[140px] w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
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
                                dataKey="completed"
                                fill="var(--color-completed)"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    )
}
