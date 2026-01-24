"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PageContent } from "@/components/shell/page-content"
import { TareaView } from "@/features/procesos/tareas/columns"
import {
    differenceInDays,
    isThisWeek,
    startOfWeek,
    endOfWeek,
    subWeeks,
    format,
    isBefore,
    isAfter,
    differenceInHours
} from "date-fns"

// Components
import { TeamStatsGrid } from "./components/team-stats-grid"
import { TeamWorkloadSection } from "./components/team-workload-section"
import { WeeklyTrendChart } from "./components/weekly-trend-chart"
import { ResolutionTimeCard } from "./components/resolution-time-card"
import { ProductivityRanking } from "./components/productivity-ranking"
import { DistributionCharts } from "./components/distribution-charts"
import { ReassignTasksModal } from "./components/reassign-tasks-modal"

export function TareasDashboardEquipo() {
    const supabase = createClient()
    const [reassignModalOpen, setReassignModalOpen] = React.useState(false)
    const [memberToReassign, setMemberToReassign] = React.useState<any>(null)

    // 1. Fetch all tasks
    const { data: allTareas = Array<TareaView>(), isLoading: isLoadingTareas } = useQuery({
        queryKey: ["team-tareas"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("v_tareas_org")
                .select("*")
                .is("eliminado_en", null)

            if (error) throw error
            return data as TareaView[]
        },
    })

    // 2. Fetch all team members
    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ["team-members"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("config_organizacion_miembros")
                .select("user_id, nombres, apellidos, email, cargo")
                .is("eliminado_en", null)

            if (error) throw error
            return data.map(m => ({
                ...m,
                nombre_completo: `${m.nombres} ${m.apellidos}`.trim()
            }))
        },
    })

    // 3. Data Aggregation & Calculations
    const calculations = React.useMemo(() => {
        if (isLoadingTareas || isLoadingMembers) return null

        const today = new Date()
        const pendingTareas = allTareas.filter(t => t.estado !== "Terminada")
        const overdueTareas = pendingTareas.filter(t => t.fecha_vencimiento && isBefore(new Date(t.fecha_vencimiento), today))
        const inProgressTareas = allTareas.filter(t => t.estado === "En Progreso")

        // Stats
        const stats = {
            total: pendingTareas.length,
            overdue: overdueTareas.length,
            inProgress: inProgressTareas.length,
            completedThisWeek: allTareas.filter(t =>
                t.estado === "Terminada" &&
                t.actualizado_en &&
                isThisWeek(new Date(t.actualizado_en))
            ).length
        }

        // Workload calculated directly from tasks
        const workloadMap = new Map<string, { 
            name: string, 
            pending: number, 
            inProgress: number, 
            completed: number,
            total: number,
            tasks: TareaView[]
        }>()

        allTareas.forEach(t => {
            const name = t.asignado_nombre_completo || "Sin asignar"
            if (!workloadMap.has(name)) {
                workloadMap.set(name, { 
                    name, 
                    pending: 0, 
                    inProgress: 0, 
                    completed: 0, 
                    total: 0,
                    tasks: [] as TareaView[] 
                })
            }
            
            const stats = workloadMap.get(name)!
            if (t.estado === "Terminada") {
                stats.completed++
            } else {
                if (t.estado === "En progreso" || t.estado === "En Progreso") {
                    stats.inProgress++
                }
                stats.pending++
                stats.tasks.push(t)
            }
            stats.total = stats.pending + stats.completed
        })

        const IDEAL_LOAD = 8
        const workload = Array.from(workloadMap.values())
            .filter(m => m.name !== "Sin asignar")
            .map(m => {
                let status: 'overloaded' | 'balanced' | 'available' = 'balanced'
                if (m.pending > IDEAL_LOAD * 1.5) status = 'overloaded'
                else if (m.pending < IDEAL_LOAD * 0.5) status = 'available'

                return {
                    userId: m.name,
                    name: m.name,
                    pending: m.pending,
                    inProgress: m.inProgress,
                    completed: m.completed,
                    status,
                    tasks: m.tasks
                }
            })
            .sort((a, b) => b.pending - a.pending)

        // Weekly Trend (Last 4 weeks)
        const weeklyTrend = [3, 2, 1, 0].map(weeksAgo => {
            const start = startOfWeek(subWeeks(today, weeksAgo))
            const end = endOfWeek(subWeeks(today, weeksAgo))

            const created = allTareas.filter(t => {
                const date = new Date(t.creado_en)
                return isAfter(date, start) && isBefore(date, end)
            }).length

            const completed = allTareas.filter(t => {
                if (t.estado !== 'Terminada' || !t.actualizado_en) return false
                const date = new Date(t.actualizado_en)
                return isAfter(date, start) && isBefore(date, end)
            }).length

            return {
                week: weeksAgo === 0 ? 'Actual' : `Sem -${weeksAgo}`,
                created,
                completed
            }
        })

        // Resolution Time
        const completedTasks = allTareas.filter(t => t.estado === "Terminada" && t.actualizado_en)
        const resolutionTimes = completedTasks.map(t =>
            differenceInHours(new Date(t.actualizado_en!), new Date(t.creado_en)) / 24
        )

        const avgResolutionTime = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0

        const sortedTimes = [...resolutionTimes].sort((a, b) => a - b)
        const medianResolutionTime = sortedTimes.length > 0
            ? sortedTimes[Math.floor(sortedTimes.length / 2)]
            : 0

        const priorities = ['Critica', 'Alta', 'Media', 'Baja']
        const byPriority = priorities.map(p => {
            const pTimes = completedTasks
                .filter(t => t.prioridad === p)
                .map(t => differenceInHours(new Date(t.actualizado_en!), new Date(t.creado_en)) / 24)

            return {
                priority: p,
                days: pTimes.length > 0 ? pTimes.reduce((a, b) => a + b, 0) / pTimes.length : 0
            }
        }).filter(p => p.days > 0)

        // Productivity Ranking (Top 5 this week)
        const ranking = workload
            .filter(m => m.completed > 0)
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5)
            .map((m, idx) => ({
                rank: idx + 1,
                userId: m.userId,
                name: m.name,
                completed: m.completed,
                streak: Math.floor(m.completed / 2) // Fake streak for demo
            }))

        return {
            stats,
            workload,
            weeklyTrend,
            resolutionStats: {
                average: avgResolutionTime,
                median: medianResolutionTime,
                byPriority
            },
            ranking,
            idealLoad: IDEAL_LOAD
        }
    }, [allTareas, members, isLoadingTareas, isLoadingMembers])

    const handleReassignStart = (userId: string) => {
        const member = calculations?.workload.find(m => m.userId === userId)
        if (member) {
            setMemberToReassign({
                userId: member.userId,
                name: member.name,
                tasks: member.tasks
            })
            setReassignModalOpen(true)
        }
    }

    if (isLoadingTareas || isLoadingMembers || !calculations) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <PageContent>
            <div className="flex flex-col gap-4 py-6 max-w-7xl mx-auto">
                {/* Quick Stats Grid */}
                <TeamStatsGrid stats={calculations.stats} />

                {/* Workload Section */}
                <TeamWorkloadSection
                    members={calculations.workload}
                    idealLoad={calculations.idealLoad}
                    onReassign={handleReassignStart}
                />

                {/* Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <WeeklyTrendChart data={calculations.weeklyTrend} />
                    <ResolutionTimeCard stats={calculations.resolutionStats} />
                </div>

                {/* Distribution & Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <DistributionCharts tareas={allTareas} />
                    </div>
                    <div>
                        <ProductivityRanking members={calculations.ranking} />
                    </div>
                </div>
            </div>

            <ReassignTasksModal
                open={reassignModalOpen}
                onClose={() => setReassignModalOpen(false)}
                fromMember={memberToReassign}
                availableMembers={members}
            />
        </PageContent>
    )
}
