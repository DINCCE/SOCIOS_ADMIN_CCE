"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { TareaView } from "@/features/procesos/tareas/columns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, ChevronRight, Clock, AlertCircle, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"
import { actualizarTarea } from "@/app/actions/tareas"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface MisTareasListaProps {
    tareas: TareaView[]
    onTaskClick: (id: string) => void
}

export function MisTareasLista({ tareas, onTaskClick }: MisTareasListaProps) {
    const queryClient = useQueryClient()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Grouping logic
    const groups = {
        vencidas: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < today),
        hoy: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= today && new Date(t.fecha_vencimiento) < tomorrow),
        manana: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= tomorrow && new Date(t.fecha_vencimiento) < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)),
        proximas: tareas.filter(t => t.estado !== "Terminada" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) >= new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) && new Date(t.fecha_vencimiento) < nextWeek),
        sinFecha: tareas.filter(t => t.estado !== "Terminada" && !t.fecha_vencimiento),
    }

    const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
        const result = await actualizarTarea(taskId, {
            estado: isCompleted ? "Terminada" : "Pendiente"
        })
        if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            if (isCompleted) toast.success("Tarea completada")
        } else {
            toast.error("Error al actualizar tarea")
        }
    }

    const getPriorityBadgeStyles = (prioridad: string) => {
        const styles: Record<string, string> = {
            "Urgente": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            "Alta": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            "Media": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            "Baja": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        }
        return styles[prioridad] || "bg-muted text-muted-foreground"
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
                                        checked={tarea.estado === "Terminada"}
                                        onCheckedChange={(checked) => handleToggleComplete(tarea.id, !!checked)}
                                        className="h-4 w-4"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{tarea.titulo}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge className={cn("text-[9px] h-4 px-1.5 py-0 border-0", getPriorityBadgeStyles(tarea.prioridad))}>
                                            {tarea.prioridad}
                                        </Badge>
                                        {tarea.doc_comercial_codigo && (
                                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                                <ChevronRight className="h-3 w-3" />
                                                {tarea.doc_comercial_codigo}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                {tarea.fecha_vencimiento && (
                                    <span className={cn(
                                        "text-[9px] font-medium px-1.5 py-0.5 rounded",
                                        new Date(tarea.fecha_vencimiento) < today ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                                    )}>
                                        {new Date(tarea.fecha_vencimiento).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                    </span>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
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

            {tareas.filter(t => t.estado !== "Terminada").length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">¡Todo al día!</h3>
                    <p className="text-sm text-muted-foreground">No tienes tareas pendientes por ahora.</p>
                </div>
            )}
        </div>
    )
}
