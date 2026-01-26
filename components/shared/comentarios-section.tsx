"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { MessageSquare, Send, MoreHorizontal, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

import {
  crearComentario,
  obtenerComentarios,
  actualizarComentario,
  eliminarComentario,
  type EntidadTipo,
} from "@/app/actions/comentarios"

import { useUser } from "@/hooks/use-user"

interface ComentariosSectionProps {
  entidadTipo: EntidadTipo
  entidadId: string
  className?: string
  compact?: boolean
  showHeader?: boolean
  renderHeader?: (count: number) => React.ReactNode
}

export function ComentariosSection({
  entidadTipo,
  entidadId,
  className,
  compact = false,
  showHeader = true,
  renderHeader,
}: ComentariosSectionProps) {
  const [nuevoComentario, setNuevoComentario] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const queryClient = useQueryClient()

  // Get current user
  const { data: currentUser } = useUser()

  const queryKey = ["comentarios", entidadTipo, entidadId]

  const { data: comentarios = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await obtenerComentarios(entidadTipo, entidadId)
      return result.data || []
    },
  })

  // Determine if we should use scrollable layout (sticky input)
  const useStickyLayout = compact

  const handleSubmit = async () => {
    if (!nuevoComentario.trim()) return

    setIsSubmitting(true)
    try {
      const result = await crearComentario({
        entidad_tipo: entidadTipo,
        entidad_id: entidadId,
        contenido: nuevoComentario.trim(),
      })

      if (!result.success) {
        toast.error("Error al agregar comentario")
        return
      }

      setNuevoComentario("")
      queryClient.invalidateQueries({ queryKey })
      toast.success("Comentario agregado")
    } catch {
      toast.error("Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (comentarioId: string) => {
    try {
      const result = await eliminarComentario(comentarioId)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey })
        toast.success("Comentario eliminado")
      } else {
        toast.error(result.message || "Error al eliminar")
      }
    } catch {
      toast.error("Error inesperado al eliminar")
    }
  }

  const handleEditStart = (comentario: typeof comentarios[0]) => {
    setEditingCommentId(comentario.id)
    setEditingContent(comentario.contenido)
  }

  const handleEditCancel = () => {
    setEditingCommentId(null)
    setEditingContent("")
  }

  const handleEditSave = async (comentarioId: string) => {
    if (!editingContent.trim()) {
      toast.error("El comentario no puede estar vacío")
      return
    }

    try {
      const result = await actualizarComentario(comentarioId, editingContent.trim())

      if (!result.success) {
        toast.error(result.message || "Error al actualizar comentario")
        return
      }

      queryClient.invalidateQueries({ queryKey })
      toast.success("Comentario actualizado")
      handleEditCancel()
    } catch {
      toast.error("Error inesperado al actualizar")
    }
  }

  return (
    <div className={useStickyLayout ? `flex flex-col h-full ${className || ''}` : className}>
      {/* Header */}
      {renderHeader ? (
        <div className={useStickyLayout ? "shrink-0 mb-3" : "mb-4"}>
          {renderHeader(comentarios.length)}
        </div>
      ) : showHeader && (
        <div className={`flex items-center gap-2 ${useStickyLayout ? "shrink-0 mb-3" : "mb-4"}`}>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Comentarios ({comentarios.length})
          </h3>
        </div>
      )}

      {/* Lista de comentarios - Scrollable area when in sticky layout */}
      <div className={useStickyLayout ? "flex-1 overflow-y-auto space-y-3 pr-1" : "space-y-4 mb-4"}>
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : comentarios.length === 0 ? (
          <p className={`text-sm text-muted-foreground text-center ${useStickyLayout ? "py-4" : "py-8"}`}>
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        ) : (
          comentarios.map((comentario) => {
            // Check if current user is the creator
            const isOwner = currentUser?.id === comentario.creado_por
            const isEditing = editingCommentId === comentario.id

            // Get initials from name or email (max 2 chars)
            const getInitials = (nombre: string, email?: string) => {
              const name = nombre || email || "U"
              return name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            }

            return (
              <div
                key={comentario.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {getInitials(comentario.creado_por_nombre, comentario.creado_por_email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Metadata row: Name + timestamp + menu */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">
                      {comentario.creado_por_nombre || comentario.creado_por_email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comentario.creado_en), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>

                    {/* Indicador de edición */}
                    {comentario.actualizado_en && new Date(comentario.actualizado_en) > new Date(comentario.creado_en) && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground italic">
                          editado {formatDistanceToNow(new Date(comentario.actualizado_en), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </>
                    )}

                    {/* Show menu ONLY for comment creator */}
                    {isOwner && !isEditing && (
                      <div className="ml-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStart(comentario)}>
                              <Pencil className="mr-2 h-3 w-3" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(comentario.id)}
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Comment content - conditional render */}
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[80px] resize-none text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") handleEditCancel()
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault()
                            handleEditSave(comentario.id)
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(comentario.id)}
                          disabled={!editingContent.trim()}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEditCancel}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Presiona ⌘+Enter para guardar, Esc para cancelar
                      </p>
                    </div>
                  ) : (
                    // View mode
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comentario.contenido}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input nuevo comentario - Sticky at bottom when in sticky layout */}
      <div className={useStickyLayout ? "shrink-0 pt-3 mt-3 border-t border-border/40" : ""}>
        <div className="flex gap-2">
          <Textarea
            placeholder="Escribe un comentario..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            className={compact
              ? "min-h-[36px] max-h-32 resize-none bg-muted/30 border-0 focus:ring-1 focus:ring-muted-foreground/20 text-sm"
              : "min-h-[80px] resize-none"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                handleSubmit()
              }
            }}
            rows={compact ? 1 : undefined}
          />
          <Button
            size="icon"
            className={compact ? "h-9 w-9 shrink-0" : "shrink-0"}
            disabled={!nuevoComentario.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            <Send className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
        </div>
        {!compact && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Presiona ⌘+Enter para enviar
          </p>
        )}
      </div>
    </div>
  )
}
