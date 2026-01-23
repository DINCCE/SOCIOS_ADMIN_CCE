"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Trash2,
  User,
  FileText,
  Users,
  Tag,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { ComentariosSection } from "@/components/shared/comentarios-section"
import { actualizarTarea, softDeleteTarea } from "@/app/actions/tareas"
import { createClient } from "@/lib/supabase/client"
import type { TareaView } from "@/features/procesos/tareas/columns"
import { tareasPrioridadOptions, tareasEstadoOptions } from "@/lib/table-filters"

// Get icon component from filter options
function getIconForValue(value: string, options: typeof tareasPrioridadOptions | typeof tareasEstadoOptions) {
  const option = options.find(opt => opt.value === value)
  return option?.icon
}

const PRIORIDAD_CONFIG: Record<string, { label: string; dotClassName: string }> = {
  Urgente: { label: "Urgente", dotClassName: "bg-status-negative" },
  Alta: { label: "Alta", dotClassName: "bg-status-negative" },
  Media: { label: "Media", dotClassName: "bg-status-warning" },
  Baja: { label: "Baja", dotClassName: "bg-status-neutral" },
}

const ESTADO_CONFIG: Record<string, { label: string; dotClassName: string }> = {
  Pendiente: { label: "Pendiente", dotClassName: "bg-status-neutral" },
  "En Progreso": { label: "En Progreso", dotClassName: "bg-status-warning" },
  Terminada: { label: "Terminada", dotClassName: "bg-status-positive" },
  Pausada: { label: "Pausada", dotClassName: "bg-status-negative" },
  Cancelada: { label: "Cancelada", dotClassName: "bg-status-negative" },
}

interface TareaDetailSheetProps {
  tareaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
  onUpdated?: () => void
}

export function TareaDetailSheet({
  tareaId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: TareaDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  // Fetch tarea data
  const { data: tarea, isLoading } = useQuery({
    queryKey: ["tarea", tareaId],
    queryFn: async () => {
      if (!tareaId) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from("v_tareas_org")
        .select("*")
        .eq("id", tareaId)
        .single()

      if (error) throw error
      return data as TareaView
    },
    enabled: !!tareaId && open,
  })

  const handleMarkComplete = async () => {
    if (!tareaId) return
    setIsUpdating(true)

    try {
      const result = await actualizarTarea(tareaId, { estado: "Terminada" })
      if (result.success) {
        toast.success("Tarea marcada como terminada")
        queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
        queryClient.invalidateQueries({ queryKey: ["tareas"] })
        onUpdated?.()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al actualizar la tarea")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!tareaId) return
    setIsDeleting(true)

    try {
      const result = await softDeleteTarea(tareaId)
      if (result.success) {
        toast.success("Tarea eliminada")
        queryClient.invalidateQueries({ queryKey: ["tareas"] })
        onOpenChange(false)
        onDeleted?.()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al eliminar la tarea")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const prioridadConfig = tarea ? PRIORIDAD_CONFIG[tarea.prioridad] : null
  const estadoConfig = tarea ? ESTADO_CONFIG[tarea.estado] : null
  const PrioridadIcon = tarea ? getIconForValue(tarea.prioridad, tareasPrioridadOptions) : null
  const EstadoIcon = tarea ? getIconForValue(tarea.estado, tareasEstadoOptions) : null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
          {/* Header */}
          <div className="bg-background shrink-0 px-6 py-6 border-b">
            <SheetHeader className="text-left space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  <VisuallyHidden>
                    <SheetTitle>Cargando tarea...</SheetTitle>
                  </VisuallyHidden>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ) : tarea ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {tarea.codigo_tarea || "Sin código"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                    {tarea.titulo}
                  </SheetTitle>

                  <div className="flex flex-wrap items-center gap-2">
                    {prioridadConfig && (
                      <Badge variant="metadata-outline" dotClassName={prioridadConfig.dotClassName} showDot className="gap-1">
                        {PrioridadIcon && <PrioridadIcon className="h-3 w-3" />}
                        {prioridadConfig.label}
                      </Badge>
                    )}
                    {estadoConfig && (
                      <Badge variant="metadata-outline" dotClassName={estadoConfig.dotClassName} showDot className="gap-1">
                        {EstadoIcon && <EstadoIcon className="h-3 w-3" />}
                        {estadoConfig.label}
                      </Badge>
                    )}
                    {tarea.fecha_vencimiento && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tarea.fecha_vencimiento).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <VisuallyHidden>
                    <SheetTitle>Tarea no encontrada</SheetTitle>
                  </VisuallyHidden>
                  <p className="text-muted-foreground">Tarea no encontrada</p>
                </>
              )}
            </SheetHeader>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : tarea ? (
              <div className="space-y-8">
                {/* Descripción */}
                {tarea.descripcion && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Descripción
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {tarea.descripcion}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Asignación */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Asignación
                  </h4>
                  {tarea.asignado_nombre_completo ? (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tarea.asignado_nombre_completo}</p>
                        <p className="text-xs text-muted-foreground">{tarea.asignado_email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin asignar</p>
                  )}
                </div>

                <Separator />

                {/* Vinculación */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vinculación
                  </h4>

                  {tarea.doc_comercial_codigo && (
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tarea.doc_comercial_codigo}</p>
                        <p className="text-xs text-muted-foreground">
                          Documento Comercial • {tarea.doc_comercial_estado}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {tarea.actor_relacionado_codigo_bp && (
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {tarea.actor_relacionado_nombre_completo || tarea.actor_relacionado_codigo_bp}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Actor relacionado
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {!tarea.doc_comercial_codigo && !tarea.actor_relacionado_codigo_bp && (
                    <p className="text-sm text-muted-foreground italic">Sin vinculaciones</p>
                  )}
                </div>

                {/* Etiquetas */}
                {tarea.tags && tarea.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Etiquetas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tarea.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Comentarios */}
                <ComentariosSection
                  entidadTipo="tarea"
                  entidadId={tarea.id}
                />
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {tarea && (
            <div className="p-6 border-t bg-background shrink-0">
              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Creado{" "}
                  {formatDistanceToNow(new Date(tarea.creado_en), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>

                <div className="flex-1" />

                {tarea.estado !== "Terminada" && (
                  <Button
                    variant="outline"
                    onClick={handleMarkComplete}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Marcar Terminada
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la tarea como eliminada. No aparecerá en las listas
              pero se conservará en la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
