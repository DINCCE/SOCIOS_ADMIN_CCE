"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import { IdentityCell } from "@/components/ui/identity-cell"
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
import { formatCurrency, formatDocumentId } from "@/lib/utils"

type EstadoOportunidad = 'abierta' | 'en_proceso' | 'ganada' | 'perdida' | 'cancelada'

const ESTADO_CONFIG: Record<
  EstadoOportunidad,
  { label: string; className: string }
> = {
  abierta: { label: 'Abierta', className: 'text-blue-700 border-blue-200' },
  en_proceso: { label: 'En Proceso', className: 'text-amber-700 border-amber-200' },
  ganada: { label: 'Ganada', className: 'text-emerald-700 border-emerald-200' },
  perdida: { label: 'Perdida', className: 'text-rose-700 border-rose-200' },
  cancelada: { label: 'Cancelada', className: 'text-slate-600 border-slate-200' },
}

export type OportunidadView = {
  id: string
  codigo: string
  tipo: string
  estado: string
  fecha_solicitud: string
  monto_estimado: number | null
  notas: string | null
  tags: string[]
  organizacion_id: string
  organizacion_nombre: string
  solicitante_id: string
  solicitante_codigo_bp: string
  solicitante_nombre: string
  responsable_id: string | null
  responsable_email: string | null
  creado_en: string
  eliminado_en: string | null
}

export const columns: ColumnDef<OportunidadView>[] = [
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
    accessorKey: 'solicitante_nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitante" />,
    cell: ({ row }) => {
      const nombre = row.getValue('solicitante_nombre') as string
      const codigo = row.original.solicitante_codigo_bp
      return (
        <IdentityCell
          name={nombre}
          subtitle={codigo}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 220, minSize: 200 },
  },
  {
    accessorKey: 'codigo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="# Solicitud" className="text-left" />,
    cell: ({ row }) => <span>{formatDocumentId(row.getValue('codigo'))}</span>,
    meta: { size: 140 },
  },
  {
    accessorKey: 'tipo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" className="text-left" />,
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as string
      return (
        <Badge variant="metadata-outline" className="border px-2 py-0.5 text-foreground">
          {tipo}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { size: 120 },
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="text-left" />,
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoOportunidad
      const config = ESTADO_CONFIG[estado]
      return (
        <div className="flex justify-start">
          <Badge variant="metadata-outline" className={config.className}>{config.label}</Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'fecha_solicitud',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" className="text-left" />,
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('fecha_solicitud'))
      return <span>{fecha.toLocaleDateString('es-CO')}</span>
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'monto_estimado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" className="text-left" />,
    cell: ({ row }) => {
      const monto = row.getValue('monto_estimado') as number | null
      return <span>{monto ? formatCurrency(monto) : '-'}</span>
    },
    meta: { size: 120 },
  },
  {
    accessorKey: 'tags',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Etiquetas" />
    ),
    cell: ({ row }) => {
      const tags = (row.getValue("tags") as string[]) || []
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge key={tag} variant="metadata-outline" className="text-foreground">
                {tag}
              </Badge>
            ))
          ) : null}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const rowTags = row.getValue(id) as string[]
      return value.some((tag: string) => rowTags.includes(tag))
    },
    meta: {
      size: 130,
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const oportunidad = row.original
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
                navigator.clipboard.writeText(oportunidad.id)
              }}
            >
              Copiar ID: <DataId className="ml-1">{oportunidad.id.substring(0, 8)}...</DataId>
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
