'use client'

import { Table } from '@tanstack/react-table'
import type { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { OportunidadesDataTable } from './data-table'
import { OportunidadMobileCard } from './mobile-card'
import type { OportunidadView } from '@/components/procesos/oportunidades/oportunidades-board'

interface ResponsiveOportunidadDataTableProps {
  table: Table<OportunidadView>
  router: ReturnType<typeof useRouter>
}

/**
 * ResponsiveOportunidadDataTable - Wrapper that switches between table and card views
 *
 * On mobile (< 768px): Displays card-based layout for better readability
 * On desktop (>= 768px): Displays standard table view with all columns
 */
export function ResponsiveOportunidadDataTable({
  table,
  router,
}: ResponsiveOportunidadDataTableProps) {
  const isMobile = useIsMobile()

  // Mobile: Card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <OportunidadMobileCard
              key={row.id}
              oportunidad={row.original}
              isSelected={row.getIsSelected()}
              onToggleSelect={() => row.toggleSelected()}
              onClick={() => router.push(`/admin/procesos/oportunidades/${row.original.id}`)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No se encontraron resultados.
          </div>
        )}
      </div>
    )
  }

  // Desktop: Table view (with border container)
  return (
    <div className="overflow-x-auto">
      <div className="rounded-md border min-w-full">
        <OportunidadesDataTable table={table} router={router} />
      </div>
    </div>
  )
}
