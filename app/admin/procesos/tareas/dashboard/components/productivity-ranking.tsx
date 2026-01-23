"use client"

import * as React from "react"
import { Trophy, Flame, TrendingUp, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-muted-foreground" />
                        Productividad
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                    <TrendingUp className="h-12 w-12 opacity-10 mb-4" />
                    Sin datos de actividad esta semana
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Ranking de Productividad
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
