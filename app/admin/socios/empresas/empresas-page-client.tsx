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
import type { EmpresaList } from '@/features/socios/types/socios-schema'
import { columns } from '@/features/socios/empresas/columns'
import { empresasEstadoOptions } from '@/lib/table-filters'

export function EmpresasPageClient() {
  const router = useRouter()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    // Columnas visibles (por defecto visibles, no se especifican aquí):
    // razon_social, nombre_comercial, nit_completo, email_principal, telefono_principal, tamano_empresa, estado
    codigo: false,
    tags: false,
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
        .select('id, codigo_bp, num_documento, digito_verificacion, razon_social, nombre_comercial, email_principal, telefono_principal, estado_actor, organizacion_id, es_socio, es_cliente, es_proveedor, eliminado_en, perfil_profesional_corporativo, nat_fiscal, regimen_tributario, creado_en, actualizado_en')
        .eq('tipo_actor', 'empresa')
        .order('razon_social', { ascending: true })

      if (queryError) {
        console.error('Query error:', queryError)
        throw queryError
      }

      // Transform to EmpresaList format
      const transformed = data?.map((actor: any) => {
        const perfilProfesional = actor.perfil_profesional_corporativo || {}
        return {
          id: actor.id,
          codigo: actor.codigo_bp,
          nit: actor.num_documento,
          digito_verificacion: actor.digito_verificacion || null,
          razon_social: actor.razon_social || '',
          nombre_comercial: actor.nombre_comercial || null,
          tipo_sociedad: actor.nat_fiscal || null,
          fecha_constitucion: null, // Not in selected fields
          ciudad_constitucion: null, // Not in selected fields
          pais_constitucion: null, // Not in selected fields
          numero_registro: null, // Not in selected fields
          codigo_ciiu: perfilProfesional.codigo_ciiu || null,
          sector_industria: perfilProfesional.sector_industria || null,
          actividad_economica: perfilProfesional.actividad_principal || null,
          tamano_empresa: perfilProfesional.tamano_empresa || null,
          representante_legal_id: null, // Not in selected fields
          cargo_representante: null, // Not in selected fields
          telefono_secundario: null, // Not in selected fields
          whatsapp: perfilProfesional.whatsapp || null,
          website: perfilProfesional.website || null,
          linkedin_url: perfilProfesional.linkedin_url || null,
          facebook_url: perfilProfesional.facebook_url || null,
          instagram_handle: perfilProfesional.instagram_handle || null,
          twitter_handle: perfilProfesional.twitter_handle || null,
          logo_url: perfilProfesional.logo_url || null,
          ingresos_anuales: perfilProfesional.ingresos_anuales || null,
          numero_empleados: perfilProfesional.numero_empleados || null,
          atributos: null, // Not in selected fields
          creado_en: actor.creado_en || new Date().toISOString(),
          actualizado_en: actor.actualizado_en || new Date().toISOString(),
          organizacion_id: actor.organizacion_id,
          tipo_actor: actor.tipo_actor,
          estado: actor.estado_actor,
          email_principal: actor.email_principal,
          telefono_principal: actor.telefono_principal,
          bp_creado_en: actor.creado_en || new Date().toISOString(),
          bp_actualizado_en: actor.actualizado_en || new Date().toISOString(),
          eliminado_en: actor.eliminado_en,
          organizacion_nombre: '', // Not in selected fields
          nit_completo: actor.digito_verificacion
            ? `${actor.num_documento}-${actor.digito_verificacion}`
            : actor.num_documento,
          nombre_representante_legal: null, // Not in selected fields
          tags: [], // Not in v_actores_org
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
      // Buscar en NIT (campo 'nit' en EmpresaList)
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
            {/* DataTableFacetedFilter
              column={table.getColumn("tags")}
              title="Etiquetas"
              options={getEmpresaTagsOptions(initialData)}
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
