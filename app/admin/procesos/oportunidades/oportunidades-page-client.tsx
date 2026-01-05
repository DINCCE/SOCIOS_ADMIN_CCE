'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
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
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { OportunidadesBoard } from '@/components/procesos/oportunidades/oportunidades-board'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type OportunidadView = {
  id: string
  codigo: string
  tipo: string
  estado: string
  fecha_solicitud: string
  monto_estimado: number | null
  notas: string | null
  organizacion_id: string
  organizacion_nombre: string
  solicitante_id: string
  solicitante_codigo_bp: string
  solicitante_nombre: string
  responsable_id: string | null
  responsable_email: string | null
  creado_en: string
  eliminado_en: string | null
}

type EstadoOportunidad = 'abierta' | 'en_proceso' | 'ganada' | 'perdida' | 'cancelada'

const ESTADO_CONFIG: Record<
  EstadoOportunidad,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  abierta: { label: 'Abierta', variant: 'default' },
  en_proceso: { label: 'En Proceso', variant: 'secondary' },
  ganada: { label: 'Ganada', variant: 'default' },
  perdida: { label: 'Perdida', variant: 'destructive' },
  cancelada: { label: 'Cancelada', variant: 'outline' },
}

const columns: ColumnDef<OportunidadView>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('codigo')}</div>,
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => <div className="font-medium">{row.getValue('tipo')}</div>,
  },
  {
    accessorKey: 'solicitante_nombre',
    header: 'Solicitante',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <span className="text-sm">{row.original.solicitante_codigo_bp}</span>
        <span className="block text-xs text-muted-foreground">{row.getValue('solicitante_nombre')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoOportunidad
      return <Badge variant={ESTADO_CONFIG[estado].variant}>{ESTADO_CONFIG[estado].label}</Badge>
    },
  },
  {
    accessorKey: 'monto_estimado',
    header: 'Monto',
    cell: ({ row }) => {
      const monto = row.getValue('monto_estimado') as number | null
      return (
        <div className="text-right font-mono">
          {monto ? formatCurrency(monto) : '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'fecha_solicitud',
    header: 'Fecha',
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('fecha_solicitud'))
      return <div className="text-xs text-muted-foreground">{fecha.toLocaleDateString('es-CO')}</div>
    },
  },
]

export function OportunidadesPageClient() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: oportunidades = [], isLoading } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('oportunidades_view')
        .select('*')
        .is('eliminado_en', null)
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
        actions={
          <Button size="sm" className="h-8 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Oportunidad
          </Button>
        }
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
        {view === 'board' ? (
          <OportunidadesBoard />
        ) : (
          <div className="flex flex-col h-full">
            {isLoading ? (
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
                <div className="flex-1 overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())
                              }
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="group cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => console.log('Edit oportunidad:', row.original.id)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                            No hay oportunidades registradas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination Footer */}
                <div className="border-t bg-background p-2">
                  <DataTablePagination table={table} />
                </div>
              </>
            )}
          </div>
        )}
      </PageContent>
    </PageShell>
  )
}
