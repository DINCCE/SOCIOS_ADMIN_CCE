"use client"

import * as React from "react"
import { Users, UserPlus, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
}

interface TeamWorkloadSectionProps {
    members: MemberWorkload[]
    idealLoad: number
    onReassign: (userId: string) => void
}

export function TeamWorkloadSection({ members, idealLoad, onReassign }: TeamWorkloadSectionProps) {
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
                    <div className="ml-2 pl-2 border-l border-border/50 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--chart-4)]" /> Crítico
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {members.map((member) => {
                        const totalPending = member.pending
                        const inProgress = member.inProgress
                        const justPending = totalPending - inProgress
                        
                        const maxVisualScale = idealLoad * 1.5
                        const inProgressPct = Math.min((inProgress / maxVisualScale) * 100, 100)
                        const justPendingPct = Math.min((justPending / maxVisualScale) * 100, 100 - inProgressPct)

                        return (
                            <div key={member.userId} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-7 w-7 border border-border/50">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium leading-none text-foreground">{member.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-semibold text-muted-foreground">
                                                    {totalPending} pendientes ({inProgress} en progreso)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            member.status === 'overloaded' ? "text-[var(--chart-4)]" : "text-muted-foreground/60"
                                        )}>
                                            {getStatusText(member.status)}
                                        </span>
                                        {member.status === 'overloaded' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 gap-1 text-[10px] font-bold border-[var(--chart-4)]/20 hover:bg-[var(--chart-4)]/10 hover:text-[var(--chart-4)]"
                                                onClick={() => onReassign(member.userId)}
                                            >
                                                Redistribuir
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-[var(--chart-1)] transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                        style={{ width: `${inProgressPct}%` }}
                                    />
                                    <div
                                        className="h-full bg-[var(--chart-2)] opacity-50 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                        style={{ width: `${justPendingPct}%` }}
                                    />
                                    {member.status === 'overloaded' && (
                                        <div className="absolute top-0 bottom-0 right-0 w-1 bg-[var(--chart-4)] animate-pulse" />
                                    )}
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
