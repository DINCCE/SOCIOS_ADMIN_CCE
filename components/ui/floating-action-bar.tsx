"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Download, RefreshCw, Trash2, Tag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface FloatingActionBarProps {
  selectedCount: number
  totalCount: number
  onExport?: () => void | Promise<void>
  onChangeStatus?: () => void | Promise<void>
  onTag?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
  className?: string
}

export function FloatingActionBar({
  selectedCount,
  totalCount,
  onExport,
  onChangeStatus,
  onTag,
  onDelete,
  className,
}: FloatingActionBarProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null)

  const handleAction = async (
    action: string,
    callback?: () => void | Promise<void>
  ) => {
    if (!callback) return
    setLoadingAction(action)
    try {
      await callback()
    } finally {
      setLoadingAction(null)
    }
  }
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {selectedCount} {selectedCount === 1 ? "fila seleccionada" : "filas seleccionadas"} de {totalCount}
      </div>

      {/* Action bar */}
      <div
        className={cn(
          "mx-4 flex max-w-2xl items-center gap-4 rounded-full border border-border bg-background/80 px-6 py-3 shadow-2xl backdrop-blur-md",
          "sm:px-6 sm:py-3",
          className
        )}
      >
        {/* Selection count with pulsing dot */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-sm font-medium">
            {selectedCount} de {totalCount} seleccionado{selectedCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="h-6" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("export", onExport)}
            disabled={loadingAction !== null}
            className="h-8"
            aria-label="Exportar selección"
          >
            {loadingAction === "export" ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <Download className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          {/* Tag/Group Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("tag", onTag)}
            disabled={loadingAction !== null}
            className="h-8"
            aria-label="Etiquetar selección"
          >
            {loadingAction === "tag" ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <Tag className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Etiquetar</span>
          </Button>

          {/* Change Status Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction("status", onChangeStatus)}
            disabled={loadingAction !== null}
            className="h-8"
            aria-label="Cambiar estado"
          >
            {loadingAction === "status" ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Cambiar Estado</span>
          </Button>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction("delete", onDelete)}
            disabled={loadingAction !== null}
            className="h-8"
            aria-label="Eliminar selección"
          >
            {loadingAction === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
