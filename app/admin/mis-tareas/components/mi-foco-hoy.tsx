"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Target, Plus, Sparkles, CheckCircle, X, RotateCcw } from "lucide-react"
import { TareaView } from "@/features/procesos/tareas/columns"
import { crearTarea, actualizarTarea } from "@/app/actions/tareas"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FocoCompletionCelebration } from "@/components/procesos/tareas/foco-completion-celebration"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const FOCO_TAG = "Foco de hoy"
const MAX_FOCO_TASKS = 5

interface MiFocoHoyProps {
    userId: string
    organizationId: string
    allTasks: TareaView[]
    onTaskClick: (taskId: string) => void
}

export function MiFocoHoy({ userId, organizationId, allTasks, onTaskClick }: MiFocoHoyProps) {
    const queryClient = useQueryClient()
    const today = new Date().toISOString().split('T')[0]

    // Filter tasks: has "Foco de hoy" tag AND due date is today
    const focusTasks = allTasks.filter(t =>
        t.tags?.includes(FOCO_TAG) &&
        t.fecha_vencimiento?.startsWith(today)
    )

    // Sort: pending first, then completed
    const sortedFocusTasks = [...focusTasks].sort((a, b) => {
        const aCompleted = a.estado === "Terminada"
        const bCompleted = b.estado === "Terminada"
        if (aCompleted && !bCompleted) return 1
        if (!aCompleted && bCompleted) return -1
        return 0
    })

    const completedFocusCount = focusTasks.filter(t => t.estado === "Terminada").length
    const progress = focusTasks.length > 0 ? (completedFocusCount / focusTasks.length) * 100 : 0

    // Celebration state
    const [showCelebration, setShowCelebration] = React.useState(false)
    const [previousCompletedCount, setPreviousCompletedCount] = React.useState(0)
    const allCompleted = focusTasks.length > 0 && completedFocusCount === focusTasks.length

    // Trigger celebration when all tasks are just completed
    React.useEffect(() => {
        if (allCompleted && previousCompletedCount < focusTasks.length && focusTasks.length > 0) {
            setShowCelebration(true)
        }
        // Update previous count for next comparison
        setPreviousCompletedCount(completedFocusCount)
    }, [allCompleted, completedFocusCount, focusTasks.length, previousCompletedCount])

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

    const handleRemoveTag = async (taskId: string) => {
        const task = allTasks.find(t => t.id === taskId)
        if (!task) return

        const newTags = (task.tags || []).filter(tag => tag !== FOCO_TAG)
        const result = await actualizarTarea(taskId, {
            tags: newTags
        })
        if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            toast.success("Tarea removida del foco")
        }
    }

    return (
        <>
        <Card className="border border-border bg-muted/30 shadow-sm">
            <CardHeader className="pb-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Target className="h-4 w-4 text-primary" />
                        MI FOCO HOY
                    </CardTitle>
                    {focusTasks.length > 0 && (
                        <div className="text-xs font-medium text-muted-foreground">
                            {completedFocusCount}/{focusTasks.length}
                        </div>
                    )}
                </div>
                {focusTasks.length > 0 && (
                    <Progress value={progress} className="h-1 mt-2" />
                )}
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
                {focusTasks.length === 0 ? (
                    <EmptyFocusState />
                ) : (
                    <div className="space-y-1">
                        {sortedFocusTasks.map((tarea) => (
                            <FocusTaskItem
                                key={tarea.id}
                                tarea={tarea}
                                onToggleComplete={handleToggleComplete}
                                onRemoveTag={handleRemoveTag}
                                onTaskClick={onTaskClick}
                            />
                        ))}
                    </div>
                )}

                {(focusTasks.length === 0 || focusTasks.length < MAX_FOCO_TASKS) && (
                    <div className={cn(
                        "flex justify-center pt-1",
                        focusTasks.length === 0 && "pt-0"
                    )}>
                        <FocoCreateDialog
                            organizationId={organizationId}
                            userId={userId}
                            existingCount={focusTasks.length}
                        />
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Celebration Overlay */}
        <FocoCompletionCelebration
            open={showCelebration}
            onClose={() => setShowCelebration(false)}
            taskCount={focusTasks.length}
        />
    </>
    )
}

function EmptyFocusState() {
    return (
        <div className="flex flex-col items-center justify-center text-center border border-dashed rounded-lg border-muted p-6">
            <Target className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">¿Qué es lo más importante hoy?</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Define tus prioridades del día (máx. 5 tareas)
            </p>
        </div>
    )
}

interface FocusTaskItemProps {
    tarea: TareaView
    onToggleComplete: (taskId: string, isCompleted: boolean) => void
    onRemoveTag: (taskId: string) => void
    onTaskClick: (taskId: string) => void
}

function FocusTaskItem({ tarea, onToggleComplete, onRemoveTag, onTaskClick }: FocusTaskItemProps) {
    const [isHovered, setIsHovered] = React.useState(false)
    const isCompleted = tarea.estado === "Terminada"

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onTaskClick(tarea.id)}
            className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                "bg-background/50 border border-transparent hover:border-border/50",
                isCompleted && "opacity-60"
            )}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                    <p className={cn(
                        "text-sm font-medium truncate leading-tight",
                        isCompleted && "line-through text-muted-foreground"
                    )}>
                        {tarea.titulo}
                    </p>
                    {tarea.descripcion && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {tarea.descripcion}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {!isCompleted ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleComplete(tarea.id, true)
                        }}
                        className={cn(
                            "h-7 px-2 text-xs font-medium gap-1 transition-opacity shrink-0",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <CheckCircle className="h-3.5 w-3.5 text-status-positive" />
                        Completar
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleComplete(tarea.id, false)
                        }}
                        className={cn(
                            "h-7 px-2 text-xs font-medium gap-1 transition-opacity shrink-0",
                            isHovered ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Deshacer
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-7 w-7 transition-all shrink-0",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemoveTag(tarea.id)
                    }}
                >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </div>
        </div>
    )
}

interface FocoCreateDialogProps {
    organizationId: string
    userId: string
    existingCount: number
}

function FocoCreateDialog({ organizationId, userId, existingCount }: FocoCreateDialogProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Create 5 input states
    const [tasks, setTasks] = React.useState(["", "", "", "", ""])

    const remainingSlots = MAX_FOCO_TASKS - existingCount
    const visibleInputs = Math.min(5, remainingSlots)

    const handleTaskChange = (index: number, value: string) => {
        setTasks(prev => {
            const newTasks = [...prev]
            newTasks[index] = value
            return newTasks
        })
    }

    const handleCreateTasks = async () => {
        // Filter out empty tasks
        const validTasks = tasks.filter(t => t.trim().length > 0)

        if (validTasks.length === 0) {
            toast.error("Escribe al menos una tarea")
            return
        }

        const today = new Date().toISOString().split('T')[0]

        setIsSubmitting(true)
        try {
            // Create each task
            for (const titulo of validTasks) {
                const result = await crearTarea({
                    organizacion_id: organizationId,
                    titulo,
                    prioridad: "alta",
                    asignado_a: userId,
                    fecha_vencimiento: today,
                    tags: [FOCO_TAG]
                })

                if (!result.success) {
                    console.error("Error creando tarea:", result.message)
                    toast.error(result.message || "Error al crear tarea")
                    setIsSubmitting(false)
                    return
                }
            }

            queryClient.invalidateQueries({ queryKey: ["mis-tareas"] })
            toast.success(`${validTasks.length} ${validTasks.length === 1 ? 'tarea creada' : 'tareas creadas'}`)
            setOpen(false)
            setTasks(["", "", "", "", ""])
        } catch (error) {
            console.error("Error al crear tareas:", error)
            toast.error("Error al crear tareas")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        // If Enter is pressed and not empty, move to next input
        if (e.key === "Enter" && tasks[index].trim().length > 0) {
            e.preventDefault()
            const nextInput = document.getElementById(`foco-input-${index + 1}`)
            if (nextInput) {
                nextInput.focus()
            } else {
                handleCreateTasks()
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {existingCount === 0 ? "Crear foco de hoy" : "Agregar tarea"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Mi Foco de Hoy
                    </DialogTitle>
                    <DialogDescription>
                        Define tus prioridades del día. Estas tareas se marcarán con prioridad alta y vencimiento hoy.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    {Array.from({ length: visibleInputs }).map((_, index) => (
                        <div key={index} className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Tarea {index + 1}
                            </label>
                            <Input
                                id={`foco-input-${index}`}
                                placeholder={`Escribe tu ${index === 0 ? 'primera' : index === 1 ? 'segunda' : index === 2 ? 'tercera' : `${index + 1}ª`} prioridad...`}
                                value={tasks[index]}
                                onChange={(e) => handleTaskChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                disabled={isSubmitting}
                                autoFocus={index === 0}
                                className="text-sm"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>
                        {remainingSlots === MAX_FOCO_TASKS
                            ? `Puedes agregar hasta ${MAX_FOCO_TASKS} tareas`
                            : `${remainingSlots} tarea${remainingSlots === 1 ? '' : 's'} restante${remainingSlots === 1 ? '' : 's'}`
                        }
                    </span>
                    <span className="flex items-center gap-1">
                        <Badge variant="metadata-outline" dotClassName="bg-status-negative" showDot className="gap-1.5 text-xs font-normal">
                            Alta
                        </Badge>
                        <span>prioridad</span>
                    </span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleCreateTasks}
                        disabled={isSubmitting || tasks.every(t => t.trim().length === 0)}
                    >
                        {isSubmitting ? "Creando..." : "Crear tareas"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
