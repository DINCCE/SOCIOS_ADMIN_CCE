"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { TareaView } from "@/features/procesos/tareas/columns"
import { startOfWeek, addDays, isSameDay, parseISO } from "date-fns"

interface MiSemanaCardProps {
    tareas: TareaView[]
}

const chartConfig = {
    completed: {
        label: "Completadas",
        color: "var(--chart-2)",
    },
    added: {
        label: "Asignadas",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function MiSemanaCard({ tareas }: MiSemanaCardProps) {
    // Calculate real weekly data
    const weeklyData = React.useMemo(() => {
        const today = new Date()
        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }) // Monday

        const dayLabels = ["L", "M", "M", "J", "V", "S", "D"]
        
        return Array.from({ length: 7 }).map((_, i) => {
            const currentDay = addDays(startOfCurrentWeek, i)
            
            // Count tasks completed on this day (using actualizado_en when estado is Terminada)
            const completed = tareas.filter(t => {
                if (t.estado !== "Terminada" || !t.actualizado_en) return false
                const updatedDate = parseISO(t.actualizado_en)
                return isSameDay(updatedDate, currentDay)
            }).length

            // Count tasks created/assigned on this day
            const added = tareas.filter(t => {
                if (!t.creado_en) return false
                const createdDate = parseISO(t.creado_en)
                return isSameDay(createdDate, currentDay)
            }).length

            return {
                day: dayLabels[i],
                completed,
                added,
            }
        })
    }, [tareas])

    return (
        <Card className="border-none shadow-none bg-muted/30">
            <CardContent className="p-4">
                <ChartContainer config={chartConfig} className="h-[160px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={weeklyData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="added"
                            fill="var(--color-added)"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                        <Bar
                            dataKey="completed"
                            fill="var(--color-completed)"
                            radius={[4, 4, 0, 0]}
                            barSize={16}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
