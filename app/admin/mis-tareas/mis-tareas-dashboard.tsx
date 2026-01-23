"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PageShell } from "@/components/shell/page-shell"
import { PageContent } from "@/components/shell/page-content"
import { Button } from "@/components/ui/button"
import { Plus, ListFilter } from "lucide-react"
import Link from "next/link"
import { NewTareaSheet } from "@/components/procesos/tareas/new-tarea-sheet"
import { TareaDetailSheet } from "@/components/procesos/tareas/tarea-detail-sheet"
import { TareaView } from "@/features/procesos/tareas/columns"

// Skeletal components (to be implemented)
import { MiFocoHoy } from "./components/mi-foco-hoy"
import { PersonalStats } from "./components/personal-stats"
import { MisTareasLista } from "./components/mis-tareas-lista"
import { MiSemanaCard } from "./components/mi-semana-card"
import { MiProductividadCard } from "./components/mi-productividad-card"

export function MisTareasDashboard() {
    const queryClient = useQueryClient()
    const [selectedTareaId, setSelectedTareaId] = React.useState<string | null>(null)
    const [isDetailOpen, setIsDetailOpen] = React.useState(false)

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
                                {getGreeting()}, {user.email?.split('@')[0]} 👋
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Tienes {pendingCount} {pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'} para hoy.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/admin/procesos/tareas">Ver todas</Link>
                            </Button>
                            <NewTareaSheet />
                        </div>
                    </div>

                    {/* Hero Section: Mi Foco Hoy */}
                    <section>
                        <MiFocoHoy
                            userId={user.id}
                            organizationId={misTareas[0]?.organizacion_id || ""}
                            allTasks={misTareas}
                        />
                    </section>

                    {/* Quick Stats */}
                    <section>
                        <PersonalStats tareas={misTareas} />
                    </section>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Task List (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">📋 Mis Tareas Pendientes</h2>
                                <Button variant="ghost" size="sm" className="gap-1">
                                    <ListFilter className="h-4 w-4" />
                                    Filtrar
                                </Button>
                            </div>
                            <MisTareasLista
                                tareas={misTareas}
                                onTaskClick={handleTareaClick}
                            />
                        </div>

                        {/* Right: Insights (1/3) */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-medium mb-4">📊 Mi Semana</h3>
                                <MiSemanaCard tareas={misTareas} />
                            </section>
                            <section>
                                <h3 className="text-lg font-medium mb-4">🏆 Mi Productividad</h3>
                                <MiProductividadCard tareas={misTareas} userId={user.id} />
                            </section>
                        </div>
                    </div>
                </div>

                {/* Tarea Detail Sheet */}
                <TareaDetailSheet
                    tareaId={selectedTareaId}
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                    onDeleted={() => queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })}
                    onUpdated={() => queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })}
                />
            </PageContent>
        </PageShell>
    )
}
