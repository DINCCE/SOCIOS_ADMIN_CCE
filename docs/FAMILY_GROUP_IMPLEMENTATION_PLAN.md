# Plan de Implementación: Grupo Familiar

> **Objetivo:** Reemplazar los datos mockup del tab "Grupo Familiar" con funcionalidad real conectada a la base de datos.
> 
> **Fecha:** 2026-01-04
> **Estado:** Planificación

---

## 📋 Resumen Ejecutivo

El tab "Grupo Familiar" actualmente usa datos mockup. Necesitamos integrarlo con las funciones RPC existentes (`crear_relacion_bp`, `actualizar_relacion_bp`, `eliminar_relacion_bp`, `obtener_relaciones_bp`, `crear_persona`) para permitir:

1. **Buscar personas existentes** en la BD que no tengan ya una relación con la persona actual
2. **Crear nuevas personas** desde el buscador cuando no existan
3. **Vincular familiares** mediante relaciones de tipo `familiar`
4. **Editar el tipo de relación** (parentesco)
5. **Desvincular familiares** (eliminar relación)
6. **Navegar al perfil** del familiar al hacer clic en su nombre o icono de enlace

---

## 🏗️ Arquitectura de Solución

### Componentes UI Existentes (Reutilizar)

| Componente | Estado | Cambios Necesarios |
|------------|--------|-------------------|
| [`family-group-section.tsx`](../components/socios/personas/family-group-section.tsx) | ✅ Existe | Cargar datos reales, implementar handlers |
| [`add-family-sheet.tsx`](../components/socios/personas/add-family-sheet.tsx) | ✅ Existe | Integrar búsqueda real, integrar creación de persona |
| [`new-person-sheet.tsx`](../components/socios/personas/new-person-sheet.tsx) | ✅ Existe | Reutilizar como sub-componente |
| [`family-card.tsx`](../components/socios/personas/family-card.tsx) | ✅ Existe | Implementar navegación al perfil |

### Funciones de Backend Existentes (Usar)

| Función RPC | Archivo | Propósito |
|-------------|---------|-----------|
| `crear_relacion_bp` | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | Crear relación familiar |
| `actualizar_relacion_bp` | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | Editar tipo de relación |
| `eliminar_relacion_bp` | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | Desvincular familiar |
| `obtener_relaciones_bp` | [`app/actions/relaciones.ts`](../app/actions/relaciones.ts) | Obtener familiares de una persona |
| `crear_persona` | [`app/actions/personas.ts`](../app/actions/personas.ts) | Crear nueva persona desde buscador |

### Vistas de BD Existentes (Usar)

| Vista | Propósito |
|-------|-----------|
| `v_personas_org` | Buscar personas por nombre/documento |
| `v_actores_unificados` | Obtener datos unificados de personas |

---

## 📝 Plan Detallado de Implementación

### FASE 1: Backend - Acciones de Servidor

#### 1.1 Crear acción para buscar personas disponibles

**Archivo:** `app/actions/personas.ts`

**Nueva función:** `buscarPersonasDisponiblesParaRelacion()`

```typescript
/**
 * Search for persons available to create a relationship with
 * Excludes persons that already have a relationship with the given bp_id
 * 
 * @param bp_id - The business partner ID to check existing relationships
 * @param query - Search query (name or document number)
 * @param organizacion_id - Organization ID for filtering
 * @returns Array of available persons
 */
export async function buscarPersonasDisponiblesParaRelacion(
  bp_id: string,
  query: string,
  organizacion_id: string
) {
  const supabase = await createClient()

  // 1. Get existing relationship IDs for this bp
  const { data: relacionesExistentes } = await supabase
    .rpc('obtener_relaciones_bp', {
      p_bp_id: bp_id,
      p_solo_vigentes: true
    })

  // Extract all related bp_ids (both origen and destino)
  const bpIdsRelacionados = new Set<string>()
  relacionesExistentes?.forEach((rel: any) => {
    bpIdsRelacionados.add(rel.bp_origen_id)
    bpIdsRelacionados.add(rel.bp_destino_id)
  })

  // 2. Search persons excluding those already related
  const { data, error } = await supabase
    .from('v_personas_org')
    .select(`
      id,
      codigo_bp,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      tipo_documento,
      numero_documento,
      email_principal,
      celular_principal,
      foto_url
    `)
    .eq('organizacion_id', organizacion_id)
    .not('eliminado_en', 'is', null)
    .or(
      `primer_nombre.ilike.%${query}%,` +
      `segundo_nombre.ilike.%${query}%,` +
      `primer_apellido.ilike.%${query}%,` +
      `segundo_apellido.ilike.%${query}%,` +
      `numero_documento.ilike.%${query}%`
    )
    .limit(50)

  if (error) {
    console.error('Error searching persons:', error)
    return { success: false, data: [] }
  }

  // 3. Filter out persons already related
  const disponibles = data?.filter(
    (persona: any) => !bpIdsRelacionados.has(persona.id)
  ) || []

  return {
    success: true,
    data: disponibles
  }
}
```

**Razonamiento:**
- Usa `obtener_relaciones_bp` para obtener relaciones existentes (bidireccional)
- Filtra personas que ya están relacionadas (evita duplicados)
- Busca por nombre completo o documento
- Filtra por organización y soft-delete
- Retorna máximo 50 resultados (performance)

---

#### 1.2 Crear acción para vincular familiar

**Archivo:** `app/actions/relaciones.ts`

**Nueva función:** `vincularFamiliar()`

```typescript
/**
 * Link a family member using crear_relacion_bp
 * Wrapper specifically for family relationships
 * 
 * @param bp_origen_id - Current person ID
 * @param bp_destino_id - Family member ID to link
 * @param tipo_parentesco - Family relationship type (esposo_a, hijo_a, etc.)
 * @param descripcion - Optional description
 * @returns Object with { success, message, relacion_id? }
 */
export async function vincularFamiliar(data: {
  bp_origen_id: string
  bp_destino_id: string
  tipo_parentesco: 'esposo_a' | 'hijo_a' | 'padre_madre' | 'hermano_a' | 'otro'
  descripcion?: string
}) {
  const supabase = await createClient()

  // Map frontend relationship types to database enum
  const tipoRelacionMap: Record<string, 'familiar'> = {
    esposo_a: 'familiar',
    hijo_a: 'familiar',
    padre_madre: 'familiar',
    hermano_a: 'familiar',
    otro: 'familiar'
  }

  // Store relationship type in atributos JSONB
  const atributos = {
    tipo_parentesco: data.tipo_parentesco,
    fecha_vinculacion: new Date().toISOString()
  }

  const { data: rpcResponse, error } = await supabase.rpc('crear_relacion_bp', {
    p_bp_origen_id: data.bp_origen_id,
    p_bp_destino_id: data.bp_destino_id,
    p_tipo_relacion: tipoRelacionMap[data.tipo_parentesco],
    p_descripcion: data.descripcion,
    p_fecha_inicio: new Date().toISOString().split('T')[0],
    p_atributos: atributos
  })

  if (error) {
    console.error('Error linking family member:', error)
    return {
      success: false,
      message: `Error al vincular familiar: ${error.message}`
    }
  }

  revalidatePath(`/admin/socios/personas/${data.bp_origen_id}`)

  return {
    success: true,
    message: 'Familiar vinculado correctamente',
    relacion_id: (rpcResponse as { id: string }).id
  }
}
```

**Razonamiento:**
- Wrapper específico para relaciones familiares
- Mapea tipos de parentesco del frontend al enum `familiar` de BD
- Almacena `tipo_parentesco` específico en `atributos` JSONB
- Revalida la página del perfil actual
- Usa función RPC existente `crear_relacion_bp`

---

#### 1.3 Crear acción para editar tipo de relación

**Archivo:** `app/actions/relaciones.ts`

**Nueva función:** `editarTipoParentesco()`

```typescript
/**
 * Update family relationship type (parentesco)
 * 
 * @param relacion_id - Relationship ID
 * @param tipo_parentesco - New relationship type
 * @returns Object with { success, message }
 */
export async function editarTipoParentesco(
  relacion_id: string,
  tipo_parentesco: 'esposo_a' | 'hijo_a' | 'padre_madre' | 'hermano_a' | 'otro'
) {
  const supabase = await createClient()

  // Get current relationship
  const { data: currentRel } = await supabase
    .from('bp_relaciones')
    .select('atributos')
    .eq('id', relacion_id)
    .single()

  if (!currentRel) {
    return {
      success: false,
      message: 'Relación no encontrada'
    }
  }

  // Update atributos with new tipo_parentesco
  const nuevosAtributos = {
    ...(currentRel.atributos as Record<string, unknown> || {}),
    tipo_parentesco,
    fecha_actualizacion: new Date().toISOString()
  }

  const { error } = await supabase.rpc('actualizar_relacion_bp', {
    p_relacion_id: relacion_id,
    p_atributos: nuevosAtributos
  })

  if (error) {
    console.error('Error updating relationship type:', error)
    return {
      success: false,
      message: `Error al actualizar parentesco: ${error.message}`
    }
  }

  revalidatePath('/admin/socios/personas')

  return {
    success: true,
    message: 'Parentesco actualizado correctamente'
  }
}
```

**Razonamiento:**
- Actualiza solo el campo `tipo_parentesco` en `atributos` JSONB
- Preserva otros atributos existentes
- Usa función RPC existente `actualizar_relacion_bp`
- Revalida rutas relevantes

---

### FASE 2: Frontend - Componentes UI

#### 2.1 Modificar `AddFamilySheet` para integrar búsqueda real

**Archivo:** `components/socios/personas/add-family-sheet.tsx`

**Cambios principales:**

1. **Agregar props para contexto:**
```typescript
interface AddFamilySheetProps {
  bp_origen_id: string  // ID de la persona actual
  organizacion_id: string // ID de la organización
  onSuccess?: () => void
}
```

2. **Reemplazar mock data con búsqueda real:**
```typescript
// Usar server action para buscar
const [searchResults, setSearchResults] = useState<PersonaBuscada[]>([])
const [isSearching, setIsSearching] = useState(false)

async function handleSearch(query: string) {
  if (query.length < 2) {
    setSearchResults([])
    return
  }

  setIsSearching(true)
  const result = await buscarPersonasDisponiblesParaRelacion(
    bp_origen_id,
    query,
    organizacion_id
  )
  setSearchResults(result.success ? result.data : [])
  setIsSearching(false)
}
```

3. **Integrar `vincularFamiliar`:**
```typescript
async function onSubmit(data: AddFamilyFormValues) {
  setIsPending(true)
  try {
    const result = await vincularFamiliar({
      bp_origen_id,
      bp_destino_id: data.persona_id,
      tipo_parentesco: data.relacion,
      descripcion: `Vinculado como ${data.relacion}`
    })

    if (result.success) {
      toast.success("Familiar vinculado correctamente")
      form.reset()
      setSearchQuery("")
      setComboboxOpen(false)
      setOpen(false)
      onSuccess?.()
    } else {
      toast.error(result.message)
    }
  } catch (err) {
    console.error("Error linking family member:", err)
    toast.error("Error al vincular familiar")
  } finally {
    setIsPending(false)
  }
}
```

4. **Agregar opción "Crear nueva persona" en resultados de búsqueda:**
```typescript
{searchResults.length === 0 && searchQuery.length >= 2 && (
  <button
    type="button"
    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
    onClick={() => {
      // Abrir NewPersonSheet como nested sheet
      setShowNewPersonSheet(true)
      setComboboxOpen(false)
    }}
  >
    <UserPlus className="h-4 w-4 text-muted-foreground" />
    <span className="text-muted-foreground">Crear nueva persona</span>
  </button>
)}
```

---

#### 2.2 Integrar `NewPersonSheet` dentro de `AddFamilySheet`

**Archivo:** `components/socios/personas/add-family-sheet.tsx`

**Implementación:**

1. **Agregar estado para nested sheet:**
```typescript
const [showNewPersonSheet, setShowNewPersonSheet] = useState(false)
const [createdPersonaId, setCreatedPersonaId] = useState<string | null>(null)
```

2. **Renderizar `NewPersonSheet` como componente anidado:**
```typescript
{showNewPersonSheet && (
  <NewPersonSheet
    open={showNewPersonSheet}
    onOpenChange={setShowNewPersonSheet}
    onSuccess={(bp_id) => {
      setCreatedPersonaId(bp_id)
      setShowNewPersonSheet(false)
      // Pre-seleccionar la persona creada en el formulario
      form.setValue('persona_id', bp_id)
      // Buscar detalles de la persona creada para mostrarla
      // ...
    }}
  />
)}
```

3. **Crear versión de `NewPersonSheet` que acepte `open` prop:**
```typescript
// Modificar NewPersonSheet para aceptar open controlado
interface NewPersonSheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (bp_id: string) => void
}
```

---

#### 2.3 Crear componente `EditRelationshipDialog`

**Archivo nuevo:** `components/socios/personas/edit-relationship-dialog.tsx`

**Propósito:** Diálogo modal para editar el tipo de parentesco

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const editRelationshipSchema = z.object({
  tipo_parentesco: z.enum(["esposo_a", "hijo_a", "padre_madre", "hermano_a", "otro"]),
})

type EditRelationshipFormValues = z.infer<typeof editRelationshipSchema>

interface EditRelationshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relacion_id: string
  current_tipo_parentesco: string
  onSuccess?: () => void
}

export function EditRelationshipDialog({
  open,
  onOpenChange,
  relacion_id,
  current_tipo_parentesco,
  onSuccess,
}: EditRelationshipDialogProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<EditRelationshipFormValues>({
    resolver: zodResolver(editRelationshipSchema),
    defaultValues: {
      tipo_parentesco: current_tipo_parentesco as any,
    },
  })

  async function onSubmit(data: EditRelationshipFormValues) {
    setIsPending(true)
    try {
      const result = await editarTipoParentesco(
        relacion_id,
        data.tipo_parentesco
      )

      if (result.success) {
        toast.success("Parentesco actualizado correctamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error("Error updating relationship:", err)
      toast.error("Error al actualizar parentesco")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Parentesco</DialogTitle>
          <DialogDescription>
            Cambia el tipo de relación familiar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_parentesco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Parentesco</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar parentesco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="esposo_a">Esposo/a</SelectItem>
                      <SelectItem value="hijo_a">Hijo/a</SelectItem>
                      <SelectItem value="padre_madre">Padre/Madre</SelectItem>
                      <SelectItem value="hermano_a">Hermano/a</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => form.handleSubmit(onSubmit)()}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

#### 2.4 Crear componente `UnlinkFamilyConfirmDialog`

**Archivo nuevo:** `components/socios/personas/unlink-family-confirm-dialog.tsx`

**Propósito:** Diálogo de confirmación para desvincular familiar

```typescript
"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

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
import { Button } from "@/components/ui/button"

interface UnlinkFamilyConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relacion_id: string
  memberName: string
  onSuccess?: () => void
}

export function UnlinkFamilyConfirmDialog({
  open,
  onOpenChange,
  relacion_id,
  memberName,
  onSuccess,
}: UnlinkFamilyConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleUnlink() {
    setIsPending(true)
    try {
      const result = await eliminarRelacion(relacion_id)

      if (result.success) {
        toast.success("Familiar desvinculado correctamente")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      console.error("Error unlinking family member:", err)
      toast.error("Error al desvincular familiar")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Desvincular Familiar</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas desvincular a <strong>{memberName}</strong> del grupo familiar?
            <br /><br />
            Esta acción eliminará la relación familiar pero no borrará la persona de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleUnlink}
            disabled={isPending}
          >
            {isPending ? "Desvinculando..." : "Desvincular"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

#### 2.5 Modificar `FamilyCard` para navegar al perfil

**Archivo:** `components/socios/personas/family-card.tsx`

**Cambios:**

1. **Agregar `useRouter`:**
```typescript
import { useRouter } from "next/navigation"

// Dentro del componente
const router = useRouter()
```

2. **Implementar navegación al perfil:**
```typescript
const handleViewProfile = (memberId: string) => {
  router.push(`/admin/socios/personas/${memberId}`)
}

// Actualizar onClick del card
<Card
  className={cn(
    "p-4 hover:border-primary/50 transition-colors cursor-pointer group",
    className
  )}
  onClick={() => handleViewProfile(member.id)}
>
```

3. **Prevenir propagación en botones de acción:**
```typescript
// Botón de enlace externo ya tiene onClick={(e) => e.stopPropagation()}
// DropdownMenu también lo maneja correctamente
```

---

#### 2.6 Modificar `FamilyGroupSection` para cargar datos reales

**Archivo:** `components/socios/personas/family-group-section.tsx`

**Cambios principales:**

1. **Agregar props para contexto:**
```typescript
interface FamilyGroupSectionProps {
  bp_id: string  // ID de la persona actual
  organizacion_id: string // ID de la organización
}
```

2. **Cargar relaciones usando `obtenerRelaciones`:**
```typescript
"use client"

import { useEffect, useState } from "react"
import { obtenerRelaciones } from "@/app/actions/relaciones"
import { FamilyCard } from "./family-card"
import { AddFamilySheet } from "./add-family-sheet"
import { EditRelationshipDialog } from "./edit-relationship-dialog"
import { UnlinkFamilyConfirmDialog } from "./unlink-family-confirm-dialog"

interface FamilyMember {
  id: string
  nombre: string
  relacion: string
  relacion_id: string  // ID de la relación para editar/eliminar
  documento: string
  fecha_nacimiento: string
  estado: "activo" | "inactivo"
  foto?: string | null
  celular?: string | null
}

export function FamilyGroupSection({ bp_id, organizacion_id }: FamilyGroupSectionProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false)
  const [selectedRelacionId, setSelectedRelacionId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string>("")

  // Cargar relaciones al montar
  useEffect(() => {
    async function loadFamilyMembers() {
      setIsLoading(true)
      const result = await obtenerRelaciones(bp_id, true)
      
      if (result.success && result.data) {
        // Transformar relaciones a formato FamilyMember
        const members = result.data
          .filter((rel: any) => rel.tipo_relacion === 'familiar')
          .map((rel: any) => {
            // Determinar si es origen o destino para obtener datos correctos
            const isOrigen = rel.bp_origen_id === bp_id
            const relatedBpId = isOrigen ? rel.bp_destino_id : rel.bp_origen_id
            
            // Obtener datos de la persona relacionada
            // (Aquí necesitarías hacer un query adicional o usar una vista)
            return {
              id: relatedBpId,
              nombre: isOrigen ? rel.destino_nombre : rel.origen_nombre,
              relacion: (rel.atributos?.tipo_parentesco as string) || 'otro',
              relacion_id: rel.id,
              documento: isOrigen ? rel.destino_documento : rel.origen_documento,
              fecha_nacimiento: isOrigen ? rel.destino_fecha_nacimiento : rel.origen_fecha_nacimiento,
              estado: rel.es_actual ? 'activo' : 'inactivo',
              foto: isOrigen ? rel.destino_foto : rel.origen_foto,
              celular: isOrigen ? rel.destino_celular : rel.origen_celular,
            }
          })
        
        setFamilyMembers(members)
      }
      setIsLoading(false)
    }

    loadFamilyMembers()
  }, [bp_id])

  const handleEditRole = (memberId: string, relacionId: string) => {
    setSelectedRelacionId(relacionId)
    setEditDialogOpen(true)
  }

  const handleUnlink = (memberId: string, relacionId: string, memberName: string) => {
    setSelectedRelacionId(relacionId)
    setSelectedMemberName(memberName)
    setUnlinkDialogOpen(true)
  }

  const handleRefresh = () => {
    // Recargar relaciones
    // ...
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Grupo Familiar
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona el núcleo familiar y los beneficiarios del socio.
          </p>
        </div>
        <AddFamilySheet 
          bp_origen_id={bp_id}
          organizacion_id={organizacion_id}
          onSuccess={handleRefresh}
        />
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando grupo familiar...
        </div>
      ) : familyMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyMembers.map(member => (
            <FamilyCard
              key={member.id}
              member={member}
              onViewProfile={(memberId) => {
                // Navegación ya implementada en FamilyCard
              }}
              onEditRole={(memberId) => handleEditRole(memberId, member.relacion_id)}
              onUnlink={(memberId) => handleUnlink(memberId, member.relacion_id, member.nombre)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/20">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Sin grupo familiar
                </h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Este socio aún no tiene familiares vinculados.
                </p>
              </div>
              <AddFamilySheet 
                bp_origen_id={bp_id}
                organizacion_id={organizacion_id}
                onSuccess={handleRefresh}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      {selectedRelacionId && (
        <>
          <EditRelationshipDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            relacion_id={selectedRelacionId}
            current_tipo_parentesco={familyMembers.find(m => m.relacion_id === selectedRelacionId)?.relacion || 'otro'}
            onSuccess={handleRefresh}
          />
          <UnlinkFamilyConfirmDialog
            open={unlinkDialogOpen}
            onOpenChange={setUnlinkDialogOpen}
            relacion_id={selectedRelacionId}
            memberName={selectedMemberName}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  )
}
```

---

### FASE 3: Integración con Página de Perfil

#### 3.1 Actualizar página de detalle de persona

**Archivo:** `app/admin/socios/personas/[id]/page.tsx`

**Cambios:**

1. **Obtener `bp_id` y `organizacion_id`:**
```typescript
// Ya deberías tener estos datos disponibles desde el contexto
// Pásalos como props a FamilyGroupSection
```

2. **Renderizar `FamilyGroupSection` con props:**
```typescript
<FamilyGroupSection 
  bp_id={persona.id}
  organizacion_id={persona.organizacion_id}
/>
```

---

## 🔄 Flujo de Usuario

### Escenario 1: Vincular familiar existente

1. Usuario hace clic en "Añadir Familiar"
2. Se abre `AddFamilySheet`
3. Usuario escribe nombre en el buscador
4. Sistema muestra personas disponibles (filtrando las ya relacionadas)
5. Usuario selecciona persona
6. Usuario selecciona tipo de parentesco
7. Usuario hace clic en "Vincular Familiar"
8. Sistema llama `vincularFamiliar()` → `crear_relacion_bp`
9. Sistema muestra toast de éxito
10. Se cierra el sheet y se recarga la lista de familiares

### Escenario 2: Crear y vincular nueva persona

1. Usuario hace clic en "Añadir Familiar"
2. Se abre `AddFamilySheet`
3. Usuario escribe nombre en el buscador
4. No se encuentran resultados
5. Usuario hace clic en "Crear nueva persona"
6. Se abre `NewPersonSheet` (nested sheet)
7. Usuario completa formulario de creación
8. Usuario hace clic en "Crear Persona"
9. Sistema llama `crear_persona`
10. Se cierra `NewPersonSheet` y la persona creada se pre-selecciona en `AddFamilySheet`
11. Usuario selecciona tipo de parentesco
12. Usuario hace clic en "Vincular Familiar"
13. Sistema llama `vincularFamiliar()`
14. Se cierra el sheet y se recarga la lista

### Escenario 3: Editar tipo de parentesco

1. Usuario hace clic en menú de opciones (⋮) en tarjeta de familiar
2. Usuario hace clic en "Editar Rol"
3. Se abre `EditRelationshipDialog`
4. Usuario selecciona nuevo tipo de parentesco
5. Usuario hace clic en "Guardar Cambios"
6. Sistema llama `editarTipoParentesco()` → `actualizar_relacion_bp`
7. Se cierra el diálogo y se recarga la lista

### Escenario 4: Desvincular familiar

1. Usuario hace clic en menú de opciones (⋮) en tarjeta de familiar
2. Usuario hace clic en "Desvincular"
3. Se abre `UnlinkFamilyConfirmDialog`
4. Usuario confirma acción
5. Sistema llama `eliminarRelacion()` → `eliminar_relacion_bp`
6. Se cierra el diálogo y se recarga la lista

### Escenario 5: Ver perfil de familiar

1. Usuario hace clic en nombre del familiar o en icono de enlace externo
2. Sistema navega a `/admin/socios/personas/{familiar_id}`
3. Se muestra el perfil completo del familiar

---

## 📊 Estructura de Datos

### Relación Familiar en BD

```typescript
// Tabla: bp_relaciones
{
  id: "uuid",
  bp_origen_id: "uuid",  // Persona actual
  bp_destino_id: "uuid", // Familiar
  tipo_relacion: "familiar",
  descripcion: "Vinculado como hijo_a",
  fecha_inicio: "2026-01-04",
  fecha_fin: null,
  es_actual: true,
  atributos: {
    tipo_parentesco: "hijo_a",
    fecha_vinculacion: "2026-01-04T20:00:00Z"
  },
  creado_en: "2026-01-04T20:00:00Z",
  actualizado_en: "2026-01-04T20:00:00Z",
  eliminado_en: null
}
```

### Tipos de Parentesco

| Valor | Descripción |
|-------|-------------|
| `esposo_a` | Esposo/a |
| `hijo_a` | Hijo/a |
| `padre_madre` | Padre/Madre |
| `hermano_a` | Hermano/a |
| `otro` | Otro |

---

## ✅ Checklist de Implementación

### Backend
- [ ] Crear `buscarPersonasDisponiblesParaRelacion()` en `app/actions/personas.ts`
- [ ] Crear `vincularFamiliar()` en `app/actions/relaciones.ts`
- [ ] Crear `editarTipoParentesco()` en `app/actions/relaciones.ts`

### Frontend
- [ ] Modificar `AddFamilySheet` para integrar búsqueda real
- [ ] Integrar `NewPersonSheet` como nested sheet en `AddFamilySheet`
- [ ] Crear `EditRelationshipDialog`
- [ ] Crear `UnlinkFamilyConfirmDialog`
- [ ] Modificar `FamilyCard` para navegar al perfil
- [ ] Modificar `FamilyGroupSection` para cargar datos reales
- [ ] Actualizar página de detalle para pasar props a `FamilyGroupSection`

### Testing
- [ ] Probar flujo: buscar → seleccionar → vincular
- [ ] Probar flujo: crear nueva persona → vincular
- [ ] Probar flujo: editar tipo de parentesco
- [ ] Probar flujo: desvincular familiar
- [ ] Probar navegación al perfil del familiar
- [ ] Probar prevención de relaciones duplicadas
- [ ] Probar validación de campos
- [ ] Probar manejo de errores

---

## 🎨 Consideraciones UX

### Búsqueda de Personas
- **Debounce:** Implementar debounce de 300ms para evitar demasiadas llamadas
- **Mínimo de caracteres:** Solo buscar después de 2 caracteres
- **Loading state:** Mostrar spinner mientras se busca
- **Empty state:** Mostrar opción de crear persona cuando no hay resultados

### Creación de Persona
- **Nested sheet:** Usar sheet anidado para mejor UX
- **Auto-selección:** Pre-seleccionar persona creada automáticamente
- **Context preservation:** Mantener el formulario de relación abierto

### Edición de Parentesco
- **Modal simple:** Usar Dialog en lugar de Sheet para acciones rápidas
- **Confirmación visual:** Mostrar cambio actual vs nuevo

### Desvinculación
- **Confirmación:** Siempre pedir confirmación antes de eliminar
- **Explicación clara:** Aclarar que no se borra la persona, solo la relación
- **Destructive action:** Usar color rojo para indicar acción irreversible

---

## 🚀 Optimizaciones

### Performance
- **Caching:** Usar React Query para cachear resultados de búsqueda
- **Pagination:** Implementar paginación si hay más de 50 resultados
- **Indexing:** Asegurar índices en `v_personas_org` para búsquedas por nombre/documento

### Accesibilidad
- **Keyboard navigation:** Asegurar navegación por teclado en todos los componentes
- **Screen readers:** Añadir ARIA labels apropiados
- **Focus management:** Manejar focus al abrir/cerrar sheets y diálogos

### Responsiveness
- **Mobile-first:** Diseñar pensando en pantallas pequeñas
- **Touch targets:** Asegurar botones de al menos 44x44px
- **Sheet behavior:** Usar full-screen en móviles

---

## 📚 Referencias

- [`docs/api/RELACIONES.md`](./RELACIONES.md) - API de relaciones
- [`docs/api/CREAR_PERSONA.md`](./CREAR_PERSONA.md) - API de creación de personas
- [`docs/database/FUNCTIONS.md`](./database/FUNCTIONS.md) - Funciones RPC disponibles
- [`docs/database/SCHEMA.md`](./database/SCHEMA.md) - Esquema de BD

---

**Última actualización:** 2026-01-04
**Autor:** KingMode AI Assistant
