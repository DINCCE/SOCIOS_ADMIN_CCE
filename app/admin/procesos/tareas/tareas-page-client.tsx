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
import {
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle2,
  ArrowUpDown,
  AlertCircle,
  AlertTriangle,
  Clock,
  XCircle,
} from 'lucide-react'

import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'
import { ViewToggle } from '@/components/procesos/view-toggle'
import { TareasBoard } from '@/components/procesos/tareas/tareas-board'
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
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataId } from '@/components/ui/data-id'
import type { Database } from '@/types_db'
import { CopyableCell } from '@/components/ui/copyable-cell'
import { DataTableColumnHeader } from '@/features/socios/components/data-table-column-header'
import { cn } from '@/lib/utils'

type TareaView = {
  id: string
  titulo: string
  descripcion: string | null
  estado: string
  prioridad: string
  fecha_vencimiento: string | null
  organizacion_id: string
  organizacion_nombre: string
  asignado_a: string | null
  asignado_email: string | null
  oportunidad_id: string | null
  oportunidad_codigo: string | null
  oportunidad_estado: string | null
  relacionado_con_bp: string | null
  relacionado_codigo_bp: string | null
  relacionado_nombre: string | null
  creado_en: string
  eliminado_en: string | null
}

type EstadoTarea = Database['public']['Enums']['estado_tarea_enum']
type PrioridadTarea = Database['public']['Enums']['prioridad_tarea_enum']

const ESTADO_CONFIG: Record<
  EstadoTarea,
  { label: string; className: string; icon: any }
> = {
  pendiente: { label: 'Pendiente', className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100', icon: Clock },
  en_progreso: { label: 'En Progreso', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', icon: AlertCircle },
  bloqueada: { label: 'Bloqueada', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', icon: AlertTriangle },
  hecha: { label: 'Hecha', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', className: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100', icon: XCircle },
}

const PRIORIDAD_CONFIG: Record<
  PrioridadTarea,
  { label: string; className: string; icon: any }
> = {
  critica: {
    label: 'Crítica',
    className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    icon: AlertCircle
  },
  alta: {
    label: 'Alta',
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    icon: AlertTriangle
  },
  media: {
    label: 'Media',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: Clock
  },
  baja: {
    label: 'Baja',
    className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
    icon: Clock
  },
}

const columns: ColumnDef<TareaView>[] = [
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
    accessorKey: 'titulo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <span className="text-sm font-medium">{row.getValue('titulo')}</span>
        {row.original.descripcion && (
          <span className="block text-xs text-muted-foreground line-clamp-1">
            {row.original.descripcion}
          </span>
        )}
      </div>
    ),
    meta: { size: 280 },
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="text-left" />,
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoTarea
      const config = ESTADO_CONFIG[estado]
      const EstadoIcon = config.icon
      return (
        <div className="flex justify-start">
          <Badge className={`gap-1 border ${config.className}`}>
            <EstadoIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      )
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'prioridad',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridad" className="text-left" />,
    cell: ({ row }) => {
      const prioridad = row.getValue('prioridad') as PrioridadTarea
      const config = PRIORIDAD_CONFIG[prioridad]
      const PrioridadIcon = config.icon
      return (
        <div className="flex justify-start">
          <Badge className={`gap-1 border ${config.className}`}>
            <PrioridadIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      )
    },
    meta: { size: 110 },
  },
  {
    accessorKey: 'asignado_email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Asignado" />,
    cell: ({ row }) => {
      const email = row.original.asignado_email
      return (
        <>
          {email ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <div className="h-full w-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {email.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <CopyableCell value={email} className="text-xs text-muted-foreground" />
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </>
      )
    },
    meta: { size: 200 },
  },
  {
    accessorKey: 'fecha_vencimiento',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_vencimiento') as string | null
      return (
        <div className="text-xs text-muted-foreground">
          {fecha ? new Date(fecha).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) : '-'}
        </div>
      )
    },
    meta: { size: 120 },
  },
  {
    accessorKey: 'relacionado',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Relacionado" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.relacionado_codigo_bp && (
          <CopyableCell value={row.original.relacionado_codigo_bp} className="bg-muted px-2 py-1 rounded text-xs" />
        )}
        {row.original.oportunidad_codigo && (
          <CopyableCell value={row.original.oportunidad_codigo} className="bg-muted px-2 py-1 rounded text-xs" />
        )}
        {!row.original.relacionado_codigo_bp && !row.original.oportunidad_codigo && (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>
    ),
    meta: { size: 160 },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const tarea = row.original
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
                navigator.clipboard.writeText(tarea.id)
              }}
            >
              Copiar ID: <DataId className="ml-1">{tarea.id.substring(0, 8)}...</DataId>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar como hecha
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Cambiar prioridad
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

export function TareasPageClient() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    select: true,
    descripcion: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: tareas = [], isLoading } = useQuery({
    queryKey: ['tareas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tareas_view')
        .select('*')
        .is('eliminado_en', null)
        .order('fecha_vencimiento', { ascending: true })

      if (error) throw error
      return data as TareaView[]
    },
  })

  const table = useReactTable({
    data: tareas,
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
        metadata={`${tareas.length} total`}
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
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={(table.getColumn('titulo')?.getFilterValue() as string) ?? ''}
                onChange={(e) => table.getColumn('titulo')?.setFilterValue(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Select
              value={(table.getColumn('prioridad')?.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) => table.getColumn('prioridad')?.setFilterValue(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
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
                            data-state={row.getIsSelected() && "selected"}
                            className="group cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => console.log('Edit tarea:', row.original.id)}
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
                            No hay tareas registradas
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
