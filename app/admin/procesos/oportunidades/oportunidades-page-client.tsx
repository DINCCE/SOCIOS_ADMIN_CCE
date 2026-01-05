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
import { Plus, Search, MoreHorizontal } from 'lucide-react'

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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { formatCurrency, formatDocumentId } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { DataTableColumnHeader } from '@/features/socios/components/data-table-column-header'
import { DataId } from '@/components/ui/data-id'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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
  { label: string; className: string }
> = {
  abierta: { label: 'Abierta', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  en_proceso: { label: 'En Proceso', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  ganada: { label: 'Ganada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  perdida: { label: 'Perdida', className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
  cancelada: { label: 'Cancelada', className: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' },
}

const columns: ColumnDef<OportunidadView>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todas"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
  {
    accessorKey: 'codigo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" className="text-left" />,
    cell: ({ row }) => (
      <div className="font-mono text-xs text-left">
        {formatDocumentId(row.getValue('codigo'))}
      </div>
    ),
    meta: { size: 140 },
  },
  {
    accessorKey: 'tipo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" className="text-left" />,
    cell: ({ row }) => <div className="font-medium text-left">{row.getValue('tipo')}</div>,
    meta: { size: 140 },
  },
  {
    accessorKey: 'solicitante_nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitante" />,
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <CopyableCell value={row.original.solicitante_codigo_bp} className="text-xs font-mono" />
        <span className="block text-xs text-muted-foreground">{row.getValue('solicitante_nombre')}</span>
      </div>
    ),
    meta: { size: 180 },
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="text-left" />,
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoOportunidad
      const config = ESTADO_CONFIG[estado]
      return (
        <div className="flex justify-start">
          <Badge className={`border ${config.className}`}>{config.label}</Badge>
        </div>
      )
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'monto_estimado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" className="text-left" />,
    cell: ({ row }) => {
      const monto = row.getValue('monto_estimado') as number | null
      return (
        <div className="text-left">
          {monto ? formatCurrency(monto) : '-'}
        </div>
      )
    },
    meta: { size: 120 },
  },
  {
    accessorKey: 'fecha_solicitud',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" className="text-left" />,
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('fecha_solicitud'))
      return <div className="text-xs text-muted-foreground text-left">{fecha.toLocaleDateString('es-CO')}</div>
    },
    meta: { size: 110 },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const oportunidad = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(oportunidad.id)
              }}
            >
              Copiar ID: <DataId className="ml-1">{oportunidad.id.substring(0, 8)}...</DataId>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
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
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              colSpan={header.colSpan}
                              style={{ width: header.getSize() }}
                              className={cn(
                                "relative group whitespace-nowrap",
                                header.column.getCanSort() && "cursor-pointer select-none"
                              )}
                            >
                              <div className="flex items-center">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())
                                }
                              </div>

                              {/* Column Resize Handle */}
                              {header.column.getCanResize() && (
                                <div
                                  onMouseDown={header.getResizeHandler()}
                                  onTouchStart={header.getResizeHandler()}
                                  className={cn(
                                    "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-opacity",
                                    "bg-primary/20 opacity-0 group-hover:opacity-100",
                                    header.column.getIsResizing() && "bg-primary opacity-100"
                                  )}
                                />
                              )}
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
            )
          )}
        </div>
      </PageContent>
    </PageShell>
  )
}
