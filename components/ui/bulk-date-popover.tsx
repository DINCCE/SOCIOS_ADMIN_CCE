"use client"

import * as React from "react"
import { Calendar, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface BulkDatePopoverProps {
  selectedIds: string[]
  selectedRowsDates: (string | null)[] // Fechas de cada fila seleccionada
  onSelectDate: (date: string | null) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
}

/**
 * BulkDatePopover - Popover para modificar fecha de vencimiento en batch
 *
 * Features:
 * - Calendar picker for date selection
 * - Option to clear date (set to null)
 * - Shows predominant date if most tasks share the same date
 */
export function BulkDatePopover({
  selectedIds,
  selectedRowsDates,
  onSelectDate,
  disabled = false,
  placeholder = "Fecha",
}: BulkDatePopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = React.useState(false)

  // Get predominant date (most common non-null date)
  const getPredominantDate = (): Date | null => {
    if (selectedIds.length === 0) return null

    const dateCount = new Map<string, number>()
    selectedRowsDates.forEach((d) => {
      if (d) {
        dateCount.set(d, (dateCount.get(d) || 0) + 1)
      }
    })

    let maxCount = 0
    let predominantDateStr: string | null = null

    dateCount.forEach((count, dateStr) => {
      if (count > maxCount) {
        maxCount = count
        predominantDateStr = dateStr
      }
    })

    if (!predominantDateStr) return null
    return new Date(predominantDateStr)
  }

  const predominantDate = getPredominantDate()

  const handleSelectDate = async (selectedDate: Date | undefined) => {
    if (disabled || isSaving) return

    setIsSaving(true)
    try {
      // Convert to ISO string at 8PM UTC to preserve the selected date across all timezones
      // 8PM UTC = 3PM EST (UTC-5), 2PM CST (UTC-6), 1PM MST (UTC-7), 12PM PST (UTC-8)
      // This ensures the date is always the same regardless of timezone
      const isoDate = selectedDate
        ? `${selectedDate.getFullYear().toString().padStart(4, '0')}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}T20:00:00.000Z`
        : null
      await onSelectDate(isoDate)
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
        className="w-auto p-0 shadow-xl"
        align="center"
        side="top"
        sideOffset={10}
      >
        <div className="p-3">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={handleSelectDate}
            initialFocus
            disabled={(date) =>
              isSaving ||
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            locale={es}
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
