"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Loader2,
  Trash2,
  MoreHorizontal,
  X,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { DatePicker } from "@/components/ui/date-picker"
import { SingleTagPopover } from "@/components/ui/single-tag-popover"

// Inline editing components
import { InlineEditableTitle } from "@/components/procesos/tareas/inline-editable-title"
import { InlineEditableTextarea } from "@/components/procesos/tareas/inline-editable-textarea"
import { InlineAssigneePopover } from "@/components/procesos/tareas/inline-assignee-popover"
import { InlineDocumentPopover } from "@/components/procesos/tareas/inline-document-popover"

import { ComentariosSection } from "@/components/shared/comentarios-section"
import { actualizarTarea, softDeleteTarea } from "@/app/actions/tareas"
import { toggleTagsForTareas, createAndAssignTagForTareas } from "@/app/actions/tags"
import { createClient } from "@/lib/supabase/client"
import type { TareaView } from "@/features/procesos/tareas/columns"
import { tareasPrioridadOptions, tareasEstadoOptions } from "@/lib/table-filters"

interface TareaDetailDialogProps {
  tareaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
  onUpdated?: () => void
}

export function TareaDetailDialog({
  tareaId,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: TareaDetailDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Local state for fields not handled by inline components
  const [isSaving, setIsSaving] = useState(false)

  // Date picker state
  const [dateValue, setDateValue] = useState<Date | null | undefined>(undefined)

  const queryClient = useQueryClient()

  // Fetch all tareas to get available tags
  const { data: allTareas = [] } = useQuery({
    queryKey: ["tareas"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("v_tareas_org")
        .select("tags")
      if (error) throw error
      return data as Pick<TareaView, "tags">[]
    },
    enabled: open,
  })

  // Get all unique available tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>()
    allTareas.forEach((tarea) => {
      if (tarea.tags) {
        tarea.tags.forEach((tag) => tagsSet.add(tag))
      }
    })
    return Array.from(tagsSet).sort()
  }, [allTareas])

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

  // Initialize local state when tarea changes
  useEffect(() => {
    if (tarea) {
      setDateValue(tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento) : null)
    }
  }, [tarea])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setDateValue(undefined)
    }
  }, [open])

  const handleQuickUpdate = useCallback(async (field: string, value: unknown) => {
    if (!tareaId || isSaving) return
    setIsSaving(true)

    try {
      const result = await actualizarTarea(tareaId, { [field]: value })
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
        queryClient.invalidateQueries({ queryKey: ["tareas"] })
        onUpdated?.()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al actualizar")
    } finally {
      setIsSaving(false)
    }
  }, [tareaId, isSaving, queryClient, onUpdated])

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

  // Handle tag toggle for SingleTagPopover
  const handleToggleTag = useCallback(async (tag: string, add: boolean) => {
    if (!tareaId) return
    const result = await toggleTagsForTareas([tareaId], tag, add)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
      queryClient.invalidateQueries({ queryKey: ["tareas"] })
      onUpdated?.()
    } else {
      toast.error(result.message)
    }
  }, [tareaId, queryClient, onUpdated])

  // Handle tag creation for SingleTagPopover
  const handleCreateTag = useCallback(async (tag: string) => {
    if (!tareaId) return
    const result = await createAndAssignTagForTareas([tareaId], tag)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
      queryClient.invalidateQueries({ queryKey: ["tareas"] })
      onUpdated?.()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }, [tareaId, queryClient, onUpdated])

  // Transform assignee data for InlineAssigneePopover
  const assignedMiembro = useMemo(() => {
    if (!tarea?.asignado_id) return null
    const nameParts = (tarea.asignado_nombre_completo || '').trim().split(/\s+/)
    return {
      user_id: tarea.asignado_id,
      nombres: nameParts[0] || '',
      apellidos: nameParts.slice(1).join(' ') || '',
      email: tarea.asignado_email || '',
    }
  }, [tarea?.asignado_id, tarea?.asignado_nombre_completo, tarea?.asignado_email])

  // Transform document data for InlineDocumentPopover
  const selectedDocumento = useMemo(() => {
    if (!tarea?.doc_comercial_id) return null
    return {
      id: tarea.doc_comercial_id,
      codigo: tarea.doc_comercial_codigo || '',
      tipo: (tarea as any).doc_comercial_tipo || '',
      estado: tarea.doc_comercial_estado || '',
      titulo: (tarea as any).doc_comercial_titulo,
      fecha_doc: (tarea as any).doc_comercial_fecha_doc,
      solicitante_id: (tarea as any).doc_comercial_solicitante_id,
    }
  }, [tarea?.doc_comercial_id, tarea?.doc_comercial_codigo, tarea?.doc_comercial_estado])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm bg-background/40" />
          <DialogContent className="max-w-5xl h-[85vh] border border-border/50 shadow-2xl rounded-xl overflow-hidden p-0 [&>button:last-child]:hidden">
            {/* VisuallyHidden title for accessibility */}
            <VisuallyHidden>
              <DialogTitle>Detalle de Tarea</DialogTitle>
            </VisuallyHidden>

            {/* Window Controls + Task ID (Top Right) */}
            <div className="absolute top-6 right-6 flex items-center gap-6 z-10">
              {/* Task ID */}
              <div className="text-xs font-mono text-muted-foreground">
                {tarea?.codigo_tarea || "Sin código"}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Tarea
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tarea ? (
              <div className="flex flex-col h-full">
                {/* ZONE 1: HEADER (Full Width) */}
                <div className="px-8 pt-6 pb-4 shrink-0 border-b border-border/40">
                  {/* Title (H1) - Inline editable */}
                  <div className="w-[70%]">
                    <InlineEditableTitle
                      value={tarea.titulo}
                      onSave={(value) => handleQuickUpdate("titulo", value)}
                      placeholder="Título de la tarea..."
                      className="text-3xl font-bold px-0 h-auto rounded-none focus-visible:ring-0 focus-visible:bg-muted/30"
                      maxLength={200}
                    />
                  </div>
                </div>

                {/* ZONE 2: BODY (Grid 2 Columns) */}
                <div className="grid grid-cols-12 flex-1 overflow-hidden">
                  {/* LEFT COLUMN (Content - col-span-8) */}
                  <div className="col-span-8 lg:col-span-8 overflow-y-auto px-8 pt-4 pb-8">
                    {/* Description Section with Container */}
                    <div className="flex flex-col gap-1 mb-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        DESCRIPCIÓN
                      </span>
                      <div className="bg-muted/20 border border-border/20 rounded-lg p-3 min-h-[120px]">
                        <InlineEditableTextarea
                          value={tarea.descripcion || ""}
                          onSave={(value) => handleQuickUpdate("descripcion", value)}
                          placeholder="Añadir descripción..."
                          minRows={3}
                          maxRows={10}
                          maxLength={2000}
                          className="bg-transparent border-0 focus:ring-0 p-0"
                        />
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-b border-border/40 mb-6" />

                    {/* Comments Section */}
                    <div className="flex flex-col gap-1 h-[400px]">
                      <ComentariosSection
                        entidadTipo="tarea"
                        entidadId={tarea.id}
                        compact
                        renderHeader={(count) => (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            COMENTARIOS ({count})
                          </span>
                        )}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN (Metadata - col-span-4) - Vertical Layout */}
                  <div className="col-span-4 lg:col-span-4 overflow-y-auto px-6 py-4 border-l border-border/40 bg-slate-50/30">
                    {/* Vertical layout: labels above, values below */}
                    <div className="flex flex-col gap-4">
                      {/* Prioridad */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Prioridad
                        </span>
                        <Select
                          value={tarea.prioridad}
                          onValueChange={(value) => handleQuickUpdate("prioridad", value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="h-9 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20">
                            {isSaving ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-muted-foreground">Guardando...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Seleccionar prioridad" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {tareasPrioridadOptions.map((option) => {
                              const Icon = option.icon
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {Icon && <Icon className="h-4 w-4" />}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Estado */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Estado
                        </span>
                        <Select
                          value={tarea.estado}
                          onValueChange={(value) => handleQuickUpdate("estado", value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="h-9 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20">
                            {isSaving ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-muted-foreground">Guardando...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Seleccionar estado" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {tareasEstadoOptions.map((option) => {
                              const Icon = option.icon
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    {Icon && <Icon className="h-4 w-4" />}
                                    {option.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Vencimiento */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Vencimiento
                        </span>
                        <DatePicker
                          value={dateValue ? dateValue.toISOString().split('T')[0] : undefined}
                          onChange={(dateStr) => {
                            setDateValue(dateStr ? new Date(dateStr + "T12:00:00") : null)
                            handleQuickUpdate("fecha_vencimiento", dateStr || null)
                          }}
                          placeholder="Seleccionar fecha"
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 5}
                          className="h-9 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Responsable */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Responsable
                        </span>
                        <InlineAssigneePopover
                          tareaId={tarea.id}
                          organizacionId={tarea.organizacion_id}
                          assignedMiembro={assignedMiembro}
                          onAssign={async (miembroId) => {
                            await handleQuickUpdate("asignado_a", miembroId)
                          }}
                          onUnassign={async () => {
                            await handleQuickUpdate("asignado_a", null)
                          }}
                        />
                      </div>

                      {/* Separator */}
                      <div className="h-px border-t border-border/40" />

                      {/* Etiquetas */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Etiquetas
                        </span>
                        <SingleTagPopover
                          availableTags={availableTags}
                          selectedTags={tarea?.tags || []}
                          onToggleTag={handleToggleTag}
                          onCreateTag={handleCreateTag}
                          disabled={isSaving}
                        />
                      </div>

                      {/* Separator */}
                      <div className="h-px border-t border-border/40" />

                      {/* Documento Relacionado */}
                      {(tarea.doc_comercial_codigo || tarea.actor_relacionado_codigo_bp) && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            Documento Relacionado
                          </span>
                          <div className="rounded-lg border border-border/50 bg-slate-50/50 p-3">
                            {/* Fila 1: Documento (Editable) */}
                            {tarea.doc_comercial_codigo && (
                              <InlineDocumentPopover
                                tareaId={tarea.id}
                                organizacionId={tarea.organizacion_id}
                                selectedDocumento={selectedDocumento}
                                onLink={async (docId) => {
                                  await handleQuickUpdate("oportunidad_id", docId)
                                }}
                                onUnlink={async () => {
                                  await handleQuickUpdate("oportunidad_id", null)
                                }}
                              />
                            )}

                            {/* Fila 2: Actor (Read-only, Inherited) */}
                            {tarea.actor_relacionado_codigo_bp && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate flex-1">
                                  {tarea.actor_relacionado_nombre_completo || tarea.actor_relacionado_codigo_bp}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  (heredado)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Separator */}
                      <div className="h-px border-t border-border/40" />

                      {/* System Metadata */}
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] text-muted-foreground">
                          Actualizado por {(tarea as any).actualizado_por_nombre || (tarea as any).actualizado_por_email} el {new Date(tarea.actualizado_en || tarea.creado_en).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Creado por {(tarea as any).creado_por_nombre || (tarea as any).creado_por_email} el {new Date(tarea.creado_en).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Tarea no encontrada</p>
              </div>
            )}
          </DialogContent>
        </DialogPortal>
      </Dialog>

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
