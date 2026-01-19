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
import { FloatingActionCapsule } from '@/components/ui/floating-action-capsule'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DataTableExportDialog } from '@/components/ui/data-table-export-dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { EmpresaList } from '@/features/socios/types/socios-schema'
import { columns } from '@/features/socios/empresas/columns'
import { empresasEstadoOptions, getEmpresaTagsOptions } from '@/lib/table-filters'
import { useDataExport } from '@/lib/hooks/use-data-export'
import { useNotify } from '@/lib/hooks/use-notify'
import { Download, Trash2 } from 'lucide-react'
import { softDeleteEmpresa } from '@/app/actions/empresas'

export function EmpresasPageClient() {
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
    // Columnas visibles (por defecto visibles, no se especifican aquí):
    // razon_social, nombre_comercial, nit_completo, email_principal, telefono_principal, tamano_empresa, estado
    codigo: false,
    tags: true, // Mostrar columna de etiquetas
    nit: false, // Oculto, usamos nit_completo en su lugar
    digito_verificacion: false,
    tipo_sociedad: false,
    fecha_constitucion: false,
    ciudad_constitucion: false,
    pais_constitucion: false,
    numero_registro: false,
    codigo_ciiu: false,
    sector_industria: false,
    actividad_economica: false,
    representante_legal_id: false,
    cargo_representante: false,
    telefono_secundario: false,
    whatsapp: false,
    website: false,
    linkedin_url: false,
    facebook_url: false,
    instagram_handle: false,
    twitter_handle: false,
    logo_url: false,
    ingresos_anuales: false,
    numero_empleados: false,
    atributos: false,
    organizacion_id: false,
    tipo_actor: false,
    es_socio: false,
    es_cliente: false,
    es_proveedor: false,
    bp_creado_en: false,
    bp_actualizado_en: false,
    eliminado_en: false,
    organizacion_nombre: false,
    nombre_representante_legal: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Client-side data fetching
  const { data: initialData = [], isLoading, error } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('v_actores_org')
        .select('id, codigo_bp, num_documento, digito_verificacion, razon_social, nombre_comercial, email_principal, telefono_principal, telefono_secundario, estado_actor, organizacion_slug, organizacion_nombre, es_socio, es_cliente, es_proveedor, eliminado_en, perfil_profesional_corporativo, nat_fiscal, regimen_tributario, creado_en, actualizado_en, tags')
        .eq('tipo_actor', 'empresa')
        .order('razon_social', { ascending: true })

      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }

      // Transform to EmpresaList format
      interface RawEmpresa {
        id: string
        codigo_bp: string
        num_documento: string | null
        digito_verificacion: number | null
        razon_social: string | null
        nombre_comercial: string | null
        email_principal: string | null
        telefono_principal: string | null
        telefono_secundario: string | null
        estado_actor: string
        organizacion_slug: string | null
        organizacion_nombre: string | null
        es_socio: boolean
        es_cliente: boolean
        es_proveedor: boolean
        eliminado_en: string | null
        perfil_profesional_corporativo: Record<string, any> | null
        nat_fiscal: string | null
        regimen_tributario: string | null
        creado_en: string
        actualizado_en: string | null
        tags: string[] | null
      }

      const transformed = (data as unknown as RawEmpresa[])?.map((actor) => {
        const perfilProfesional = actor.perfil_profesional_corporativo || {}
        return {
          id: actor.id,
          codigo_bp: actor.codigo_bp,
          num_documento: actor.num_documento || '',
          digito_verificacion: actor.digito_verificacion || null,
          razon_social: actor.razon_social || null,
          nombre_comercial: actor.nombre_comercial || null,
          nat_fiscal: actor.nat_fiscal || null,
          tipo_actor: 'empresa' as const,
          estado_actor: actor.estado_actor as 'activo' | 'inactivo' | 'bloqueado',
          email_principal: actor.email_principal || null,
          telefono_principal: actor.telefono_principal || null,
          telefono_secundario: actor.telefono_secundario || null,
          organizacion_slug: actor.organizacion_slug || null,
          organizacion_nombre: actor.organizacion_nombre || null,
          es_socio: actor.es_socio,
          es_cliente: actor.es_cliente,
          es_proveedor: actor.es_proveedor,
          eliminado_en: actor.eliminado_en,
          fecha_constitucion: perfilProfesional.fecha_constitucion || null,
          ciudad_constitucion: perfilProfesional.ciudad_constitucion || null,
          pais_constitucion: perfilProfesional.pais_constitucion || null,
          numero_registro: perfilProfesional.numero_registro || null,
          codigo_ciiu: perfilProfesional.codigo_ciiu || null,
          sector_industria: perfilProfesional.sector_industria || null,
          actividad_economica: perfilProfesional.actividad_economica || null,
          tamano_empresa: perfilProfesional.tamano_empresa || null,
          representante_legal_id: perfilProfesional.representante_legal_id || null,
          cargo_representante: perfilProfesional.cargo_representante || null,
          whatsapp: perfilProfesional.whatsapp || null,
          website: perfilProfesional.website || null,
          linkedin_url: perfilProfesional.linkedin_url || null,
          facebook_url: perfilProfesional.facebook_url || null,
          instagram_handle: perfilProfesional.instagram_handle || null,
          twitter_handle: perfilProfesional.twitter_handle || null,
          logo_url: perfilProfesional.logo_url || null,
          ingresos_anuales: perfilProfesional.ingresos_anuales || null,
          numero_empleados: perfilProfesional.numero_empleados || null,
          creado_en: actor.creado_en,
          creado_por_email: null, // Not in selected fields
          creado_por_nombre: null, // Not in selected fields
          actualizado_en: actor.actualizado_en,
          actualizado_por_email: null, // Not in selected fields
          actualizado_por_nombre: null, // Not in selected fields
          nit_completo: actor.digito_verificacion
            ? `${actor.num_documento}-${actor.digito_verificacion}`
            : actor.num_documento || null,
          nombre_representante_legal: null, // Not in selected fields
          tags: actor.tags || [],
        }
      }) || []

      return transformed as EmpresaList[]
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
      // Buscar en número de documento
      if (empresa.num_documento?.toLowerCase().includes(searchLower)) {
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
      // Buscar en código BP
      if (empresa.codigo_bp?.toLowerCase().includes(searchLower)) {
        return true
      }
      return false
    })
  }, [initialData, globalSearch])

  // Obtener todas las etiquetas únicas disponibles
  const availableTags = React.useMemo(() => {
    const tagsSet = new Set<string>()
    initialData.forEach((empresa) => {
      if (empresa.tags) {
        empresa.tags.forEach((tag) => tagsSet.add(tag))
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
      filename: `empresas-${Date.now()}`
    })
  }

  // Selection export handler
  const handleExportSelection = ({ format, selectedColumns }: { format: 'csv' | 'xlsx'; selectedColumns: string[] }) => {
    // Get only selected rows from table
    const selectedRows = table.getSelectedRowModel().rows.map((row: any) => row.original)

    exportData(selectedRows, {
      format,
      columns: exportColumns,
      selectedColumns,
      filename: `seleccion_empresas_${Date.now()}`
    })

    setShowSelectionExport(false)
  }

  // Delete handler with confirmation
  const handleDelete = async () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row: any) => row.original.id)
    const selectedCount = selectedIds.length

    try {
      // Delete all selected records
      let successCount = 0
      let errorCount = 0

      for (const id of selectedIds) {
        const result = await softDeleteEmpresa(id)
        if (result.success) {
          successCount++
        } else {
          errorCount++
          console.error('Error deleting empresa:', result.message)
        }
      }

      // Clear selection and refresh data
      setRowSelection({})
      await queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setShowDeleteConfirm(false)

      // Show appropriate notification
      if (errorCount === 0) {
        notifySuccess({
          title: `${successCount} ${successCount === 1 ? 'empresa eliminada' : 'empresas eliminadas'} correctamente`
        })
      } else if (successCount === 0) {
        notifyError({
          title: 'Error al eliminar',
          description: `No se pudieron eliminar las empresas. ${errorCount > 1 ? 'Intente nuevamente.' : ''}`
        })
      } else {
        notifyError({
          title: 'Eliminación parcial',
          description: `${successCount} de ${selectedCount} empresas eliminadas. ${errorCount} errores.`
        })
      }
    } catch (error) {
      console.error('Error in batch delete:', error)
      notifyError({
        title: 'Error al eliminar',
        description: 'Error al eliminar las empresas. Intente nuevamente.'
      })
      setShowDeleteConfirm(false)
    }
  }

  // Handle mount state
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Dynamic visibility for "tags" column - only run on client after mount
  // Note: tags column removed since v_actores_org doesn't have a tags field
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
  }) as any

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
        title="Empresas"
        description="Gestiona las empresas registradas como socios de negocio"
        metadata={`${filteredData.length} de ${initialData.length}`}
        actions={<NewCompanySheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <div className="relative w-full md:w-64 lg:w-80">
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
            {availableTags.length > 0 && (
              <DataTableFacetedFilter
                column={table.getColumn("tags")}
                title="Etiquetas"
                options={getEmpresaTagsOptions(initialData)}
              />
            )}
            {/* DataTableFacetedFilter
              column={table.getColumn("tipo_sociedad")}
              title="Tipo Sociedad"
              options={empresasTipoSociedadOptions}
            */}
            {/* DataTableFacetedFilter
              column={table.getColumn("tamano_empresa")}
              title="Tamaño"
              options={empresasTamanoOptions}
            */}
            {/* DataTableFacetedFilter
              column={table.getColumn("sector_industria")}
              title="Sector"
              options={getEmpresaSectorOptions(initialData)}
            */}
            {/* DataTableFacetedFilter
              column={table.getColumn("ingresos_anuales")}
              title="Ingresos"
              options={empresasIngresosOptions}
            */}
            {/* DataTableFacetedFilter
              column={table.getColumn("numero_empleados")}
              title="Empleados"
              options={empresasEmpleadosOptions}
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
              title="Exportar Empresas"
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
          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <EmpresasDataTable table={table} router={router} />
          </div>

          {/* Pagination */}
          <div className="border-t bg-background p-2">
            <DataTablePagination table={table} />
          </div>

          {/* Floating Action Capsule */}
          <AnimatePresence>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <FloatingActionCapsule
                selectedCount={table.getFilteredSelectedRowModel().rows.length}
                selectedIds={table.getFilteredSelectedRowModel().rows.map((row: any) => row.original.id)}
                totalCount={table.getFilteredRowModel().rows.length}
                availableTags={availableTags}
                selectedRowsTags={table.getFilteredSelectedRowModel().rows.map((row: any) => (row.original as EmpresaList).tags || [])}
                onClearSelection={() => setRowSelection({})}
                onExport={() => setShowSelectionExport(true)}
                onToggleTag={async (tag: string, add: boolean) => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map((row: any) => row.original.id)
                  const result = await toggleTagsForActores(selectedIds, tag, add)
                  if (!result.success) {
                    console.error('Error toggling tag:', result.message)
                  }
                  // Refrescar datos invalidando query
                  await queryClient.invalidateQueries({ queryKey: ['empresas'] })
                }}
                onCreateTag={async (tag: string) => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map((row: any) => row.original.id)
                  const result = await createAndAssignTag(selectedIds, tag)
                  if (!result.success) {
                    console.error('Error creating tag:', result.message)
                  }
                  // Refrescar datos invalidando query
                  await queryClient.invalidateQueries({ queryKey: ['empresas'] })
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
