"use client"

import * as React from "react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WeeklyTrendData {
    week: string
    created: number
    completed: number
}

interface WeeklyTrendChartProps {
    data: WeeklyTrendData[]
}

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Tendencia Semanal</span>
                    <span className="text-xs font-normal text-muted-foreground">Últimas 4 semanas</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="week"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar
                                name="Creadas"
                                dataKey="created"
                                fill="#0ea5e9"
                                radius={[4, 4, 0, 0]}
                                barSize={32}
                            />
                            <Bar
                                name="Completadas"
                                dataKey="completed"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
