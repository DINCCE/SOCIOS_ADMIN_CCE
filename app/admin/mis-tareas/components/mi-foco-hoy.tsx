"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Target, X, Plus, GripVertical } from "lucide-react"
import { TareaView } from "@/features/procesos/tareas/columns"
import { updateUserFocus, getUserFocus } from "@/app/actions/admin/members"
import { actualizarTarea } from "@/app/actions/tareas"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MiFocoHoyProps {
    userId: string
    organizationId: string
    allTasks: TareaView[]
}

export function MiFocoHoy({ userId, organizationId, allTasks }: MiFocoHoyProps) {
    const queryClient = useQueryClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch focus from DB
    const { data: focusData, isLoading } = useQuery({
        queryKey: ["user-focus", userId, organizationId],
        queryFn: () => getUserFocus(userId, organizationId),
    })

    // Mutation to update focus in DB
    const mutation = useMutation({
        mutationFn: (newFocus: { fecha: string; tareas: string[] }) =>
            updateUserFocus(userId, organizationId, newFocus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-focus", userId, organizationId] })
        }
    })

    // Persistence logic: if date is different, we should probably clear or handle it
    const currentFocusIds = (focusData?.success && focusData?.data?.fecha === today)
        ? focusData.data.tareas
        : []

    const focusTasks = allTasks.filter(t => currentFocusIds.includes(t.id))
    const completedFocusCount = focusTasks.filter(t => t.estado === "Terminada").length
    const progress = focusTasks.length > 0 ? (completedFocusCount / focusTasks.length) * 100 : 0

    const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
        const result = await actualizarTarea(taskId, {
            estado: isCompleted ? "Terminada" : "Pendiente"
        })
        if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            if (isCompleted) toast.success("¡Tarea completada! Sigue así.")
        } else {
            toast.error("Error al actualizar tarea")
        }
    }

    const handleRemoveFromFocus = (taskId: string) => {
        const newIds = currentFocusIds.filter((id: string) => id !== taskId)
        mutation.mutate({ fecha: today, tareas: newIds })
    }

    const handleAddToFocus = (taskId: string) => {
        if (currentFocusIds.length >= 3) {
            toast.error("Máximo 3 tareas en el foco diario")
            return
        }
        if (currentFocusIds.includes(taskId)) return

        mutation.mutate({ fecha: today, tareas: [...currentFocusIds, taskId] })
    }

    return (
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Target className="h-5 w-5 text-primary" />
                        MI FOCO HOY
                    </CardTitle>
                    <div className="text-sm font-medium text-muted-foreground">
                        Progreso: {completedFocusCount}/{focusTasks.length} ({Math.round(progress)}%)
                    </div>
                </div>
                <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                {focusTasks.length === 0 ? (
                    <div className="h-[120px] flex flex-col items-center justify-center text-center border border-dashed rounded-lg border-muted">
                        <p className="text-sm text-muted-foreground">No has definido tu foco para hoy.</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Elige hasta 3 tareas clave para concentrarte.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {focusTasks.map((tarea, index) => (
                            <div
                                key={tarea.id}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/40 group transition-all",
                                    index < focusTasks.length - 1 && "border-b border-border/30",
                                    tarea.estado === "Terminada" && "opacity-60 bg-muted/30"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Checkbox
                                        checked={tarea.estado === "Terminada"}
                                        onCheckedChange={(checked) => handleToggleComplete(tarea.id, !!checked)}
                                        className="h-4 w-4 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className={cn(
                                            "text-sm font-medium truncate leading-tight",
                                            tarea.estado === "Terminada" && "line-through text-muted-foreground"
                                        )}>
                                            {tarea.titulo}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] uppercase px-1.5 py-0 h-4 border-0",
                                                tarea.prioridad === "Alta" || tarea.prioridad === "Urgente"
                                                    ? "bg-destructive/10 text-destructive"
                                                    : "bg-muted/60 text-muted-foreground"
                                            )}>
                                                {tarea.prioridad}
                                            </Badge>
                                            {tarea.codigo_tarea && (
                                                <span className="text-[9px] text-muted-foreground">
                                                    {tarea.codigo_tarea}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={() => handleRemoveFromFocus(tarea.id)}
                                >
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {focusTasks.length < 3 && (
                    <div className="flex justify-center pt-2">
                        <Button variant="outline" size="sm" className="rounded-full gap-2 border-dashed">
                            <Plus className="h-4 w-4" />
                            Agregar tarea al foco
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
