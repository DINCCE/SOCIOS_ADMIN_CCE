"use client"

import { useState, useEffect } from "react"
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
  Trash2,
  User,
  FileText,
  Users,
  Tag,
  X,
  Search,
  ChevronDown,
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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"

import { ComentariosSection } from "@/components/shared/comentarios-section"
import { actualizarTarea, softDeleteTarea, buscarMiembrosOrganizacion, buscarDocumentosComerciales } from "@/app/actions/tareas"
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
  telefono?: string
  cargo?: string
  role?: string
}

interface DocumentoComercial {
  id: string
  codigo: string
  tipo: string
  estado: string
  titulo?: string
  fecha_doc: string
  solicitante_id?: string
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

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editValues, setEditValues] = useState<Partial<TareaView>>({})

  // Quick update dropdown states
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false)
  const [prioridadDropdownOpen, setPrioridadDropdownOpen] = useState(false)
  const [isQuickUpdating, setIsQuickUpdating] = useState(false)

  // Search states for comboboxes
  const [miembroSearchQuery, setMiembroSearchQuery] = useState("")
  const [miembroComboboxOpen, setMiembroComboboxOpen] = useState(false)
  const [miembroSearchResults, setMiembroSearchResults] = useState<MiembroOrganizacion[]>([])
  const [isSearchingMiembros, setIsSearchingMiembros] = useState(false)
  const [selectedMiembro, setSelectedMiembro] = useState<MiembroOrganizacion | null>(null)

  const [documentoSearchQuery, setDocumentoSearchQuery] = useState("")
  const [documentoComboboxOpen, setDocumentoComboboxOpen] = useState(false)
  const [documentoSearchResults, setDocumentoSearchResults] = useState<DocumentoComercial[]>([])
  const [isSearchingDocumentos, setIsSearchingDocumentos] = useState(false)
  const [selectedDocumento, setSelectedDocumento] = useState<DocumentoComercial | null>(null)

  // Tags state
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [existingTags, setExistingTags] = useState<string[]>([])

  // Get organization ID for searches
  const [orgId, setOrgId] = useState<string>("")

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

  // Fetch existing tags when tarea or orgId changes
  useEffect(() => {
    const fetchExistingTags = async () => {
      if (!orgId) return
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tr_tareas")
        .select("tags")
        .eq("organizacion_id", orgId)
        .not("tags", "is", null)
        .not("tags", "eq", "{}")
      if (error) throw error
      const allTags = data?.flatMap(o => o.tags || []) || []
      const uniqueTags = Array.from(new Set(allTags))
      setExistingTags(uniqueTags)
    }
    fetchExistingTags()
  }, [orgId])

  // Initialize edit values and tags when tarea changes
  useEffect(() => {
    if (tarea) {
      setEditValues({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estado: tarea.estado,
        fecha_vencimiento: tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento) : undefined,
        asignado_a: tarea.asignado_id,
        oportunidad_id: tarea.doc_comercial_id,
      })
      setTags(tarea.tags || [])
      setOrgId(tarea.organizacion_id || "")
    }
  }, [tarea])

  // Debounced search for miembros
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (miembroSearchQuery.length >= 2 && orgId) {
        setIsSearchingMiembros(true)
        const result = await buscarMiembrosOrganizacion(miembroSearchQuery, orgId)
        setMiembroSearchResults(result.success ? result.data : [])
        setIsSearchingMiembros(false)
      } else {
        setMiembroSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [miembroSearchQuery, orgId])

  // Debounced search for documentos
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (documentoSearchQuery.length >= 2 && orgId) {
        setIsSearchingDocumentos(true)
        const result = await buscarDocumentosComerciales(documentoSearchQuery, orgId)
        setDocumentoSearchResults(result.success ? result.data : [])
        setIsSearchingDocumentos(false)
      } else {
        setDocumentoSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [documentoSearchQuery, orgId])

  // Sync selectedMiembro with edit value
  useEffect(() => {
    if (editValues.asignado_a && !selectedMiembro) {
      const found = miembroSearchResults.find(m => m.user_id === editValues.asignado_a)
      if (found) setSelectedMiembro(found)
    } else if (!editValues.asignado_a && selectedMiembro) {
      setSelectedMiembro(null)
    }
  }, [editValues.asignado_a, miembroSearchResults, selectedMiembro])

  // Sync selectedDocumento with edit value
  useEffect(() => {
    if (editValues.oportunidad_id && !selectedDocumento) {
      const found = documentoSearchResults.find(d => d.id === editValues.oportunidad_id)
      if (found) setSelectedDocumento(found)
    } else if (!editValues.oportunidad_id && selectedDocumento) {
      setSelectedDocumento(null)
    }
  }, [editValues.oportunidad_id, documentoSearchResults, selectedDocumento])

  // Reset edit mode when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setEditValues({})
      setSelectedMiembro(null)
      setSelectedDocumento(null)
      setMiembroSearchQuery("")
      setMiembroSearchResults([])
      setDocumentoSearchQuery("")
      setDocumentoSearchResults([])
      setTags([])
      setTagInput("")
    }
  }, [open])

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

  const handleQuickUpdate = async (field: string, value: string) => {
    if (!tareaId) return
    setIsQuickUpdating(true)

    try {
      const result = await actualizarTarea(tareaId, { [field]: value })
      if (result.success) {
        toast.success(`${field === 'estado' ? 'Estado' : 'Prioridad'} actualizado`)
        queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
        queryClient.invalidateQueries({ queryKey: ["tareas"] })
        onUpdated?.()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al actualizar")
    } finally {
      setIsQuickUpdating(false)
      setEstadoDropdownOpen(false)
      setPrioridadDropdownOpen(false)
    }
  }

  const handleSave = async () => {
    if (!tareaId) return
    setIsSaving(true)

    try {
      const result = await actualizarTarea(tareaId, {
        titulo: editValues.titulo,
        descripcion: editValues.descripcion,
        prioridad: editValues.prioridad,
        estado: editValues.estado,
        fecha_vencimiento: editValues.fecha_vencimiento
          ? editValues.fecha_vencimiento.toISOString().split('T')[0]
          : undefined,
        asignado_a: editValues.asignado_a,
        oportunidad_id: editValues.oportunidad_id,
        tags: tags.length > 0 ? tags : undefined,
      })
      if (result.success) {
        toast.success("Tarea actualizada correctamente")
        queryClient.invalidateQueries({ queryKey: ["tarea", tareaId] })
        queryClient.invalidateQueries({ queryKey: ["tareas"] })
        onUpdated?.()
        setIsEditing(false)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error("Error al actualizar la tarea")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (tarea) {
      setEditValues({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estado: tarea.estado,
        fecha_vencimiento: tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento) : undefined,
        asignado_a: tarea.asignado_id,
        oportunidad_id: tarea.doc_comercial_id,
      })
      setTags(tarea.tags || [])
    }
    setIsEditing(false)
  }

  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getDocumentoDisplay = (doc: DocumentoComercial) => {
    return `${doc.codigo}${doc.titulo ? ` - ${doc.titulo}` : ""} (${doc.tipo})`
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
    }
    setTagInput("")
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (tagInput.trim()) {
        addTag(tagInput)
      }
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
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                      {tarea.titulo}
                    </SheetTitle>
                  ) : (
                    <Input
                      value={editValues.titulo || ""}
                      onChange={(e) => setEditValues({ ...editValues, titulo: e.target.value })}
                      className="text-xl font-bold tracking-tight h-auto py-2"
                      placeholder="Título de la tarea"
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Prioridad Badge - Clickeable para edición rápida */}
                    <DropdownMenu open={prioridadDropdownOpen} onOpenChange={setPrioridadDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant="metadata-outline"
                          dotClassName={prioridadConfig?.dotClassName}
                              showDot
                              className="gap-1 cursor-pointer hover:bg-accent transition-colors"
                        >
                          {isQuickUpdating ? (
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
                              <Icon className="mr-2 h-4 w-4" />
                              {option.label}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Estado Badge - Clickeable para edición rápida */}
                    <DropdownMenu open={estadoDropdownOpen} onOpenChange={setEstadoDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant="metadata-outline"
                          dotClassName={estadoConfig?.dotClassName}
                              showDot
                              className="gap-1 cursor-pointer hover:bg-accent transition-colors"
                        >
                          {isQuickUpdating ? (
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
                              <Icon className="mr-2 h-4 w-4" />
                              {option.label}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Fecha de vencimiento - Editable en modo edición */}
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <DatePicker
                          value={editValues.fecha_vencimiento as Date | null | undefined}
                          onChange={(date) => setEditValues({ ...editValues, fecha_vencimiento: date })}
                          placeholder="Seleccionar fecha"
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 5}
                          className="h-8"
                        />
                      </div>
                    ) : (
                      tarea.fecha_vencimiento && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(tarea.fecha_vencimiento).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Badge>
                      )
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
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Descripción
                  </h4>
                  {!isEditing ? (
                    tarea.descripcion ? (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {tarea.descripcion}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sin descripción</p>
                    )
                  ) : (
                    <Textarea
                      value={editValues.descripcion || ""}
                      onChange={(e) => setEditValues({ ...editValues, descripcion: e.target.value })}
                      placeholder="Detalles adicionales de la tarea..."
                      className="min-h-[100px]"
                    />
                  )}
                </div>

                <Separator />

                {/* Asignación */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Asignación
                  </h4>
                  {!isEditing ? (
                    tarea.asignado_nombre_completo ? (
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
                    )
                  ) : (
                    <Popover open={miembroComboboxOpen} onOpenChange={setMiembroComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          type="button"
                          className={cn(
                            "w-full justify-between h-11 bg-muted/30 border-muted-foreground/20",
                            !selectedMiembro && "text-muted-foreground"
                          )}
                        >
                          {selectedMiembro ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(selectedMiembro.nombres || selectedMiembro.email || "U")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">{selectedMiembro.nombres} {selectedMiembro.apellidos}</span>
                                <span className="text-xs text-muted-foreground">{selectedMiembro.email}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Buscar miembro...</span>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <div className="p-2">
                          <Input
                            placeholder="Escribe al menos 2 caracteres..."
                            value={miembroSearchQuery}
                            onChange={(e) => setMiembroSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {isSearchingMiembros ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                              Buscando...
                            </div>
                          ) : miembroSearchResults.length === 0 && miembroSearchQuery.length >= 2 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No se encontraron resultados
                            </div>
                          ) : miembroSearchResults.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              Escribe al menos 2 caracteres para buscar
                            </div>
                          ) : (
                            miembroSearchResults.map((miembro) => (
                              <button
                                key={miembro.user_id}
                                type="button"
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors",
                                  editValues.asignado_a === miembro.user_id && "bg-accent"
                                )}
                                onClick={() => {
                                  setEditValues({ ...editValues, asignado_a: miembro.user_id })
                                  setSelectedMiembro(miembro)
                                  setMiembroSearchQuery("")
                                  setMiembroComboboxOpen(false)
                                }}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs font-semibold">
                                    {getInitials(miembro.nombres || miembro.email || "U")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="font-medium">{miembro.nombres} {miembro.apellidos}</span>
                                  <span className="text-xs text-muted-foreground">{miembro.email}</span>
                                  {miembro.role && (
                                    <Badge variant="outline" className="text-[10px] mt-0.5">
                                      {miembro.role}
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <Separator />

                {/* Vinculación */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vinculación
                  </h4>

                  {!isEditing ? (
                    <>
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
                    </>
                  ) : (
                    <Popover open={documentoComboboxOpen} onOpenChange={setDocumentoComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          type="button"
                          className={cn(
                            "w-full justify-between h-11 bg-muted/30 border-muted-foreground/20",
                            !selectedDocumento && "text-muted-foreground"
                          )}
                        >
                          {selectedDocumento ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{getDocumentoDisplay(selectedDocumento)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Buscar documento...</span>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <div className="p-2">
                          <Input
                            placeholder="Escribe al menos 2 caracteres..."
                            value={documentoSearchQuery}
                            onChange={(e) => setDocumentoSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {isSearchingDocumentos ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                              Buscando...
                            </div>
                          ) : documentoSearchResults.length === 0 && documentoSearchQuery.length >= 2 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No se encontraron resultados
                            </div>
                          ) : documentoSearchResults.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              Escribe al menos 2 caracteres para buscar
                            </div>
                          ) : (
                            documentoSearchResults.map((doc) => (
                              <button
                                key={doc.id}
                                type="button"
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors",
                                  editValues.oportunidad_id === doc.id && "bg-accent"
                                )}
                                onClick={() => {
                                  setEditValues({ ...editValues, oportunidad_id: doc.id })
                                  setSelectedDocumento(doc)
                                  setDocumentoSearchQuery("")
                                  setDocumentoComboboxOpen(false)
                                }}
                              >
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="font-medium">{doc.codigo}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {doc.titulo || doc.tipo} • {doc.estado}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Etiquetas */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Etiquetas
                  </h4>
                  {!isEditing ? (
                    tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sin etiquetas</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      {/* Selected Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 rounded-full hover:bg-background/20 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Tag Input */}
                      <div className="relative">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          placeholder={
                            existingTags.length > 0
                              ? `Escribe y presiona Enter. Ej: ${existingTags.slice(0, 3).join(", ")}`
                              : "Escribe y presiona Enter para añadir etiquetas..."
                          }
                          className="h-11 bg-muted/30 border-muted-foreground/20"
                        />
                        {/* Tag Suggestions */}
                        {tagInput && existingTags.filter(t => t.includes(tagInput.toLowerCase())).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                            {existingTags
                              .filter(t => t.includes(tagInput.toLowerCase()) && !tags.includes(t))
                              .slice(0, 5)
                              .map((suggestedTag) => (
                                <button
                                  key={suggestedTag}
                                  type="button"
                                  onClick={() => addTag(suggestedTag)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                >
                                  {suggestedTag}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
          {tarea && !isEditing && (
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
