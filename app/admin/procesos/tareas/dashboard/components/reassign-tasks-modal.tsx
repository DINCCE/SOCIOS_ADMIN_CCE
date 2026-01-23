"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { reasignarTareasMasivo } from "@/app/actions/tareas"
import { useNotify } from "@/lib/hooks/use-notify"
import { useQueryClient } from "@tanstack/react-query"
import { TareaView } from "@/features/procesos/tareas/columns"
import { Loader2 } from "lucide-react"

interface ReassignTasksModalProps {
    open: boolean
    onClose: () => void
    fromMember: {
        userId: string
        name: string
        tasks: TareaView[]
    } | null
    availableMembers: Array<{
        user_id: string
        nombre_completo: string
        avatar?: string
    }>
}

export function ReassignTasksModal({ open, onClose, fromMember, availableMembers }: ReassignTasksModalProps) {
    const [selectedTasks, setSelectedTasks] = React.useState<Set<string>>(new Set())
    const [newAssigneeId, setNewAssigneeId] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const { notifySuccess, notifyError } = useNotify()
    const queryClient = useQueryClient()

    // Reset selection when modal opens/changes member
    React.useEffect(() => {
        if (open && fromMember) {
            setSelectedTasks(new Set(fromMember.tasks.map(t => t.id)))
            setNewAssigneeId("")
        }
    }, [open, fromMember])

    const toggleTask = (taskId: string) => {
        const newSet = new Set(selectedTasks)
        if (newSet.has(taskId)) {
            newSet.delete(taskId)
        } else {
            newSet.add(taskId)
        }
        setSelectedTasks(newSet)
    }

    const toggleAll = () => {
        if (!fromMember) return
        if (selectedTasks.size === fromMember.tasks.length) {
            setSelectedTasks(new Set())
        } else {
            setSelectedTasks(new Set(fromMember.tasks.map(t => t.id)))
        }
    }

    const handleConfirm = async () => {
        if (!newAssigneeId || selectedTasks.size === 0) return

        setIsSubmitting(true)
        try {
            const result = await reasignarTareasMasivo(
                Array.from(selectedTasks),
                newAssigneeId
            )

            if (result.success) {
                notifySuccess({
                    title: "Tareas reasignadas",
                    description: `Se han reasignado ${result.count} tareas correctamente.`
                })
                await queryClient.invalidateQueries({ queryKey: ["team-tareas"] })
                onClose()
            } else {
                notifyError({
                    title: "Error al reasignar",
                    description: result.message
                })
            }
        } catch (error) {
            notifyError({
                title: "Error inesperado",
                description: "Intente nuevamente en unos momentos."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!fromMember) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Redistribuir Carga</DialogTitle>
                    <DialogDescription>
                        Selecciona las tareas de <strong>{fromMember.name}</strong> que deseas reasignar.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Tareas ({fromMember.tasks.length})</h4>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={toggleAll}>
                                {selectedTasks.size === fromMember.tasks.length ? "Desmarcar todas" : "Seleccionar todas"}
                            </Button>
                        </div>

                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            <div className="space-y-2">
                                {fromMember.tasks.map((tarea) => (
                                    <div key={tarea.id} className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                        <Checkbox
                                            id={tarea.id}
                                            checked={selectedTasks.has(tarea.id)}
                                            onCheckedChange={() => toggleTask(tarea.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={tarea.id}
                                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {tarea.titulo}
                                            </label>
                                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                {tarea.prioridad} • {tarea.estado}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Reasignar a</h4>
                        <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un miembro..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMembers
                                    .filter(m => m.user_id !== fromMember.userId)
                                    .map((member) => (
                                        <SelectItem key={member.user_id} value={member.user_id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback className="text-[8px]">
                                                        {member.nombre_completo.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{member.nombre_completo}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!newAssigneeId || selectedTasks.size === 0 || isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Reasignación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
