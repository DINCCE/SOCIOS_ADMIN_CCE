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
import { Avatar } from "@/components/ui/avatar"
import { DataId } from "@/components/ui/data-id"
import { CopyableCell } from "@/components/ui/copyable-cell"
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

type EstadoTarea = Database['public']['Enums']['estado_tarea_enum']
type PrioridadTarea = Database['public']['Enums']['prioridad_tarea_enum']

const ESTADO_CONFIG: Record<
  EstadoTarea,
  { label: string; className: string; icon: any }
> = {
  pendiente: { label: 'Pendiente', className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100', icon: Clock },
  en_progreso: { label: 'En Progreso', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', icon: AlertCircle },
  bloqueada: { label: 'Bloqueada', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', icon: AlertTriangle },
  hecha: { label: 'Hecha', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', className: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100', icon: XCircle },
}

const PRIORIDAD_CONFIG: Record<
  PrioridadTarea,
  { label: string; className: string; icon: any }
> = {
  critica: {
    label: 'Crítica',
    className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    icon: AlertCircle
  },
  alta: {
    label: 'Alta',
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    icon: AlertTriangle
  },
  media: {
    label: 'Media',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: Clock
  },
  baja: {
    label: 'Baja',
    className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
    icon: Clock
  },
}

export type TareaView = {
  id: string
  titulo: string
  descripcion: string | null
  estado: string
  prioridad: string
  fecha_vencimiento: string | null
  organizacion_id: string
  organizacion_nombre: string
  asignado_a: string | null
  asignado_email: string | null
  oportunidad_id: string | null
  oportunidad_codigo: string | null
  oportunidad_estado: string | null
  relacionado_con_bp: string | null
  relacionado_codigo_bp: string | null
  relacionado_nombre: string | null
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
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <span className="font-medium">{row.getValue('titulo')}</span>
        {row.original.descripcion && (
          <span className="block line-clamp-1">
            {row.original.descripcion}
          </span>
        )}
      </div>
    ),
    meta: { size: 280 },
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="text-left" />,
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoTarea
      const config = ESTADO_CONFIG[estado]
      const EstadoIcon = config.icon
      return (
        <div className="flex justify-start">
          <Badge className={`gap-1 border ${config.className}`}>
            <EstadoIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      )
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'prioridad',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridad" className="text-left" />,
    cell: ({ row }) => {
      const prioridad = row.getValue('prioridad') as PrioridadTarea
      const config = PRIORIDAD_CONFIG[prioridad]
      const PrioridadIcon = config.icon
      return (
        <div className="flex justify-start">
          <Badge className={`gap-1 border ${config.className}`}>
            <PrioridadIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      )
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'asignado_email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Asignado" />,
    cell: ({ row }) => {
      const email = row.original.asignado_email
      return (
        <>
          {email ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <div className="h-full w-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {email.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <CopyableCell value={email} />
            </div>
          ) : (
            <span className="text-foreground text-xs">-</span>
          )}
        </>
      )
    },
    meta: { size: 200 },
  },
  {
    accessorKey: 'fecha_vencimiento',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_vencimiento') as string | null
      return (
        <span>
          {fecha ? new Date(fecha).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) : '-'}
        </span>
      )
    },
    meta: { size: 120 },
  },
  {
    accessorKey: 'relacionado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Relacionado" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.relacionado_codigo_bp && (
          <CopyableCell value={row.original.relacionado_codigo_bp} />
        )}
        {row.original.oportunidad_codigo && (
          <CopyableCell value={row.original.oportunidad_codigo} />
        )}
        {!row.original.relacionado_codigo_bp && !row.original.oportunidad_codigo && (
          <span>-</span>
        )}
      </div>
    ),
    meta: { size: 160 },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const tarea = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
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
