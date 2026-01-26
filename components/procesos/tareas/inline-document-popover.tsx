"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { FileText, Search, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { buscarDocumentosComerciales } from "@/app/actions/tareas"

interface DocumentoComercial {
  id: string
  codigo: string
  tipo: string
  estado: string
  titulo?: string
  fecha_doc: string
  solicitante_id?: string
}

interface InlineDocumentPopoverProps {
  // tareaId is kept for future use (e.g., permissions)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tareaId: string | null
  organizacionId: string
  selectedDocumento: DocumentoComercial | null
  onLink: (docId: string) => Promise<void>
  onUnlink?: () => Promise<void>
  disabled?: boolean
  className?: string
}

/**
 * InlineDocumentPopover - Popover-based document selector with rich display
 *
 * Features:
 * - Closed state: Shows Code + Type + Status (rich display)
 * - Open state: Searchable document list with debounced input
 * - Auto-save on selection, immediate close
 * - Option to unlink (clear document link)
 */
export function InlineDocumentPopover({
  tareaId,
  organizacionId,
  selectedDocumento,
  onLink,
  onUnlink,
  disabled = false,
  className,
}: InlineDocumentPopoverProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<DocumentoComercial[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Debounced search for documentos
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && organizacionId) {
        setIsSearching(true)
        const result = await buscarDocumentosComerciales(searchQuery, organizacionId)
        setSearchResults(result.success ? result.data : [])
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, organizacionId])

  const handleLink = async (docId: string) => {
    if (disabled || isSaving) return

    setIsSaving(true)
    try {
      await onLink(docId)
      setOpen(false)
      setSearchQuery("")
    } catch (error) {
      console.error("Error linking document:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlink = async () => {
    if (disabled || isSaving || !onUnlink) return

    setIsSaving(true)
    try {
      await onUnlink()
      setOpen(false)
    } catch (error) {
      console.error("Error unlinking:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-auto p-2 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          {selectedDocumento ? (
            <div className="flex items-center gap-3 w-full">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {selectedDocumento.codigo}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {selectedDocumento.tipo} • {selectedDocumento.estado}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Vincular documento...</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
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
            searchResults.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left",
                  selectedDocumento?.id === doc.id && "bg-accent",
                  isSaving && "pointer-events-none opacity-50"
                )}
                onClick={() => handleLink(doc.id)}
                disabled={isSaving}
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {doc.codigo}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {doc.titulo || doc.tipo} • {doc.estado}
                  </span>
                </div>
                {selectedDocumento?.id === doc.id && (
                  <span className="text-xs text-muted-foreground">✓</span>
                )}
              </button>
            ))
          )}
        </div>

        {selectedDocumento && onUnlink && (
          <div className="p-2 border-t">
            <button
              type="button"
              onClick={handleUnlink}
              disabled={isSaving}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors",
                isSaving && "pointer-events-none opacity-50"
              )}
            >
              <X className="h-3 w-3" />
              Quitar vinculación
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
