"use client"

import Link from "next/link"
import { ArrowRightLeft, Edit, MoreVertical, Printer, FileDown, AlertTriangle, UserPlus } from "lucide-react"
import { AccionDetail } from "@/features/procesos/acciones/types/acciones-schema"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AccionDetailHeaderProps {
  accion: AccionDetail
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getEstadoColor(estado: string): string {
  switch (estado) {
    case "asignada":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
    case "disponible":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
    case "arrendada":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
    case "bloqueada":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    case "inactiva":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

function getEstadoBgColor(estado: string): string {
  switch (estado) {
    case "asignada":
      return "bg-emerald-500"
    case "disponible":
      return "bg-blue-500"
    case "arrendada":
      return "bg-purple-500"
    case "bloqueada":
      return "bg-red-500"
    case "inactiva":
      return "bg-gray-500"
    default:
      return "bg-gray-500"
  }
}

function getSolvenciaVariant(solvencia: string): "status-active" | "status-warning" | "status-destructive" | "status-neutral" {
  switch (solvencia) {
    case "al_dia":
      return "status-active"
    case "pendiente":
      return "status-warning"
    case "mora_30":
    case "mora_60":
    case "cobro_juridico":
      return "status-destructive"
    default:
      return "status-neutral"
  }
}

function getSolvenciaLabel(solvencia: string): string {
  switch (solvencia) {
    case "al_dia":
      return "Al día"
    case "pendiente":
      return "Pendiente"
    case "mora_30":
      return "Mora 30 días"
    case "mora_60":
      return "Mora 60 días"
    case "cobro_juridico":
      return "Cobro Jurídico"
    default:
      return solvencia
  }
}

export function AccionDetailHeader({ accion }: AccionDetailHeaderProps) {
  const titularInitials = getInitials(accion.titular.nombre_completo)
  const isDisponible = accion.estado === "disponible"

  return (
    <div className="space-y-4">
      {/* Main Identity Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Square icon container with "AC" glyph */}
          <div
            className={`h-16 w-16 rounded-lg border-2 flex items-center justify-center shadow-sm ${getEstadoBgColor(
              accion.estado
            )} text-white font-bold text-xl`}
          >
            AC
          </div>

          {/* Title + Badges */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">
                Acción #{accion.codigo_accion}
              </h1>
              {/* Estado Badge */}
              <Badge
                variant="outline"
                className={`${getEstadoColor(accion.estado)} font-semibold`}
                showDot
              >
                {accion.estado.charAt(0).toUpperCase() + accion.estado.slice(1)}
              </Badge>
              {/* Solvencia Badge */}
              <Badge
                variant={getSolvenciaVariant(accion.solvencia)}
                showDot
              >
                {getSolvenciaLabel(accion.solvencia)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-medium text-muted-foreground/60">Tipo:</span>
              <span className="font-semibold">{accion.tipo}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons - Changed based on estado */}
        <div className="flex items-center gap-2">
          {isDisponible ? (
            <Button variant="default" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Asignar</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transferir</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Carnet
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Suspender Acción
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Propietario (Owner) Slot - Enhanced - Only show if NOT disponible */}
      {!isDisponible && (
        <div className="flex items-center gap-3 pt-2 border-t border-border/40">
          <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider min-w-[80px]">
            Propietario
          </span>
          <Link
            href={`/admin/socios/personas/${accion.titular.id}`}
            className="flex items-center gap-3 hover:bg-accent/50 rounded-lg px-3 py-2 -mx-3 transition-all group"
          >
            <Avatar className="h-8 w-8 border-2 border-border/60 shadow-sm group-hover:border-primary/50 transition-colors">
              <AvatarImage src={accion.titular.avatar_url || undefined} alt={accion.titular.nombre_completo} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {titularInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {accion.titular.nombre_completo}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Ver perfil completo
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
