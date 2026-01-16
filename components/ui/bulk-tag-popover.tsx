"use client"

import * as React from "react"
import { Check, Plus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Tag } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BulkTagPopoverProps {
  selectedIds: string[]
  currentTags: string[] // Todas las etiquetas disponibles
  selectedRowsTags: string[][] // Tags de cada fila seleccionada [[tag1, tag2], [tag1, tag3], ...]
  onToggleTag: (tag: string, add: boolean) => Promise<void> | void
  onCreateTag: (tag: string) => Promise<void> | void
  disabled?: boolean
}

/**
 * BulkTagPopover - Popover para asignar/remover etiquetas en batch
 *
 * Comportamiento de checkboxes:
 * - Checked: TODOS los seleccionados tienen la etiqueta
 * - Indeterminate: ALGUNOS tienen la etiqueta (opacidad 50%)
 * - Unchecked: NINGUNO tiene la etiqueta
 *
 * No se cierra al seleccionar (permite multi-tagging rápido)
 */
export function BulkTagPopover({
  selectedIds,
  currentTags,
  selectedRowsTags,
  onToggleTag,
  onCreateTag,
  disabled = false,
}: BulkTagPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  // Calcular estado de cada etiqueta para todos los seleccionados
  const getTagState = (tag: string): "checked" | "indeterminate" | "unchecked" => {
    if (selectedIds.length === 0) return "unchecked"

    const hasTag = selectedRowsTags.filter((tags) => tags.includes(tag)).length
    const total = selectedIds.length

    if (hasTag === 0) return "unchecked"
    if (hasTag === total) return "checked"
    return "indeterminate"
  }

  // Manejar toggle de etiqueta
  const handleToggleTag = async (tag: string) => {
    const state = getTagState(tag)
    // Si está checked o indeterminate, removemos. Si unchecked, agregamos.
    const shouldAdd = state === "unchecked"
    await onToggleTag(tag, shouldAdd)
    // NO cerrar el popover para permitir multi-tagging
  }

  // Manejar creación de nueva etiqueta
  const handleCreateTag = async () => {
    if (!searchValue.trim()) return
    setIsCreating(true)
    try {
      await onCreateTag(searchValue.trim())
      setSearchValue("")
    } finally {
      setIsCreating(false)
    }
  }

  // Filtrar etiquetas por búsqueda
  const filteredTags = currentTags.filter((tag) =>
    tag.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Verificar si la etiqueta buscada ya existe
  const tagExists = currentTags.some(
    (tag) => tag.toLowerCase() === searchValue.toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 gap-2 text-background hover:bg-background/20"
          aria-label="Etiquetar selección"
        >
          <Tag className="h-4 w-4" />
          <span>Etiquetar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[280px] p-0 shadow-xl"
      >
        <Command className="w-full">
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder="Buscar o crear etiqueta..."
            autoFocus
          />
          <CommandList className="max-h-[240px]">
            {filteredTags.length === 0 ? (
              <CommandEmpty>
                {searchValue.trim() ? (
                  <button
                    onClick={handleCreateTag}
                    disabled={isCreating}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Crear "{searchValue}"</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-muted-foreground">
                    No hay etiquetas disponibles. Escribe para crear una nueva.
                  </span>
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredTags.map((tag) => {
                  const state = getTagState(tag)
                  return (
                    <CommandItem
                      key={tag}
                      onSelect={() => handleToggleTag(tag)}
                      className="flex gap-2"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border border-primary",
                          state === "checked" && "bg-primary text-primary-foreground",
                          state === "indeterminate" && "bg-primary/50",
                          state === "unchecked" && "bg-transparent"
                        )}
                      >
                        {state === "checked" && <Check className="h-3 w-3" />}
                        {state === "indeterminate" && (
                          <div className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </div>
                      <span className="flex-1">{tag}</span>
                      {state === "indeterminate" && (
                        <span className="text-xs text-muted-foreground">
                          Parcial
                        </span>
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
