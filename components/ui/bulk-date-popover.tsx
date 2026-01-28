"use client"

import * as React from "react"
import { Calendar, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface BulkDatePopoverProps {
  selectedIds: string[]
  selectedRowsDates: (string | null)[]
  onSelectDate: (date: string | null) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
}

/**
 * BulkDatePopover - Popover para modificar fecha de vencimiento en batch
 *
 * Uses the approved DatePicker component
 * Format: yyyy-MM-dd (PostgreSQL date type, no timezone issues)
 */
export function BulkDatePopover({
  selectedIds,
  selectedRowsDates,
  onSelectDate,
  disabled = false,
  placeholder = "Fecha",
}: BulkDatePopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = React.useState(false)

  // Get predominant date for display
  const predominantDate = React.useMemo(() => {
    if (selectedRowsDates.length === 0) return undefined
    const dateCounts = new Map<string, number>()
    selectedRowsDates.forEach((d) => {
      if (d) dateCounts.set(d, (dateCounts.get(d) || 0) + 1)
    })
    let maxCount = 0
    let predDate: string | undefined
    dateCounts.forEach((count, d) => {
      if (count > maxCount) {
        maxCount = count
        predDate = d
      }
    })
    return predDate
  }, [selectedRowsDates])

  const handleSelectDate = async (selectedDate: string | undefined) => {
    if (disabled || isSaving) return

    setIsSaving(true)
    try {
      await onSelectDate(selectedDate || null)
      setOpen(false)
      setDate(undefined)
    } catch (error) {
      console.error("Error selecting date:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearDate = async () => {
    if (disabled || isSaving) return

    setIsSaving(true)
    try {
      await onSelectDate(null)
      setOpen(false)
      setDate(undefined)
    } catch (error) {
      console.error("Error clearing date:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-8 gap-2 text-background hover:bg-background/20 min-w-[100px]",
            isSaving && "pointer-events-none"
          )}
          aria-label={placeholder}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          <span className="truncate">
            {placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-xl z-50"
        align="center"
        side="top"
        sideOffset={10}
      >
        <div className="p-3">
          <DatePicker
            value={date || predominantDate}
            onChange={handleSelectDate}
            disabled={disabled || isSaving}
            placeholder={placeholder}
            dateDisplayFormat="dd MMM yy"
            className="border-0 shadow-none p-0"
            fromYear={new Date().getFullYear()}
            toYear={new Date().getFullYear() + 5}
          />
          <div className="mt-3 pt-3 border-t">
            <button
              type="button"
              onClick={handleClearDate}
              disabled={isSaving}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors",
                isSaving && "pointer-events-none opacity-50"
              )}
            >
              <X className="h-3 w-3" />
              Quitar fecha
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
