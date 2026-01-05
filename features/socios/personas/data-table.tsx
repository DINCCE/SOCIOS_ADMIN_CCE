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
import type { Persona } from "@/features/socios/types/socios-schema"

interface PersonasDataTableProps {
  table: Table<Persona>
  router: ReturnType<typeof useRouter>
}

/**
 * PersonasDataTable - Presentation component for personas table
 *
 * This component now receives a pre-configured table instance from the parent,
 * allowing the toolbar, pagination, and floating action bar to be managed externally.
 *
 * @example
 * ```tsx
 * const table = useReactTable({ data, columns, ... })
 * return (
 *   <div className="overflow-hidden rounded-md border">
 *     <PersonasDataTable table={table} router={router} />
 *   </div>
 * )
 * ```
 */
export function PersonasDataTable({ table, router }: PersonasDataTableProps) {
  return (
    <UITable>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                  className={cn(
                    "relative group",
                    header.column.id === "select" && "sticky left-0 z-20 bg-slate-50",
                    header.column.id === "nombre_completo" && "min-w-[250px] sticky left-[48px] z-20 bg-slate-50 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)]",
                    header.column.id !== "nombre_completo" && header.column.id !== "select" && "whitespace-nowrap"
                  )}
                >
                  <div className={cn(
                    "flex items-center",
                    header.column.getCanSort() && "cursor-pointer select-none"
                  )}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </div>

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
                router.push(`/admin/socios/personas/${(row.original as { id: string }).id}`)
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    cell.column.id === "select" && "sticky left-0 z-10 bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted",
                    cell.column.id === "nombre_completo" && "sticky left-[48px] z-10 bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)]"
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
