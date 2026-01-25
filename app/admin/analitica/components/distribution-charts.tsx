"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TareaView } from "@/features/procesos/tareas/columns"

interface DistributionChartsProps {
    tareas: TareaView[]
}

function CategoryBarList({ data }: { data: { name: string, value: number, color?: string }[] }) {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="space-y-4">
            {data.map((item) => {
                const percentage = (item.value / maxVal) * 100;
                return (
                    <div key={item.name} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-28 truncate shrink-0">{item.name}</span>
                        <div className="flex-1 h-2 relative">
                            <div 
                                className="h-full rounded-full transition-all duration-500" 
                                style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: item.color || "var(--chart-1)"
                                }}
                            />
                        </div>
                        <span className="text-sm font-medium text-foreground tabular-nums w-8 text-right shrink-0">{item.value}</span>
                    </div>
                );
            })}
        </div>
    );
}

export function DistributionCharts({ tareas }: DistributionChartsProps) {
    // 1. Distribution by Status (Sorted Descending)
    const statusData = React.useMemo(() => {
        const counts: Record<string, number> = {}
        tareas.forEach(t => {
            const status = t.estado || 'Pendiente'
            counts[status] = (counts[status] || 0) + 1
        })
        
        return Object.entries(counts)
            .map(([name, value]) => ({ 
                name, 
                value,
                color: name.toLowerCase() === 'cancelada' ? 'var(--chart-5)' : 'var(--chart-1)'
            }))
            .sort((a, b) => b.value - a.value)
    }, [tareas])

    // 2. Distribution by Priority (Sorted Descending)
    const priorityData = React.useMemo(() => {
        const counts: Record<string, number> = {}
        tareas.forEach(t => {
            const priority = t.prioridad || 'Media'
            counts[priority] = (counts[priority] || 0) + 1
        })
        
        return Object.entries(counts)
            .map(([name, value]) => ({ 
                name, 
                value,
                color: (name.toLowerCase() === 'critica' || name.toLowerCase() === 'urgente') ? 'var(--chart-4)' : 'var(--chart-2)'
            }))
            .sort((a, b) => b.value - a.value)
    }, [tareas])

    // 3. Distribution by Tags (Top 5)
    const tagData = React.useMemo(() => {
        const counts: Record<string, number> = {}
        tareas.forEach(t => {
            if (t.tags) {
                t.tags.forEach(tag => {
                    counts[tag] = (counts[tag] || 0) + 1
                })
            }
        })
        return Object.entries(counts)
            .map(([name, value], index) => ({ 
                name, 
                value,
                color: `var(--chart-${(index % 5) + 1})`
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
    }, [tareas])

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Distribución de tareas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                    {/* Status List */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70 flex items-center gap-2">
                            Por estado
                            <div className="h-px flex-1 bg-border/50" />
                        </h4>
                        <CategoryBarList data={statusData} />
                    </div>

                    {/* Priority List */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70 flex items-center gap-2">
                            Por prioridad
                            <div className="h-px flex-1 bg-border/50" />
                        </h4>
                        <CategoryBarList data={priorityData} />
                    </div>
                </div>
                
                {/* Tags Section */}
                <div className="pt-6 border-t border-border/50">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70 flex items-center gap-2 mb-6">
                        Top etiquetas
                        <div className="h-px flex-1 bg-border/50" />
                    </h4>
                    <CategoryBarList data={tagData} />
                </div>
            </CardContent>
        </Card>
    )
}
