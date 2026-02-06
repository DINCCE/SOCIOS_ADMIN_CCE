"use client"

import * as React from "react"
import { Users, UserPlus, ArrowRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MemberWorkload {
    userId: string
    name: string
    pending: number
    inProgress: number
    completed: number
    avatar?: string
    status: 'overloaded' | 'balanced' | 'available'
    // New props for Flow Health
    oldTasks?: number  // Tasks > 7 days
    oldTasksPercentage?: number
}

interface TeamWorkloadSectionProps {
    members: MemberWorkload[]
    idealLoad: number
    onReassign: (userId: string) => void
    showOldTasks?: boolean  // New prop for Flow Health dashboard
}

export function TeamWorkloadSection({ members, idealLoad, onReassign, showOldTasks = false }: TeamWorkloadSectionProps) {
    const IDEAL_LOAD = idealLoad

    const getStatusText = (status: string) => {
        switch (status) {
            case 'overloaded': return "Sobrecargado"
            case 'balanced': return "Balanceado"
            case 'available': return "Capacidad"
            default: return "S/D"
        }
    }

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Carga por miembro
                </CardTitle>
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-tight text-muted-foreground/70">
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--chart-1)]" /> En progreso
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--chart-2)]" /> Pendiente
                    </div>
                    {showOldTasks && (
                        <div className="ml-2 pl-2 border-l border-border/50 flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" /> +7 días
                        </div>
                    )}
                    <div className={cn("ml-2 pl-2 border-l border-border/50 flex items-center gap-1", !showOldTasks && "md:hidden")}>
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--chart-4)]" /> Crítico
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {members.map((member) => {
                        const totalPending = member.pending
                        const inProgress = member.inProgress
                        const oldTasks = showOldTasks ? (member.oldTasks || 0) : 0
                        const oldTasksPercentage = showOldTasks ? (member.oldTasksPercentage || 0) : 0
                        const hasOldTasksWarning = showOldTasks && oldTasksPercentage > 30

                        return (
                            <div key={member.userId} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 border border-border/50">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{member.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-semibold",
                                            totalPending > IDEAL_LOAD ? "text-[var(--chart-4)]" : "text-muted-foreground"
                                        )}>
                                            {totalPending}
                                        </span>
                                        {showOldTasks && oldTasks > 0 && (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "h-5 px-1.5 text-[9px] gap-0.5",
                                                    hasOldTasksWarning
                                                        ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                        : "bg-muted/50 text-muted-foreground"
                                                )}
                                            >
                                                {oldTasks} viejas
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Simplified progress bar */}
                                <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            hasOldTasksWarning
                                                ? "bg-orange-500"
                                                : totalPending > IDEAL_LOAD * 1.2
                                                    ? "bg-[var(--chart-4)]"
                                                    : "bg-[var(--chart-1)]"
                                        )}
                                        style={{ width: `${Math.min((totalPending / (IDEAL_LOAD * 2)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {members.length === 0 && (
                    <div 
                        className="text-center py-16 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center relative overflow-hidden"
                        style={{
                            backgroundImage: `radial-gradient(hsl(var(--muted-foreground)/0.15) 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}
                    >
                        <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg flex flex-col items-center">
                            <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="text-sm font-medium text-foreground">Sin asignaciones</p>
                            <p className="text-xs text-muted-foreground mt-1 mb-4">No hay miembros con tareas pendientes.</p>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                                Asignar miembros
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between text-[10px] font-medium text-muted-foreground/60">
                    <span>Promedio ideal: {idealLoad} tareas</span>
                    <a href="/admin/procesos/tareas" className="hover:text-primary transition-colors flex items-center gap-1">
                        Gestionar <ArrowRight className="h-3 w-3" />
                    </a>
                </div>
            </CardContent>
        </Card>
    )
}
