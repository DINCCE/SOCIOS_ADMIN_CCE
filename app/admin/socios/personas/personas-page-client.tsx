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
import { PersonasDataTable } from '@/features/socios/personas/data-table'
import { NewPersonSheet } from '@/components/socios/personas/new-person-sheet'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableFacetedFilter } from '@/features/socios/components/data-table-faceted-filter'
import { DataTableResetFilters } from '@/features/socios/components/data-table-reset-filters'
import { FloatingActionBar } from '@/components/ui/floating-action-bar'
import { Separator } from '@/components/ui/separator'
import type { PersonaList } from '@/features/socios/types/socios-schema'
import { columns } from '@/features/socios/personas/columns'
import { personasEstadoOptions } from '@/lib/table-filters'

export function PersonasPageClient() {
  const router = useRouter()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    codigo: false,
    tags: false, // Tags column hidden since dm_actores doesn't have a tags field
    // Campos no disponibles en v_actores_org (ocultos temporalmente):
    // tipo_documento, genero, fecha_nacimiento, nacionalidad, tipo_sangre,
    // eps, ocupacion, fecha_socio, estado_vital, whatsapp, organizacion_nombre
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Client-side data fetching
  const { data: initialData = [], isLoading, error } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('dm_actores')
        .select('id, codigo_bp, primer_nombre, primer_apellido, num_documento, email_principal, telefono_principal, estado_actor, organizacion_id, es_socio, es_cliente, es_proveedor, eliminado_en')
        .eq('tipo_actor', 'persona')
        .is('eliminado_en', null)
        .order('primer_apellido', { ascending: true })

      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }

      // Transform to PersonaList format
      const transformed = data?.map((actor: any) => ({
        id: actor.id,
        codigo: actor.codigo_bp,
        nombre: `${actor.primer_nombre || ''} ${actor.primer_apellido || ''}`.trim(),
        identificacion: actor.num_documento,
        tipo_actor: actor.tipo_actor,
        email: actor.email_principal,
        telefono: actor.telefono_principal,
        estado: actor.estado_actor,
        organizacion_id: actor.organizacion_id,
        es_socio: actor.es_socio,
        es_cliente: actor.es_cliente,
        es_proveedor: actor.es_proveedor,
        eliminado_en: actor.eliminado_en,
        foto_url: null, // Not in selected fields
      })) || []

      return transformed as PersonaList[]
    },
  })

  // Global search filter
  const filteredData = React.useMemo(() => {
    if (!globalSearch) return initialData

    const searchLower = globalSearch.toLowerCase()
    return initialData.filter((persona) => {
      // Buscar en nombre completo (campo 'nombre' en v_actores_org)
      if (persona.nombre?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en número de documento (campo 'identificacion' en v_actores_org)
      if (persona.identificacion?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en email principal (campo 'email' en v_actores_org)
      if (persona.email?.toLowerCase().includes(searchLower)) {
        return true
      }
      // Buscar en teléfono principal (campo 'telefono' en v_actores_org)
      if (persona.telefono?.toLowerCase().includes(searchLower)) {
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
        actions={<NewPersonSheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <div className="relative w-64 lg:w-80">
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
              column={table.getColumn("estado")}
              title="Estado"
              options={personasEstadoOptions}
            />
            {/* DataTableFacetedFilter
              column={table.getColumn("tipo_documento")}
              title="Tipo Doc."
              options={personasTipoDocOptions}
            */}
            {/* DataTableFacetedFilter
              column={table.getColumn("tags")}
              title="Etiquetas"
              options={getPersonaTagsOptions(initialData)}
            */}
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
            <PersonasDataTable table={table} router={router} />
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
