"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { TareaView } from "@/features/procesos/tareas/columns"
import { subDays, format, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface WeeklyCompletionChartProps {
    tareas: TareaView[]
}

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
        <Card className="border-none shadow-none bg-muted/30">
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
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={weeklyData}
                            margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                            barSize={20}
                        >
                            {/* No grid lines */}
                            <CartesianGrid stroke="none" />

                            {/* Minimalist XAxis - only day initials */}
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                tickMargin={8}
                            />

                            {/* Hide YAxis */}
                            <YAxis hide />

                            {/* Minimalist Tooltip */}
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length > 0) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="rounded-md border bg-popover px-2.5 py-1 text-xs shadow-md">
                                                <div className="font-medium text-foreground">{data.completed}</div>
                                                <div className="text-muted-foreground">{data.fullDate}</div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                                cursor={false}
                            />

                            {/* Bars - using theme colors */}
                            <Bar
                                dataKey="completed"
                                fill="hsl(var(--foreground))"
                                radius={[4, 4, 0, 0]}
                                className="fill-foreground"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
