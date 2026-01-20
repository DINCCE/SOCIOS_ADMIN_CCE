'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Plus,
  Search,
} from 'lucide-react'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { TareasBoard } from '@/components/procesos/tareas/tareas-board'
import { ResponsiveTareaDataTable } from '@/features/procesos/tareas/responsive-data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { DataTableFacetedFilter } from '@/features/socios/components/data-table-faceted-filter'
import { DataTableResetFilters } from '@/features/socios/components/data-table-reset-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { columns, type TareaView } from '@/features/procesos/tareas/columns'
import { tareasPrioridadOptions, tareasEstadoOptions, getTareaTagsOptions } from '@/lib/table-filters'

export function TareasPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const [hasMounted, setHasMounted] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    select: true,
    codigo_tarea: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: initialData = [], isLoading } = useQuery({
    queryKey: ['tareas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('v_tareas_org')
        .select('*')
        .order('fecha_vencimiento', { ascending: true })

      if (error) throw error
      return data as TareaView[]
    },
  })

  // Global search filter
  const filteredData = React.useMemo(() => {
    if (!globalSearch) return initialData

    const searchLower = globalSearch.toLowerCase()
    return initialData.filter((tarea) => {
      // Buscar en título
      if (tarea.titulo?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en descripción
      if (tarea.descripcion?.toLowerCase().includes(searchLower)) {
        return true
      }
      return false
    })
  }, [initialData, globalSearch])

  // Handle mount state
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Tareas"
        description="Gestiona las tareas y actividades"
        metadata={`${filteredData.length} de ${initialData.length}`}
        actions={
          <Button size="sm" className="h-8 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        }
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <div className="relative w-full md:w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o descripción..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <DataTableFacetedFilter
              column={table.getColumn("prioridad")}
              title="Prioridad"
              options={tareasPrioridadOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("estado")}
              title="Estado"
              options={tareasEstadoOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn("tags")}
              title="Etiquetas"
              options={getTareaTagsOptions(initialData)}
            />
            {table.getState().columnFilters.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <DataTableResetFilters table={table} />
              </>
            )}
          </>
        }
        right={
          <>
            <ViewToggle defaultValue="list" />
            {view === 'list' && <DataTableViewOptions table={table} />}
          </>
        }
      />

      {/* Content */}
      <PageContent>
        <div className="space-y-4">
          {view === 'board' ? (
            /* KANBAN: Mantiene h-full absoluto para el canvas */
            <TareasBoard />
          ) : (
            /* TABLA: Comportamiento natural con scroll */
            isLoading ? (
              <div className="border rounded-lg">
                <div className="h-10 bg-muted/40 animate-pulse" />
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted/20" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Table - with responsive card view on mobile */}
                <ResponsiveTareaDataTable table={table} router={router} />
                {/* Pagination Footer */}
                <div className="border-t bg-background p-2">
                  <DataTablePagination table={table} />
                </div>
              </>
            )
          )}
        </div>
      </PageContent>
    </PageShell>
  )
}
