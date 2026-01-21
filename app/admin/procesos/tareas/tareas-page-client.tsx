'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  Trash2,
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

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
import { DataTableExportDialog } from '@/components/ui/data-table-export-dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { FloatingActionCapsule } from '@/components/ui/floating-action-capsule'
import { columns, type TareaView } from '@/features/procesos/tareas/columns'
import { tareasPrioridadOptions, tareasEstadoOptions, getTareaTagsOptions } from '@/lib/table-filters'
import { calculateDefaultPageSize } from '@/lib/utils/pagination'
import { useDataExport } from '@/lib/hooks/use-data-export'
import { useNotify } from '@/lib/hooks/use-notify'
import { toggleTagsForTareas, createAndAssignTagForTareas } from '@/app/actions/tags'
import { softDeleteTarea } from '@/app/actions/tareas'

export function TareasPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { exportData } = useDataExport()
  const { notifySuccess, notifyError } = useNotify()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const [hasMounted, setHasMounted] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [showSelectionExport, setShowSelectionExport] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    select: true,
    codigo_tarea: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [pageSize, setPageSize] = React.useState(10)

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

  // Obtener todas las etiquetas únicas disponibles
  const availableTags = React.useMemo(() => {
    const tagsSet = new Set<string>()
    initialData.forEach((tarea) => {
      if (tarea.tags) {
        tarea.tags.forEach((tag) => tagsSet.add(tag))
      }
    })
    return Array.from(tagsSet).sort()
  }, [initialData])

  // Export columns definition
  const exportColumns = React.useMemo(() => {
    return columns
      .map((col: any) => {
        const id = col.id || col.accessorKey || ''
        let label = id

        // Extract label from header
        if (typeof col.header === 'string') {
          label = col.header
        } else if (col.header?.props?.children) {
          // Handle complex headers like components
          label = String(col.header.props.children || id)
        }

        return { id, label }
      })
      .filter((col: any) => col.id && col.id !== 'select' && col.id !== 'actions')
  }, [columns])

  // Handle mount state
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Update page size dynamically based on data count
  React.useEffect(() => {
    const newSize = calculateDefaultPageSize(filteredData.length)
    setPageSize(newSize)
  }, [filteredData.length])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageSize,
        pageIndex: 0,
      },
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

  // Export handler for all filtered data
  const handleExport = ({ format, selectedColumns }: { format: 'csv' | 'xlsx'; selectedColumns: string[] }) => {
    exportData(filteredData, {
      format,
      columns: exportColumns,
      selectedColumns,
      filename: `tareas-${Date.now()}`
    })
  }

  // Selection export handler
  const handleExportSelection = ({ format, selectedColumns }: { format: 'csv' | 'xlsx'; selectedColumns: string[] }) => {
    // Get only selected rows from table
    const selectedRows = table.getSelectedRowModel().rows.map(row => row.original)

    exportData(selectedRows, {
      format,
      columns: exportColumns,
      selectedColumns,
      filename: `seleccion_tareas_${Date.now()}`
    })

    setShowSelectionExport(false)
  }

  // Delete handler with confirmation
  const handleDelete = async () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
    const selectedCount = selectedIds.length

    try {
      // Delete all selected records
      let successCount = 0
      let errorCount = 0

      for (const id of selectedIds) {
        const result = await softDeleteTarea(id)
        if (result.success) {
          successCount++
        } else {
          errorCount++
          console.error('Error deleting tarea:', result.message)
        }
      }

      // Clear selection and refresh data
      setRowSelection({})
      await queryClient.invalidateQueries({ queryKey: ['tareas'] })
      setShowDeleteConfirm(false)

      // Show appropriate notification
      if (errorCount === 0) {
        notifySuccess({
          title: `${successCount} ${successCount === 1 ? 'tarea eliminada' : 'tareas eliminadas'} correctamente`
        })
      } else if (successCount === 0) {
        notifyError({
          title: 'Error al eliminar',
          description: `No se pudieron eliminar las tareas. ${errorCount > 1 ? 'Intente nuevamente.' : ''}`
        })
      } else {
        notifyError({
          title: 'Eliminación parcial',
          description: `${successCount} de ${selectedCount} tareas eliminadas. ${errorCount} errores.`
        })
      }
    } catch (error) {
      console.error('Error in batch delete:', error)
      notifyError({
        title: 'Error al eliminar',
        description: 'Error al eliminar las tareas. Intente nuevamente.'
      })
      setShowDeleteConfirm(false)
    }
  }

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
                  <DataTablePagination table={table} totalRecords={filteredData.length} />
                </div>
              </>
            )
          )}
        </div>

        {/* Floating Action Capsule */}
        <AnimatePresence>
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <FloatingActionCapsule
              selectedCount={table.getFilteredSelectedRowModel().rows.length}
              selectedIds={table.getFilteredSelectedRowModel().rows.map(row => row.original.id)}
              totalCount={table.getFilteredRowModel().rows.length}
              availableTags={availableTags}
              selectedRowsTags={table.getFilteredSelectedRowModel().rows.map(row => (row.original as TareaView).tags || [])}
              onClearSelection={() => setRowSelection({})}
              onExport={() => setShowSelectionExport(true)}
              onToggleTag={async (tag: string, add: boolean) => {
                const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                const result = await toggleTagsForTareas(selectedIds, tag, add)
                if (!result.success) {
                  console.error('Error toggling tag:', result.message)
                }
                await queryClient.invalidateQueries({ queryKey: ['tareas'] })
              }}
              onCreateTag={async (tag: string) => {
                const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                const result = await createAndAssignTagForTareas(selectedIds, tag)
                if (!result.success) {
                  console.error('Error creating tag:', result.message)
                }
                await queryClient.invalidateQueries({ queryKey: ['tareas'] })
              }}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          )}
        </AnimatePresence>
      </PageContent>

      {/* Selection Export Dialog */}
      <DataTableExportDialog
        open={showSelectionExport}
        onOpenChange={setShowSelectionExport}
        title="Exportar Selección"
        description={`Se exportarán ${table.getSelectedRowModel().rows.length} registros seleccionados`}
        columns={exportColumns}
        totalRows={table.getSelectedRowModel().rows.length}
        isLoading={isLoading}
        onExport={handleExportSelection}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar {table.getFilteredSelectedRowModel().rows.length} {table.getFilteredSelectedRowModel().rows.length === 1 ? 'registro' : 'registros'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción establecerá la marca de soft delete. Los registros ya no aparecerán en la lista pero se conservarán en la base de datos.
              <br /><br />
              <strong>¿Está seguro de que desea continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
