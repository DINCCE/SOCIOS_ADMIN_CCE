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
import type { TareaView } from "./columns"

interface TareasDataTableProps {
  table: Table<TareaView>
  router: ReturnType<typeof useRouter>
}

/**
 * TareasDataTable - Presentation component for tareas table
 *
 * This component receives a pre-configured table instance from the parent,
 * allowing the toolbar, pagination, and floating action bar to be managed externally.
 *
 * Features sticky table headers that remain visible when scrolling.
 *
 * @example
 * ```tsx
 * const table = useReactTable({ data, columns, ... })
 * return (
 *   <div className="rounded-md border relative">
 *     <TareasDataTable table={table} router={router} />
 *   </div>
 * )
 * ```
 */
export function TareasDataTable({ table, router }: TareasDataTableProps) {
  return (
    <UITable>
      <TableHeader className="sticky top-0 z-10 bg-background">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-0">
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                  className={cn(
                    "relative group whitespace-nowrap",
                    header.column.getCanSort() && "cursor-pointer select-none"
                  )}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}

                  {/* Column Resize Handle */}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-opacity",
                        "bg-primary/20 opacity-0 group-hover:opacity-100",
                        header.column.getIsResizing() && "bg-primary opacity-100"
                      )}
                    />
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
                // Navigate to tarea detail page (to be implemented)
                router.push(`/admin/procesos/tareas/${row.original.id}`)
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
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
