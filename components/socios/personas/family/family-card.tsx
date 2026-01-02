"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    Cake,
    CreditCard,
    ExternalLink,
    MoreHorizontal,
    Phone,
    UserMinus,
    UserPen
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface FamilyMember {
    id: string
    person_id: string
    name: string
    relation: string
    // Extended fields
    estado?: string
    tipo_documento?: string
    numero_documento?: string
    edad?: string
    email?: string
    celular?: string

    es_beneficiario?: boolean
    es_acudiente?: boolean
    es_emergencia?: boolean
    foto_url?: string | null
}

interface FamilyCardProps {
    member: FamilyMember
    onEdit: (id: string) => void
    onRemove: (id: string) => void
}

export function FamilyCard({ member, onEdit, onRemove }: FamilyCardProps) {
    const isActive = member.estado === 'activo' || !member.estado // Default to active if unknown for now

    return (
        <Card className="overflow-hidden bg-card hover:bg-muted/30 transition-all border-dashed hover:border-solid group">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* AVATAR + STATUS */}
                    <div className="relative">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={member.foto_url || undefined} />
                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                            isActive ? "bg-emerald-500" : "bg-muted-foreground"
                        )} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* HEADER: NAME + RELATION */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex flex-col min-w-0">
                                <Link
                                    href={`/admin/socios/personas/${member.person_id}`}
                                    className="font-semibold truncate hover:underline decoration-primary underline-offset-4"
                                >
                                    {member.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal h-5 border-transparent bg-secondary/50 text-secondary-foreground hover:bg-secondary/70">
                                        {member.relation}
                                    </Badge>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <Link href={`/admin/socios/personas/${member.person_id}`}>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(member.id)}>
                                            <UserPen className="mr-2 h-4 w-4" />
                                            Editar relación
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onRemove(member.id)} className="text-destructive focus:text-destructive">
                                            <UserMinus className="mr-2 h-4 w-4" />
                                            Desvincular
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* BODY: METADATA GRID */}
                        <div className="grid grid-cols-2 gap-y-1 gap-x-4 mt-3">
                            {member.numero_documento && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                    <CreditCard className="h-3 w-3 shrink-0 opacity-70" />
                                    <span className="truncate">
                                        {member.tipo_documento} {member.numero_documento}
                                    </span>
                                </div>
                            )}

                            {member.edad && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                    <Cake className="h-3 w-3 shrink-0 opacity-70" />
                                    <span>{member.edad}</span>
                                </div>
                            )}

                            {(member.celular || member.email) && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate col-span-2">
                                    <Phone className="h-3 w-3 shrink-0 opacity-70" />
                                    <span className="truncate">
                                        {member.celular || member.email}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
