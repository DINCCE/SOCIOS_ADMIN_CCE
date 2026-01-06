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
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { EmpresasDataTable } from '@/features/socios/empresas/data-table'
import { NewCompanySheet } from '@/components/socios/empresas/new-company-sheet'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
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
import { columns } from '@/features/socios/empresas/columns'

export function EmpresasPageClient() {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    codigo: false,
    tags: false,
    nombre_comercial: false,
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

  // Client-side data fetching
  const { data: initialData = [], isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('v_empresas_org')
        .select('*')
        .order('razon_social', { ascending: true })

      if (error) throw error
      return data as Empresa[]
    },
  })

  // Dynamic visibility for "tags" column - only run when data length changes
  React.useEffect(() => {
    const hasTags = initialData.some((item) => {
      return (item.tags || []).length > 0
    })
    setColumnVisibility(prev => ({
      ...prev,
      tags: hasTags
    }))
  }, [initialData.length]) // Only depend on length, not the array itself

  const table = useReactTable({
    data: initialData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <PageShell>
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        </PageContent>
      </PageShell>
    )
  }

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
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razón social, NIT o email..."
                value={(table.getColumn("razon_social")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("razon_social")?.setFilterValue(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
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
