"use client"

import * as React from "react"
import { Trophy, Flame, TrendingUp, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RankingMember {
    rank: number
    userId: string
    name: string
    completed: number
    streak?: number
    avatar?: string
}

interface ProductivityRankingProps {
    members: RankingMember[]
}

export function ProductivityRanking({ members }: ProductivityRankingProps) {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-4 w-4 text-yellow-500" />
            case 2: return <Trophy className="h-4 w-4 text-slate-400" />
            case 3: return <Trophy className="h-4 w-4 text-amber-600" />
            default: return null
        }
    }

    if (members.length === 0) {
        return (
            <Card className="h-full border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Productividad
                    </CardTitle>
                </CardHeader>
                <CardContent 
                    className="flex flex-col items-center justify-center h-[300px] text-center p-6 relative"
                    style={{
                        backgroundImage: `radial-gradient(hsl(var(--muted-foreground)/0.15) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}
                >
                    <div className="bg-background/80 backdrop-blur-sm p-8 rounded-xl border border-border/50 shadow-sm flex flex-col items-center">
                        <TrendingUp className="h-10 w-10 text-muted-foreground/20 mb-4" />
                        <p className="text-sm font-medium text-foreground">Sin actividad</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[180px]">
                            No hay datos de tareas completadas esta semana.
                        </p>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium" asChild>
                            <a href="/admin/procesos/tareas">Gestionar tareas</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full border-border/50 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Ranking de productividad
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {members.map((member) => (
                        <div
                            key={member.userId}
                            className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-muted/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="bg-primary/5 text-primary text-xs">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.rank <= 3 && (
                                        <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                                            {getRankIcon(member.rank)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-none">{member.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {member.completed} tareas completadas
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                {member.streak && member.streak > 0 && (
                                    <Badge variant="outline" className="text-[10px] h-5 bg-orange-500/5 text-orange-600 border-orange-500/20 gap-1">
                                        <Flame className="h-3 w-3 fill-orange-600" />
                                        {member.streak} días racha
                                    </Badge>
                                )}
                                <span className="text-xs font-bold text-muted-foreground">
                                    #{member.rank}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
