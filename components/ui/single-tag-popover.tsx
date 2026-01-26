"use client"

import * as React from "react"
import { Check, Plus, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface SingleTagPopoverProps {
  availableTags: string[] // Todas las etiquetas disponibles en el sistema
  selectedTags: string[] // Tags actualmente asignados a esta tarea
  onToggleTag: (tag: string, add: boolean) => Promise<void> | void
  onCreateTag: (tag: string) => Promise<void> | void
  disabled?: boolean
}

/**
 * SingleTagPopover - Campo de etiquetas con popover para gestionar
 *
 * Comportamiento:
 * - Muestra las etiquetas seleccionadas como badges en un campo
 * - Al hacer click abre el popover con todas las etiquetas
 * - Las seleccionadas aparecen primero, luego el resto alfabéticamente
 * - Permite crear nuevas etiquetas
 */
export function SingleTagPopover({
  availableTags,
  selectedTags,
  onToggleTag,
  onCreateTag,
  disabled = false,
}: SingleTagPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  // Ordenar etiquetas: seleccionadas primero, luego alfabéticamente
  const sortedTags = React.useMemo(() => {
    return [...availableTags].sort((a, b) => {
      const aSelected = selectedTags.some(t => t.toLowerCase() === a.toLowerCase())
      const bSelected = selectedTags.some(t => t.toLowerCase() === b.toLowerCase())

      // Si una está seleccionada y la otra no, la seleccionada va primero
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1

      // Si ambas están seleccionadas o ninguna, orden alfabético
      return a.localeCompare(b)
    })
  }, [availableTags, selectedTags])

  // Verificar si una etiqueta está seleccionada
  const isTagSelected = (tag: string) => {
    return selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
  }

  // Manejar toggle de etiqueta
  const handleToggleTag = async (tag: string) => {
    const currentlySelected = isTagSelected(tag)
    await onToggleTag(tag, !currentlySelected)
    // NO cerrar el popover para permitir multi-tagging
  }

  // Manejar remoción de etiqueta desde el badge
  const handleRemoveTag = async (e: React.MouseEvent, tag: string) => {
    e.stopPropagation() // Evitar abrir el popover
    await onToggleTag(tag, false)
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
  const filteredTags = sortedTags.filter((tag) =>
    tag.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Verificar si la etiqueta buscada ya existe
  const tagExists = availableTags.some(
    (tag) => tag.toLowerCase() === searchValue.toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full min-h-[36px] px-3 py-1.5",
            "flex flex-wrap items-center gap-1.5",
            "bg-background border border-input",
            "rounded-md text-sm",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors",
            "text-left"
          )}
          aria-label="Gestionar etiquetas"
        >
          {selectedTags.length === 0 ? (
            <span className="text-muted-foreground">Seleccionar etiquetas...</span>
          ) : (
            selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 pr-1.5 h-5 text-xs"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={(e) => handleRemoveTag(e, tag)}
                />
              </Badge>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        className="w-[320px] p-0 shadow-xl"
      >
        <Command className="w-full">
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder="Buscar o crear etiqueta..."
            autoFocus
            className="h-9"
          />
          <CommandList className="max-h-[240px]">
            {filteredTags.length === 0 ? (
              <CommandEmpty>
                {searchValue.trim() && !tagExists ? (
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
                        <span>Crear &quot;{searchValue}&quot;</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-muted-foreground text-xs px-2">
                    No hay etiquetas disponibles
                  </span>
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredTags.map((tag) => {
                  const selected = isTagSelected(tag)
                  return (
                    <CommandItem
                      key={tag}
                      onSelect={() => handleToggleTag(tag)}
                      className="flex gap-2"
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selected && "bg-primary text-primary-foreground",
                          !selected && "bg-transparent"
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="flex-1">{tag}</span>
                      {selected && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          Seleccionado
                        </Badge>
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
