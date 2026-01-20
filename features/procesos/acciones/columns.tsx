"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CopyableCell } from "@/components/ui/copyable-cell"
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
import type { AccionList } from "@/features/procesos/acciones/types/acciones-schema"

export const columns: ColumnDef<AccionList>[] = [
  // Checkbox column (required for row selection)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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

  // Código de acción
  {
    accessorKey: "codigo_accion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <CopyableCell value={row.getValue("codigo_accion")} />
    ),
    meta: { size: 100 },
  },

  // Estado
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      return (
        <Badge variant="metadata-outline">
          {estado}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: { size: 110 },
  },

  // Organización
  {
    accessorKey: "organizacion_nombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organización" />
    ),
    cell: ({ row }) => {
      const nombre = row.getValue("organizacion_nombre") as string | null
      return <NullCell value={nombre || ""} />
    },
    meta: { size: 200 },
  },

  // Fecha de creación
  {
    accessorKey: "creado_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creado" />
    ),
    cell: ({ row }) => {
      const fecha = row.getValue("creado_en") as string
      const date = new Date(fecha)
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      )
    },
    meta: { size: 120 },
  },

  // Actions column (dropdown menu)
  {
    id: "actions",
    cell: ({ row }) => {
      const accion = row.original
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(accion.id)}>
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
  },
]
