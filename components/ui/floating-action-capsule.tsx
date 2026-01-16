"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Download, Tag, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BulkTagPopover } from "@/components/ui/bulk-tag-popover"
import { cn } from "@/lib/utils"

export interface FloatingActionCapsuleProps {
  selectedCount: number
  selectedIds: string[] // IDs de los elementos seleccionados
  totalCount: number
  // Opciones para el popover de etiquetas
  availableTags?: string[] // Etiquetas disponibles
  selectedRowsTags?: string[][] // Tags de cada fila seleccionada
  // Callbacks
  onExport?: () => void | Promise<void>
  onToggleTag?: (tag: string, add: boolean) => Promise<void> | void
  onCreateTag?: (tag: string) => Promise<void> | void
  onDelete?: () => void | Promise<void>
  onClearSelection: () => void
  className?: string
}

export function FloatingActionCapsule({
  selectedCount,
  selectedIds,
  totalCount,
  availableTags = [],
  selectedRowsTags = [],
  onExport,
  onToggleTag,
  onCreateTag,
  onDelete,
  onClearSelection,
  className,
}: FloatingActionCapsuleProps) {
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
      className="fixed bottom-8 left-[calc(50%+10.5rem)] z-50 -translate-x-1/2 group-has-[[data-collapsible=icon]]/sidebar-wrapper:left-[calc(50%+2.25rem)]"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {selectedCount} {selectedCount === 1 ? "fila seleccionada" : "filas seleccionadas"} de {totalCount}
      </div>

      {/* Action Capsule - Inverted design */}
      <div
        className={cn(
          // Layout
          "flex items-center h-12 px-1",
          // Shape and shadow
          "rounded-full shadow-lg",
          // INVERTED COLORS (theme-aware)
          "bg-foreground text-background",
          className
        )}
      >
        {/* ZONE A - Selection (left) */}
        <div className="pl-4 pr-2 flex items-center gap-3 border-r border-background/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (loadingAction === null) {
                onClearSelection()
              }
            }}
            disabled={loadingAction !== null}
            className="h-8 w-8 hover:bg-background/20 text-background"
            aria-label="Limpiar selección"
          >
            <X className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium tabular-nums">
            {selectedCount}
          </span>
        </div>

        {/* ZONE B - Primary Action (center) */}
        <div className="flex items-center px-2">
          {onToggleTag ? (
            <BulkTagPopover
              selectedIds={selectedIds}
              currentTags={availableTags}
              selectedRowsTags={selectedRowsTags}
              onToggleTag={onToggleTag}
              onCreateTag={onCreateTag || (() => {})}
              disabled={loadingAction !== null}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={loadingAction !== null || !onToggleTag}
              className="h-8 gap-2 text-background hover:bg-background/20 opacity-50 cursor-not-allowed"
              aria-label="Etiquetar no disponible"
            >
              <Tag className="h-4 w-4" />
              <span>Etiquetar</span>
            </Button>
          )}
        </div>

        {/* ZONE C - Secondary Actions (right) */}
        <div className="flex items-center gap-1 pl-2 pr-3 border-l border-background/20">
          {/* Export */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAction("export", onExport)}
            disabled={loadingAction !== null}
            className="h-8 w-8 text-background hover:bg-background/20"
            aria-label="Exportar selección"
          >
            {loadingAction === "export" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>

          {/* Delete - with destructive hover */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleAction("delete", onDelete)}
            disabled={loadingAction !== null}
            className="h-8 w-8 text-background hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Eliminar selección"
          >
            {loadingAction === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
