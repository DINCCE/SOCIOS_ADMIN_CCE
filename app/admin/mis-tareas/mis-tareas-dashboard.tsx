"use client"

import * as React from "react"
import { AnimatePresence } from "framer-motion"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PageShell } from "@/components/shell/page-shell"
import { PageContent } from "@/components/shell/page-content"
import { Button } from "@/components/ui/button"
import { CheckSquare } from "lucide-react"
import Link from "next/link"
import { NewTareaSheet } from "@/components/procesos/tareas/new-tarea-sheet"
import { TareaDetailDialog } from "@/components/procesos/tareas/tarea-detail-dialog"
import { TareaView } from "@/features/procesos/tareas/columns"
import { FloatingActionCapsule } from "@/components/ui/floating-action-capsule"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useNotify } from "@/lib/hooks/use-notify"
import { toggleTagsForTareas, createAndAssignTagForTareas } from "@/app/actions/tags"
import { softDeleteTarea } from "@/app/actions/tareas"

// Skeletal components (to be implemented)
import { MiFocoHoy } from "./components/mi-foco-hoy"
import { PersonalStats } from "./components/personal-stats"
import { MisTareasLista } from "./components/mis-tareas-lista"
import { WeeklyCompletionChart } from "./components/weekly-completion-chart"
import { BalanceChart } from "./components/balance-chart"
import { MisTareasFastFilter, type FilterState } from "./components/mis-tareas-fast-filter"

export function MisTareasDashboard() {
    const queryClient = useQueryClient()
    const { notifySuccess, notifyError } = useNotify()
    const [selectedTareaId, setSelectedTareaId] = React.useState<string | null>(null)
    const [isDetailOpen, setIsDetailOpen] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
    const [filterState, setFilterState] = React.useState<FilterState>({
        search: "",
        soloUrgentes: false,
        soloHoy: false,
        pausadas: false,
        enProgreso: false,
        proximosDias: false,
        terminadas: false,
    })

    // 1. Get current user
    const { data: user } = useQuery({
        queryKey: ["current-user"],
        queryFn: async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
    })

    // 2. Fetch tasks assigned to current user
    const { data: misTareas = [], isLoading: isLoadingTareas } = useQuery({
        queryKey: ["mis-tareas", user?.id],
        queryFn: async () => {
            if (!user) return []
            const supabase = createClient()
            const { data, error } = await supabase
                .from("v_tareas_org")
                .select("*")
                .eq("asignado_id", user.id)
                .order("fecha_vencimiento", { ascending: true })

            if (error) throw error
            return data as TareaView[]
        },
        enabled: !!user,
    })

    // 3. Greeting logic
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Buenos días"
        if (hour < 18) return "Buenas tardes"
        return "Buenas noches"
    }

    const handleTareaClick = (tareaId: string) => {
        setSelectedTareaId(tareaId)
        setIsDetailOpen(true)
    }

    const handleSelectionChange = (id: string, selected: boolean) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev)
            if (selected) {
                newSet.add(id)
            } else {
                newSet.delete(id)
            }
            return newSet
        })
    }

    const handleClearSelection = () => {
        setSelectedIds(new Set())
    }

    const handleToggleTag = async (tag: string, add: boolean) => {
        const selectedIdsArray = Array.from(selectedIds)
        const result = await toggleTagsForTareas(selectedIdsArray, tag, add)
        if (!result.success) {
            console.error('Error toggling tag:', result.message)
        }
        await queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
    }

    const handleCreateTag = async (tag: string) => {
        const selectedIdsArray = Array.from(selectedIds)
        const result = await createAndAssignTagForTareas(selectedIdsArray, tag)
        if (!result.success) {
            console.error('Error creating tag:', result.message)
        }
        await queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
    }

    const handleDelete = async () => {
        const selectedIdsArray = Array.from(selectedIds)
        const selectedCount = selectedIdsArray.length

        try {
            let successCount = 0
            let errorCount = 0

            for (const id of selectedIdsArray) {
                const result = await softDeleteTarea(id)
                if (result.success) {
                    successCount++
                } else {
                    errorCount++
                    console.error('Error deleting tarea:', result.message)
                }
            }

            setSelectedIds(new Set())
            await queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            setShowDeleteConfirm(false)

            if (errorCount === 0) {
                notifySuccess({
                    title: `${successCount} ${successCount === 1 ? 'tarea eliminada' : 'tareas eliminadas'} correctamente`
                })
            } else if (successCount === 0) {
                notifyError({
                    title: 'Error al eliminar',
                    description: `No se pudieron eliminar las tareas.`
                })
            } else {
                notifyError({
                    title: 'Eliminación parcial',
                    description: `${successCount} de ${selectedCount} tareas eliminadas. ${errorCount} errores.`
                })
            }
        } catch (error) {
            console.error('Error in batch delete:', error)
            notifyError({
                title: 'Error al eliminar',
                description: 'Error al eliminar las tareas. Intente nuevamente.'
            })
            setShowDeleteConfirm(false)
        }
    }

    // Get available tags from tasks
    const availableTags = React.useMemo(() => {
        const tagsSet = new Set<string>()
        misTareas.forEach((tarea) => {
            if (tarea.tags) {
                tarea.tags.forEach((tag) => tagsSet.add(tag))
            }
        })
        return Array.from(tagsSet).sort()
    }, [misTareas])

    // Filter tasks based on filter state
    const filteredTareas = React.useMemo(() => {
        let filtered = misTareas

        // Apply search filter
        if (filterState.search) {
            const searchLower = filterState.search.toLowerCase()
            filtered = filtered.filter((tarea) => {
                return (
                    tarea.titulo?.toLowerCase().includes(searchLower) ||
                    tarea.descripcion?.toLowerCase().includes(searchLower)
                )
            })
        }

        // Apply urgent filter (Urgente or Alta)
        if (filterState.soloUrgentes) {
            filtered = filtered.filter((tarea) =>
                tarea.prioridad === "Urgente" || tarea.prioridad === "Alta"
            )
        }

        // Apply today filter
        if (filterState.soloHoy) {
            const today = new Date()
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const todayEnd = new Date(todayStart)
            todayEnd.setDate(todayEnd.getDate() + 1)

            filtered = filtered.filter((tarea) => {
                if (!tarea.fecha_vencimiento) return false
                const vencimiento = new Date(tarea.fecha_vencimiento)
                return vencimiento >= todayStart && vencimiento < todayEnd
            })
        }

        // Apply paused filter
        if (filterState.pausadas) {
            filtered = filtered.filter((tarea) => tarea.estado === "Pausada")
        }

        // Apply in progress filter
        if (filterState.enProgreso) {
            filtered = filtered.filter((tarea) => tarea.estado === "En Progreso")
        }

        // Apply next 7 days filter
        if (filterState.proximosDias) {
            const today = new Date()
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const nextWeek = new Date(todayStart)
            nextWeek.setDate(nextWeek.getDate() + 7)

            filtered = filtered.filter((tarea) => {
                if (!tarea.fecha_vencimiento) return false
                const vencimiento = new Date(tarea.fecha_vencimiento)
                return vencimiento >= todayStart && vencimiento < nextWeek
            })
        }

        // Apply completed filter
        if (filterState.terminadas) {
            filtered = filtered.filter((tarea) => tarea.estado === "Terminada")
        }

        return filtered
    }, [misTareas, filterState])

    // Calculate active filter count
    const activeFilterCount = React.useMemo(() => {
        let count = 0
        if (filterState.search) count++
        if (filterState.soloUrgentes) count++
        if (filterState.soloHoy) count++
        if (filterState.pausadas) count++
        if (filterState.enProgreso) count++
        if (filterState.proximosDias) count++
        if (filterState.terminadas) count++
        return count
    }, [filterState])

    if (!user || isLoadingTareas) {
        return (
            <PageShell>
                <PageContent>
                    <div className="flex items-center justify-center h-[50vh]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                </PageContent>
            </PageShell>
        )
    }

    const pendingCount = misTareas.filter(t => t.estado !== "Terminada").length

    return (
        <PageShell>
            <PageContent>
                <div className="flex flex-col gap-8 max-w-7xl mx-auto py-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {getGreeting()}, {user.email?.split('@')[0]}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Tienes {pendingCount} {pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'} para hoy.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 shadow-sm" asChild>
                                <Link href="/admin/procesos/tareas">Ver todas</Link>
                            </Button>
                            <NewTareaSheet />
                        </div>
                    </div>

                    {/* ZONA 1: HERO - Mi Foco Hoy (Full Width) */}
                    <section className="mb-8">
                        <MiFocoHoy
                            userId={user.id}
                            organizationId={misTareas[0]?.organizacion_id || ""}
                            allTasks={misTareas}
                        />
                    </section>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ZONA 3: Main Content (2/3) */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                    Mis Tareas Pendientes
                                </h2>
                                <MisTareasFastFilter
                                    filterState={filterState}
                                    onFilterChange={setFilterState}
                                    activeFilterCount={activeFilterCount}
                                />
                            </div>
                            <MisTareasLista
                                tareas={filteredTareas}
                                onTaskClick={handleTareaClick}
                                selectedIds={selectedIds}
                                onSelectionChange={handleSelectionChange}
                            />
                        </div>

                        {/* ZONA 2: Sidebar (1/3) */}
                        <div className="space-y-6">
                            {/* Componente A: KPI Grid (Compact 2x2) */}
                            <section>
                                <PersonalStats tareas={misTareas} />
                            </section>

                            {/* Componente B: Rhythm Chart */}
                            <section>
                                <WeeklyCompletionChart tareas={misTareas} />
                            </section>

                            {/* Componente C: Balance Chart */}
                            <section>
                                <BalanceChart tareas={misTareas} />
                            </section>
                        </div>
                    </div>
                </div>

                {/* Tarea Detail Dialog */}
                <TareaDetailDialog
                    tareaId={selectedTareaId}
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                    onDeleted={() => queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })}
                    onUpdated={() => queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })}
                />

                {/* Floating Action Capsule */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <FloatingActionCapsule
                            selectedCount={selectedIds.size}
                            selectedIds={Array.from(selectedIds)}
                            totalCount={filteredTareas.length}
                            availableTags={availableTags}
                            selectedRowsTags={Array.from(selectedIds).map(id => {
                                const tarea = misTareas.find(t => t.id === id)
                                return tarea?.tags || []
                            })}
                            onClearSelection={handleClearSelection}
                            onToggleTag={handleToggleTag}
                            onCreateTag={handleCreateTag}
                            onDelete={() => setShowDeleteConfirm(true)}
                        />
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Eliminar {selectedIds.size} {selectedIds.size === 1 ? 'registro' : 'registros'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción establecerá la marca de soft delete. Los registros ya no aparecerán en la lista pero se conservarán en la base de datos.
                                <br /><br />
                                <strong>¿Está seguro de que desea continuar?</strong>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </PageContent>
        </PageShell>
    )
}
