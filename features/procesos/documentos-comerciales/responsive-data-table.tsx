'use client'

import { Table } from '@tanstack/react-table'
import type { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { DocComercialesDataTable } from './data-table'
import { DocComercialMobileCard } from './mobile-card'
import type { DocumentoComercialView } from './columns'

interface ResponsiveDocComercialesDataTableProps {
  table: Table<DocumentoComercialView>
  router: ReturnType<typeof useRouter>
}

/**
 * ResponsiveDocComercialesDataTable - Wrapper that switches between table and card views
 *
 * On mobile (< 768px): Displays card-based layout for better readability
 * On desktop (>= 768px): Displays standard table view with all columns
 */
export function ResponsiveDocComercialesDataTable({
  table,
  router,
}: ResponsiveDocComercialesDataTableProps) {
  const isMobile = useIsMobile()

  // Mobile: Card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <DocComercialMobileCard
              key={row.id}
              docComercial={row.original}
              isSelected={row.getIsSelected()}
              onToggleSelect={() => row.toggleSelected()}
              onClick={() => router.push(`/admin/procesos/documentos-comerciales/${row.original.id}`)}
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
    <div className="overflow-x-auto max-w-full">
      <div className="rounded-md border min-w-full">
        <DocComercialesDataTable table={table} router={router} />
      </div>
    </div>
  )
}
