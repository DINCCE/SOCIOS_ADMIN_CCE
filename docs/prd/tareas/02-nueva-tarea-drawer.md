# PRD: Nueva Tarea (Drawer)

## Resumen

Crear un drawer para la creación de nuevas tareas siguiendo el patrón establecido en `new-person-sheet.tsx`. El drawer debe permitir ingresar todos los campos necesarios para una tarea y guardarla mediante el server action existente `crearTarea`.

---

## Problema

Actualmente:
- El botón "Nueva Tarea" existe pero no tiene funcionalidad
- No hay forma de crear tareas desde la interfaz de usuario
- El server action `crearTarea` existe pero no se usa desde el frontend

---

## Solución Propuesta

Crear `NewTareaSheet.tsx` con:
- Formulario con validación Zod
- Campos organizados en secciones numeradas
- Integración con `crearTarea` server action
- Refresh de la lista al crear

---

## Diseño UI/UX

### Estructura del Drawer

```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
│ Nueva Tarea                                      │
│ Ingresa los datos de la tarea                    │
├──────────────────────────────────────────────────┤
│ BODY (scrollable)                                │
│                                                  │
│ ① INFORMACIÓN BÁSICA                             │
│ ─────────────────────────────                    │
│ [Título*                                    ]    │
│ [Descripción                                ]    │
│                                                  │
│ ② CLASIFICACIÓN                                  │
│ ─────────────────────────────                    │
│ [Prioridad v]        [Estado v]                  │
│ [Fecha Vencimiento]                              │
│                                                  │
│ ③ ASIGNACIÓN Y VINCULACIÓN                       │
│ ─────────────────────────────                    │
│ [Asignado a (Combobox)                     ]     │
│ [Actor relacionado (Combobox)              ]     │
│ [Doc. Comercial (Combobox)                 ]     │
│                                                  │
│ ④ ETIQUETAS                                      │
│ ─────────────────────────────                    │
│ [Tags input]                                     │
│                                                  │
├──────────────────────────────────────────────────┤
│ FOOTER                                           │
│ [        Crear Tarea         ]                   │
└──────────────────────────────────────────────────┘
```

### Campos del Formulario

| Campo | Tipo | Requerido | Componente |
|-------|------|-----------|------------|
| `titulo` | text | ✅ | `Input` |
| `descripcion` | text | ❌ | `Textarea` |
| `prioridad` | enum | ❌ (default: Media) | `Select` |
| `estado` | enum | ❌ (default: Pendiente) | `Select` |
| `fecha_vencimiento` | date | ❌ | `DatePicker` |
| `asignado_a` | uuid | ❌ | `Combobox` (org members) |
| `relacionado_con_bp` | uuid | ❌ | `Combobox` (actores) |
| `oportunidad_id` | uuid | ❌ | `Combobox` (doc comerciales) |
| `tags` | string[] | ❌ | `TagInput` |

---

## Implementación Técnica

### Paso 1: Crear Schema Zod

Crear archivo `lib/schemas/tarea-schema.ts`:

```typescript
import { z } from "zod"

export const tareaSchema = z.object({
  titulo: z.string()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  descripcion: z.string()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .nullable(),
  prioridad: z.enum(["Baja", "Media", "Alta", "Urgente"]).default("Media"),
  estado: z.enum(["Pendiente", "En Progreso", "Terminada", "Pausada", "Cancelada"]).default("Pendiente"),
  fecha_vencimiento: z.preprocess(
    (val) => (typeof val === "string" && val !== "" ? new Date(val) : val),
    z.date().optional().nullable()
  ),
  asignado_a: z.string().uuid().optional().nullable(),
  relacionado_con_bp: z.string().uuid().optional().nullable(),
  oportunidad_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
})

export type TareaFormValues = z.infer<typeof tareaSchema>
```

### Paso 2: Crear Componente `NewTareaSheet`

Crear archivo `components/procesos/tareas/new-tarea-sheet.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { crearTarea } from "@/app/actions/tareas"
import { tareaSchema, type TareaFormValues } from "@/lib/schemas/tarea-schema"

interface NewTareaSheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (tarea_id: string) => void
  // Pre-fill values for contextual creation
  defaultValues?: Partial<TareaFormValues>
}

export function NewTareaSheet({
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  defaultValues,
}: NewTareaSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      prioridad: "Media",
      estado: "Pendiente",
      fecha_vencimiento: undefined,
      asignado_a: undefined,
      relacionado_con_bp: undefined,
      oportunidad_id: undefined,
      tags: [],
      ...defaultValues,
    },
  })

  async function onSubmit(data: TareaFormValues) {
    setIsPending(true)
    try {
      // Get organization ID from context or session
      const result = await crearTarea({
        organizacion_id: "TODO_GET_FROM_CONTEXT", // See implementation note below
        titulo: data.titulo,
        descripcion: data.descripcion || undefined,
        prioridad: data.prioridad?.toLowerCase() as any,
        oportunidad_id: data.oportunidad_id || undefined,
        asignado_a: data.asignado_a || undefined,
        relacionado_con_bp: data.relacionado_con_bp || undefined,
        fecha_vencimiento: data.fecha_vencimiento
          ? data.fecha_vencimiento.toISOString().split('T')[0]
          : undefined,
      })

      if (!result.success) {
        toast.error("Error al crear tarea", {
          description: result.message,
        })
        return
      }

      toast.success("Tarea creada correctamente")

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["tareas"] })

      form.reset()
      setOpen(false)

      if (onSuccess && result.tarea_id) {
        onSuccess(result.tarea_id)
      }
    } catch (err) {
      console.error("Error creating tarea:", err)
      toast.error("Error inesperado al crear la tarea")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <SheetTrigger asChild>
          <Button size="sm" className="h-8 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-xl w-[90vw] flex flex-col p-0 gap-0 border-l shadow-2xl">
        {/* Header */}
        <div className="bg-background shrink-0 px-6 py-6 border-b">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
              Nueva Tarea
            </SheetTitle>
            <SheetDescription className="text-base text-muted-foreground mt-1">
              Crea una nueva tarea para dar seguimiento.
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <Form {...form}>
            <form id="new-tarea-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

              {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Información Básica
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        Título *
                      </FormLabel>
                      <FormControl>
                        <Input
                          className={cn(
                            "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="Ej: Llamar al cliente para confirmar cita"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        Descripción
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className={cn(
                            "min-h-[100px] bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                          )}
                          placeholder="Detalles adicionales de la tarea..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECCIÓN 2: CLASIFICACIÓN */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Clasificación
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="prioridad"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Prioridad
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                              fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                            )}>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Baja">Baja</SelectItem>
                            <SelectItem value="Media">Media</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          Estado
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                              fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                            )}>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="En Progreso">En Progreso</SelectItem>
                            <SelectItem value="Pausada">Pausada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fecha_vencimiento"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        Fecha de Vencimiento
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value as any}
                          onChange={field.onChange}
                          placeholder="Seleccionar fecha"
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 5}
                          className={cn(
                            "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
                            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECCIÓN 3: ASIGNACIÓN Y VINCULACIÓN */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Asignación y Vinculación
                  </h3>
                  <Separator className="flex-1" />
                </div>

                {/* TODO: Implementar Combobox para asignado_a */}
                {/* Usar OrgMemberCombobox o similar */}

                {/* TODO: Implementar Combobox para relacionado_con_bp */}
                {/* Usar ActorSearchCombobox o similar */}

                {/* TODO: Implementar Combobox para oportunidad_id */}
                {/* Usar DocComercialCombobox o similar */}

                <p className="text-sm text-muted-foreground italic">
                  Los campos de asignación y vinculación se implementarán con Combobox
                  que buscan en las tablas correspondientes.
                </p>
              </div>

            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <SheetFooter className="sm:justify-start">
            <Button
              type="submit"
              form="new-tarea-form"
              className="w-full h-12 font-bold tracking-tight text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Tarea"
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Paso 3: Actualizar Server Action

Modificar `app/actions/tareas.ts` para obtener `organizacion_id` automáticamente:

```typescript
// En crearTarea, si no se pasa organizacion_id, obtenerlo de la sesión
export async function crearTarea(data: {
  organizacion_id?: string  // Hacer opcional
  titulo: string
  // ... resto de campos
}) {
  const supabase = await createClient()

  let orgId = data.organizacion_id
  if (!orgId) {
    // Obtener de la sesión/RPC
    const { data: orgs } = await supabase.rpc('get_user_orgs')
    if (!orgs?.[0]) {
      return { success: false, message: 'No se encontró una organización activa' }
    }
    orgId = orgs[0].organization_id
  }

  // ... resto de la implementación
}
```

### Paso 4: Integrar en `tareas-page-client.tsx`

```tsx
import { NewTareaSheet } from "@/components/procesos/tareas/new-tarea-sheet"

// En el PageHeader.actions:
<NewTareaSheet />
```

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `lib/schemas/tarea-schema.ts` | [NEW] Crear schema Zod |
| `components/procesos/tareas/new-tarea-sheet.tsx` | [NEW] Crear componente |
| `app/actions/tareas.ts` | [MODIFY] Mejorar obtención de org_id |
| `app/admin/procesos/tareas/tareas-page-client.tsx` | [MODIFY] Integrar NewTareaSheet |

---

## Dependencias de Componentes

Usar SOLO los componentes especificados en [FORM_COMPONENTS.md](file:///Users/oscarjavier/AIProjects/Nuevo%20Stack%20CCE/Proyectos/SOCIOS_ADMIN/docs/UI/FORM_COMPONENTS.md):

- `Input` - `@/components/ui/input`
- `Textarea` - `@/components/ui/textarea`
- `Select` - `@/components/ui/select`
- `DatePicker` - `@/components/ui/date-picker`
- `Form*` - `@/components/ui/form`
- `Sheet*` - `@/components/ui/sheet`

---

## Criterios de Aceptación

- [ ] El drawer se abre al hacer clic en "Nueva Tarea"
- [ ] El título es requerido y muestra validación
- [ ] La prioridad por defecto es "Media"
- [ ] El estado por defecto es "Pendiente"
- [ ] El formulario muestra loading state durante submit
- [ ] Al crear exitosamente, se cierra el drawer y refresca la lista
- [ ] Los errores se muestran con toast
- [ ] El drawer puede usarse de forma controlada (props open/onOpenChange)
- [ ] Soporta defaultValues para creación contextual

---

## Estimación

| Fase | Tiempo |
|------|--------|
| Schema Zod | 15 min |
| Componente base (sin comboboxes) | 1.5 horas |
| Integración con page | 15 min |
| Comboboxes (asignado, actor, doc) | 2-3 horas |
| Testing | 30 min |

**Total**: ~4-5 horas
