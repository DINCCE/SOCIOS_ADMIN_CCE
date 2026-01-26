"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { TareaView } from "@/features/procesos/tareas/columns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, RotateCcw, Calendar, Clock, AlertCircle, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"
import { actualizarTarea } from "@/app/actions/tareas"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface MisTareasListaProps {
    tareas: TareaView[]
    onTaskClick: (id: string) => void
    selectedIds: Set<string>
    onSelectionChange: (id: string, selected: boolean) => void
}

interface CompletedTaskItemProps {
    tarea: TareaView
    onUncomplete: (taskId: string) => void
    onTaskClick: (id: string) => void
}

export function MisTareasLista({ tareas, onTaskClick, selectedIds, onSelectionChange }: MisTareasListaProps) {
    const queryClient = useQueryClient()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Focus tag constant
    const FOCO_TAG = "Foco de hoy"

    // Grouping logic - EXCLUDE focus tasks, Terminada and Cancelada
    const isPendingTask = (t: TareaView) => t.estado !== "Terminada" && t.estado !== "Cancelada"

    const groups = {
        vencidas: tareas.filter(t => isPendingTask(t) && !t.tags?.includes(FOCO_TAG) && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < today),
        hoy: tareas.filter(t => isPendingTask(t) && !t.tags?.includes(FOCO_TAG) && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= today && new Date(t.fecha_vencimiento) < tomorrow),
        manana: tareas.filter(t => isPendingTask(t) && !t.tags?.includes(FOCO_TAG) && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= tomorrow && new Date(t.fecha_vencimiento) < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)),
        proximas: tareas.filter(t => isPendingTask(t) && !t.tags?.includes(FOCO_TAG) && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) && new Date(t.fecha_vencimiento) < nextWeek),
        sinFecha: tareas.filter(t => isPendingTask(t) && !t.tags?.includes(FOCO_TAG) && !t.fecha_vencimiento),
    }

    const handleToggleSelection = (tareaId: string, checked: boolean | string) => {
        onSelectionChange(tareaId, checked === true)
    }

    const handleCompleteTask = async (taskId: string) => {
        const result = await actualizarTarea(taskId, {
            estado: "Terminada"
        })
        if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            toast.success("Tarea completada", {
                action: {
                    label: "Deshacer",
                    onClick: () => handleUncompleteTask(taskId)
                }
            })
        } else {
            toast.error("Error al completar tarea")
        }
    }

    const handleUncompleteTask = async (taskId: string) => {
        const result = await actualizarTarea(taskId, {
            estado: "Pendiente"
        })
        if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            toast.success("Tarea restaurada")
        } else {
            toast.error("Error al restaurar tarea")
        }
    }

    const getPriorityConfig = (prioridad: string) => {
        const config: Record<string, string> = {
            "Urgente": "bg-status-negative",
            "Alta": "bg-status-negative",
            "Media": "bg-status-warning",
            "Baja": "bg-status-neutral"
        }
        return config[prioridad] || "bg-status-neutral"
    }

    const renderGroup = (title: string, taskGroup: TareaView[], color: string, icon: LucideIcon) => {
        if (taskGroup.length === 0) return null
        const Icon = icon

        return (
            <div className="mb-8">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <Icon className={cn("h-4 w-4", color)} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 text-[9px]">{taskGroup.length}</Badge>
                </div>
                <div className="rounded-lg border bg-card overflow-hidden">
                    {taskGroup.map((tarea, index) => (
                        <div
                            key={tarea.id}
                            className={cn(
                                "group flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
                                index < taskGroup.length - 1 && "border-b border-border/40"
                            )}
                            onClick={() => onTaskClick(tarea.id)}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                    <Checkbox
                                        checked={selectedIds.has(tarea.id)}
                                        onCheckedChange={(checked) => handleToggleSelection(tarea.id, checked)}
                                        className="h-4 w-4"
                                        aria-label="Seleccionar tarea"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{tarea.titulo}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge
                                            variant="metadata-outline"
                                            dotClassName={getPriorityConfig(tarea.prioridad)}
                                            showDot
                                            className="text-[9px] h-4 px-1.5 py-0 gap-1 font-normal"
                                        >
                                            {tarea.prioridad}
                                        </Badge>
                                        {tarea.fecha_vencimiento && (
                                            <span className={cn(
                                                "text-[9px] font-medium",
                                                new Date(tarea.fecha_vencimiento) < today ? "text-destructive" : "text-muted-foreground"
                                            )}>
                                                {new Date(tarea.fecha_vencimiento).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleCompleteTask(tarea.id)
                                }}
                                className="h-7 px-2 text-xs font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                Terminar
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    function CompletedTaskItem({ tarea, onUncomplete, onTaskClick }: CompletedTaskItemProps) {
        return (
            <div
                className="group flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onTaskClick(tarea.id)}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate line-through text-muted-foreground">
                            {tarea.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                Completada
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        onUncomplete(tarea.id)
                    }}
                    className="h-7 px-2 text-xs font-medium gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Deshacer
                </Button>
            </div>
        )
    }

    return (
        <div className="pb-10">
            {renderGroup("Vencidas", groups.vencidas, "text-destructive", AlertCircle)}
            {renderGroup("Para Hoy", groups.hoy, "text-orange-500", Clock)}
            {renderGroup("Mañana", groups.manana, "text-blue-500", Calendar)}
            {renderGroup("Próximos 7 días", groups.proximas, "text-muted-foreground", Calendar)}
            {renderGroup("Sin fecha", groups.sinFecha, "text-muted-foreground", ListFilter)}

            {/* Completadas hoy section */}
            {(() => {
                const completedToday = tareas.filter(t => {
                    if (t.estado !== "Terminada") return false
                    const completedDate = new Date(t.actualizado_en || t.creado_en)
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    return completedDate >= todayStart
                })

                if (completedToday.length === 0) return null

                return (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 px-1 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Completadas hoy
                            </h3>
                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 text-[9px]">
                                {completedToday.length}
                            </Badge>
                        </div>
                        <div className="rounded-lg border bg-muted/30 overflow-hidden">
                            {completedToday.map((tarea) => (
                                <CompletedTaskItem
                                    key={tarea.id}
                                    tarea={tarea}
                                    onUncomplete={handleUncompleteTask}
                                    onTaskClick={onTaskClick}
                                />
                            ))}
                        </div>
                    </div>
                )
            })()}

            {(() => {
                const pendingCount = tareas.filter(t => isPendingTask(t)).length
                const completedTodayCount = tareas.filter(t => {
                    if (t.estado !== "Terminada") return false
                    const completedDate = new Date(t.actualizado_en || t.creado_en)
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    return completedDate >= todayStart
                }).length

                // Show empty state only if no pending tasks AND no completed tasks today
                if (pendingCount === 0 && completedTodayCount === 0) {
                    return (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <Clock className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">¡Todo al día!</h3>
                            <p className="text-sm text-muted-foreground">No tienes tareas pendientes por ahora.</p>
                        </div>
                    )
                }
                return null
            })()}
        </div>
    )
}
