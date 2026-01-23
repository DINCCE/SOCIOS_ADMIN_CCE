# PRD: Vista de Detalle de Tarea (Drawer)

## Resumen

Crear un drawer para visualizar y editar el detalle de una tarea. Similar al drawer de creación pero en modo lectura/edición. El drawer debe ser invocable desde cualquier contexto (lista de tareas, kanban, documentos comerciales, etc.).

---

## Problema

- No hay forma de ver el detalle completo de una tarea
- No se pueden editar tareas individuales
- Las tareas pueden abrirse desde múltiples contextos (tabla, kanban, otros módulos)
- Una página dedicada `/admin/tareas/[id]` sería menos fluida que un drawer

---

## Solución Propuesta

Crear `TareaDetailSheet` que:
- Muestre todos los campos de la tarea en modo lectura
- Permita edición inline o mediante formulario
- Incluya la sección de comentarios
- Sea invocable desde cualquier parte de la aplicación

---

## Diseño UI/UX

### Estructura del Drawer

```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
│ TAR-00000123                              [Edit] │
│ Llamar al cliente para confirmar cita            │
│                                                  │
│ [🟡 Alta] [🟢 En Progreso] [📅 Vence: 25 ene]   │
├──────────────────────────────────────────────────┤
│ BODY (scrollable)                                │
│                                                  │
│ DESCRIPCIÓN                                      │
│ ─────────────────────────────                    │
│ El cliente solicitó una reunión para revisar     │
│ los términos del contrato...                     │
│                                                  │
│ ASIGNACIÓN                                       │
│ ─────────────────────────────                    │
│ 👤 Juan Pérez (Analista)                         │
│                                                  │
│ VINCULACIÓN                                      │
│ ─────────────────────────────                    │
│ 📄 DOC-00000456 (Oportunidad - En Progreso)     │
│ 👥 ACT-00000789 (María González)                 │
│                                                  │
│ ETIQUETAS                                        │
│ ─────────────────────────────                    │
│ [urgente] [llamar] [seguimiento]                │
│                                                  │
│ ─────────────────────────────                    │
│ 💬 COMENTARIOS (3)                               │
│ ─────────────────────────────                    │
│ [Sección de comentarios integrada]              │
│                                                  │
├──────────────────────────────────────────────────┤
│ FOOTER                                           │
│ Creado hace 3 días por Juan Pérez               │
│ Actualizado hace 2 horas                        │
│                                                  │
│ [Eliminar]     [Marcar Terminada] [Guardar]     │
└──────────────────────────────────────────────────┘
```

### Estados del Drawer

1. **Modo Vista**: Muestra información en solo lectura
2. **Modo Edición**: Campos editables con formulario

---

## Implementación Técnica

### Paso 1: Crear Componente `TareaDetailSheet`

Crear archivo `components/procesos/tareas/tarea-detail-sheet.tsx`:

```tsx
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
  MoreHorizontal,
  Trash2,
  User,
  FileText,
  Users,
  Tag,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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

import { ComentariosSection } from "@/components/shared/comentarios-section"
import { actualizarTarea, softDeleteTarea } from "@/app/actions/tareas"
import { createClient } from "@/lib/supabase/client"
import type { TareaView } from "@/features/procesos/tareas/columns"

interface TareaDetailSheetProps {
  tareaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

const PRIORIDAD_CONFIG = {
  Urgente: { label: "Urgente", color: "bg-red-100 text-red-700 border-red-200" },
  Alta: { label: "Alta", color: "bg-orange-100 text-orange-700 border-orange-200" },
  Media: { label: "Media", color: "bg-blue-100 text-blue-700 border-blue-200" },
  Baja: { label: "Baja", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

const ESTADO_CONFIG = {
  Pendiente: { label: "Pendiente", color: "bg-gray-100 text-gray-700 border-gray-200" },
  "En Progreso": { label: "En Progreso", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  Terminada: { label: "Terminada", color: "bg-green-100 text-green-700 border-green-200" },
  Pausada: { label: "Pausada", color: "bg-orange-100 text-orange-700 border-orange-200" },
  Cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700 border-red-200" },
}

export function TareaDetailSheet({
  tareaId,
  open,
  onOpenChange,
  onDeleted,
}: TareaDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
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

  // Reset editing state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
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
      } else {
        toast.error(result.message)
      }
    } catch (error) {
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
    } catch (error) {
      toast.error("Error al eliminar la tarea")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const prioridadConfig = tarea ? PRIORIDAD_CONFIG[tarea.prioridad as keyof typeof PRIORIDAD_CONFIG] : null
  const estadoConfig = tarea ? ESTADO_CONFIG[tarea.estado as keyof typeof ESTADO_CONFIG] : null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
          {/* Header */}
          <div className="bg-background shrink-0 px-6 py-6 border-b">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ) : tarea ? (
              <>
                <SheetHeader className="text-left space-y-3">
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
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
                      <Badge variant="outline" className={prioridadConfig.color}>
                        {prioridadConfig.label}
                      </Badge>
                    )}
                    {estadoConfig && (
                      <Badge variant="outline" className={estadoConfig.color}>
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
                </SheetHeader>
              </>
            ) : (
              <p className="text-muted-foreground">Tarea no encontrada</p>
            )}
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
                          <Badge key={tag} variant="secondary">
                            <Tag className="h-3 w-3 mr-1" />
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
```

### Paso 2: Crear Hook para Manejo del Drawer

Crear archivo `lib/hooks/use-tarea-detail.ts`:

```typescript
import { create } from "zustand"

interface TareaDetailState {
  tareaId: string | null
  isOpen: boolean
  openTarea: (id: string) => void
  closeTarea: () => void
}

export const useTareaDetail = create<TareaDetailState>((set) => ({
  tareaId: null,
  isOpen: false,
  openTarea: (id: string) => set({ tareaId: id, isOpen: true }),
  closeTarea: () => set({ tareaId: null, isOpen: false }),
}))
```

### Paso 3: Integrar en la Página de Tareas

En `tareas-page-client.tsx`:

```tsx
import { TareaDetailSheet } from "@/components/procesos/tareas/tarea-detail-sheet"
import { useTareaDetail } from "@/lib/hooks/use-tarea-detail"

// En el componente:
const { tareaId, isOpen, openTarea, closeTarea } = useTareaDetail()

// Al hacer clic en una fila:
const handleRowClick = (tarea: TareaView) => {
  openTarea(tarea.id)
}

// Agregar el drawer al final del componente:
<TareaDetailSheet
  tareaId={tareaId}
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) closeTarea()
  }}
/>
```

### Paso 4: Integrar en las Columnas de la Tabla

En `columns.tsx`, modificar la celda de título para ser clickeable:

```tsx
cell: ({ row }) => {
  const titulo = row.getValue('titulo') as string
  const codigo = row.original.codigo_tarea
  return (
    <div 
      className="flex flex-col min-w-0 space-y-0.5 py-1 cursor-pointer hover:text-primary"
      onClick={() => openTarea(row.original.id)}
    >
      {/* ... contenido existente */}
    </div>
  )
}
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `components/procesos/tareas/tarea-detail-sheet.tsx` | [NEW] | Componente principal |
| `lib/hooks/use-tarea-detail.ts` | [NEW] | Store Zustand para estado global |
| `app/admin/procesos/tareas/tareas-page-client.tsx` | [MODIFY] | Integrar drawer |
| `features/procesos/tareas/columns.tsx` | [MODIFY] | Hacer filas clickeables |
| `components/procesos/tareas/tarea-card.tsx` | [MODIFY] | Abrir drawer desde kanban |

---

## Dependencias

- Requiere PRD #3 (Sistema de Comentarios) para mostrar la sección de comentarios

---

## Criterios de Aceptación

- [ ] El drawer se abre al hacer clic en una tarea (lista o kanban)
- [ ] Muestra todos los campos de la tarea
- [ ] Muestra badges de prioridad, estado y fecha correctamente
- [ ] Muestra asignado con avatar y email
- [ ] Muestra vinculaciones como enlaces clickeables
- [ ] Incluye sección de comentarios funcional
- [ ] Permite marcar tarea como terminada
- [ ] Permite eliminar tarea con confirmación
- [ ] Muestra metadata de creación
- [ ] El drawer funciona desde cualquier contexto

---

## Estimación

| Fase | Tiempo |
|------|--------|
| Componente base | 2 horas |
| Hook Zustand | 15 min |
| Integración en página | 30 min |
| Integración en columnas/cards | 30 min |
| Modo edición (opcional fase 2) | 2 horas |
| Testing | 30 min |

**Total**: ~4-5 horas (sin modo edición)
