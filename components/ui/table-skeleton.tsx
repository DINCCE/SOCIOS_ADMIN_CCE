"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { TableRow, TableCell } from "@/components/ui/table"

export interface TableSkeletonProps {
  columns: number
  rows?: number
  showCheckbox?: boolean
  showBadge?: boolean
  showDataId?: boolean
}

export function TableSkeleton({
  columns,
  rows = 5,
  showCheckbox = true,
  showBadge = false,
  showDataId = false,
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => {
            // First column: Checkbox
            if (colIndex === 0 && showCheckbox) {
              return (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
              )
            }

            // Second column: DataId (monospace)
            if (colIndex === 1 && showDataId) {
              return (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-24 rounded font-mono" />
                </TableCell>
              )
            }

            // Badge column (pill-shaped)
            if (showBadge && colIndex === columns - 2) {
              return (
                <TableCell key={colIndex}>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
              )
            }

            // Default: Text content
            return (
              <TableCell key={colIndex}>
                <Skeleton
                  className="h-4 rounded"
                  style={{
                    width: `${Math.floor(Math.random() * 40) + 60}%`,
                  }}
                />
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}

export interface DataTableSkeletonProps {
  columnCount: number
  rowCount?: number
  showCheckbox?: boolean
  showBadge?: boolean
  showDataId?: boolean
}

/**
 * Pre-configured skeleton for data tables with common patterns
 */
export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  showCheckbox = true,
  showBadge = true,
  showDataId = true,
}: DataTableSkeletonProps) {
  return (
    <TableSkeleton
      columns={columnCount}
      rows={rowCount}
      showCheckbox={showCheckbox}
      showBadge={showBadge}
      showDataId={showDataId}
    />
  )
}
