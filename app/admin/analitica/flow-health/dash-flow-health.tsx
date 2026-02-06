"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PageContent } from "@/components/shell/page-content"
import { TareaView } from "@/features/procesos/tareas/columns"
import {
    isThisWeek,
    startOfWeek,
    endOfWeek,
    subWeeks,
    isBefore,
    isAfter,
    differenceInHours,
    subDays
} from "date-fns"

// Components
import { TeamStatsGrid } from "../components/team-stats-grid"
import { TeamWorkloadSection } from "../components/team-workload-section"
import { WeeklyTrendChart } from "../components/weekly-trend-chart"
import { StagnationAlerts } from "../components/stagnation-alerts"
import { BottleneckHeatmap } from "../components/bottleneck-heatmap"
import { FocusSpecialtySection, type TagFocusMetric } from "../components/focus-specialty-section"
import { ReassignTasksModal } from "../components/reassign-tasks-modal"

// Types for our calculations
interface StateBottleneck {
    state: string
    avgHours: number
    avgDays: number
    medianHours: number
    taskCount: number
    severity: 'fast' | 'normal' | 'slow' | 'blocked'
}

interface StagnationAlert {
    taskId: string
    taskTitle: string
    assignedTo: string | null
    stateChangeDate: string
    daysSinceChange: number
    thresholdExceeded: number
}

export function DashFlowHealth() {
    const supabase = createClient()
    const [reassignModalOpen, setReassignModalOpen] = React.useState(false)
    const [memberToReassign, setMemberToReassign] = React.useState<{ userId: string; name: string; tasks: TareaView[] } | null>(null)

    // 1. Get current user and organization
    const { data: currentUser } = useQuery({
        queryKey: ["current-user-for-flow-health"],
        queryFn: async () => {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) return null
            return user
        },
    })

    // 2. Fetch organization members for names
    const { data: membersMap = new Map<string, string>() } = useQuery({
        queryKey: ["members-map-flow", currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return new Map()
            const { data, error } = await supabase
                .from("config_organizacion_miembros")
                .select("user_id, nombre_completo")
                .is("eliminado_en", null)
            if (error) {
                console.error("[DashFlowHealth] Error fetching members:", error)
                return new Map()
            }
            return new Map(data?.map(m => [m.user_id, m.nombre_completo]) || [])
        },
        enabled: !!currentUser,
    })

    // 3. Fetch tasks
    const { data: allTareas = [] as TareaView[], isLoading: isLoadingTareas } = useQuery({
        queryKey: ["flow-health-tareas", currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return []

            try {
                const { data: member } = await supabase
                    .from("config_organizacion_miembros")
                    .select("organization_id")
                    .eq("user_id", currentUser.id)
                    .is("eliminado_en", null)
                    .limit(1)
                    .maybeSingle()

                if (!member?.organization_id) return []

                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

                const { data, error } = await supabase
                    .from("tr_tareas")
                    .select("id, titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_id, creado_en, actualizado_en, tags")
                    .eq("organizacion_id", member.organization_id)
                    .is("eliminado_en", null)
                    .order("creado_en", { ascending: false })
                    .limit(1000)

                if (error) throw error

                const filtered = data?.filter(t => {
                    if (t.estado !== "Terminada") return true
                    if (!t.actualizado_en) return true
                    return new Date(t.actualizado_en) >= threeMonthsAgo
                }) || []

                return filtered as TareaView[]
            } catch (err) {
                console.error("[DashFlowHealth] Query error:", err)
                throw err
            }
        },
        enabled: !!currentUser,
    })

    // Add assignee names
    const tareasWithNames = React.useMemo(() => {
        return allTareas.map(t => ({
            ...t,
            asignado_nombre_completo: t.asignado_id ? membersMap.get(t.asignado_id) || null : null
        })) as TareaView[]
    }, [allTareas, membersMap])

    // Flow Health Calculations
    const calculations = React.useMemo(() => {
        if (isLoadingTareas) return null

        const today = new Date()
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        const sevenDaysAgo = subDays(today, 7)

        // Initialize aggregations
        const stats = { total: 0, overdue: 0, inProgress: 0, completedThisWeek: 0 }
        const workloadMap = new Map<string, {
            name: string
            pending: number
            inProgress: number
            completed: number
            total: number
            oldTasks: number
            tasks: TareaView[]
        }>()
        const weeklyBuckets = [3, 2, 1, 0].map(weeksAgo => ({
            start: startOfWeek(subWeeks(today, weeksAgo)),
            end: endOfWeek(subWeeks(today, weeksAgo)),
            created: 0,
            completed: 0,
            weeksAgo
        }))
        const resolutionTimes: number[] = []

        // Tag counts for Focus & Specialty
        const tagCounts: Record<string, number> = {}
        let totalTaggedTasks = 0

        // Single pass through all tasks
        tareasWithNames.forEach(t => {
            // 1. Basic stats
            if (t.estado !== "Terminada") {
                stats.total++
                if (t.fecha_vencimiento && isBefore(new Date(t.fecha_vencimiento), today)) {
                    stats.overdue++
                }
                if (t.estado === "En Progreso" || t.estado === "En progreso") {
                    stats.inProgress++
                }
            } else if (t.actualizado_en && isThisWeek(new Date(t.actualizado_en))) {
                stats.completedThisWeek++
            }

            // 2. Workload by assignee with old tasks tracking
            const name = t.asignado_nombre_completo || "Sin asignar"
            if (!workloadMap.has(name)) {
                workloadMap.set(name, {
                    name,
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                    total: 0,
                    oldTasks: 0,
                    tasks: [] as TareaView[]
                })
            }
            const wl = workloadMap.get(name)!
            if (t.estado === "Terminada") {
                wl.completed++
            } else {
                if (t.estado === "En progreso" || t.estado === "En Progreso") {
                    wl.inProgress++
                }
                wl.pending++

                // Count old tasks (> 7 days)
                const createdDate = new Date(t.creado_en)
                if (createdDate < sevenDaysAgo) {
                    wl.oldTasks++
                }

                wl.tasks.push(t)
            }
            wl.total = wl.pending + wl.completed

            // 3. Weekly trend for sustainability
            const createdDate = new Date(t.creado_en)
            weeklyBuckets.forEach(bucket => {
                if (isAfter(createdDate, bucket.start) && isBefore(createdDate, bucket.end)) {
                    bucket.created++
                }
                if (t.estado === "Terminada" && t.actualizado_en) {
                    const updatedDate = new Date(t.actualizado_en)
                    if (isAfter(updatedDate, bucket.start) && isBefore(updatedDate, bucket.end)) {
                        bucket.completed++
                    }
                }
            })

            // 4. Resolution time for stagnation threshold
            if (t.estado === "Terminada" && t.actualizado_en && isAfter(new Date(t.actualizado_en), threeMonthsAgo)) {
                const days = differenceInHours(new Date(t.actualizado_en), new Date(t.creado_en)) / 24
                resolutionTimes.push(days)
            }

            // 5. Tag counting
            if (t.tags && t.tags.length > 0) {
                totalTaggedTasks++
                t.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1
                })
            }
        })

        // Calculate global median resolution time
        const sortedTimes = [...resolutionTimes].sort((a, b) => a - b)
        const globalMedianResolution = sortedTimes.length > 0
            ? sortedTimes[Math.floor(sortedTimes.length / 2)]
            : 7 // Default 7 days
        const stagnationThreshold = globalMedianResolution * 2

        // Process workload with old tasks percentage
        const IDEAL_LOAD = 8
        const workload = Array.from(workloadMap.values())
            .filter(m => m.name !== "Sin asignar")
            .map(m => {
                const oldTasksPercentage = m.total > 0 ? (m.oldTasks / m.total) * 100 : 0

                let status: 'overloaded' | 'balanced' | 'available' = 'balanced'
                if (m.pending > IDEAL_LOAD * 1.5 || oldTasksPercentage > 30) status = 'overloaded'
                else if (m.pending < IDEAL_LOAD * 0.5) status = 'available'

                return {
                    userId: m.name,
                    name: m.name,
                    pending: m.pending,
                    inProgress: m.inProgress,
                    completed: m.completed,
                    oldTasks: m.oldTasks,
                    oldTasksPercentage,
                    status,
                    tasks: m.tasks
                }
            })
            .sort((a, b) => b.oldTasks - a.oldTasks)

        // Weekly trend with sustainability (net difference)
        const weeklyTrend = weeklyBuckets
            .sort((a, b) => a.weeksAgo - b.weeksAgo)
            .map(b => {
                const netDiff = b.completed - b.created
                return {
                    week: b.weeksAgo === 0 ? 'Actual' : `Sem -${b.weeksAgo}`,
                    created: b.created,
                    completed: b.completed,
                    netDifference: netDiff,
                    isSustainable: netDiff >= 0
                }
            })

        // Calculate flow health score (total net change)
        const totalNetChange = weeklyTrend.reduce((sum, w) => sum + (w.netDifference || 0), 0)
        let flowHealthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (totalNetChange < -10) flowHealthStatus = 'critical'
        else if (totalNetChange < 0) flowHealthStatus = 'warning'

        // Tag focus metrics
        const tagFocusMetrics: TagFocusMetric[] = Object.entries(tagCounts)
            .map(([tag, count]) => ({
                tag,
                count,
                percentage: (count / tareasWithNames.length) * 100
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 8)

        // Stagnation alerts
        const inProgressTasks = tareasWithNames.filter(t =>
            t.estado === 'En Progreso' || t.estado === 'En progreso'
        )

        const stagnationAlerts: StagnationAlert[] = []
        inProgressTasks.forEach(tarea => {
            const stateChangeDate = new Date(tarea.actualizado_en || tarea.creado_en)
            const daysSinceChange = (today.getTime() - stateChangeDate.getTime()) / (1000 * 60 * 60 * 24)

            if (daysSinceChange > stagnationThreshold) {
                stagnationAlerts.push({
                    taskId: tarea.id,
                    taskTitle: tarea.titulo,
                    assignedTo: tarea.asignado_nombre_completo,
                    stateChangeDate: stateChangeDate.toISOString(),
                    daysSinceChange: Math.floor(daysSinceChange),
                    thresholdExceeded: Math.floor(daysSinceChange / stagnationThreshold)
                })
            }
        })
        stagnationAlerts.sort((a, b) => b.thresholdExceeded - a.thresholdExceeded)

        // Bottleneck data - Calculate from current task data by state
        // Group tasks by state and calculate age
        const stateAgeMap = new Map<string, number[]>()
        tareasWithNames.forEach(t => {
            if (t.estado === 'Terminada' || t.estado === 'Cancelada') return

            const createdDate = new Date(t.creado_en)
            const daysOld = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)

            if (!stateAgeMap.has(t.estado)) {
                stateAgeMap.set(t.estado, [])
            }
            stateAgeMap.get(t.estado)!.push(daysOld)
        })

        const bottleneckData: StateBottleneck[] = Array.from(stateAgeMap.entries())
            .map(([state, ages]) => {
                const avgDays = ages.reduce((a, b) => a + b, 0) / ages.length
                const avgHours = avgDays * 24
                const sortedAges = [...ages].sort((a, b) => a - b)
                const medianDays = sortedAges[Math.floor(sortedAges.length / 2)]
                const medianHours = medianDays * 24

                // Determine severity based on age
                let severity: 'fast' | 'normal' | 'slow' | 'blocked' = 'normal'
                if (avgDays > 14) severity = 'blocked'
                else if (avgDays > 7) severity = 'slow'
                else if (avgDays < 2) severity = 'fast'

                return {
                    state,
                    avgHours,
                    avgDays,
                    medianHours,
                    taskCount: ages.length,
                    severity
                }
            })
            .sort((a, b) => b.avgDays - a.avgDays)

        return {
            stats,
            workload,
            weeklyTrend,
            tagFocusMetrics,
            stagnationAlerts,
            stagnationThreshold,
            bottleneckData,
            flowHealthScore: totalNetChange,
            flowHealthStatus,
            idealLoad: IDEAL_LOAD
        }
    }, [tareasWithNames, isLoadingTareas])

    const availableMembers = React.useMemo(() => {
        if (!calculations) return []
        return calculations.workload.map(m => ({
            user_id: m.userId,
            nombre_completo: m.name,
            email: null
        }))
    }, [calculations])

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

    if (isLoadingTareas || !calculations) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <PageContent>
            <div className="flex flex-col gap-4 py-6 max-w-7xl mx-auto">
                {/* Quick Stats Grid with Flow Health */}
                <TeamStatsGrid
                    stats={calculations.stats}
                    flowHealthScore={calculations.flowHealthScore}
                    flowHealthStatus={calculations.flowHealthStatus}
                />

                {/* Row 1: Stagnation Alerts + Weekly Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StagnationAlerts
                        alerts={calculations.stagnationAlerts}
                        thresholdDays={calculations.stagnationThreshold}
                    />
                    <WeeklyTrendChart
                        data={calculations.weeklyTrend}
                        showSustainability={true}
                    />
                </div>

                {/* Row 2: Bottleneck Heatmap */}
                <BottleneckHeatmap data={calculations.bottleneckData} />

                {/* Row 3: Workload + Focus & Specialty */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TeamWorkloadSection
                        members={calculations.workload}
                        idealLoad={calculations.idealLoad}
                        onReassign={handleReassignStart}
                        showOldTasks={true}
                    />
                    <FocusSpecialtySection
                        tagMetrics={calculations.tagFocusMetrics}
                        totalTasks={tareasWithNames.length}
                    />
                </div>
            </div>

            <ReassignTasksModal
                open={reassignModalOpen}
                onClose={() => setReassignModalOpen(false)}
                fromMember={memberToReassign}
                availableMembers={availableMembers}
            />
        </PageContent>
    )
}
