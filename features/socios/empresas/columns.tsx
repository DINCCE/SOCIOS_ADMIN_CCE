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
  "status-success" | "current-status-muted" | "status-destructive" | "status-inactive" | "status-warning"
> = {
  activo: "status-success",
  inactivo: "status-inactive",
  suspendido: "status-destructive",
  mora: "status-warning",
}

const tipoEmpresaVariants: Record<
  string,
  "type-primary" | "type-secondary" | "type-outline"
> = {
  SA: "type-primary",
  SAS: "type-primary",
  LTDA: "type-secondary",
  UNIPERSONAL: "type-outline",
  OTRA: "type-outline",
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
      <div className="font-medium">
        <DataId>{row.getValue("codigo")}</DataId>
      </div>
    ),
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
          subtitle={empresa.email_principal}
        />
      )
    },
  },
  {
    accessorKey: "nit_completo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="NIT" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          <DataId>{row.getValue("nit_completo")}</DataId>
        </div>
      )
    },
  },
  {
    accessorKey: "email_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email_principal") as string | null
      return email ? (
        <div className="max-w-[200px] truncate tabular-nums text-muted-foreground/80">
          {email}
        </div>
      ) : <NullCell />
    },
  },
  {
    accessorKey: "telefono_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teléfono" />
    ),
    cell: ({ row }) => {
      const telefono = row.getValue("telefono_principal") as string | null
      return telefono ? (
        <span className="tabular-nums text-muted-foreground/80">{telefono}</span>
      ) : <NullCell />
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
          variant="status-neutral"
          className="font-medium"
        >
          <DataEnum value={val} />
        </Badge>
      ) : <NullCell />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // --- Optional Columns (Hidden by default) ---
  {
    accessorKey: "nombre_comercial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre Comercial" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "sector_industria",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sector" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "tamano_empresa",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tamaño" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "actividad_economica",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actividad Económica" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "nombre_representante_legal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Representante Legal" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "cargo_representante",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cargo Repr." />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "ingresos_anuales",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ingresos Anuales" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("ingresos_anuales") as number
      return val ? `$${val.toLocaleString()}` : "$0"
    },
    enableHiding: true,
  },
  {
    accessorKey: "numero_empleados",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nro. Empleados" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "website",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sitio Web" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "whatsapp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WhatsApp" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "organizacion_nombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organización" />
    ),
    enableHiding: true,
  },
  // --- Status Column ---
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const estado = (row.getValue("estado") as string)?.toLowerCase()
      // "Activo" is neutral/subtle in SaaS 2025
      const variant = estado === "activo" ? "status-neutral" : (estadoVariants[estado] as any || "outline")
      return (
        <div className="flex justify-center">
          <Badge
            variant={variant}
            showDot={estado !== "activo"} // Dots only for non-default states
          >
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </Badge>
        </div>
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
  },
]
