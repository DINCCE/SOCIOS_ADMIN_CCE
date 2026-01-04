"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, MoreHorizontal, IdCard, Cake, Phone, Mail, Hash } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface FamilyMember {
  id: string
  nombre: string
  relacion: string
  relacion_id: string  // ID of the relationship for editing/unlinking
  codigo_bp: string    // Internal BP ID
  documento: string
  fecha_nacimiento: string
  estado: "activo" | "inactivo"
  foto?: string | null
  celular?: string | null
  email?: string | null
}

interface FamilyCardProps {
  member: FamilyMember
  onViewProfile?: (memberId: string) => void
  onEditRole?: (memberId: string) => void
  onUnlink?: (memberId: string) => void
  className?: string
}

function FamilyCard({
  member,
  onViewProfile,
  onEditRole,
  onUnlink,
  className
}: FamilyCardProps) {
  const router = useRouter()

  const initials = member.nombre
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge(member.fecha_nacimiento)

  const handleViewProfile = (memberId: string) => {
    if (memberId && memberId !== 'undefined') {
      router.push(`/admin/socios/personas/${memberId}`)
    }
  }

  return (
    <Card
      className={cn(
        "p-4 hover:border-primary/50 transition-colors cursor-pointer group",
        className
      )}
      onClick={() => handleViewProfile(member.id)}
    >
      {/* Header Row - Flex */}
      <div className="flex items-start gap-3">
        {/* Avatar with status dot */}
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border-2 border-border/50">
            <AvatarImage src={member.foto || undefined} alt={member.nombre} />
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {member.estado === "activo" && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
          )}
        </div>

        {/* Main Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-foreground hover:underline underline-offset-2 transition-all">
              {member.nombre}
            </h4>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {member.relacion}
            </Badge>
          </div>
        </div>

        {/* Actions - Right Side */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewProfile(member.id)}
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem onClick={() => onEditRole?.(member.id)}>
                Editar Rol
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onUnlink?.(member.id)}
                className="text-destructive focus:text-destructive"
              >
                Desvincular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metadata Row - Grid/Flex */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
          {/* BP Code (ID interno) */}
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">ID Interno</span>
              <span className="text-xs font-medium text-foreground">
                {member.codigo_bp}
              </span>
            </div>
          </div>

          {/* Document */}
          <div className="flex items-center gap-2">
            <IdCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Documento</span>
              <span className="text-xs text-foreground">
                {member.documento || "Sin documento"}
              </span>
            </div>
          </div>

          {/* Age */}
          <div className="flex items-center gap-2">
            <Cake className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Edad</span>
              <span className="text-xs text-foreground">
                {age} años
              </span>
            </div>
          </div>

          {/* Phone */}
          {member.celular && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Teléfono</span>
                <span className="text-xs text-foreground">
                  {member.celular}
                </span>
              </div>
            </div>
          )}

          {/* Email */}
          {member.email && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Correo</span>
                <span className="text-xs text-foreground truncate">
                  {member.email}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export { FamilyCard }
