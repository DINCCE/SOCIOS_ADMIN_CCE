"use client"

import { flexRender, type Table } from "@tanstack/react-table"
import type { useRouter } from "next/navigation"

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AccionList } from "@/features/procesos/acciones/types/acciones-schema"

interface AccionesDataTableProps {
  table: Table<AccionList>
  router: ReturnType<typeof useRouter>
}

/**
 * AccionesDataTable - Presentation component for acciones table
 *
 * This component receives a pre-configured table instance from the parent,
 * allowing the toolbar, pagination, and floating action bar to be managed externally.
 *
 * Features sticky table headers that remain visible when scrolling.
 */
export function AccionesDataTable({ table, router }: AccionesDataTableProps) {
  return (
    <UITable className="min-w-max">
      <TableHeader className="sticky top-0 z-10 bg-background">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-0">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                style={{ width: header.getSize() }}
                className="relative group whitespace-nowrap"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}

                {/* Column Resize Handle */}
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none
                      bg-primary/20 opacity-0 group-hover:opacity-100
                      {header.column.getIsResizing() && 'bg-primary opacity-100'}"
                  />
                )}
              </TableHead>
            ))}
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
                // Don't navigate if clicking interactive elements
                const target = e.target as HTMLElement
                if (
                  target.closest('button') ||
                  target.closest('input') ||
                  target.closest('a') ||
                  target.getAttribute('role') === 'checkbox'
                ) return

                // For now, navigate to detail page (to be implemented)
                router.push(`/admin/procesos/acciones/${row.original.id}`)
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
              No se encontraron resultados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </UITable>
  )
}
