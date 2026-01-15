'use client'

import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TrDocComercialEstados } from '@/lib/db-types'
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
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types_db'

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

type EstadoOportunidad = TrDocComercialEstados

const ESTADO_CONFIG: Record<
  EstadoOportunidad,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  Nueva: { label: 'Nueva', variant: 'default' },
  'En Progreso': { label: 'En Progreso', variant: 'secondary' },
  Ganada: { label: 'Ganada', variant: 'default' },
  Pérdida: { label: 'Pérdida', variant: 'destructive' },
  Descartada: { label: 'Descartada', variant: 'outline' },
}

export function OportunidadesList() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as 'list' | 'board') || 'list'

  const { data: oportunidades, isLoading } = useQuery({
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
            <TableHead>Código</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {oportunidades?.map((oportunidad) => (
            <TableRow
              key={oportunidad.id}
              onClick={() => {
                // TODO: Open drawer for editing
                console.log('Edit oportunidad:', oportunidad.id)
              }}
            >
              <TableCell className="font-mono text-xs">
                {oportunidad.codigo}
              </TableCell>
              <TableCell className="font-medium">
                {oportunidad.tipo}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <span className="text-sm">
                    {oportunidad.solicitante_codigo_bp}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {oportunidad.solicitante_nombre}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={ESTADO_CONFIG[oportunidad.estado as EstadoOportunidad].variant}>
                  {ESTADO_CONFIG[oportunidad.estado as EstadoOportunidad].label}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {oportunidad.monto_estimado ? (
                  formatCurrency(oportunidad.monto_estimado)
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(oportunidad.fecha_solicitud).toLocaleDateString('es-CO')}
              </TableCell>
            </TableRow>
          ))}
          {oportunidades?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay oportunidades registradas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
