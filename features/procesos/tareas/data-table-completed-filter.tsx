"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTableCompletedFilterProps {
  value: string
  onChange: (value: string) => void
  hiddenCount: number
}

const options = [
  { value: "7", label: "Últimos 7 días" },
  { value: "15", label: "Últimos 15 días" },
  { value: "30", label: "Últimos 30 días" },
]

export function DataTableCompletedFilter({
  value,
  onChange,
  hiddenCount,
}: DataTableCompletedFilterProps) {
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          Completadas
          {value !== "all" && selectedOption && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {selectedOption.label}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-3" align="start">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Ocultar tareas terminadas hace más de:
          </div>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="all">Mostrar todas</SelectItem>
            </SelectContent>
          </Select>
          {hiddenCount > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ocultas:</span>
                <Badge variant="secondary" className="font-normal">
                  {hiddenCount}
                </Badge>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
