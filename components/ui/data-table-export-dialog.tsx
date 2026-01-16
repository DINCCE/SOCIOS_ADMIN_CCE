'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download, FileSpreadsheet, Check, Loader2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableExportDialogProps {
  trigger?: React.ReactNode // Optional: if not provided, requires open/onOpenChange
  open?: boolean // Controlled state
  onOpenChange?: (open: boolean) => void // Controlled state change handler
  title?: string
  description?: string
  columns: Array<{ id: string; label: string }>
  totalRows?: number
  isLoading?: boolean
  onExport: (options: {
    format: 'csv' | 'xlsx'
    selectedColumns: string[]
  }) => void | Promise<void>
}

export function DataTableExportDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title = 'Exportar datos',
  description,
  columns,
  totalRows,
  isLoading = false,
  onExport,
}: DataTableExportDialogProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [format, setFormat] = React.useState<'csv' | 'xlsx'>('csv')
  const [exportAll, setExportAll] = React.useState(true)
  const [isExporting, setIsExporting] = React.useState(false)

  const allColumnIds = React.useMemo(() => columns.map((col) => col.id), [columns])
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(allColumnIds)

  // Auto-select all when exportAll changes to true
  React.useEffect(() => {
    if (exportAll) {
      setSelectedColumns(allColumnIds)
    }
  }, [exportAll, allColumnIds])

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) => {
      const newSelection = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]

      const allSelected = newSelection.length === columns.length
      if (allSelected !== exportAll) {
        setExportAll(allSelected)
      }

      return newSelection
    })
  }

  const handleSelectAll = () => {
    setSelectedColumns(allColumnIds)
    setExportAll(true)
  }

  const handleDeselectAll = () => {
    setSelectedColumns([])
    setExportAll(false)
  }

  const handleExport = async () => {
    if (isExporting) return

    const columnsToExport = exportAll ? allColumnIds : selectedColumns
    if (columnsToExport.length === 0) return

    setIsExporting(true)
    try {
      await onExport({
        format,
        selectedColumns: columnsToExport,
      })
      setOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild disabled={isLoading}>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {description || 'Selecciona el formato y columnas a exportar'}
            {totalRows !== undefined && (
              <Badge variant="secondary">
                {totalRows.toLocaleString()} {totalRows === 1 ? 'fila' : 'filas'}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section A: Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formato de exportación</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as 'csv' | 'xlsx')}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* CSV Card */}
                <div className="relative">
                  <RadioGroupItem value="csv" id="csv" className="sr-only" />
                  <Label
                    htmlFor="csv"
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-4 transition-all',
                      'hover:bg-accent/50',
                      format === 'csv'
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-semibold">CSV</span>
                      {format === 'csv' && (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Valores separados por comas
                    </span>
                  </Label>
                </div>

                {/* Excel Card */}
                <div className="relative">
                  <RadioGroupItem value="xlsx" id="xlsx" className="sr-only" />
                  <Label
                    htmlFor="xlsx"
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-4 transition-all',
                      'hover:bg-accent/50',
                      format === 'xlsx'
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      <span className="font-semibold">Excel</span>
                      {format === 'xlsx' && (
                        <Check className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Libro de Excel (.xlsx)
                    </span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Section B: Column Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="export-all" className="text-base font-semibold">
                  Columnas a exportar
                </Label>
                <p className="text-sm text-muted-foreground">
                  {exportAll
                    ? `Todas las ${columns.length} columnas seleccionadas`
                    : `${selectedColumns.length} de ${columns.length} columnas`}
                </p>
              </div>
              <Switch
                id="export-all"
                checked={exportAll}
                onCheckedChange={setExportAll}
              />
            </div>

            {/* Conditional Column Checkboxes */}
            {!exportAll && (
              <ScrollArea className="max-h-48 w-full rounded-md border bg-muted/30 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Seleccionar columnas
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSelectAll}
                      >
                        Todo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleDeselectAll}
                      >
                        Ninguno
                      </Button>
                    </div>
                  </div>
                  {columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-3"
                    >
                      <Checkbox
                        id={column.id}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => handleColumnToggle(column.id)}
                      />
                      <Label
                        htmlFor={column.id}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting || (!exportAll && selectedColumns.length === 0)
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Screen reader announcements */}
        <div role="status" aria-live="polite" className="sr-only">
          {isExporting && 'Exportando datos...'}
        </div>
      </DialogContent>
    </Dialog>
  )
}
