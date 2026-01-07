"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import { IdentityCell } from "@/components/ui/identity-cell"
import { NullCell } from "@/components/ui/null-cell"
import { DataDate } from "@/components/ui/data-date"
import { DataEnum } from "@/components/ui/data-enum"
import { FormattedNumber } from "@/components/ui/formatted-number"
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
import { Empresa } from "@/features/socios/types/socios-schema"
import { formatDocumentId } from "@/lib/utils"

const estadoVariants: Record<string, string> = {
  activo: "bg-status-positive",
  inactivo: "bg-status-neutral",
  suspendido: "bg-status-negative",
  mora: "bg-status-warning",
}

// Variants for tipo_sociedad are now handled by metadata-outline directly

export const columns: ColumnDef<Empresa>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "codigo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <CopyableCell value={row.getValue("codigo")} />
    ),
    meta: {
      size: 100,
    },
  },
  {
    accessorKey: "razon_social",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Razón Social" />
    ),
    cell: ({ row }) => {
      const empresa = row.original
      return (
        <IdentityCell
          name={empresa.razon_social}
          subtitle={empresa.codigo}
        />
      )
    },
    meta: {
      size: 220,
      minSize: 200,
    },
  },
  {
    accessorKey: "nit_completo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="NIT" className="text-left" />
    ),
    cell: ({ row }) => {
      const empresa = row.original
      // Use nit_completo if available, otherwise fall back to nit
      const nitValue = empresa.nit_completo || empresa.nit
      return (
        <CopyableCell
          value={nitValue}
          label={formatDocumentId(nitValue)}
        />
      )
    },
    meta: {
      size: 140,
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Etiquetas" />
    ),
    cell: ({ row }) => {
      const tags = (row.getValue("tags") as string[]) || []
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge key={tag} variant="metadata-outline">
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
    accessorKey: "email_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email_principal") as string | null
      return email ? <CopyableCell value={email} /> : <NullCell />
    },
    meta: {
      size: 240,
    },
  },
  {
    accessorKey: "telefono_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teléfono" className="text-left" />
    ),
    cell: ({ row }) => {
      const telefono = row.getValue("telefono_principal") as string
      return telefono ? (
        <CopyableCell
          value={telefono}
          label={<FormattedNumber value={telefono} type="phone" copyable={false} />}
        />
      ) : <NullCell />
    },
    meta: {
      size: 130,
    },
  },
  {
    accessorKey: "sector_industria",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sector" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("sector_industria") as string
      return val ? <span>{val}</span> : <NullCell />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
    meta: {
      size: 120,
    },
  },
  {
    accessorKey: "tipo_sociedad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("tipo_sociedad") as string
      return val ? (
        <Badge
          variant="metadata-outline"
        >
          <DataEnum value={val} />
        </Badge>
      ) : <NullCell />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      size: 90,
    },
  },
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" className="text-left" />
    ),
    cell: ({ row }) => {
      const estado = (row.getValue("estado") as string)?.toLowerCase()
      const dotClassName = estadoVariants[estado] || "bg-status-neutral"
      return (
        <div className="flex justify-start">
          <Badge
            variant="metadata-outline"
            dotClassName={dotClassName}
            showDot
          >
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      size: 110,
    },
  },
  // --- Optional Columns (Hidden by default) ---
  {
    accessorKey: "nombre_comercial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre Comercial" />
    ),
    enableHiding: true,
    meta: {
      size: 150,
    },
  },
  {
    accessorKey: "tamano_empresa",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tamaño" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("tamano_empresa") as string
      return val ? <span className="capitalize">{val}</span> : <NullCell />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
    meta: {
      size: 100,
    },
  },
  {
    accessorKey: "actividad_economica",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actividad Económica" />
    ),
    enableHiding: true,
    meta: {
      size: 150,
    },
  },
  {
    accessorKey: "nombre_representante_legal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Representante Legal" />
    ),
    enableHiding: true,
    meta: {
      size: 180,
    },
  },
  {
    accessorKey: "cargo_representante",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cargo Repr." />
    ),
    enableHiding: true,
    meta: {
      size: 120,
    },
  },
  {
    accessorKey: "ingresos_anuales",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ingresos Anuales" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("ingresos_anuales") as number
      return <span>{val ? `$${val.toLocaleString()}` : '$0'}</span>
    },
    filterFn: (row, id, value) => {
      const ingresos = row.getValue(id) as number | null
      if (ingresos === null || ingresos === undefined) return false

      // value es un array de strings como "0-500", "500-1000", "10000+"
      return value.some((range: string) => {
        if (range === "10000+") {
          return ingresos >= 10000
        }
        const [min, max] = range.split("-").map(Number)
        return ingresos >= min && ingresos < max
      })
    },
    enableHiding: true,
    meta: {
      size: 120,
    },
  },
  {
    accessorKey: "numero_empleados",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nro. Empleados" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("numero_empleados")
      return val ? <span>{val as string}</span> : <NullCell />
    },
    filterFn: (row, id, value) => {
      const empleados = row.getValue(id) as number | null
      if (empleados === null || empleados === undefined) return false

      // value es un array de strings como "0-10", "11-50", "500+"
      return value.some((range: string) => {
        if (range === "500+") {
          return empleados >= 500
        }
        const [min, max] = range.split("-").map(Number)
        return empleados >= min && empleados <= max
      })
    },
    enableHiding: true,
    meta: {
      size: 100,
    },
  },
  {
    accessorKey: "website",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sitio Web" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("website") as string
      return val ? (
        <span className="truncate max-w-[150px]" title={val}>
          {val}
        </span>
      ) : <NullCell />
    },
    enableHiding: true,
    meta: {
      size: 150,
    },
  },
  {
    accessorKey: "whatsapp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WhatsApp" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("whatsapp") as string
      return val ? (
        <CopyableCell
          value={val}
          label={<FormattedNumber value={val} type="phone" copyable={false} />}
        />
      ) : <NullCell />
    },
    enableHiding: true,
    meta: {
      size: 140,
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const empresa = row.original

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
                navigator.clipboard.writeText(empresa.id)
              }}
            >
              Copiar ID: <DataId className="ml-1">{empresa.id.substring(0, 8)}...</DataId>
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
