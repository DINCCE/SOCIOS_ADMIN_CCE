'use client'

import * as React from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { PersonasDataTable } from '@/features/socios/personas/data-table'
import { NewPersonSheet } from '@/components/socios/personas/new-person-sheet'
import { CommandSearch } from '@/components/ui/command-search'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { FloatingActionBar } from '@/components/ui/floating-action-bar'
import { Separator } from '@/components/ui/separator'
import type { Persona } from '@/features/socios/types/socios-schema'

interface PersonasPageClientProps {
  initialData: Persona[]
  columns: ColumnDef<Persona, unknown>[]
}

export function PersonasPageClient({ initialData, columns }: PersonasPageClientProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    codigo: false,
    genero: false,
    fecha_nacimiento: false,
    nacionalidad: false,
    tipo_sangre: false,
    eps: false,
    ocupacion: false,
    fecha_socio: false,
    estado_vital: false,
    whatsapp: false,
    organizacion_nombre: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Dynamic visibility for "tags" column
  React.useEffect(() => {
    const hasTags = initialData.some((item) => {
      return (item.tags || []).length > 0
    })
    setColumnVisibility(prev => ({
      ...prev,
      tags: hasTags
    }))
  }, [initialData])

  const table = useReactTable({
    data: initialData,
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
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Personas"
        description="Gestiona las personas registradas como socios de negocio"
        metadata={`${initialData.length} total`}
        actions={<NewPersonSheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <CommandSearch
              placeholder="Buscar por nombre, documento o email..."
              value={(table.getColumn("nombre_completo")?.getFilterValue() as string) ?? ""}
              onChange={(value) => table.getColumn("nombre_completo")?.setFilterValue(value)}
              aria-label="Buscar personas"
            />
            <Separator orientation="vertical" className="h-6" />
            <Select
              value={(table.getColumn("estado")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) =>
                table.getColumn("estado")?.setFilterValue(value === "all" ? "" : value)
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
          </>
        }
        right={<DataTableViewOptions table={table} />}
      />

      {/* Content */}
      <PageContent>
        <div className="space-y-4">
          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <PersonasDataTable table={table} router={router} />
          </div>

          {/* Pagination */}
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
                }}
                onChangeStatus={() => {
                  console.log('Change status')
                }}
                onDelete={() => {
                  console.log('Delete')
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </PageContent>
    </PageShell>
  )
}
