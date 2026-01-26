"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { User, Search, Loader2, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { buscarMiembrosOrganizacion } from "@/app/actions/tareas"

interface MiembroOrganizacion {
  user_id: string
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  cargo?: string
  role?: string
}

export interface BulkAssigneePopoverProps {
  selectedIds: string[]
  selectedRowsAssignees: Array<{ id: string | null; nombre: string | null; email: string | null }>
  organizacionId: string
  onAssign: (miembroId: string) => Promise<void> | void
  onUnassign?: () => Promise<void> | void
  disabled?: boolean
}

/**
 * BulkAssigneePopover - Popover para reasignar múltiples tareas
 *
 * Features:
 * - Searchable member list with debounced input
 * - Shows current assignee distribution
 * - Assign all to new user or unassign all
 */
export function BulkAssigneePopover({
  selectedIds,
  selectedRowsAssignees,
  organizacionId,
  onAssign,
  onUnassign,
  disabled = false,
}: BulkAssigneePopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<MiembroOrganizacion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Debounced search for miembros
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && organizacionId) {
        setIsSearching(true)
        const result = await buscarMiembrosOrganizacion(searchQuery, organizacionId)
        setSearchResults(result.success ? result.data : [])
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, organizacionId])

  const getInitials = useCallback((nombre: string, email?: string) => {
    const name = nombre || email || "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [])

  // Get predominant assignee (most common)
  const getPredominantAssignee = () => {
    const assigneeCount = new Map<string, number>()
    selectedRowsAssignees.forEach((assignee) => {
      if (assignee.id) {
        assigneeCount.set(assignee.id, (assigneeCount.get(assignee.id) || 0) + 1)
      }
    })

    let maxCount = 0
    let predominantId: string | null = null

    assigneeCount.forEach((count, id) => {
      if (count > maxCount) {
        maxCount = count
        predominantId = id
      }
    })

    return selectedRowsAssignees.find((a) => a.id === predominantId) || null
  }

  const predominantAssignee = getPredominantAssignee()

  const handleAssign = async (miembroId: string) => {
    if (disabled || isSaving) return

    setIsSaving(true)
    try {
      await onAssign(miembroId)
      setOpen(false)
      setSearchQuery("")
    } catch (error) {
      console.error("Error assigning member:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnassign = async () => {
    if (disabled || isSaving || !onUnassign) return

    setIsSaving(true)
    try {
      await onUnassign()
      setOpen(false)
    } catch (error) {
      console.error("Error unassigning:", error)
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
            "h-8 gap-2 text-background hover:bg-background/20",
            isSaving && "pointer-events-none"
          )}
          aria-label="Reasignar responsable"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span>Responsable</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start" side="top">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Escribe al menos 2 caracteres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          {isSearching ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Buscando...
            </div>
          ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron resultados
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          ) : (
            searchResults.map((miembro) => (
              <button
                key={miembro.user_id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left",
                  predominantAssignee?.id === miembro.user_id && "bg-accent",
                  isSaving && "pointer-events-none opacity-50"
                )}
                onClick={() => handleAssign(miembro.user_id)}
                disabled={isSaving}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(miembro.nombres, miembro.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {miembro.nombres} {miembro.apellidos}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {miembro.email}
                  </span>
                  {miembro.role && (
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {miembro.role}
                    </Badge>
                  )}
                </div>
                {predominantAssignee?.id === miembro.user_id && (
                  <span className="text-xs text-muted-foreground">Actual</span>
                )}
              </button>
            ))
          )}
        </div>

        {onUnassign && (
          <div className="p-2 border-t">
            <button
              type="button"
              onClick={handleUnassign}
              disabled={isSaving}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors",
                isSaving && "pointer-events-none opacity-50"
              )}
            >
              <X className="h-3 w-3" />
              Quitar asignación
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
