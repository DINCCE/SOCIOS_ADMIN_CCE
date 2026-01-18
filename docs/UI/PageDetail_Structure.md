# PageDetail Structure

> **Pattern for detail pages with two-column layout** - All detail pages (Personas, Empresas, Acciones, Oportunidades) follow this standardized structure.

---

## Overview

A PageDetail page consists of:

1. **Server Component** (`[id]/page.tsx`) - Entry point, data fetching, returns layout
2. **Detail Header** (`{entity}-detail-header.tsx`) - Fixed header with actions
3. **Identity Panel** (`{entity}-identity-panel.tsx`) - Sidebar content (client component)
4. **Tabs Content** (`{entity}-tabs-content.tsx`) - Main tabs and content (client component)
5. **Shell Components** - `PageShell`, `PageDetailLayout`, `PageDetailSidebar`, `PageDetailMain`

---

## Architecture

```
app/admin/{domain}/{entity}/
└── [id]/
    └── page.tsx                              # Server Component (entry point)

components/{domain}/{entity}/
├── {entity}-detail-header.tsx                # Header: avatar, name, actions
├── {entity}-identity-panel.tsx               # Sidebar: contact info, identity
└── {entity}-tabs-content.tsx                 # Main: tabs, forms, data

components/shell/
├── page-shell.tsx                            # Container: full-height layout
├── page-detail-layout.tsx                    # Layout: flex container
├── page-detail-sidebar.tsx                   # Sidebar: ScrollArea wrapper
└── page-detail-main.tsx                      # Main: ScrollArea + card styling
```

---

## 1. Server Component (`[id]/page.tsx`)

**File:** [personas/[id]/page.tsx](../../app/admin/socios/personas/[id]/page.tsx)

Server-side data fetching and layout composition.

```tsx
// app/admin/{domain}/{entity}/[id]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PageShell, PageDetailLayout, PageDetailSidebar, PageDetailMain } from "@/components/shell"
import { EntityDetailHeader } from "@/components/{domain}/{entity}/{entity}-detail-header"
import { EntityIdentityPanel } from "@/components/{domain}/{entity}/{entity}-identity-panel"
import { EntityTabsContent } from "@/components/{domain}/{entity}/{entity}-tabs-content"
import type { Entity } from "@/features/{domain}/types/{entity}-schema"

interface EntityPageProps {
  params: Promise<{ id: string }>
}

export default async function EntityDetailPage({ params }: EntityPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch entity data
  const { data: entity, error } = await supabase
    .from("table_name")
    .select("*")
    .eq("id", id)
    .is("eliminado_en", null)
    .single()

  if (error || !entity) {
    console.error("Error fetching entity:", error)
    return notFound()
  }

  // Map to domain type
  const entityData: Entity = {
    id: entity.id,
    codigo: entity.codigo,
    // ... map all fields
  }

  return (
    <PageShell>
      {/* Header area with custom EntityDetailHeader */}
      <div className="px-6 py-4 shrink-0 border-b border-border/60">
        <EntityDetailHeader entity={entityData} />
      </div>

      {/* Two-column layout with ScrollArea */}
      <PageDetailLayout>
        <PageDetailSidebar>
          <EntityIdentityPanel entity={entityData} />
        </PageDetailSidebar>
        <PageDetailMain>
          <EntityTabsContent entity={entityData} />
        </PageDetailMain>
      </PageDetailLayout>
    </PageShell>
  )
}
```

### Key Points

| Aspect | Implementation |
|--------|----------------|
| **Data Fetching** | Server-side with Supabase (`createClient()` from `@/lib/supabase/server`) |
| **Error Handling** | `notFound()` for 404, log errors with `console.error` |
| **Soft Delete** | Filter: `.is('eliminado_en', null)` |
| **Layout** | `PageShell` → Header div → `PageDetailLayout` → Sidebar + Main |

---

## 2. Detail Header Component

**File:** [person-detail-header.tsx](../../components/socios/personas/person-detail-header.tsx)

Fixed header with avatar, identity, badges, and action buttons.

```tsx
// components/{domain}/{entity}/{entity}-detail-header.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MessageSquare, MoreVertical, Plus } from "lucide-react"
import type { Entity } from "@/features/{domain}/types/{entity}-schema"

interface EntityDetailHeaderProps {
  entity: Entity
}

export function EntityDetailHeader({ entity }: EntityDetailHeaderProps) {
  const initials = `${entity.nombre[0]}${entity.apellido[0]}`

  return (
    <div className="space-y-4">
      {/* Main Identity Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
            <AvatarImage src={entity.foto_url || undefined} alt={entity.nombre} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          {/* Name + Badges */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{entity.nombre}</h1>
              {entity.estado && (
                <Badge
                  variant={entity.estado === "activo" ? "status-active" : "status-warning"}
                  showDot
                >
                  {entity.estado}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-medium text-muted-foreground/60">ID:</span>
              <span className="font-semibold">{entity.codigo}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Actividad</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Acción</span>
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Imprimir</DropdownMenuItem>
              <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
```

---

## 3. Identity Panel Component (Sidebar)

**File:** [person-identity-panel.tsx](../../components/socios/personas/person-identity-panel.tsx)

Client component with contact info, identity details, related entities.

```tsx
// components/{domain}/{entity}/{entity}-identity-panel.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Calendar } from "lucide-react"
import type { Entity } from "@/features/{domain}/types/{entity}-schema"

interface EntityIdentityPanelProps {
  entity: Entity
}

export function EntityIdentityPanel({ entity }: EntityIdentityPanelProps) {
  return (
    <div className="space-y-4">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium truncate">{entity.email || "Sin email"}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="font-medium">{entity.telefono || "Sin teléfono"}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Ubicación</p>
              <p className="font-medium">{entity.ubicacion || "Sin ubicación"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Fecha de Registro</p>
              <p className="font-medium">
                {new Date(entity.creado_en).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Entities (optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {entity.relaciones_count || 0} relaciones registradas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 4. Tabs Content Component (Main)

**File:** [person-tabs-content.tsx](../../components/socios/personas/person-tabs-content.tsx)

Client component with tabs for different content sections.

```tsx
// components/{domain}/{entity}/{entity}-tabs-content.tsx
"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Entity } from "@/features/{domain}/types/{entity}-schema"

interface EntityTabsContentProps {
  entity: Entity
}

export function EntityTabsContent({ entity }: EntityTabsContentProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "overview"

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
          Resumen
        </TabsTrigger>
        <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
          Perfil
        </TabsTrigger>
        <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
          Actividad
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Información general sobre {entity.nombre}.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Profile Tab */}
      <TabsContent value="profile" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil Completo</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Profile fields */}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Activity Tab */}
      <TabsContent value="activity" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Activity timeline */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

---

## 5. Shell Components

Located in [`components/shell/`](../../components/shell/).

### PageShell

**File:** [page-shell.tsx](../../components/shell/page-shell.tsx)

Full-height container for the entire page layout.

```tsx
<PageShell>
  <div className="px-6 py-4 shrink-0 border-b border-border/60">
    <EntityDetailHeader entity={entity} />
  </div>
  <PageDetailLayout>
    {/* Sidebar + Main */}
  </PageDetailLayout>
</PageShell>
```

**Height calculation:** `calc(100vh - 96px)`
- 64px for admin layout header
- 32px for layout padding (p-4: 16px top + 16px bottom)

### PageDetailLayout

**File:** [page-detail-layout.tsx](../../components/shell/page-detail-layout.tsx)

Flex container for two-column layout.

```tsx
<PageDetailLayout>
  <PageDetailSidebar>{/* Sidebar content */}</PageDetailSidebar>
  <PageDetailMain>{/* Main content */}</PageDetailMain>
</PageDetailLayout>
```

**Responsive behavior:**
- Mobile (`< 1024px`): `flex-col` - Sidebar stacks above main
- Desktop (`>= 1024px`): `lg:flex-row` - Side-by-side layout

**Key classes:** `flex-1 overflow-hidden` - Fills remaining space, enables ScrollArea

### PageDetailSidebar

**File:** [page-detail-sidebar.tsx](../../components/shell/page-detail-sidebar.tsx)

Fixed-width sidebar with ScrollArea.

```tsx
<PageDetailSidebar>
  <EntityIdentityPanel entity={entity} />
  <RelatedEntitiesList />
</PageDetailSidebar>
```

**Width:**
- `lg:` (1024px+) - 320px
- `xl:` (1280px+) - 360px
- Mobile - 100% (stacks)

**Features:**
- ScrollArea for custom scrollbar styling
- `pr-4 -mr-4` creates space for visible scrollbar
- `pb-4` prevents content cutoff at bottom

### PageDetailMain

**File:** [page-detail-main.tsx](../../components/shell/page-detail-main.tsx)

Flexible main content with card styling and ScrollArea.

```tsx
<PageDetailMain>
  <Tabs defaultValue="overview">
    <TabsList>...</TabsList>
    <TabsContent>...</TabsContent>
  </Tabs>
</PageDetailMain>
```

**Key classes:**
- `flex-1` - Fills remaining space
- `min-w-0` - Prevents flex overflow with long content
- `bg-card/50` - Visual separation from sidebar
- `rounded-lg border` - Card styling

---

## Layout Hierarchy

```
PageShell (h-[calc(100vh-96px)])
├─ Header div (shrink-0, fixed height)
│  └─ EntityDetailHeader
│
└─ PageDetailLayout (flex-1, fills remaining space)
   ├─ PageDetailSidebar (320px lg+, 360px xl+)
   │  └─ ScrollArea (independent scroll)
   │     └─ EntityIdentityPanel
   │
   └─ PageDetailMain (flex-1, remaining width)
      └─ ScrollArea (independent scroll)
         └─ EntityTabsContent
            └─ Tabs + TabContent
```

**Key behaviors:**
- Header stays fixed at top (`shrink-0`)
- Sidebar and main scroll independently (via ScrollArea)
- No double scrollbars
- Proper height calculation fills viewport

---

## Creating a New PageDetail Page

Use this checklist when creating a new detail page:

### Step 1: Create Detail Header

```bash
# Create header component
components/{domain}/{entity}/{entity}-detail-header.tsx
```

Include: Avatar, name, badges, action buttons, dropdown menu.

### Step 2: Create Identity Panel

```bash
# Create sidebar component
components/{domain}/{entity}/{entity}-identity-panel.tsx
```

Include: Contact info, identity details, related entities, stats.

### Step 3: Create Tabs Content

```bash
# Create tabs component
components/{domain}/{entity}/{entity}-tabs-content.tsx
```

Include: TabsList, TabsTrigger, TabsContent for each section.

### Step 4: Create Server Component

```bash
# Create page entry point
app/admin/{domain}/{entity}/[id]/page.tsx
```

Follow the template from section 1.

### Step 5: Test Responsive Behavior

- [ ] Desktop (1280px+): Sidebar 360px, side-by-side
- [ ] Tablet (1024px-1279px): Sidebar 320px, side-by-side
- [ ] Mobile (<1024px): Sidebar stacks above main
- [ ] Both sidebar and main scroll independently
- [ ] No double scrollbars or layout overflow

---

## Examples

| Page | Path | Key Files |
|------|------|-----------|
| Personas | [app/admin/socios/personas/[id]/page.tsx](../../app/admin/socios/personas/[id]/page.tsx) | [person-detail-header.tsx](../../components/socios/personas/person-detail-header.tsx), [person-identity-panel.tsx](../../components/socios/personas/person-identity-panel.tsx), [person-tabs-content.tsx](../../components/socios/personas/person-tabs-content.tsx) |
| Empresas | (to be created) | Same pattern as Personas |
| Acciones | (to be created) | Same pattern as Personas |

---

## Best Practices

### DO

- Use `PageShell` wrapper for consistent layout
- Keep header fixed with `shrink-0`
- Use ScrollArea for independent scrolling in sidebar and main
- Implement proper responsive design (stack on mobile)
- Use `min-w-0` on PageDetailMain to prevent flex overflow
- Filter soft-deleted records: `.is('eliminado_en', null)`
- Use server component for data fetching, client components for interactivity

### DON'T

- Don't forget the header div with `shrink-0` before `PageDetailLayout`
- Don't use native `overflow-y-auto` - use ScrollArea instead
- Don't hardcode sidebar width on mobile - let it stack naturally
- Don't put interactive elements in server component (use `'use client'`)
- Don't create custom API endpoints for basic CRUD (use Supabase auto-generated)

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Overall project guidelines
- [docs/ui/PageTable_Structure.md](./PageTable_Structure.md) - List page pattern
- [docs/database/API.md](../database/API.md) - Supabase CRUD endpoints
- [docs/database/TABLES.md](../database/TABLES.md) - Table schemas
