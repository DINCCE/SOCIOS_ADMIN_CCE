"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  Loader2,
  Trash2,
  MoreHorizontal,
  Users,
  X,
  ChevronDown,
  User,
  Edit2,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"

import { ComentariosSection } from "@/components/shared/comentarios-section"
import { actualizarTarea, softDeleteTarea, buscarMiembrosOrganizacion } from "@/app/actions/tareas"
import { createClient } from "@/lib/supabase/client"
import type { TareaView } from "@/features/procesos/tareas/columns"
import { tareasPrioridadOptions, tareasEstadoOptions } from "@/lib/table-filters"

// Get icon component from filter options
function getIconForValue(value: string, options: typeof tareasPrioridadOptions | typeof tareasEstadoOptions) {
  const option = options.find(opt => opt.value === value)
  return option?.icon
}

interface MiembroOrganizacion {
  user_id: string
  nombres: string
  apellidos: string
  email: string
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

  // Local state for inline editing
  const [titleValue, setTitleValue] = useState("")
  const [descriptionValue, setDescriptionValue] = useState("")
  const [isSaving, setIsSaving] = useState<string | null>(null)

  // Quick update dropdown states
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false)
  const [prioridadDropdownOpen, setPrioridadDropdownOpen] = useState(false)
  const [isQuickUpdating, setIsQuickUpdating] = useState(false)

  // Tags state
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSavingTags, setIsSavingTags] = useState(false)

  // Date picker state
  const [dateValue, setDateValue] = useState<Date | null | undefined>(undefined)

  // Assignee popover state
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("")
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<MiembroOrganizacion[]>([])
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false)

  // Get organization ID
  const [orgId, setOrgId] = useState<string>("")

  const queryClient = useQueryClient()
  const titleInputRef = useRef<HTMLTextAreaElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)

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
      setTitleValue(tarea.titulo)
      setDescriptionValue(tarea.descripcion || "")
      setTags(tarea.tags || [])
      setOrgId(tarea.organizacion_id || "")
      setDateValue(tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento) : null)
    }
  }, [tarea])

  // Debounced search for assignee
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (assigneeSearchQuery.length >= 2 && orgId) {
        setIsSearchingAssignee(true)
        const result = await buscarMiembrosOrganizacion(assigneeSearchQuery, orgId)
        setAssigneeSearchResults(result.success ? result.data : [])
        setIsSearchingAssignee(false)
      } else {
        setAssigneeSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [assigneeSearchQuery, orgId])

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      setTitleValue("")
      setDescriptionValue("")
      setTags([])
      setTagInput("")
      setDateValue(undefined)
      setAssigneeSearchQuery("")
      setAssigneeSearchResults([])
    }
  }, [open])

  // Auto-resize textareas
  const autoResizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = "auto"
    element.style.height = `${element.scrollHeight}px`
  }, [])

  // Auto-resize title on change
  useEffect(() => {
    autoResizeTextarea(titleInputRef.current)
  }, [titleValue, autoResizeTextarea])

  // Auto-resize description on change
  useEffect(() => {
    autoResizeTextarea(descriptionInputRef.current)
  }, [descriptionValue, autoResizeTextarea])

  const handleQuickUpdate = useCallback(async (field: string, value: unknown) => {
    if (!tareaId || isSaving) return
    setIsSaving(field)

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
      setIsSaving(null)
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

  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
    }
    setTagInput("")
  }, [tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }, [tags])

  // Auto-save tags
  useEffect(() => {
    const saveTags = async () => {
      if (!tareaId || isSavingTags) return

      const currentTags = tarea?.tags || []
      if (JSON.stringify(tags) === JSON.stringify(currentTags)) return

      setIsSavingTags(true)
      try {
        await actualizarTarea(tareaId, { tags: tags.length > 0 ? tags : undefined })
        queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
        queryClient.invalidateQueries({ queryKey: ["tareas"] })
        onUpdated?.()
      } catch {
        toast.error("Error al guardar etiquetas")
      } finally {
        setIsSavingTags(false)
      }
    }

    const timer = setTimeout(saveTags, 500)
    return () => clearTimeout(timer)
  }, [tags, tareaId, tarea, queryClient, onUpdated, isSavingTags])

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (tagInput.trim()) {
        addTag(tagInput)
      }
    }
  }

  // Get initials for avatar
  const getInitials = useCallback((nombre: string, email?: string) => {
    const name = nombre || email || "U"
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [])

  const prioridadConfig = tarea ? PRIORIDAD_CONFIG[tarea.prioridad] : null
  const estadoConfig = tarea ? ESTADO_CONFIG[tarea.estado] : null
  const PrioridadIcon = tarea ? getIconForValue(tarea.prioridad, tareasPrioridadOptions) : null
  const EstadoIcon = tarea ? getIconForValue(tarea.estado, tareasEstadoOptions) : null

  // Ghost input affordance class
  const ghostInputClass = "transition-colors rounded-md -ml-2 p-2 hover:bg-muted/50 cursor-text"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
          {/* Header */}
          <div className="bg-background shrink-0 px-6 py-6 border-b space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <VisuallyHidden>
                  <SheetTitle>Cargando tarea...</SheetTitle>
                </VisuallyHidden>
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <Skeleton className="h-5 w-32" />
              </div>
            ) : tarea ? (
              <>
                {/* Zona 1: Navegación (Top Right) - FIXED: gap-2, no negative margins */}
                <div className="flex items-center justify-end gap-2">
                  {/* Close button */}
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>

                  {/* More menu */}
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
                </div>

                {/* Zona 2: Encabezado - Header Stack */}
                {/* Nivel 1: Título - FIXED: Better alignment */}
                <VisuallyHidden>
                  <SheetTitle>{tarea.titulo}</SheetTitle>
                </VisuallyHidden>
                <textarea
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={() => {
                    if (titleValue !== tarea.titulo) {
                      handleQuickUpdate("titulo", titleValue)
                    }
                  }}
                  placeholder="Título de la tarea..."
                  className={cn(
                    "w-full resize-none overflow-hidden",
                    "font-semibold text-xl text-foreground",
                    "bg-transparent placeholder:text-muted-foreground",
                    "border-2 border-transparent rounded-md",
                    "focus:ring-1 focus:ring-ring focus:border-ring",
                    "transition-all duration-200",
                    "hover:bg-muted/30 hover:border-border/50",
                    isSaving === "titulo" && "opacity-60",
                    "min-h-[2rem] py-1 px-0 focus:px-2 focus:outline-none"
                  )}
                  style={{ height: "auto" }}
                  rows={1}
                />

                {/* Nivel 2: ID - Indentado como subtítulo */}
                <div className="text-xs text-muted-foreground ml-1 pl-1">
                  {tarea.codigo_tarea || "Sin código"} • Creado {formatDistanceToNow(new Date(tarea.creado_en), { addSuffix: true, locale: es })}
                </div>

                {/* Nivel 3: Meta Bar - Nueva estructura con títulos para cada campo */}
                <div className="space-y-3 pt-2">
                  {/* Fila 1: Prioridad y Estado */}
                  <div className="flex gap-4 items-start">
                    {/* Prioridad */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        Prioridad
                      </span>
                      <DropdownMenu open={prioridadDropdownOpen} onOpenChange={setPrioridadDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                          <Badge
                            variant="metadata-outline"
                            dotClassName={prioridadConfig?.dotClassName}
                            showDot
                            className="gap-1 cursor-pointer hover:bg-accent transition-colors"
                          >
                            {isQuickUpdating && isSaving === "prioridad" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                {PrioridadIcon && <PrioridadIcon className="h-3 w-3" />}
                                {prioridadConfig?.label}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </>
                            )}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {tareasPrioridadOptions.map((option) => {
                            const Icon = option.icon
                            return (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleQuickUpdate("prioridad", option.value)}
                                disabled={isQuickUpdating}
                              >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {option.label}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Estado */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        Estado
                      </span>
                      <DropdownMenu open={estadoDropdownOpen} onOpenChange={setEstadoDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                          <Badge
                            variant="metadata-outline"
                            dotClassName={estadoConfig?.dotClassName}
                            showDot
                            className="gap-1 cursor-pointer hover:bg-accent transition-colors"
                          >
                            {isQuickUpdating && isSaving === "estado" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                {EstadoIcon && <EstadoIcon className="h-3 w-3" />}
                                {estadoConfig?.label}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </>
                            )}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {tareasEstadoOptions.map((option) => {
                            const Icon = option.icon
                            return (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleQuickUpdate("estado", option.value)}
                                disabled={isQuickUpdating}
                              >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {option.label}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Fila 2: Vencimiento */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      Vencimiento
                    </span>
                    <div className="w-full max-w-[200px]">
                      <DatePicker
                        value={dateValue ? dateValue.toISOString().split('T')[0] : undefined}
                        onChange={(dateStr) => {
                          const newDate = dateStr ? new Date(dateStr + "T12:00:00") : null
                          setDateValue(newDate)
                          handleQuickUpdate("fecha_vencimiento", dateStr || null)
                        }}
                        placeholder="dd/mm/yyyy"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 5}
                        dateDisplayFormat="dd/MM/yyyy"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Fila 3: Responsable */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      Responsable
                    </span>
                    <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-8 px-2 -ml-2 gap-2 w-full justify-start">
                          {tarea.asignado_nombre_completo ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(tarea.asignado_nombre_completo)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate">
                                {tarea.asignado_nombre_completo}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span className="text-xs text-muted-foreground">Sin asignar</span>
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <div className="p-2">
                          <Input
                            placeholder="Buscar miembro..."
                            value={assigneeSearchQuery}
                            onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {isSearchingAssignee ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                              Buscando...
                            </div>
                          ) : assigneeSearchResults.length === 0 && assigneeSearchQuery.length >= 2 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No se encontraron resultados
                            </div>
                          ) : assigneeSearchResults.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              Escribe al menos 2 caracteres
                            </div>
                          ) : (
                            assigneeSearchResults.map((miembro) => (
                              <button
                                key={miembro.user_id}
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                                onClick={() => {
                                  handleQuickUpdate("asignado_a", miembro.user_id)
                                  setAssigneePopoverOpen(false)
                                  setAssigneeSearchQuery("")
                                }}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(miembro.nombres + " " + miembro.apellidos)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-xs">
                                    {miembro.nombres} {miembro.apellidos}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {miembro.email}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Fila 4: Etiquetas */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      Etiquetas
                    </span>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary/50 h-5 px-2 py-0.5 gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 rounded-full hover:bg-background/20 p-0"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="+ tag"
                        className="h-6 w-20 text-xs px-2"
                      />
                    </div>
                  </div>
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
          </div>

          {/* Zona 3: Cuerpo - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : tarea ? (
              <div className="space-y-6">
                {/* FIXED: Added "DESCRIPCIÓN" section header */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descripción
                  </h4>
                  <textarea
                    ref={descriptionInputRef}
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    onBlur={() => {
                      if (descriptionValue !== (tarea.descripcion || "")) {
                        handleQuickUpdate("descripcion", descriptionValue)
                      }
                    }}
                    placeholder="Agregar una descripción..."
                    className={cn(
                      "w-full resize-none overflow-hidden",
                      "text-sm text-foreground",
                      "bg-transparent placeholder:text-muted-foreground",
                      "border-2 border-transparent rounded-md",
                      "focus:ring-1 focus:ring-ring focus:border-ring",
                      "transition-all duration-200",
                      ghostInputClass,
                      isSaving === "descripcion" && "opacity-60",
                      "min-h-[80px] focus:outline-none"
                    )}
                    style={{ height: "auto" }}
                    rows={3}
                  />
                </div>

                {/* FIXED: Redesigned vinculation section with clear hierarchy */}
                {(tarea.doc_comercial_codigo || tarea.actor_relacionado_codigo_bp) && (
                  <div className="bg-muted/20 border border-border/50 rounded-md p-3 space-y-2">
                    {/* Línea 1: Documento (EDITABLE) - Shows edit icon on hover */}
                    {tarea.doc_comercial_codigo && (
                      <div className="flex items-center gap-2 group">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a
                          href={`/admin/oportunidades/${tarea.doc_comercial_id}`}
                          className="font-medium text-foreground hover:underline truncate flex-1"
                        >
                          {tarea.doc_comercial_codigo}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {(tarea as any).doc_comercial_tipo}
                        </span>
                        {/* Edit indicator - shows on hover */}
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-50">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Línea 2: Actor Relacionado (READ-ONLY, inherited) - Static cursor */}
                    {tarea.actor_relacionado_codigo_bp && (
                      <div className="flex items-center gap-2 text-sm cursor-default">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {tarea.actor_relacionado_nombre_completo || tarea.actor_relacionado_codigo_bp}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          (heredado)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* FIXED: Tags section removed from body, now in header */}

                {/* Comentarios */}
                <ComentariosSection
                  entidadTipo="tarea"
                  entidadId={tarea.id}
                />
              </div>
            ) : null}
          </div>
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
