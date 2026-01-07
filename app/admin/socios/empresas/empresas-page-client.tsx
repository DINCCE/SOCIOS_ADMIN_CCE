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
import { DataTableFacetedFilter } from '@/features/socios/components/data-table-faceted-filter'
import { DataTableResetFilters } from '@/features/socios/components/data-table-reset-filters'
import { FloatingActionBar } from '@/components/ui/floating-action-bar'
import { Separator } from '@/components/ui/separator'
import type { Empresa } from '@/features/socios/types/socios-schema'
import { columns } from '@/features/socios/empresas/columns'
import { empresasEstadoOptions, empresasTamanoOptions, empresasTipoSociedadOptions, empresasSectorOptions, empresasIngresosOptions, empresasEmpleadosOptions, getEmpresaSectorOptions, getEmpresaTagsOptions } from '@/lib/table-filters'

export function EmpresasPageClient() {
  const router = useRouter()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
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

  // Global search filter
  const filteredData = React.useMemo(() => {
    if (!globalSearch) return initialData

    const searchLower = globalSearch.toLowerCase()
    return initialData.filter((empresa) => {
      // Buscar en razón social
      if (empresa.razon_social?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en NIT
      if (empresa.nit?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en email principal
      if (empresa.email_principal?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en teléfono principal
      if (empresa.telefono_principal?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en nombre comercial
      if (empresa.nombre_comercial?.toLowerCase().includes(searchLower)) {
        return true
      }
      return false
    })
  }, [initialData, globalSearch])

  // Handle mount state
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Dynamic visibility for "tags" column - only run on client after mount
  React.useEffect(() => {
    if (!hasMounted || !initialData.length) return

    const hasTags = initialData.some((item) => {
      return (item.tags || []).length > 0
    })
    setColumnVisibility(prev => {
      if (prev.tags === hasTags) return prev
      return {
        ...prev,
        tags: hasTags
      }
    })
  }, [hasMounted, initialData.length])

  const table = useReactTable({
    data: filteredData,
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
        metadata={`${filteredData.length} de ${initialData.length}`}
        actions={<NewCompanySheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razón social, NIT, email o teléfono..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <DataTableFacetedFilter
              column={table.getColumn("estado")}
              title="Estado"
              options={empresasEstadoOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("tipo_sociedad")}
              title="Tipo Sociedad"
              options={empresasTipoSociedadOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("tamano_empresa")}
              title="Tamaño"
              options={empresasTamanoOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("sector_industria")}
              title="Sector"
              options={getEmpresaSectorOptions(initialData)}
            />
            <DataTableFacetedFilter
              column={table.getColumn("ingresos_anuales")}
              title="Ingresos"
              options={empresasIngresosOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("numero_empleados")}
              title="Empleados"
              options={empresasEmpleadosOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("tags")}
              title="Etiquetas"
              options={getEmpresaTagsOptions(initialData)}
            />
            {table.getState().columnFilters.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <DataTableResetFilters table={table} />
              </>
            )}
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
          <div className="border-t bg-background p-2">
            <DataTablePagination table={table} />
          </div>

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
