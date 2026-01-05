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
import { EmpresasDataTable } from '@/features/socios/empresas/data-table'
import { NewCompanySheet } from '@/components/socios/empresas/new-company-sheet'
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
import type { Empresa } from '@/features/socios/types/socios-schema'

interface EmpresasPageClientProps {
  initialData: Empresa[]
  columns: ColumnDef<Empresa, unknown>[]
}

export function EmpresasPageClient({ initialData, columns }: EmpresasPageClientProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
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
        title="Empresas"
        description="Gestiona las empresas registradas como socios de negocio"
        metadata={`${initialData.length} total`}
        actions={<NewCompanySheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <CommandSearch
              placeholder="Buscar por razón social, NIT o email..."
              value={(table.getColumn("razon_social")?.getFilterValue() as string) ?? ""}
              onChange={(value) => table.getColumn("razon_social")?.setFilterValue(value)}
              aria-label="Buscar empresas"
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
            <Select
              value={(table.getColumn("tipo_sociedad")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) =>
                table.getColumn("tipo_sociedad")?.setFilterValue(value === "all" ? "" : value)
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
          </>
        }
        right={<DataTableViewOptions table={table} />}
      />

      {/* Content */}
      <PageContent>
        <div className="space-y-4">
          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <EmpresasDataTable table={table} router={router} />
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
