"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import { IdentityCell } from "@/components/ui/identity-cell"
import { NullCell } from "@/components/ui/null-cell"
import { FormattedNumber } from "@/components/ui/formatted-number"
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
import { formatRelativeDate, formatShortDate, TABULAR_NUMS } from "@/lib/format"
import { User, UserMinus } from "lucide-react"
import { cn } from "@/lib/utils"

const estadoVariants: Record<string, string> = {
  activo: "status-active",
  inactivo: "status-inactive",
  suspendido: "status-destructive",
  mora: "status-warning",
}

const generoIcons: Record<string, string> = {
  masculino: "♂",
  femenino: "♀",
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
        <IdentityCell
          name={persona.nombre_completo}
          subtitle={persona.email_principal}
          image={persona.foto_url}
          className="min-w-[200px] flex-1"
        />
      )
    },
  },
  {
    accessorKey: "numero_documento",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Documento" className="text-center" />
    ),
    cell: ({ row }) => {
      const tipoDocumento = row.original.tipo_documento
      const numeroDocumento = row.getValue("numero_documento") as string
      return (
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="metadata-outline"
          >
            {tipoDocumento}
          </Badge>
          <FormattedNumber
            value={numeroDocumento}
            type="document"
          />
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
  },
  {
    accessorKey: "telefono_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teléfono" className="text-center" />
    ),
    cell: ({ row }) => (
      <div className="text-center">
        <FormattedNumber value={row.getValue("telefono_principal")} type="phone" />
      </div>
    ),
  },
  // --- Optional Columns (Hidden by default) ---
  {
    accessorKey: "genero",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Género" />
    ),
    cell: ({ row }) => {
      const genero = row.getValue("genero") as string
      if (!genero) return <NullCell />
      const displayGenero = genero.charAt(0).toUpperCase() + genero.slice(1)
      const icon = generoIcons[genero.toLowerCase()]
      return (
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-xs text-slate-600">{displayGenero}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "fecha_nacimiento",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha Nacimiento" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("fecha_nacimiento") as string
      return val ? (
        <span className="tabular-nums text-xs tracking-wide text-slate-600 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatShortDate(val)}
        </span>
      ) : <NullCell />
    },
    enableHiding: true,
  },
  {
    accessorKey: "nacionalidad",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nacionalidad" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("nacionalidad") as string
      return val ? (
        <span className="text-xs text-slate-600">{val}</span>
      ) : <NullCell />
    },
    enableHiding: true,
  },
  {
    accessorKey: "tipo_sangre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RH" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("tipo_sangre") as string
      return val ? (
        <span className="text-xs text-slate-600">{val}</span>
      ) : <NullCell />
    },
    enableHiding: true,
  },
  {
    accessorKey: "eps",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="EPS" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("eps") as string
      return val ? (
        <span className="text-xs text-slate-600">{val}</span>
      ) : <NullCell />
    },
    enableHiding: true,
  },
  {
    accessorKey: "ocupacion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ocupación" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("ocupacion") as string
      return val ? (
        <span className="text-xs text-slate-600">{val}</span>
      ) : <NullCell />
    },
    enableHiding: true,
  },
  {
    accessorKey: "fecha_socio",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha Socio" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("fecha_socio") as string
      return val ? (
        <span className="tabular-nums text-xs tracking-wide text-slate-600 whitespace-nowrap">
          {formatShortDate(val)}
        </span>
      ) : <NullCell />
    },
    enableHiding: true,
  },
  {
    accessorKey: "estado_vital",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("estado_vital") as string
      if (val?.toLowerCase() === "fallecido") {
        return (
          <div className="flex justify-center" title="Fallecido">
            <span className="text-lg opacity-60">⚰️</span>
          </div>
        )
      }
      return null
    },
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
      <DataTableColumnHeader column={column} title="Estado" className="text-center" />
    ),
    cell: ({ row }) => {
      const estado = (row.getValue("estado") as string)?.toLowerCase()
      // "Activo" is neutral secondary in SaaS 2025
      const variant = (estadoVariants[estado] || "status-neutral") as "status-active" | "status-inactive" | "status-destructive" | "status-warning" | "status-neutral"
      return (
        <div className="flex justify-center">
          <Badge
            variant={variant}
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
