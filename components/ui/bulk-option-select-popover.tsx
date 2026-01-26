"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface OptionSelectProps {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface BulkOptionSelectPopoverProps {
  selectedIds: string[]
  selectedRowsValues: string[][] // Valores de cada fila seleccionada [[value1, value2], [value1, value3], ...]
  options: OptionSelectProps[]
  onSelect: (value: string) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
  triggerLabel?: string
  triggerIcon?: React.ComponentType<{ className?: string }>
}

/**
 * BulkOptionSelectPopover - Popover genérico para seleccionar una opción en batch
 *
 * Comportamiento de checkboxes:
 * - Checked: TODOS los seleccionados tienen el mismo valor
 * - Indeterminate: Los valores son mixtos (se muestra estado neutral)
 * - Unchecked: NINGUNO tiene ese valor específico
 *
 * Se cierra después de la selección (a diferencia de BulkTagPopover)
 */
export function BulkOptionSelectPopover({
  selectedIds,
  selectedRowsValues,
  options,
  onSelect,
  disabled = false,
  placeholder = "Seleccionar opción...",
  emptyMessage = "No hay opciones disponibles",
  triggerLabel = "Seleccionar",
  triggerIcon: TriggerIcon,
}: BulkOptionSelectPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Calcular el valor predominante (el que más se repite)
  const getPredominantValue = (): string | null => {
    if (selectedIds.length === 0) return null

    const valueCount = new Map<string, number>()
    selectedRowsValues.forEach((values) => {
      values.forEach((value) => {
        valueCount.set(value, (valueCount.get(value) || 0) + 1)
      })
    })

    let maxCount = 0
    let predominantValue: string | null = null

    valueCount.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count
        predominantValue = value
      }
    })

    return predominantValue
  }

  const predominantValue = getPredominantValue()

  // Verificar si un valor es el predominante
  const isPredominant = (value: string): boolean => {
    return predominantValue === value
  }

  // Manejar selección de opción
  const handleSelect = async (value: string) => {
    if (disabled || isSaving) return

    setIsSaving(true)
    try {
      await onSelect(value)
      setOpen(false)
    } catch (error) {
      console.error("Error selecting option:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Obtener el icono de la opción predominante para mostrar en el trigger
  const PredominantIcon = predominantValue
    ? options.find((o) => o.value === predominantValue)?.icon
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-8 gap-2 text-background hover:bg-background/20",
            isSaving && "pointer-events-none"
          )}
          aria-label={triggerLabel}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : PredominantIcon ? (
            <PredominantIcon className="h-4 w-4" />
          ) : TriggerIcon ? (
            <TriggerIcon className="h-4 w-4" />
          ) : null}
          <span>{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[280px] p-0 shadow-xl"
      >
        <Command className="w-full">
          <CommandList className="max-h-[240px]">
            {options.length === 0 ? (
              <CommandEmpty>
                <span className="text-muted-foreground">{emptyMessage}</span>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => {
                  const Icon = option.icon
                  const isPredom = isPredominant(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="flex gap-2"
                      disabled={isSaving}
                    >
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="flex-1">{option.label}</span>
                      {isPredom && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
