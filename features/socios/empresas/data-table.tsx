"use client"

import { flexRender, type Table } from "@tanstack/react-table"
import type { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Empresa } from "@/features/socios/types/socios-schema"

interface EmpresasDataTableProps {
  table: Table<Empresa>
  router: ReturnType<typeof useRouter>
}

/**
 * EmpresasDataTable - Presentation component for empresas table
 *
 * This component now receives a pre-configured table instance from the parent,
 * allowing the toolbar, pagination, and floating action bar to be managed externally.
 *
 * @example
 * ```tsx
 * const table = useReactTable({ data, columns, ... })
 * return (
 *   <div className="overflow-hidden rounded-md border">
 *     <EmpresasDataTable table={table} router={router} />
 *   </div>
 * )
 * ```
 */
export function EmpresasDataTable({ table, router }: EmpresasDataTableProps) {
  return (
    <UITable>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    header.column.id === "select" && "sticky left-0 z-20 bg-slate-50 border-r border-border/60",
                    header.column.id === "razon_social" && "min-w-[250px] sticky left-[48px] z-20 bg-slate-50 border-r border-border/80 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)]",
                    header.column.id !== "razon_social" && header.column.id !== "select" && "w-auto whitespace-nowrap"
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className="group cursor-pointer transition-colors hover:bg-muted/50"
              onClick={(e) => {
                // Don't navigate if clicking checkbox or action button
                const target = e.target as HTMLElement
                if (
                  target.closest('button') ||
                  target.closest('input') ||
                  target.closest('a') ||
                  target.getAttribute('role') === 'checkbox'
                ) {
                  return
                }
                router.push(`/admin/socios/empresas/${(row.original as { id: string }).id}`)
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    cell.column.id === "select" && "sticky left-0 z-10 bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted border-r border-border/40",
                    cell.column.id === "razon_social" && "sticky left-[48px] z-10 bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted border-r border-border/80 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)]"
                  )}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              No se encontraron resultados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </UITable>
  )
}
