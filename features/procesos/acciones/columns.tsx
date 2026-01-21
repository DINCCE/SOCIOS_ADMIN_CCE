"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, User, Building2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CopyableCell } from "@/components/ui/copyable-cell"
import { NullCell } from "@/components/ui/null-cell"
import { ActorCell } from "@/components/ui/actor-cell"
import { ContactCell } from "@/components/ui/contact-cell"
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

  // Acción (renombrado de "Código")
  {
    accessorKey: "codigo_accion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Acción" />
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

  // Propietario (NUEVO)
  {
    accessorKey: "propietario_nombre_completo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Propietario" />
    ),
    cell: ({ row }) => {
      const nombre = row.getValue("propietario_nombre_completo") as string | null
      const codigo = row.original.propietario_codigo_bp
      return (
        <ActorCell
          nombre={nombre || "Sin propietario"}
          codigo={codigo || "-"}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 250 },
  },

  // Tipo Propietario (NUEVO)
  {
    accessorKey: "propietario_tipo_actor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo Propietario" />
    ),
    cell: ({ row }) => {
      const tipo = row.getValue("propietario_tipo_actor") as string | null
      if (!tipo) return <NullCell value="" />

      const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
        persona: "default",
        empresa: "secondary",
      }

      const icons: Record<string, React.ReactNode> = {
        persona: <User className="h-3 w-3" />,
        empresa: <Building2 className="h-3 w-3" />,
      }

      return (
        <Badge variant={variants[tipo] || "outline"}>
          {icons[tipo]}
          <span className="ml-1 capitalize">{tipo}</span>
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: { size: 140 },
  },

  // Plan Comercial (NUEVO)
  {
    accessorKey: "propietario_plan_comercial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan Comercial" />
    ),
    cell: ({ row }) => {
      const plan = row.getValue("propietario_plan_comercial") as string | null
      if (!plan) return <NullCell value="" />

      return (
        <Badge variant="metadata-outline">
          {plan}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: { size: 140 },
  },

  // Contacto (NUEVO)
  {
    accessorKey: "propietario_telefono_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contacto" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue("propietario_telefono_principal") as string | null
      const email = row.original.propietario_email_principal
      return (
        <ContactCell
          phone={phone}
          email={email}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 200 },
  },

  // Desde (NUEVO)
  {
    accessorKey: "propietario_fecha_inicio",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desde" />
    ),
    cell: ({ row }) => {
      const fecha = row.getValue("propietario_fecha_inicio") as string | null
      if (!fecha) return <NullCell value="" />

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
