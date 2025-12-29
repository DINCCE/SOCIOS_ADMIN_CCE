"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/features/socios/components/data-table-column-header"
import { Persona } from "@/features/socios/types/socios-schema"

const estadoVariants: Record<
  string,
  "status-active" | "status-inactive" | "status-suspended"
> = {
  activo: "status-active",
  inactivo: "status-inactive",
  suspendido: "status-suspended",
}

export const columns: ColumnDef<Persona>[] = [
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
    accessorKey: "nombre_completo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre Completo" />
    ),
    cell: ({ row }) => {
      const persona = row.original
      return (
        <div className="flex space-x-2">
          <Link
            href={`/admin/socios/personas/${persona.id}`}
            className="max-w-[500px] truncate font-medium hover:underline text-primary"
          >
            {row.getValue("nombre_completo")}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: "numero_documento",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Documento" />
    ),
    cell: ({ row }) => {
      const tipoDocumento = row.original.tipo_documento
      const numeroDocumento = row.getValue("numero_documento")
      return (
        <div className="flex flex-col">
          <span className="font-medium">{numeroDocumento as string}</span>
          <span className="text-muted-foreground text-xs">{tipoDocumento}</span>
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
              <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs italic">Sin tags</span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const rowTags = row.getValue(id) as string[]
      return value.some((tag: string) => rowTags.includes(tag))
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
  // --- Optional Columns (Hidden by default) ---
  {
    accessorKey: "genero",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Género" />
    ),
    cell: ({ row }) => <span className="capitalize">{row.getValue("genero")}</span>,
    enableHiding: true,
  },
  {
    accessorKey: "fecha_nacimiento",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha Nacimiento" />
    ),
    cell: ({ row }) => row.getValue("fecha_nacimiento"),
    enableHiding: true,
  },
  {
    accessorKey: "nacionalidad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nacionalidad" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "tipo_sangre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RH" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "eps",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="EPS" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "ocupacion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ocupación" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "fecha_socio",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha Socio" />
    ),
    enableHiding: true,
  },
  {
    accessorKey: "estado_vital",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado Vital" />
    ),
    cell: ({ row }) => <span className="capitalize">{row.getValue("estado_vital")}</span>,
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
      const estado = row.getValue("estado") as string
      return (
        <div className="flex justify-center">
          <Badge
            variant={estadoVariants[estado] || "outline"}
            showDot={true}
            dotAnimation={estado === "activo" ? "pulse" : "none"}
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
      const persona = row.original

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
              onClick={() => navigator.clipboard.writeText(persona.id)}
            >
              Copiar ID: <DataId className="ml-1">{persona.id.substring(0, 8)}...</DataId>
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
