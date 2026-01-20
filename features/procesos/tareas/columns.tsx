"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontal,
  CheckCircle2,
  ArrowUpDown,
  AlertCircle,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import { CopyableCell } from "@/components/ui/copyable-cell"
import { IdentityCell } from "@/components/ui/identity-cell"
import { ActorCell } from "@/components/ui/actor-cell"
import { UserCell } from "@/components/ui/user-cell"
import { NullCell } from "@/components/ui/null-cell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/features/socios/components/data-table-column-header"
import type { Database } from "@/types_db"
import type { TrTareasEstado, TrTareasPrioridad } from "@/lib/db-types"

type EstadoTarea = TrTareasEstado
type PrioridadTarea = TrTareasPrioridad

const ESTADO_CONFIG: Record<
  EstadoTarea,
  { label: string; dotClassName: string }
> = {
  Pendiente: { label: 'Pendiente', dotClassName: 'bg-status-neutral' },
  'En Progreso': { label: 'En Progreso', dotClassName: 'bg-status-warning' },
  Terminada: { label: 'Terminada', dotClassName: 'bg-status-positive' },
  Pausada: { label: 'Pausada', dotClassName: 'bg-status-negative' },
  Cancelada: { label: 'Cancelada', dotClassName: 'bg-status-negative' },
}

const PRIORIDAD_CONFIG: Record<
  PrioridadTarea,
  { label: string; dotClassName: string }
> = {
  Urgente: {
    label: 'Urgente',
    dotClassName: 'bg-status-negative',
  },
  Alta: {
    label: 'Alta',
    dotClassName: 'bg-status-negative',
  },
  Media: {
    label: 'Media',
    dotClassName: 'bg-status-warning',
  },
  Baja: {
    label: 'Baja',
    dotClassName: 'bg-status-neutral',
  },
}

type VencimientoStatus = 'futuro' | 'proximo' | 'hoy' | 'vencido'

const VENCIMIENTO_CONFIG: Record<VencimientoStatus, { className: string; label: (dias: number) => string }> = {
  futuro: {
    className: 'text-slate-600',
    label: (dias) => `Vence en ${dias} días`,
  },
  proximo: {
    className: 'text-amber-600',
    label: (dias) => (dias === 1 ? 'Vence mañana' : dias === 2 ? 'Vence en 2 días' : 'Vence en 3 días'),
  },
  hoy: {
    className: 'text-orange-600',
    label: (dias) => 'Vence Hoy',
  },
  vencido: {
    className: 'text-rose-600',
    label: (dias) => (dias === 1 ? 'Venció ayer' : `Venció hace ${dias} días`),
  },
}

function getVencimientoInfo(fechaVencimiento: string): { status: VencimientoStatus; dias: number } {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const vencimiento = new Date(fechaVencimiento)
    if (isNaN(vencimiento.getTime())) {
      return { status: 'futuro', dias: 999 }
    }
    vencimiento.setHours(0, 0, 0, 0)

    const diffMs = vencimiento.getTime() - hoy.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'vencido', dias: Math.abs(diffDays) }
    } else if (diffDays === 0) {
      return { status: 'hoy', dias: 0 }
    } else if (diffDays <= 3) {
      return { status: 'proximo', dias: diffDays }
    } else {
      return { status: 'futuro', dias: diffDays }
    }
  } catch (error) {
    return { status: 'futuro', dias: 999 }
  }
}

export type TareaView = {
  id: string
  codigo_tarea: string | null
  titulo: string
  descripcion: string | null
  estado: string
  prioridad: string
  fecha_vencimiento: string | null
  organizacion_id: string
  organizacion_nombre: string
  // Usuario asignado (de config_organizacion_miembros via v_tareas_org)
  asignado_id: string | null
  asignado_nombre_completo: string | null
  asignado_email: string | null
  // Documento comercial relacionado (via v_tareas_org)
  doc_comercial_id: string | null
  doc_comercial_codigo: string | null
  doc_comercial_estado: string | null
  // Actor relacionado (de dm_actores via v_tareas_org)
  actor_relacionado_id: string | null
  actor_relacionado_codigo_bp: string | null
  actor_relacionado_nombre_completo: string | null
  tags: string[] | null
  creado_en: string
  eliminado_en: string | null
}

export const columns: ColumnDef<TareaView>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todas"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
  {
    accessorKey: 'titulo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => {
      const titulo = row.getValue('titulo') as string
      const codigo = row.original.codigo_tarea
      return (
        <div className="flex flex-col min-w-0 space-y-0.5 py-1">
          <span className="truncate font-medium text-sm text-foreground leading-tight">
            {titulo}
          </span>
          <span className="truncate text-xs text-slate-500 leading-tight">
            {codigo || 'Pendiente'}
          </span>
        </div>
      )
    },
    meta: { size: 280 },
  },
  {
    accessorKey: 'prioridad',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridad" className="text-left" />,
    cell: ({ row }) => {
      const prioridad = row.getValue('prioridad') as PrioridadTarea
      const config = PRIORIDAD_CONFIG[prioridad] || { label: prioridad, dotClassName: 'bg-status-neutral' }
      return (
        <Badge variant="metadata-outline" dotClassName={config.dotClassName} showDot>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'fecha_vencimiento',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_vencimiento') as string | null

      if (!fecha) {
        return <span>-</span>
      }

      const fechaFormateada = new Date(fecha).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      const { status, dias } = getVencimientoInfo(fecha)
      const config = VENCIMIENTO_CONFIG[status]

      return (
        <div className="flex flex-col min-w-0 space-y-0.5 py-1">
          <span className="truncate font-medium text-sm text-foreground leading-tight">
            {fechaFormateada}
          </span>
          <span className={`truncate text-xs leading-tight ${config.className}`}>
            {config.label(dias)}
          </span>
        </div>
      )
    },
    meta: { size: 140 },
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="text-left" />,
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoTarea
      const config = ESTADO_CONFIG[estado] || { label: estado, dotClassName: 'bg-status-neutral' }
      return (
        <Badge variant="metadata-outline" dotClassName={config.dotClassName} showDot>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'asignado_nombre_completo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Asignado" />,
    cell: ({ row }) => {
      const nombre = row.original.asignado_nombre_completo
      const email = row.original.asignado_email

      if (!nombre && !email) {
        return <NullCell />
      }

      return (
        <UserCell
          nombre={nombre || 'Sin asignar'}
          email={email || 'no-email@asignado'}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 220 },
  },
  {
    accessorKey: 'doc_comercial_codigo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Oportunidad" />,
    cell: ({ row }) => {
      const codigo = row.original.doc_comercial_codigo
      return codigo ? <CopyableCell value={codigo} /> : <NullCell />
    },
    meta: { size: 130 },
  },
  {
    accessorKey: 'actor_relacionado_codigo_bp',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitante" />,
    cell: ({ row }) => {
      const codigo = row.original.actor_relacionado_codigo_bp
      const nombre = row.original.actor_relacionado_nombre_completo

      if (!codigo) {
        return <NullCell />
      }

      return (
        <ActorCell
          nombre={nombre || codigo}
          codigo={codigo}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 220 },
  },
  {
    accessorKey: 'codigo_tarea',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    cell: ({ row }) => {
      const codigo = row.original.codigo_tarea
      return codigo ? <CopyableCell value={codigo} /> : <span className="text-muted-foreground text-xs">Pendiente</span>
    },
    enableHiding: true,
    meta: { size: 130 },
  },
  {
    accessorKey: 'tags',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Etiquetas" />,
    cell: ({ row }) => {
      const tags = row.original.tags
      if (!tags || tags.length === 0) {
        return <NullCell />
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.some((val: string) => row.original.tags?.includes(val))
    },
    meta: { size: 200 },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const tarea = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 relative after:content-[''] after:absolute after:-inset-2 after:md:hidden">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(tarea.id)
              }}
            >
              Copiar ID: <DataId className="ml-1">{tarea.id.substring(0, 8)}...</DataId>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar como hecha
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Cambiar prioridad
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
]
