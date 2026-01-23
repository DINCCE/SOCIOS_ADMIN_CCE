# PRD: Sistema de Comentarios (Multi-Entidad)

## Resumen

Implementar un sistema de comentarios reutilizable que permita agregar notas y conversaciones a diferentes entidades del sistema (tareas, documentos comerciales, actores, etc.). El diseño es modular para implementarse una vez y usarse en múltiples contextos.

---

## Problema

- No existe forma de agregar comentarios o notas a las tareas
- Los equipos no pueden colaborar dentro del sistema
- La comunicación sobre tareas/documentos ocurre fuera de la plataforma
- Se pierde contexto histórico de decisiones y discusiones

---

## Solución Propuesta

### Arquitectura Multi-Entidad

Crear una tabla genérica `tr_comentarios` con referencia polimórfica:

```
entidad_tipo: 'tarea' | 'doc_comercial' | 'actor' | 'asociado'
entidad_id: uuid
```

Esto permite usar UN SOLO sistema de comentarios para múltiples entidades.

---

## Diseño de Base de Datos

### Nueva Tabla: `tr_comentarios`

```sql
-- Ejecutar en Supabase MCP Server
CREATE TABLE public.tr_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia polimórfica
  entidad_tipo text NOT NULL,  -- 'tarea', 'doc_comercial', 'actor', etc.
  entidad_id uuid NOT NULL,

  -- Contenido
  contenido text NOT NULL,
  
  -- Metadatos
  es_interno boolean DEFAULT false,  -- Solo visible para admins
  es_resolucion boolean DEFAULT false,  -- Marca como comentario de resolución
  
  -- Auditoría
  organizacion_id uuid NOT NULL REFERENCES config_organizaciones(id),
  creado_en timestamptz DEFAULT now() NOT NULL,
  creado_por uuid REFERENCES auth.users(id),
  actualizado_en timestamptz DEFAULT now(),
  actualizado_por uuid REFERENCES auth.users(id),
  eliminado_en timestamptz,
  eliminado_por uuid REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT tr_comentarios_entidad_tipo_check 
    CHECK (entidad_tipo IN ('tarea', 'doc_comercial', 'actor', 'asociado'))
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_comentarios_entidad ON public.tr_comentarios(entidad_tipo, entidad_id);
CREATE INDEX idx_comentarios_organizacion ON public.tr_comentarios(organizacion_id);
CREATE INDEX idx_comentarios_creado_por ON public.tr_comentarios(creado_por);

-- RLS Policies
ALTER TABLE public.tr_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY tr_comentarios_select ON public.tr_comentarios
  FOR SELECT TO authenticated
  USING (
    eliminado_en IS NULL 
    AND can_user_v2('tr_comentarios', 'select', organizacion_id)
  );

CREATE POLICY tr_comentarios_insert ON public.tr_comentarios
  FOR INSERT TO authenticated
  WITH CHECK (can_user_v2('tr_comentarios', 'insert', organizacion_id));

CREATE POLICY tr_comentarios_update ON public.tr_comentarios
  FOR UPDATE TO authenticated
  USING (can_user_v2('tr_comentarios', 'update', organizacion_id));

CREATE POLICY tr_comentarios_delete ON public.tr_comentarios
  FOR DELETE TO authenticated
  USING (can_user_v2('tr_comentarios', 'delete', organizacion_id));
```

### Nueva Vista: `v_comentarios_org`

```sql
-- Vista con información del autor
CREATE VIEW public.v_comentarios_org AS
SELECT
  c.id,
  c.entidad_tipo,
  c.entidad_id,
  c.contenido,
  c.es_interno,
  c.es_resolucion,
  c.organizacion_id,
  org.nombre AS organizacion_nombre,
  c.creado_en,
  c.creado_por,
  uc.email AS creado_por_email,
  uc.raw_user_meta_data->>'name' AS creado_por_nombre,
  om.cargo AS creado_por_cargo,
  c.actualizado_en,
  c.eliminado_en
FROM tr_comentarios c
  LEFT JOIN config_organizaciones org ON org.id = c.organizacion_id
  LEFT JOIN auth.users uc ON uc.id = c.creado_por
  LEFT JOIN config_organizacion_miembros om ON om.user_id = c.creado_por 
    AND om.organization_id = c.organizacion_id
    AND om.eliminado_en IS NULL
WHERE c.eliminado_en IS NULL;
```

### Permisos en `config_roles_permisos`

```sql
-- Agregar permisos para la nueva tabla
INSERT INTO config_roles_permisos (role, resource, action, allow) VALUES
  ('owner', 'tr_comentarios', 'select', true),
  ('owner', 'tr_comentarios', 'insert', true),
  ('owner', 'tr_comentarios', 'update', true),
  ('owner', 'tr_comentarios', 'delete', true),
  ('admin', 'tr_comentarios', 'select', true),
  ('admin', 'tr_comentarios', 'insert', true),
  ('admin', 'tr_comentarios', 'update', true),
  ('admin', 'tr_comentarios', 'delete', true),
  ('analyst', 'tr_comentarios', 'select', true),
  ('analyst', 'tr_comentarios', 'insert', true),
  ('analyst', 'tr_comentarios', 'update', true),
  ('analyst', 'tr_comentarios', 'delete', false),
  ('auditor', 'tr_comentarios', 'select', true),
  ('auditor', 'tr_comentarios', 'insert', false),
  ('auditor', 'tr_comentarios', 'update', false),
  ('auditor', 'tr_comentarios', 'delete', false);
```

> [!IMPORTANT]
> Todas las operaciones de base de datos deben ejecutarse exclusivamente a través del **Supabase MCP Server**.

---

## Diseño UI/UX

### Componente Reutilizable: `ComentariosSection`

```
┌──────────────────────────────────────────────────┐
│ 💬 Comentarios (3)                    [+ Agregar]│
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐   │
│ │ 👤 Juan Pérez            hace 2 horas      │   │
│ │ Llamé al cliente, quedamos en reunión      │   │
│ │ mañana a las 10am.                         │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 👤 María García           ayer             │   │
│ │ El cliente solicitó documentos adicionales │   │
│ │ para el proceso.                           │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ [Escribe un comentario...              ]   │   │
│ │                              [Comentar]    │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Características

- Lista de comentarios ordenados por fecha (más reciente primero o últimos)
- Avatar del autor con iniciales
- Nombre y cargo del autor
- Timestamp relativo ("hace 2 horas", "ayer")
- Input para nuevo comentario
- Opciones para editar/eliminar propios comentarios
- Badge para comentarios internos (solo visible para roles permitidos)

---

## Implementación Técnica

### Paso 1: Crear Migración en Supabase

Usar el **Supabase MCP Server** para ejecutar:

```sql
-- Ver SQL en sección "Diseño de Base de Datos"
```

### Paso 2: Crear Server Actions

Crear archivo `app/actions/comentarios.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type EntidadTipo = 'tarea' | 'doc_comercial' | 'actor' | 'asociado'

/**
 * Crear un nuevo comentario
 */
export async function crearComentario(data: {
  entidad_tipo: EntidadTipo
  entidad_id: string
  contenido: string
  es_interno?: boolean
  es_resolucion?: boolean
}) {
  const supabase = await createClient()

  // Obtener organización activa
  const { data: orgs } = await supabase.rpc('get_user_orgs')
  if (!orgs?.[0]) {
    return { success: false, message: 'No se encontró una organización activa' }
  }

  const { data: comentario, error } = await supabase
    .from('tr_comentarios')
    .insert({
      entidad_tipo: data.entidad_tipo,
      entidad_id: data.entidad_id,
      contenido: data.contenido,
      es_interno: data.es_interno ?? false,
      es_resolucion: data.es_resolucion ?? false,
      organizacion_id: orgs[0].organization_id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating comentario:', error)
    return { success: false, message: error.message }
  }

  // Revalidar paths relevantes
  revalidatePath('/admin/procesos/tareas')
  revalidatePath('/admin/procesos/documentos-comerciales')

  return { success: true, comentario_id: comentario.id }
}

/**
 * Obtener comentarios de una entidad
 */
export async function obtenerComentarios(
  entidad_tipo: EntidadTipo,
  entidad_id: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_comentarios_org')
    .select('*')
    .eq('entidad_tipo', entidad_tipo)
    .eq('entidad_id', entidad_id)
    .order('creado_en', { ascending: false })

  if (error) {
    console.error('Error fetching comentarios:', error)
    return { success: false, message: error.message, data: [] }
  }

  return { success: true, data }
}

/**
 * Actualizar un comentario (solo el autor puede hacerlo)
 */
export async function actualizarComentario(
  comentario_id: string,
  contenido: string
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tr_comentarios')
    .update({
      contenido,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', comentario_id)

  if (error) {
    console.error('Error updating comentario:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/admin/procesos/tareas')

  return { success: true }
}

/**
 * Eliminar un comentario (soft delete)
 */
export async function eliminarComentario(comentario_id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tr_comentarios')
    .update({ eliminado_en: new Date().toISOString() })
    .eq('id', comentario_id)

  if (error) {
    console.error('Error deleting comentario:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/admin/procesos/tareas')

  return { success: true }
}
```

### Paso 3: Crear Componente Reutilizable

Crear archivo `components/shared/comentarios-section.tsx`:

```tsx
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
import { Badge } from "@/components/ui/badge"
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
}

export function ComentariosSection({
  entidadTipo,
  entidadId,
  className,
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comentarios ({comentarios.length})
        </h3>
      </div>

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
          comentarios.map((comentario: any) => (
            <div
              key={comentario.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {comentario.creado_por_nombre?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {comentario.creado_por_nombre || comentario.creado_por_email}
                  </span>
                  {comentario.creado_por_cargo && (
                    <Badge variant="outline" className="text-[10px]">
                      {comentario.creado_por_cargo}
                    </Badge>
                  )}
                  {comentario.es_interno && (
                    <Badge variant="secondary" className="text-[10px]">
                      Interno
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(comentario.creado_en), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>

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

                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comentario.contenido}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input nuevo comentario */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Escribe un comentario..."
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              handleSubmit()
            }
          }}
        />
        <Button
          size="icon"
          className="shrink-0"
          disabled={!nuevoComentario.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        Presiona ⌘+Enter para enviar
      </p>
    </div>
  )
}
```

### Paso 4: Usar en Tareas y Documentos

```tsx
// En TareaDetailSheet o DocComercialDetailSheet:
import { ComentariosSection } from "@/components/shared/comentarios-section"

<ComentariosSection
  entidadTipo="tarea"
  entidadId={tareaId}
  className="mt-6"
/>
```

---

## Archivos a Crear

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `app/actions/comentarios.ts` | [NEW] | Server actions para CRUD |
| `components/shared/comentarios-section.tsx` | [NEW] | Componente UI reutilizable |
| `lib/db-types.ts` | [MODIFY] | Agregar tipos TypeScript |

## Migraciones de Base de Datos

> [!CAUTION]
> Ejecutar a través del **Supabase MCP Server** únicamente.

1. Crear tabla `tr_comentarios`
2. Crear vista `v_comentarios_org`
3. Agregar permisos en `config_roles_permisos`

---

## Extensibilidad

El sistema está diseñado para usarse en:

| Entidad | Valor `entidad_tipo` | Uso |
|---------|---------------------|-----|
| Tareas | `'tarea'` | Notas de seguimiento |
| Documentos Comerciales | `'doc_comercial'` | Historial de negociación |
| Actores/Personas | `'actor'` | Notas sobre el cliente |
| Asociados | `'asociado'` | Historial de membresía |

---

## Criterios de Aceptación

- [ ] La tabla `tr_comentarios` existe con RLS habilitado
- [ ] Los comentarios se pueden crear y mostrar en tareas
- [ ] Se muestra nombre, cargo y avatar del autor
- [ ] Timestamps son relativos ("hace 2 horas")
- [ ] Solo el autor puede editar/eliminar sus comentarios
- [ ] El componente es reutilizable en otras entidades
- [ ] ⌘+Enter envía el comentario

---

## Estimación

| Fase | Tiempo |
|------|--------|
| Migración SQL (via MCP) | 30 min |
| Server Actions | 1 hora |
| Componente UI | 2 horas |
| Integración en Tareas | 30 min |
| Testing | 30 min |

**Total**: ~4-5 horas
