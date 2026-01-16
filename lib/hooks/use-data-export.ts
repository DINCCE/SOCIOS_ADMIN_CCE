'use client'

import * as XLSX from 'xlsx'

export interface ExportOptions {
  format: 'csv' | 'xlsx'
  columns: Array<{ id: string; label: string }>
  selectedColumns: string[]
  filename?: string
}

export function useDataExport() {
  const exportData = <T extends Record<string, any>>(
    data: T[],
    options: ExportOptions
  ) => {
    const { format, columns, selectedColumns, filename } = options

    // Transform data: map selected columns to labels
    const transformedData = data.map((row) => {
      const obj: Record<string, any> = {}
      selectedColumns.forEach((colId) => {
        const column = columns.find((c) => c.id === colId)
        if (column) {
          obj[column.label] = row[colId]
        }
      })
      return obj
    })

    // Generate worksheet
    const worksheet = XLSX.utils.json_to_sheet(transformedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

    // Generate file based on format
    const extension = format === 'csv' ? 'csv' : 'xlsx'
    const defaultFilename = `export-${Date.now()}.${extension}`

    if (format === 'csv') {
      // XLSX library also supports CSV
      XLSX.writeFile(workbook, filename || defaultFilename, { bookType: 'csv' })
    } else {
      XLSX.writeFile(workbook, filename || defaultFilename, { bookType: 'xlsx' })
    }
  }

  return { exportData }
}
