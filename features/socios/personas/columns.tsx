"use client"

/**
 * Column definitions for Personas table
 *
 * NOTE: Optimized for v_actores_org view which has limited fields.
 * For full persona details, detail pages should query dm_actores directly.
 *
 * Temporarily removed columns (not in v_actores_org):
 * - tipo_documento, fecha_nacimiento, genero, nacionalidad,
 * - tipo_sangre, eps, ocupacion, fecha_socio, estado_vital,
 * - whatsapp, organizacion_nombre
 */

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataId } from "@/components/ui/data-id"
import { IdentityCell } from "@/components/ui/identity-cell"
import { NullCell } from "@/components/ui/null-cell"
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
import type { PersonaList } from "@/features/socios/types/socios-schema"
import { formatShortDate } from "@/lib/format"
import { formatDocumentId } from "@/lib/utils"

const estadoVariants: Record<string, string> = {
  activo: "bg-status-positive",
  inactivo: "bg-status-neutral",
  suspendido: "bg-status-negative",
  mora: "bg-status-warning",
}

const generoIcons: Record<string, string> = {
  masculino: "♂",
  femenino: "♀",
}

export const columns: ColumnDef<PersonaList>[] = [
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
    accessorKey: "codigo_bp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <CopyableCell value={row.getValue("codigo_bp")} />
    ),
    meta: {
      size: 100,
    },
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
          subtitle={persona.codigo_bp}
          image={persona.foto_url}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: {
      size: 220,
      minSize: 200,
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
  // {
  //   accessorKey: "tipo_documento",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Tipo Doc." />
  //   ),
  //   cell: ({ row }) => {
  //     const tipo = row.getValue("tipo_documento") as string
  //     return tipo ? (
  //       <Badge variant="metadata-outline">
  //         {tipo}
  //       </Badge>
  //     ) : <NullCell />
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 100,
  //   },
  // },
  {
    accessorKey: "num_documento",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Documento" className="text-left" />
    ),
    cell: ({ row }) => {
      const numeroDocumento = row.getValue("num_documento") as string
      return (
        <div className="flex items-center gap-2">
          <CopyableCell
            value={numeroDocumento}
            label={formatDocumentId(numeroDocumento)}
          />
        </div>
      )
    },
    meta: {
      size: 140,
    },
  },
  {
    accessorKey: "email_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email_principal") as string
      return email ? <CopyableCell value={email} /> : <NullCell />
    },
    meta: {
      size: 200,
    },
  },
  {
    accessorKey: "telefono_principal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teléfono" />
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
    accessorKey: "estado_actor",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" className="text-left" />
    ),
    cell: ({ row }) => {
      const estado = (row.getValue("estado_actor") as string)?.toLowerCase()
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
  // Temporarily commented - not in v_actores_org view
  // {
  //   accessorKey: "fecha_nacimiento",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Fecha Nacimiento" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("fecha_nacimiento") as string
  //     return val ? <span>{formatShortDate(val)}</span> : <NullCell />
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 120,
  //   },
  // },
  // // --- Optional Columns (Hidden by default) ---
  // {
  //   accessorKey: "genero",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Género" />
  //   ),
  //   cell: ({ row }) => {
  //     const genero = row.getValue("genero") as string
  //     if (!genero) return <NullCell />
  //     const displayGenero = genero.charAt(0).toUpperCase() + genero.slice(1)
  //     const icon = generoIcons[genero.toLowerCase()]
  //     return (
  //       <div className="flex items-center gap-1.5">
  //         {icon && <span className="text-sm">{icon}</span>}
  //         <span>{displayGenero}</span>
  //       </div>
  //     )
  //   },
  //   meta: {
  //     size: 100,
  //   },
  // },
  // {
  //   accessorKey: "nacionalidad",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Nacionalidad" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("nacionalidad") as string
  //     return val ? <span>{val}</span> : <NullCell />
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 120,
  //   },
  // },
  // {
  //   accessorKey: "tipo_sangre",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="RH" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("tipo_sangre") as string
  //     return val ? <span>{val}</span> : <NullCell />
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 80,
  //   },
  // },
  // {
  //   accessorKey: "eps",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="EPS" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("eps") as string
  //     return val ? <span>{val}</span> : <NullCell />
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 150,
  //   },
  // },
  // {
  //   accessorKey: "ocupacion",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Ocupación" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("ocupacion") as string
  //     return val ? <span>{val}</span> : <NullCell />
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 150,
  //   },
  // },
  // {
  //   accessorKey: "fecha_socio",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Fecha Socio" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("fecha_socio") as string
  //     return val ? <span className="whitespace-nowrap">{formatShortDate(val)}</span> : <NullCell />
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 120,
  //   },
  // },
  // {
  //   accessorKey: "estado_vital",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="" />
  //   ),
  //   cell: ({ row }) => {
  //     const val = row.getValue("estado_vital") as string
  //     if (val?.toLowerCase() === "fallecido") {
  //       return (
  //         <div className="flex justify-center" title="Fallecido">
  //           <span className="text-lg opacity-60">⚰️</span>
  //         </div>
  //       )
  //     }
  //     return null
  //   },
  //   enableHiding: true,
  //   meta: {
  //     size: 60,
  //   },
  // },
  // {
  //   accessorKey: "whatsapp",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="WhatsApp" />
  //   ),
  //   enableHiding: true,
  //   meta: {
  //     size: 140,
  //   },
  // },
  // {
  //   accessorKey: "organizacion_nombre",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Organización" />
  //   ),
  //   enableHiding: true,
  //   meta: {
  //     size: 150,
  //   },
  // },
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
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(persona.id)
              }}
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
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
]
