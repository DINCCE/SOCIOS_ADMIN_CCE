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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toggleTagsForActores, createAndAssignTag } from '@/app/actions/tags'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ResponsivePersonaDataTable } from '@/features/socios/personas/responsive-data-table'
import { NewPersonDialog } from '@/components/socios/personas/new-person-dialog'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableFacetedFilter } from '@/features/socios/components/data-table-faceted-filter'
import { DataTableResetFilters } from '@/features/socios/components/data-table-reset-filters'
import { FloatingActionCapsule } from '@/components/ui/floating-action-capsule'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DataTableExportDialog } from '@/components/ui/data-table-export-dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { PersonaList } from '@/features/socios/types/socios-schema'
import { columns } from '@/features/socios/personas/columns'
import { personasEstadoOptions, getPersonaTagsOptions } from '@/lib/table-filters'
import { useDataExport } from '@/lib/hooks/use-data-export'
import { useNotify } from '@/lib/hooks/use-notify'
import { Download, Trash2 } from 'lucide-react'
import { softDeletePersona } from '@/app/actions/personas'
import { calculateDefaultPageSize } from '@/lib/utils/pagination'

export function PersonasPageClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { exportData } = useDataExport()
  const { notifySuccess, notifyError } = useNotify()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [showSelectionExport, setShowSelectionExport] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    codigo: false,
    tags: true, // Mostrar columna de etiquetas
    // Campos no disponibles en v_actores_org (ocultos temporalmente):
    // tipo_documento, genero, fecha_nacimiento, nacionalidad, tipo_sangre,
    // eps, ocupacion, fecha_socio, estado_vital, whatsapp, organizacion_nombre
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [pageSize, setPageSize] = React.useState(10)

  // Client-side data fetching
  const { data: initialData = [], isLoading, error } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('v_actores_org')
        .select('id, codigo_bp, nombre_completo, num_documento, tipo_actor, email_principal, telefono_principal, estado_actor, organizacion_slug, organizacion_nombre, es_socio, es_cliente, es_proveedor, eliminado_en, tags, creado_en, actualizado_en, creado_por_email, creado_por_nombre, actualizado_por_email, actualizado_por_nombre')
        .eq('tipo_actor', 'persona')
        .order('nombre_completo', { ascending: true })

      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }

      // Transform to PersonaList format - now matches view structure
      const transformed = (data as any[])?.map((actor) => ({
        id: actor.id,
        codigo_bp: actor.codigo_bp,
        nombre_completo: actor.nombre_completo,
        num_documento: actor.num_documento,
        tipo_actor: actor.tipo_actor,
        email_principal: actor.email_principal,
        telefono_principal: actor.telefono_principal,
        estado_actor: actor.estado_actor,
        organizacion_slug: actor.organizacion_slug,
        organizacion_nombre: actor.organizacion_nombre,
        es_socio: actor.es_socio,
        es_cliente: actor.es_cliente,
        es_proveedor: actor.es_proveedor,
        eliminado_en: actor.eliminado_en,
        tags: actor.tags || [],
        foto_url: null, // Not in view
        creado_en: actor.creado_en,
        creado_por_email: actor.creado_por_email,
        creado_por_nombre: actor.creado_por_nombre,
        actualizado_en: actor.actualizado_en,
        actualizado_por_email: actor.actualizado_por_email,
        actualizado_por_nombre: actor.actualizado_por_nombre,
      })) || []

      return transformed as PersonaList[]
    },
  })

  // Global search filter
  const filteredData = React.useMemo(() => {
    if (!globalSearch) return initialData

    const searchLower = globalSearch.toLowerCase()
    return initialData.filter((persona) => {
      // Buscar en nombre completo
      if (persona.nombre_completo?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en número de documento
      if (persona.num_documento?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en email principal
      if (persona.email_principal?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en teléfono principal
      if (persona.telefono_principal?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en código BP
      if (persona.codigo_bp?.toLowerCase().includes(searchLower)) {
        return true
      }
      return false
    })
  }, [initialData, globalSearch])

  // Obtener todas las etiquetas únicas disponibles
  const availableTags = React.useMemo(() => {
    const tagsSet = new Set<string>()
    initialData.forEach((persona) => {
      if (persona.tags) {
        persona.tags.forEach((tag) => tagsSet.add(tag))
      }
    })
    return Array.from(tagsSet).sort()
  }, [initialData])

  // Column mapping for export dialog
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

  // Export handler
  const handleExport = ({ format, selectedColumns }: { format: 'csv' | 'xlsx'; selectedColumns: string[] }) => {
    exportData(filteredData, {
      format,
      columns: exportColumns,
      selectedColumns,
      filename: `personas-${Date.now()}`
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
      filename: `seleccion_personas_${Date.now()}`
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
        const result = await softDeletePersona(id)
        if (result.success) {
          successCount++
        } else {
          errorCount++
          console.error('Error deleting persona:', result.message)
        }
      }

      // Clear selection and refresh data
      setRowSelection({})
      await queryClient.invalidateQueries({ queryKey: ['personas'] })
      setShowDeleteConfirm(false)

      // Show appropriate notification
      if (errorCount === 0) {
        notifySuccess({
          title: `${successCount} ${successCount === 1 ? 'persona eliminada' : 'personas eliminadas'} correctamente`
        })
      } else if (successCount === 0) {
        notifyError({
          title: 'Error al eliminar',
          description: `No se pudieron eliminar las personas. ${errorCount > 1 ? 'Intente nuevamente.' : ''}`
        })
      } else {
        notifyError({
          title: 'Eliminación parcial',
          description: `${successCount} de ${selectedCount} personas eliminadas. ${errorCount} errores.`
        })
      }
    } catch (error) {
      console.error('Error in batch delete:', error)
      notifyError({
        title: 'Error al eliminar',
        description: 'Error al eliminar las personas. Intente nuevamente.'
      })
      setShowDeleteConfirm(false)
    }
  }

  // Handle mount state
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Update page size dynamically based on data count
  React.useEffect(() => {
    const newSize = calculateDefaultPageSize(filteredData.length)
    setPageSize(newSize)
  }, [filteredData.length])

  // Dynamic visibility for "tags" column - only run on client after mount
  // Note: tags column removed since dm_actores doesn't have a tags field
  // React.useEffect(() => {
  //   if (!hasMounted || !initialData.length) return

  //   const hasTags = initialData.some((item) => {
  //     return (item.tags || []).length > 0
  //   })

  //   setColumnVisibility(prev => {
  //     if (prev.tags === hasTags) return prev
  //     return {
  //       ...prev,
  //       tags: hasTags
  //     }
  //   })
  // }, [hasMounted, initialData.length])

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
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!hasMounted || isLoading) {
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

  if (error) {
    return (
      <PageShell>
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">
              Error: {error.message}
            </div>
          </div>
        </PageContent>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Personas"
        description="Gestiona las personas registradas como socios de negocio"
        metadata={`${filteredData.length} de ${initialData.length}`}
        actions={<NewPersonDialog />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <div className="relative w-full md:w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, documento, email o teléfono..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <DataTableFacetedFilter
              column={table.getColumn("estado_actor")}
              title="Estado"
              options={personasEstadoOptions}
            />
            {availableTags.length > 0 && (
              <DataTableFacetedFilter
                column={table.getColumn("tags")}
                title="Etiquetas"
                options={getPersonaTagsOptions(initialData)}
              />
            )}
            {/* DataTableFacetedFilter
              column={table.getColumn("tipo_documento")}
              title="Tipo Doc."
              options={personasTipoDocOptions}
            */}
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
            <DataTableExportDialog
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </Button>
              }
              title="Exportar Personas"
              description="Selecciona el formato y columnas a exportar"
              columns={exportColumns}
              totalRows={filteredData.length}
              isLoading={isLoading}
              onExport={handleExport}
            />
            <DataTableViewOptions table={table} />
          </>
        }
      />

      {/* Content */}
      <PageContent>
        <div className="space-y-4">
          {/* Table - with responsive card view on mobile */}
          <ResponsivePersonaDataTable table={table} router={router} />

          {/* Pagination */}
          <div className="border-t bg-background p-2">
            <DataTablePagination table={table} totalRecords={filteredData.length} />
          </div>

          {/* Floating Action Capsule */}
          <AnimatePresence>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <FloatingActionCapsule
                selectedCount={table.getFilteredSelectedRowModel().rows.length}
                selectedIds={table.getFilteredSelectedRowModel().rows.map(row => row.original.id)}
                totalCount={table.getFilteredRowModel().rows.length}
                availableTags={availableTags}
                selectedRowsTags={table.getFilteredSelectedRowModel().rows.map(row => (row.original as PersonaList).tags || [])}
                onClearSelection={() => setRowSelection({})}
                onExport={() => setShowSelectionExport(true)}
                onToggleTag={async (tag: string, add: boolean) => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                  const result = await toggleTagsForActores(selectedIds, tag, add)
                  if (!result.success) {
                    console.error('Error toggling tag:', result.message)
                  }
                  // Refrescar datos invalidando query
                  await queryClient.invalidateQueries({ queryKey: ['personas'] })
                }}
                onCreateTag={async (tag: string) => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                  const result = await createAndAssignTag(selectedIds, tag)
                  if (!result.success) {
                    console.error('Error creating tag:', result.message)
                  }
                  // Refrescar datos invalidando query
                  await queryClient.invalidateQueries({ queryKey: ['personas'] })
                }}
                onDelete={() => setShowDeleteConfirm(true)}
              />
            )}
          </AnimatePresence>
        </div>
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
