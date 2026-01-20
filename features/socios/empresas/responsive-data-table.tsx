'use client'

import { Table } from '@tanstack/react-table'
import type { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { EmpresasDataTable } from './data-table'
import { EmpresaMobileCard } from './mobile-card'
import type { EmpresaList } from '../types/socios-schema'

interface ResponsiveEmpresaDataTableProps {
  table: Table<EmpresaList>
  router: ReturnType<typeof useRouter>
}

/**
 * ResponsiveEmpresaDataTable - Wrapper that switches between table and card views
 *
 * On mobile (< 768px): Displays card-based layout for better readability
 * On desktop (>= 768px): Displays standard table view with all columns
 */
export function ResponsiveEmpresaDataTable({
  table,
  router,
}: ResponsiveEmpresaDataTableProps) {
  const isMobile = useIsMobile()

  // Mobile: Card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <EmpresaMobileCard
              key={row.id}
              empresa={row.original}
              isSelected={row.getIsSelected()}
              onToggleSelect={() => row.toggleSelected()}
              onClick={() => router.push(`/admin/socios/empresas/${row.original.id}`)}
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
        <EmpresasDataTable table={table} router={router} />
      </div>
    </div>
  )
}
