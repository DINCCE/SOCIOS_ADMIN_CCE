"use client"

import * as React from "react"
import { Users, AlertCircle, CheckCircle2, UserPlus, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MemberWorkload {
    userId: string
    name: string
    pending: number
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
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'overloaded': return "bg-red-500"
            case 'balanced': return "bg-green-500"
            case 'available': return "bg-blue-500"
            default: return "bg-slate-500"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'overloaded': return "Sobrecargado"
            case 'balanced': return "Balanceado"
            case 'available': return "Con capacidad"
            default: return "Desconocido"
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Carga por Miembro
                </CardTitle>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" /> Sobrecargado
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-500" /> Balanceado
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" /> Con capacidad
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {members.map((member) => {
                        const percentage = Math.min((member.pending / (idealLoad * 1.5)) * 100, 100)

                        return (
                            <div key={member.userId} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold leading-none">{member.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                                                    {member.pending} pendientes
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {member.completed} completadas
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                member.status === 'overloaded' ? "text-red-600" :
                                                    member.status === 'balanced' ? "text-green-600" : "text-blue-600"
                                            )}>
                                                {getStatusText(member.status)}
                                            </p>
                                        </div>
                                        {member.status === 'overloaded' && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1 text-xs border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                            onClick={() => onReassign(member.userId)}
                                                        >
                                                            <UserPlus className="h-3.5 w-3.5" />
                                                            Redistribuir
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Reducir carga de {member.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>

                                <div className="relative pt-1">
                                    <Progress value={percentage} className="h-2" />
                                    <div
                                        className={cn(
                                            "absolute top-1 bottom-1 w-1 rounded-full",
                                            getStatusColor(member.status)
                                        )}
                                        style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
                                    />
                                </div>
                            </div>
                        )
                    })}

                    {members.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No hay miembros asignados a tareas actualmente
                        </div>
                    )}

                    <div className="pt-4 border-t flex items-center justify-between text-[11px] text-muted-foreground italic">
                        <span>Promedio ideal: {idealLoad} tareas pendientes por persona</span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-[11px] text-primary" asChild>
                            <a href="/admin/procesos/tareas">Gestionar tareas manualmente <ArrowRight className="ml-1 h-3 w-3" /></a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
