"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import { IdentityCell } from "@/components/ui/identity-cell"
import { UserCell } from "@/components/ui/user-cell"
import { NullCell } from "@/components/ui/null-cell"
import { TitleCell } from "@/components/ui/title-cell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/features/socios/components/data-table-column-header"
import type { TrDocComercialEstados } from "@/lib/db-types"
import { docComercialesTipoOptions, docComercialesSubTipoOptions, docComercialesEstadoOptions } from "@/lib/table-filters"

// Get icon component from filter options
function getIconForValue(value: string, options: typeof docComercialesEstadoOptions) {
  const option = options.find(opt => opt.value === value)
  return option?.icon
}

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
  organizacion_slug: string
  organizacion_nombre: string
  solicitante_id: string | null
  solicitante_codigo_bp: string
  solicitante_nombre_completo: string
  solicitante_tipo_actor: 'persona' | 'empresa' | null
  solicitante_email_principal: string | null
  pagador_id: string | null
  pagador_codigo_bp: string | null
  pagador_nombre_completo: string | null
  pagador_tipo_actor: 'persona' | 'empresa' | null
  pagador_email_principal: string | null
  responsable_id: string | null
  responsable_nombre_completo: string | null
  responsable_email: string | null
  asociado_id: string | null
  asociado_codigo_completo: string | null
  asociado_tipo_vinculo: string | null
  asociado_nombre_completo: string | null
  moneda_iso: string | null
  valor_neto: number | null
  valor_descuento: number | null
  valor_impuestos: number | null
  valor_total: number | null
  monto_estimado: number | null
  fecha_doc: string | null
  fecha_venc_doc: string | null
  notas: string | null
  atributos: Record<string, unknown> | null
  tags: string[]
  items: Record<string, unknown> | null
  documento_origen_id: string | null
  creado_en: string
  creado_por_email: string | null
  creado_por_nombre: string | null
  actualizado_en: string
  actualizado_por_email: string | null
  actualizado_por_nombre: string | null
  eliminado_en: string | null
  eliminado_por_email: string | null
  eliminado_por_nombre: string | null

  // === Campos mapeados para compatibilidad con columnas ===
  solicitante_nombre: string
  pagador_nombre: string | null
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
  // 1. TÍTULO - Primera columna con título + código
  {
    accessorKey: 'titulo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => {
      const titulo = row.getValue('titulo') as string
      const codigo = row.original.codigo
      return (
        <TitleCell
          title={titulo}
          subtitle={codigo}
          className="min-w-[250px] flex-1"
        />
      )
    },
    meta: { size: 280, minSize: 250 },
  },
  // 2. CÓDIGO - Columna oculta independiente para filtrar/ordenar por código
  {
    id: 'codigo_column',
    accessorKey: 'codigo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    cell: ({ row }) => {
      const codigo = row.getValue('codigo') as string
      return <span className="text-sm text-muted-foreground">{codigo}</span>
    },
    enableHiding: true, // Aparece en dropdown pero oculta por defecto
    meta: { size: 120, minSize: 100 },
  },
  // 3. TIPO (FILTRO) - Columna oculta independiente para filtrar por tipo
  {
    id: 'tipo_filter',
    accessorKey: 'tipo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: () => null, // No se visualiza
    filterFn: (row, id, value) => {
      const tipo = row.getValue(id) as string
      return value.includes(tipo)
    },
    enableHiding: true, // Aparece en dropdown pero oculta por defecto
    meta: { size: 0 },
  },
  // 3. SUB_TIPO (FILTRO) - Columna oculta independiente para filtrar por sub_tipo
  {
    id: 'sub_tipo_filter',
    accessorKey: 'sub_tipo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subtipo" />,
    cell: () => null, // No se visualiza
    filterFn: (row, id, value) => {
      const subTipo = row.getValue(id) as string | null
      if (!subTipo) return false
      return value.includes(subTipo)
    },
    enableHiding: true, // Aparece en dropdown pero oculta por defecto
    meta: { size: 0 },
  },
  // 4. TIPO/SUB_TIPO (VISUAL) - Combina tipo + sub_tipo para visualización
  {
    id: 'tipo_visual',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo / Subtipo" />,
    cell: ({ row }) => {
      const tipo = row.original.tipo as string
      const subTipo = row.original.sub_tipo as string | null

      // Obtener configuración del tipo
      const tipoConfig = docComercialesTipoOptions.find(opt => opt.value === tipo)
      const TipoIcon = tipoConfig?.icon

      // Obtener configuración del subtipo
      const subTipoConfig = subTipo
        ? docComercialesSubTipoOptions.find(opt => opt.value === subTipo)
        : null
      const SubTipoIcon = subTipoConfig?.icon

      return (
        <div className="flex flex-col gap-1">
          <Badge variant="metadata-outline" className="w-fit">
            {TipoIcon && <TipoIcon className="mr-1 h-3 w-3" />}
            {tipoConfig?.label || tipo}
          </Badge>
          {subTipo && subTipoConfig && (
            <Badge variant="metadata-outline" className="w-fit">
              {SubTipoIcon && <SubTipoIcon className="mr-1 h-3 w-3" />}
              {subTipoConfig.label}
            </Badge>
          )}
        </div>
      )
    },
    meta: { size: 140, minSize: 120 },
  },
  // 3. ESTADO
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="text-left" />,
    cell: ({ row }) => {
      const estado = row.getValue('estado') as TrDocComercialEstados
      const config = ESTADO_CONFIG[estado] || { label: estado, dotClassName: 'bg-status-neutral' }
      const Icon = getIconForValue(estado, docComercialesEstadoOptions)
      return (
        <div className="flex justify-start">
          <Badge variant="metadata-outline" dotClassName={config.dotClassName} showDot className="gap-1">
            {Icon && <Icon className="h-3 w-3" />}
            {config.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: { size: 110, minSize: 100 },
  },
  // 4. ETIQUETAS
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
      minSize: 100,
    },
  },
  // 5. SOLICITANTE
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
  // 6. RESPONSABLE
  {
    accessorKey: 'responsable_nombre_completo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Responsable" />,
    cell: ({ row }) => {
      const nombre = row.original.responsable_nombre_completo
      const email = row.original.responsable_email

      if (!nombre && !email) {
        return <NullCell />
      }

      return (
        <UserCell
          nombre={nombre || 'Sin responsable'}
          email={email || 'no-email@responsable'}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 220, minSize: 200 },
  },
  // 7. FECHA CREACIÓN
  {
    accessorKey: 'creado_en',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha Creación" className="text-left" />,
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('creado_en'))
      return (
        <span className="text-sm text-muted-foreground">
          {fecha.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      )
    },
    meta: { size: 110, minSize: 100 },
  },
  // Actions column
  {
    id: 'actions',
    cell: ({ row }) => {
      const docComercial = row.original
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
                navigator.clipboard.writeText(docComercial.id)
              }}
            >
              Copiar ID: <DataId className="ml-1">{docComercial.id.substring(0, 8)}...</DataId>
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
