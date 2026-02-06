"use client"

import * as React from "react"
import { subWeeks, getWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TareaView } from "@/features/procesos/tareas/columns"
import { cn } from "@/lib/utils"

interface ChartDataPoint {
    member: string
    fullName: string
    pendiente: number
    enProgreso: number
    pausada: number
    total: number
    average3Weeks: number
    userId: string
}

interface TeamWorkloadChartProps {
    tareas: TareaView[]
    onMemberClick?: (userId: string) => void
}

const chartConfig = {
    pendiente: {
        label: "Pendiente",
        color: "var(--chart-2)",
    },
    enProgreso: {
        label: "En Progreso",
        color: "var(--chart-1)",
    },
    pausada: {
        label: "Pausada",
        color: "var(--chart-4)",
    },
    average3Weeks: {
        label: "Promedio 3 sem",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

function calculate3WeekAverage(tareas: TareaView[], userId: string): number {
    const today = new Date()
    const threeWeeksAgo = subWeeks(today, 3)

    const userTasks = tareas.filter(t =>
        t.asignado_id === userId &&
        t.creado_en &&
        new Date(t.creado_en) >= threeWeeksAgo
    )

    if (userTasks.length === 0) return 0

    const weekCounts: Record<number, number> = {}
    userTasks.forEach(t => {
        const weekNum = getWeek(new Date(t.creado_en))
        weekCounts[weekNum] = (weekCounts[weekNum] || 0) + 1
    })

    const weeks = Object.values(weekCounts)
    return weeks.reduce((a, b) => a + b, 0) / Math.max(weeks.length, 1)
}

function shortenName(name: string): string {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0]
    // Return first name only
    return parts[0]
}

function useTeamWorkloadChartData(tareas: TareaView[]) {
    return React.useMemo(() => {
        const memberMap = new Map<string, {
            fullName: string
            userId: string
            pendiente: number
            enProgreso: number
            pausada: number
            tareas: TareaView[]
        }>()

        tareas.forEach(t => {
            if (!t.asignado_id) return

            if (!memberMap.has(t.asignado_id)) {
                memberMap.set(t.asignado_id, {
                    fullName: t.asignado_nombre_completo || "Sin nombre",
                    userId: t.asignado_id,
                    pendiente: 0,
                    enProgreso: 0,
                    pausada: 0,
                    tareas: []
                })
            }

            const member = memberMap.get(t.asignado_id)!

            if (t.estado === 'Pendiente') {
                member.pendiente++
            } else if (t.estado === 'En Progreso' || t.estado === 'En progreso') {
                member.enProgreso++
            } else if (t.estado === 'Pausada') {
                member.pausada++
            }

            if (t.estado !== 'Terminada' && t.estado !== 'Cancelada') {
                member.tareas.push(t)
            }
        })

        const data: ChartDataPoint[] = Array.from(memberMap.values())
            .filter(m => m.fullName !== "Sin asignar")
            .map(m => ({
                member: shortenName(m.fullName),
                fullName: m.fullName,
                pendiente: m.pendiente,
                enProgreso: m.enProgreso,
                pausada: m.pausada,
                total: m.pendiente + m.enProgreso + m.pausada,
                average3Weeks: calculate3WeekAverage(tareas, m.userId),
                userId: m.userId,
            }))
            .filter(d => d.total > 0)
            .sort((a, b) => b.total - a.total)

        const maxTasks = Math.max(...data.map(d => d.total), 10)

        return { data, maxTasks }
    }, [tareas])
}

function WorkloadTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null

    const data = payload[0].payload as ChartDataPoint

    return (
        <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
            <p className="text-xs font-semibold mb-2">{data.fullName}</p>

            <div className="space-y-1">
                {payload.filter((p: any) => ['pendiente', 'enProgreso', 'pausada'].includes(p.dataKey)).map((item: any) => (
                    <div key={item.dataKey} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-muted-foreground">
                            {chartConfig[item.dataKey].label}
                        </span>
                        <span className="text-[10px] font-medium ml-auto">{item.value}</span>
                    </div>
                ))}

                <div className="pt-1 border-t border-border/50 flex justify-between">
                    <span className="text-[10px] text-muted-foreground">Total</span>
                    <span className="text-[10px] font-bold">{data.total}</span>
                </div>

                <div className="pt-1 border-t border-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-average3Weeks)]" />
                        <span className="text-[10px] text-muted-foreground">Promedio 3 sem</span>
                    </div>
                    <span className="text-[10px] font-medium">{data.average3Weeks.toFixed(1)}</span>
                </div>

                {data.total > data.average3Weeks * 1.2 && (
                    <div className="pt-1 text-[9px] text-amber-600">
                        Arriba del promedio
                    </div>
                )}
            </div>
        </div>
    )
}

export function TeamWorkloadChart({ tareas, onMemberClick }: TeamWorkloadChartProps) {
    const { data, maxTasks } = useTeamWorkloadChartData(tareas)

    if (data.length === 0) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Carga por Miembro
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
                    <p className="text-sm font-medium text-foreground">Sin datos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        No hay tareas asignadas para mostrar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Carga por Miembro
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                        <XAxis
                            type="number"
                            tickCount={maxTasks}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="member"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => value}
                        />
                        <YAxis
                            yAxisId="line"
                            type="number"
                            orientation="right"
                            hide={true}
                        />

                        <ChartTooltip content={<WorkloadTooltip />} />
                        <ChartLegend content={<ChartLegendContent />} />

                        <Bar
                            stackId="states"
                            dataKey="pendiente"
                            fill="var(--color-pendiente)"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            stackId="states"
                            dataKey="enProgreso"
                            fill="var(--color-enProgreso)"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            stackId="states"
                            dataKey="pausada"
                            fill="var(--color-pausada)"
                            radius={[0, 4, 4, 0]}
                        />
                        <Line
                            yAxisId="line"
                            type="monotone"
                            dataKey="average3Weeks"
                            stroke="var(--color-average3Weeks)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-average3Weeks)", r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
