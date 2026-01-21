"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Calendar,
  AlertCircle,
  Clock,
  List,
  RotateCcw,
  Settings2,
} from "lucide-react"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  getDateRangeForPreset,
  getPresetLabel,
  parseDateFilterValue,
  type DateFilterPreset,
} from "@/lib/utils/date-helpers"

interface DateRangeFilter {
  preset?: DateFilterPreset
  from?: string
  to?: string
}

interface DataTableDateFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title: string
}

export function DataTableDateFilter<TData, TValue>({
  column,
  title,
}: DataTableDateFilterProps<TData, TValue>) {
  const [selectedPreset, setSelectedPreset] = React.useState<DateFilterPreset>("all")
  const [customFrom, setCustomFrom] = React.useState<Date>()
  const [customTo, setCustomTo] = React.useState<Date>()
  const [showCustomRange, setShowCustomRange] = React.useState(false)

  const filterValue = column?.getFilterValue() as DateRangeFilter | undefined

  // Sync internal state with filter value
  React.useEffect(() => {
    if (filterValue) {
      if (typeof filterValue === "string") {
        setSelectedPreset(filterValue as DateFilterPreset)
        setShowCustomRange(false)
      } else if (typeof filterValue === "object") {
        setSelectedPreset("custom")
        if (filterValue.from) setCustomFrom(new Date(filterValue.from))
        if (filterValue.to) setCustomTo(new Date(filterValue.to))
      }
    } else {
      setSelectedPreset("all")
      setCustomFrom(undefined)
      setCustomTo(undefined)
      setShowCustomRange(false)
    }
  }, [filterValue])

  const presets = [
    {
      value: "overdue" as const,
      label: "Vencidas",
      icon: AlertCircle,
      description: "Ya pasaron",
    },
    {
      value: "today" as const,
      label: "Para hoy",
      icon: Calendar,
      description: "Vencen hoy",
    },
    {
      value: "upcoming" as const,
      label: "Próximas 7 días",
      icon: Clock,
      description: "Próximamente",
    },
    {
      value: "all" as const,
      label: "Todas",
      icon: List,
      description: "Sin filtro",
    },
  ]

  const handlePresetClick = (preset: DateFilterPreset) => {
    setSelectedPreset(preset)
    setShowCustomRange(false)
    setCustomFrom(undefined)
    setCustomTo(undefined)
    column?.setFilterValue(preset === "all" ? undefined : preset)
  }

  const handleApplyCustomRange = () => {
    if (customFrom && customTo) {
      setSelectedPreset("custom")
      column?.setFilterValue({
        from: format(customFrom, "yyyy-MM-dd"),
        to: format(customTo, "yyyy-MM-dd"),
      })
    }
  }

  const handleReset = () => {
    setSelectedPreset("all")
    setCustomFrom(undefined)
    setCustomTo(undefined)
    setShowCustomRange(false)
    column?.setFilterValue(undefined)
  }

  // Get display label for active filter
  const getActiveFilterLabel = () => {
    if (!filterValue) return ""

    if (typeof filterValue === "string") {
      return getPresetLabel(filterValue as DateFilterPreset)
    }

    if (typeof filterValue === "object" && filterValue.from && filterValue.to) {
      return `${format(new Date(filterValue.from), "dd/MMM")} - ${format(
        new Date(filterValue.to),
        "dd/MMM"
      )}`
    }

    return ""
  }

  const activeLabel = getActiveFilterLabel()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Calendar className="mr-2 h-4 w-4" />
          {title}
          {activeLabel && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {activeLabel}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-3">
          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={
                  selectedPreset === preset.value ? "default" : "outline"
                }
                size="sm"
                className="h-auto flex-col gap-1 p-2"
                onClick={() => handlePresetClick(preset.value)}
              >
                <preset.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{preset.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Custom Range Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mb-2"
            onClick={() => setShowCustomRange(!showCustomRange)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Rango personalizado
            <span
              className={cn(
                "ml-auto transition-transform",
                showCustomRange && "rotate-90"
              )}
            >
              ›
            </span>
          </Button>

          {/* Custom Date Range */}
          {showCustomRange && (
            <div className="space-y-2 mt-2">
              <DatePicker
                placeholder="Desde"
                value={customFrom}
                onChange={(date) =>
                  setCustomFrom(date ? new Date(date) : undefined)
                }
              />
              <DatePicker
                placeholder="Hasta"
                value={customTo}
                onChange={(date) =>
                  setCustomTo(date ? new Date(date) : undefined)
                }
              />
              <Button
                size="sm"
                className="w-full"
                onClick={handleApplyCustomRange}
                disabled={!customFrom || !customTo}
              >
                Aplicar rango
              </Button>
            </div>
          )}

          {/* Reset Button */}
          {filterValue && (
            <>
              <Separator className="my-3" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpiar filtro
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
