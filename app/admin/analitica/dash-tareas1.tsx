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

export function DashTareas1() {
    const supabase = createClient()
    const [reassignModalOpen, setReassignModalOpen] = React.useState(false)
    const [memberToReassign, setMemberToReassign] = React.useState<{ userId: string; name: string; tasks: TareaView[] } | null>(null)

    // 1. Get current user and organization
    const { data: currentUser } = useQuery({
        queryKey: ["current-user-for-dashboard"],
        queryFn: async () => {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) return null
            return user
        },
    })

    // 2. Fetch organization members for names
    const { data: membersMap = new Map<string, string>() } = useQuery({
        queryKey: ["members-map", currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return new Map()
            const { data, error } = await supabase
                .from("config_organizacion_miembros")
                .select("user_id, nombre_completo")
                .is("eliminado_en", null)
            if (error) {
                console.error("[DashTareas1] Error fetching members:", error)
                return new Map()
            }
            return new Map(data?.map(m => [m.user_id, m.nombre_completo]) || [])
        },
        enabled: !!currentUser,
    })

    // 3. Fetch tasks with organization filter and field selection (3-month completed task filter)
    const { data: allTareas = [] as TareaView[], isLoading: isLoadingTareas, error: queryError } = useQuery({
        queryKey: ["team-tareas", currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return []

            try {
                // Get organization_id from user's membership
                const { data: member, error: memberError } = await supabase
                    .from("config_organizacion_miembros")
                    .select("organization_id")
                    .eq("user_id", currentUser.id)
                    .is("eliminado_en", null)
                    .limit(1)
                    .maybeSingle()

                if (memberError) {
                    console.error("[DashTareas1] Error getting member:", memberError)
                }

                if (!member?.organization_id) {
                    console.log("[DashTareas1] No organization_id found for user:", currentUser.id)
                    return []
                }

                console.log("[DashTareas1] Fetching tasks for org:", member.organization_id)

                // Calculate 3 months ago date for filtering completed tasks
                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

                // Query base table directly - v_tareas_org view doesn't expose organizacion_id
                const { data, error } = await supabase
                    .from("tr_tareas")
                    .select("id, titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_id, creado_en, actualizado_en, tags")
                    .eq("organizacion_id", member.organization_id)
                    .is("eliminado_en", null)
                    .order("creado_en", { ascending: false })
                    .limit(1000)

                if (error) {
                    console.error("[DashTareas1] Error fetching tareas:", error)
                    throw error
                }

                console.log("[DashTareas1] Raw tasks fetched:", data?.length || 0)

                // Filter completed tasks older than 3 months in JavaScript
                // (Supabase doesn't support complex OR filters well with dates)
                const filtered = data?.filter(t => {
                    if (t.estado !== "Terminada") return true
                    if (!t.actualizado_en) return true
                    return new Date(t.actualizado_en) >= threeMonthsAgo
                }) || []

                console.log("[DashTareas1] Filtered tasks (3 months):", filtered.length)

                return filtered as TareaView[]
            } catch (err) {
                console.error("[DashTareas1] Query error:", err)
                throw err
            }
        },
        enabled: !!currentUser,
    })

    // Add assignee names using a separate useMemo
    const tareasWithNames = React.useMemo(() => {
        return allTareas.map(t => ({
            ...t,
            asignado_nombre_completo: t.asignado_id ? membersMap.get(t.asignado_id) || null : null
        })) as TareaView[]
    }, [allTareas, membersMap])

    // Log query error
    React.useEffect(() => {
        if (queryError) {
            console.error("[DashTareas1] Query error:", queryError)
        }
    }, [queryError])

    // 2. Data Aggregation & Calculations - Single-pass optimization
    const calculations = React.useMemo(() => {
        if (isLoadingTareas) return null

        console.log("[DashTareas1] Computing calculations for", tareasWithNames.length, "tasks")

        const today = new Date()
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        // Initialize aggregations
        const stats = { total: 0, overdue: 0, inProgress: 0, completedThisWeek: 0 }
        const workloadMap = new Map<string, {
            name: string
            pending: number
            inProgress: number
            completed: number
            total: number
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
        const priorityTimes: Record<string, number[]> = {
            Critica: [],
            Alta: [],
            Media: [],
            Baja: [],
            Urgente: []
        }

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

            // 2. Workload by assignee
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
            const wl = workloadMap.get(name)!
            if (t.estado === "Terminada") {
                wl.completed++
            } else {
                if (t.estado === "En progreso" || t.estado === "En Progreso") {
                    wl.inProgress++
                }
                wl.pending++
                wl.tasks.push(t)
            }
            wl.total = wl.pending + wl.completed

            // 3. Weekly trend
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

            // 4. Resolution time (only completed tasks within 3 months)
            if (t.estado === "Terminada" && t.actualizado_en && isAfter(new Date(t.actualizado_en), threeMonthsAgo)) {
                const days = differenceInHours(new Date(t.actualizado_en), new Date(t.creado_en)) / 24
                resolutionTimes.push(days)
                const priority = t.prioridad || "Media"
                if (priorityTimes[priority]) {
                    priorityTimes[priority].push(days)
                }
            }
        })

        // Process aggregated data
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

        const weeklyTrend = weeklyBuckets
            .sort((a, b) => a.weeksAgo - b.weeksAgo)
            .map(b => ({
                week: b.weeksAgo === 0 ? 'Actual' : `Sem -${b.weeksAgo}`,
                created: b.created,
                completed: b.completed
            }))

        const avgResolutionTime = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0

        const sortedTimes = [...resolutionTimes].sort((a, b) => a - b)
        const medianResolutionTime = sortedTimes.length > 0
            ? sortedTimes[Math.floor(sortedTimes.length / 2)]
            : 0

        const byPriority = Object.entries(priorityTimes)
            .filter(([, times]) => times.length > 0)
            .map(([priority, times]) => ({
                priority,
                days: times.reduce((a, b) => a + b, 0) / times.length
            }))

        const ranking = workload
            .filter(m => m.completed > 0)
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5)
            .map((m, idx) => ({
                rank: idx + 1,
                userId: m.userId,
                name: m.name,
                completed: m.completed,
                streak: Math.floor(m.completed / 2)
            }))

        const result = {
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

        console.log("[DashTareas1] Calculations complete:", {
            stats,
            workloadCount: workload.length,
            rankingCount: ranking.length
        })

        return result
    }, [tareasWithNames, isLoadingTareas])

    // Build available members list from workload (derived from tasks, no separate query needed)
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
                        <DistributionCharts tareas={tareasWithNames} />
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
                availableMembers={availableMembers}
            />
        </PageContent>
    )
}
