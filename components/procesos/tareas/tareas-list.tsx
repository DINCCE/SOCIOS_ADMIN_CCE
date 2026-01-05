'use client'

import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
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

export function TareasList() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const { data: tareas, isLoading } = useQuery({
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

  if (view !== 'list') return null

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="h-10 bg-muted/40 animate-pulse" />
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse bg-muted/20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox />
            </TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Asignado</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Relacionado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tareas?.map((tarea) => {
            const EstadoIcon = ESTADO_CONFIG[tarea.estado as EstadoTarea].icon
            const PrioridadIcon = PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].icon

            return (
              <TableRow
                key={tarea.id}
                onClick={() => {
                  // TODO: Open drawer for editing
                  console.log('Edit tarea:', tarea.id)
                }}
              >
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="space-y-0.5">
                    <span className="text-sm">{tarea.titulo}</span>
                    {tarea.descripcion && (
                      <span className="block text-xs text-muted-foreground line-clamp-1">
                        {tarea.descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ESTADO_CONFIG[tarea.estado as EstadoTarea].variant} className="gap-1">
                    <EstadoIcon className="h-3 w-3" />
                    {ESTADO_CONFIG[tarea.estado as EstadoTarea].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].bgColor}`}>
                    <PrioridadIcon className={`h-3 w-3 ${PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].color}`} />
                    <span className={`text-xs font-medium ${PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].color}`}>
                      {PRIORIDAD_CONFIG[tarea.prioridad as PrioridadTarea].label}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {tarea.asignado_email ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <div className="h-full w-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {tarea.asignado_email.charAt(0).toUpperCase()}
                        </div>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {tarea.asignado_email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {tarea.fecha_vencimiento ? (
                    new Date(tarea.fecha_vencimiento).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {tarea.relacionado_codigo_bp && (
                      <span className="bg-muted px-2 py-1 rounded text-xs">
                        {tarea.relacionado_codigo_bp}
                      </span>
                    )}
                    {tarea.oportunidad_codigo && (
                      <span className="bg-muted px-2 py-1 rounded text-xs">
                        {tarea.oportunidad_codigo}
                      </span>
                    )}
                    {!tarea.relacionado_codigo_bp && !tarea.oportunidad_codigo && (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {tareas?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No hay tareas registradas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
