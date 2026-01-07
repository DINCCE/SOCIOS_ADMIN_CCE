"use client"

import { RotateCcw } from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"

interface DataTableResetFiltersProps<TData> {
  table: Table<TData>
}

export function DataTableResetFilters<TData>({
  table,
}: DataTableResetFiltersProps<TData>) {
  const handleReset = () => {
    table.resetColumnFilters()
  }

  return (
    <Button
      variant="ghost"
      className="h-8 px-2 lg:px-3"
      onClick={handleReset}
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      Reiniciar
    </Button>
  )
}
