"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"

import { CommandSearch } from "@/components/ui/command-search"
import { FloatingActionBar } from "@/components/ui/floating-action-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/features/socios/components/data-table-pagination"
import { DataTableViewOptions } from "@/features/socios/components/data-table-view-options"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function EmpresasDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      codigo: false,
      nombre_comercial: false,
      sector_industria: false,
      tamano_empresa: false,
      actividad_economica: false,
      nombre_representante_legal: false,
      cargo_representante: false,
      ingresos_anuales: false,
      numero_empleados: false,
      website: false,
      whatsapp: false,
      organizacion_nombre: false,
    })
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <CommandSearch
            placeholder="Buscar por razón social, NIT o email..."
            value={
              (table.getColumn("razon_social")?.getFilterValue() as string) ?? ""
            }
            onChange={(value) =>
              table.getColumn("razon_social")?.setFilterValue(value)
            }
            aria-label="Buscar empresas"
          />
          <Select
            value={
              (table.getColumn("estado")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("estado")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="suspendido">Suspendido</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={
              (table.getColumn("tipo_sociedad")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("tipo_sociedad")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Tipo Sociedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="SA">SA</SelectItem>
              <SelectItem value="SAS">SAS</SelectItem>
              <SelectItem value="LTDA">LTDA</SelectItem>
              <SelectItem value="EU">E.U.</SelectItem>
              <SelectItem value="COOPERATIVA">Cooperativa</SelectItem>
              <SelectItem value="FUNDACION">Fundación</SelectItem>
              <SelectItem value="ASOCIACION">Asociación</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="cursor-pointer transition-colors hover:bg-muted/50"
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
                    router.push(`/admin/socios/empresas/${(row.original as any).id}`)
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      {/* Floating Action Bar */}
      <AnimatePresence>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <FloatingActionBar
            selectedCount={table.getFilteredSelectedRowModel().rows.length}
            totalCount={table.getFilteredRowModel().rows.length}
            onExport={() => {
              const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
              console.log('Export', selectedRows)
              // Future: CSV/Excel export
            }}
            onChangeStatus={() => {
              console.log('Change status')
              // Future: Open dialog with estado dropdown
            }}
            onDelete={() => {
              console.log('Delete')
              // Future: Open confirmation dialog with soft delete
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
