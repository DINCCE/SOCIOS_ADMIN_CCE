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
import { Search } from 'lucide-react'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { OportunidadesBoard } from '@/components/procesos/oportunidades/oportunidades-board'
import { OportunidadesDataTable } from '@/components/procesos/oportunidades/oportunidades-data-table'
import { NewOportunidadSheet } from '@/components/procesos/oportunidades/new-oportunidad-sheet'
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
import { Skeleton } from '@/components/ui/skeleton'
import { columns, type OportunidadView } from '@/features/procesos/oportunidades/columns'

export function OportunidadesPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'fecha_solicitud', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: oportunidades = [], isLoading } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('v_oportunidades_org')
        .select('*')
        .order('fecha_solicitud', { ascending: false })

      if (error) throw error
      return data as OportunidadView[]
    },
  })

  const table = useReactTable({
    data: oportunidades,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
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
        title="Oportunidades"
        description="Gestiona las oportunidades de negocio y solicitudes"
        metadata={`${oportunidades.length} total`}
        actions={<NewOportunidadSheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar oportunidades..."
                value={(table.getColumn('solicitante_nombre')?.getFilterValue() as string) ?? ''}
                onChange={(e) => table.getColumn('solicitante_nombre')?.setFilterValue(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Select
              value={(table.getColumn('estado')?.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) => table.getColumn('estado')?.setFilterValue(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="ganada">Ganada</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
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
        <div className="flex-1 overflow-hidden bg-background relative flex flex-col">
          {view === 'board' ? (
            /* KANBAN: Mantiene h-full absoluto para el canvas */
            <OportunidadesBoard />
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
                <div className="overflow-auto rounded-md border">
                  <OportunidadesDataTable table={table} router={router} />
                </div>
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
