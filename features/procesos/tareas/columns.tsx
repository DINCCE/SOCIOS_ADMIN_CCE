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
  { label: string; className: string }
> = {
  pendiente: { label: 'Pendiente', className: 'text-slate-700 border-slate-200' },
  en_progreso: { label: 'En Progreso', className: 'text-blue-700 border-blue-200' },
  bloqueada: { label: 'Bloqueada', className: 'text-amber-700 border-amber-200' },
  hecha: { label: 'Hecha', className: 'text-emerald-700 border-emerald-200' },
  cancelada: { label: 'Cancelada', className: 'text-slate-600 border-slate-200' },
}

const PRIORIDAD_CONFIG: Record<
  PrioridadTarea,
  { label: string; className: string }
> = {
  critica: {
    label: 'Crítica',
    className: 'text-rose-700 border-rose-200',
  },
  alta: {
    label: 'Alta',
    className: 'text-orange-700 border-orange-200',
  },
  media: {
    label: 'Media',
    className: 'text-blue-700 border-blue-200',
  },
  baja: {
    label: 'Baja',
    className: 'text-slate-700 border-slate-200',
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
  asignado_a: string | null
  asignado_email: string | null
  asignado_nombre: string | null
  oportunidad_id: string | null
  oportunidad_codigo: string | null
  oportunidad_estado: string | null
  relacionado_con_bp: string | null
  relacionado_codigo_bp: string | null
  relacionado_nombre: string | null
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
      const config = PRIORIDAD_CONFIG[prioridad]
      return (
        <Badge variant="metadata-outline" className={config.className}>
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
      const config = ESTADO_CONFIG[estado]
      return (
        <Badge variant="metadata-outline" className={config.className}>
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
    accessorKey: 'asignado_nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Asignado" />,
    cell: ({ row }) => {
      const nombre = row.original.asignado_nombre
      const email = row.original.asignado_email

      if (!nombre) {
        return <span className="text-muted-foreground text-xs">-</span>
      }

      return (
        <IdentityCell
          name={nombre}
          subtitle={email}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 220 },
  },
  {
    accessorKey: 'oportunidad_codigo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Oportunidad" />,
    cell: ({ row }) => {
      const codigo = row.original.oportunidad_codigo
      return codigo ? <CopyableCell value={codigo} /> : <span>-</span>
    },
    meta: { size: 130 },
  },
  {
    accessorKey: 'relacionado_codigo_bp',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitante" />,
    cell: ({ row }) => {
      const codigo = row.original.relacionado_codigo_bp
      return codigo ? <CopyableCell value={codigo} /> : <span>-</span>
    },
    meta: { size: 130 },
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
        return <span className="text-muted-foreground text-xs">-</span>
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
