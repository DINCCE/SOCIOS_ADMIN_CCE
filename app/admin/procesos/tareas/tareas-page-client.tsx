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
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import type { Database } from '@/types_db'

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
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }
> = {
  pendiente: { label: 'Pendiente', variant: 'default', icon: Clock },
  en_progreso: { label: 'En Progreso', variant: 'secondary', icon: AlertCircle },
  bloqueada: { label: 'Bloqueada', variant: 'secondary', icon: AlertTriangle },
  hecha: { label: 'Hecha', variant: 'default', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', variant: 'outline', icon: XCircle },
}

const PRIORIDAD_CONFIG: Record<
  PrioridadTarea,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  critica: {
    label: 'Crítica',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: AlertCircle
  },
  alta: {
    label: 'Alta',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: AlertTriangle
  },
  media: {
    label: 'Media',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Clock
  },
  baja: {
    label: 'Baja',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: Clock
  },
}

const columns: ColumnDef<TareaView>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'titulo',
    header: 'Título',
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
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.getValue('estado') as EstadoTarea
      const config = ESTADO_CONFIG[estado]
      const EstadoIcon = config.icon
      return (
        <Badge variant={config.variant} className="gap-1">
          <EstadoIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'prioridad',
    header: 'Prioridad',
    cell: ({ row }) => {
      const prioridad = row.getValue('prioridad') as PrioridadTarea
      const config = PRIORIDAD_CONFIG[prioridad]
      const PrioridadIcon = config.icon
      return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${config.bgColor}`}>
          <PrioridadIcon className={`h-3 w-3 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'asignado_email',
    header: 'Asignado',
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
              <span className="text-xs text-muted-foreground">{email}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </>
      )
    },
  },
  {
    accessorKey: 'fecha_vencimiento',
    header: 'Vencimiento',
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
  },
  {
    accessorKey: 'relacionado',
    header: 'Relacionado',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.relacionado_codigo_bp && (
          <span className="bg-muted px-2 py-1 rounded text-xs">
            {row.original.relacionado_codigo_bp}
          </span>
        )}
        {row.original.oportunidad_codigo && (
          <span className="bg-muted px-2 py-1 rounded text-xs">
            {row.original.oportunidad_codigo}
          </span>
        )}
        {!row.original.relacionado_codigo_bp && !row.original.oportunidad_codigo && (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </div>
    ),
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
        {view === 'board' ? (
          <TareasBoard />
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
            )}
          </div>
        )}
      </PageContent>
    </PageShell>
  )
}
