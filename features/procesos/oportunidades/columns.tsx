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
import type { TrDocComercialEstados } from "@/lib/db-types"

const ESTADO_CONFIG: Record<
  TrDocComercialEstados,
  { label: string; dotClassName: string }
> = {
  'Nueva': { label: 'Nueva', dotClassName: 'bg-status-neutral' },
  'En Progreso': { label: 'En Progreso', dotClassName: 'bg-status-warning' },
  'Ganada': { label: 'Ganada', dotClassName: 'bg-status-positive' },
  'Pérdida': { label: 'Pérdida', dotClassName: 'bg-status-negative' },
  'Descartada': { label: 'Descartada', dotClassName: 'bg-status-negative' },
}

export type DocumentoComercialView = {
  // === Campos de v_doc_comercial_org ===
  id: string
  codigo: string
  titulo: string
  tipo: 'oportunidad' | 'oferta' | 'pedido_venta' | 'reserva'
  sub_tipo: 'sol_ingreso' | 'sol_retiro' | 'oferta_eventos' | 'pedido_eventos' | null
  estado: 'Nueva' | 'En Progreso' | 'Ganada' | 'Pérdida' | 'Descartada'
  organizacion_id: string
  solicitante_id: string | null
  solicitante_codigo: string | null
  solicitante_tipo_actor: 'persona' | 'empresa' | null
  solicitante_primer_nombre: string | null
  solicitante_primer_apellido: string | null
  solicitante_numero_documento: string | null
  solicitante_razon_social: string | null
  solicitante_nit: string | null
  responsable_id: string | null
  pagador_id: string | null
  pagador_codigo: string | null
  pagador_tipo_actor: 'persona' | 'empresa' | null
  pagador_primer_nombre: string | null
  pagador_primer_apellido: string | null
  pagador_num_documento: string | null
  pagador_razon_social: string | null
  pagador_nit: string | null
  monto_estimado: number | null
  valor_neto: number | null
  valor_descuento: number | null
  valor_impuestos: number | null
  valor_total: number | null
  moneda_iso: string | null
  fecha_venc_doc: string | null
  asociado_id: string | null
  asociado_codigo: string | null
  asociado_tipo: string | null
  asociado_codigo_bp: string | null
  asociado_primer_nombre: string | null
  asociado_primer_apellido: string | null
  documento_origen_id: string | null
  documento_origen_codigo: string | null
  notas: string | null
  atributos: Record<string, unknown> | null
  items: Record<string, unknown> | null
  tags: string[]
  creado_en: string
  actualizado_en: string
  eliminado_en: string | null

  // === Campos computados para compatibilidad ===
  solicitante_nombre: string
  solicitante_codigo_bp: string
  pagador_nombre: string | null
  pagador_codigo_bp: string | null
}

export const columns: ColumnDef<DocumentoComercialView>[] = [
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
    cell: ({ row }) => (
      <CopyableCell
        value={row.getValue('codigo')}
        label={formatDocumentId(row.getValue('codigo'))}
      />
    ),
    meta: { size: 140 },
  },
  {
    accessorKey: 'titulo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" className="text-left" />,
    cell: ({ row }) => {
      const titulo = row.getValue('titulo') as string
      return <span className="truncate max-w-[300px] block" title={titulo}>{titulo || '-'}</span>
    },
    meta: { size: 200 },
  },
  {
    accessorKey: 'tipo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" className="text-left" />,
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as string
      return (
        <Badge variant="metadata-outline">
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
      const estado = row.getValue('estado') as TrDocComercialEstados
      const config = ESTADO_CONFIG[estado] || { label: estado, dotClassName: 'bg-status-neutral' }
      return (
        <div className="flex justify-start">
          <Badge variant="metadata-outline" dotClassName={config.dotClassName} showDot>
            {config.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'creado_en',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" className="text-left" />,
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('creado_en'))
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
