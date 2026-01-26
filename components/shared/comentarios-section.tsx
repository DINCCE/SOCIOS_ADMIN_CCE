"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { MessageSquare, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
  eliminarComentario,
  type EntidadTipo,
} from "@/app/actions/comentarios"

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
  const queryClient = useQueryClient()

  const queryKey = ["comentarios", entidadTipo, entidadId]

  const { data: comentarios = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await obtenerComentarios(entidadTipo, entidadId)
      return result.data || []
    },
  })

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
      }
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      {renderHeader ? (
        <div className="mb-4">
          {renderHeader(comentarios.length)}
        </div>
      ) : showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Comentarios ({comentarios.length})
          </h3>
        </div>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-4 mb-4">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : comentarios.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        ) : (
          comentarios.map((comentario) => {
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

                    <div className="ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
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
                  </div>

                  {/* Comment text */}
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comentario.contenido}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input nuevo comentario */}
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
  )
}
