"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"

interface WeeklyTrendData {
    week: string
    created: number
    completed: number
}

interface WeeklyTrendChartProps {
    data: WeeklyTrendData[]
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

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Tendencia semanal</span>
                    <span className="text-[10px] font-bold opacity-50">4 semanas</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
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
            </CardContent>
        </Card>
    )
}
