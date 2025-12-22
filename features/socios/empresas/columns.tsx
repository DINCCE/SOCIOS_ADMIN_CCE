"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

const estadoVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  activo: "default",
  inactivo: "secondary",
  suspendido: "destructive",
}

const tipoEmpresaVariants: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  SA: "default",
  SAS: "default",
  LTDA: "secondary",
  UNIPERSONAL: "outline",
  OTRA: "outline",
}

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
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "codigo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("codigo")}</div>
    ),
  },
  {
    accessorKey: "razon_social",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Razón Social" />
    ),
    cell: ({ row }) => {
      const nombreComercial = row.original.nombre_comercial
      return (
        <div className="flex flex-col">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("razon_social")}
          </span>
          {nombreComercial && (
            <span className="text-muted-foreground max-w-[500px] truncate text-xs">
              {nombreComercial}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "nit_completo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="NIT" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("nit_completo")}</div>
    },
  },
  {
    accessorKey: "email_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email_principal") as string | null
      return (
        <div className="max-w-[200px] truncate">
          {email || (
            <span className="text-muted-foreground italic">Sin email</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "telefono_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teléfono" />
    ),
    cell: ({ row }) => {
      const telefono = row.getValue("telefono_principal") as string | null
      return telefono || (
        <span className="text-muted-foreground italic">Sin teléfono</span>
      )
    },
  },
  {
    accessorKey: "tipo_sociedad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const tipoSociedad = row.getValue("tipo_sociedad") as string
      return (
        <Badge variant={tipoEmpresaVariants[tipoSociedad] || "outline"}>
          {tipoSociedad}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      return (
        <Badge variant={estadoVariants[estado] || "outline"}>
          {estado.charAt(0).toUpperCase() + estado.slice(1)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
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
              onClick={() => navigator.clipboard.writeText(empresa.id)}
            >
              Copiar ID
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
  },
]
