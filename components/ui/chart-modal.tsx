"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ChartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * ChartModal - Reusable modal component for displaying expanded charts
 *
 * Matches the styling of TareaDetailDialog with:
 * - Backdrop blur overlay
 * - Max width 5xl with 70vh height
 * - Shadow and rounded corners
 * - Custom close button
 */
export function ChartModal({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  actions,
  className,
}: ChartModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-background/40" />
        <DialogContent
          className={cn(
            "max-w-5xl h-[70vh] border border-border/50 shadow-2xl rounded-xl overflow-hidden p-0 [&>button:last-child]:hidden",
            className
          )}
        >
          {/* DialogTitle for accessibility - hidden from visual display */}
          <DialogTitle className="sr-only">{title}</DialogTitle>

          {/* Header with title and actions (toggle + close button) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </DialogClose>
            </div>
          </div>

          {/* Chart content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
