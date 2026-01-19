# PageTable Structure

> **Pattern for list pages with data tables** - All table-based list pages (Personas, Empresas, Oportunidades, Tareas) follow this standardized structure.

---

## Overview

A PageTable page consists of:

1. **Server Component** (`page.tsx`) - Entry point, returns the client component
2. **Client Component** (`{entity}-page-client.tsx`) - Main logic with TanStack Table
3. **Type/Schema** (`types/{entity}-schema.ts`) - Zod schema for the list view
4. **Columns** (`columns.tsx`) - Column definitions for the table
5. **DataTable** (`data-table.tsx`) - Pure presentation component
6. **Sub-components** - Filters, pagination, view options

---

## Architecture

```
app/admin/{domain}/{entity}/
├── page.tsx                              # Server Component (entry point)
└── {entity}-page-client.tsx              # Client Component (main logic)

features/{domain}/{entity}/
├── columns.tsx                           # Column definitions
├── data-table.tsx                        # Table presentation
├── types/
│   └── {entity}-schema.ts                # Zod schema (List type)
└── components/
    ├── data-table-column-header.tsx      # Shared: sortable column header
    ├── data-table-faceted-filter.tsx     # Shared: multi-select filter
    ├── data-table-pagination.tsx         # Shared: pagination controls
    ├── data-table-reset-filters.tsx      # Shared: reset button
    └── data-table-view-options.tsx       # Shared: column visibility toggle

components/shell/
├── page-shell.tsx                        # Container: full-height layout
├── page-header.tsx                       # Header: title, description, actions
├── page-toolbar.tsx                      # Toolbar: filters, controls
└── page-content.tsx                      # Content: scrollable area
```

---

## 1. Server Component (`page.tsx`)

Simple pass-through to client component.

```tsx
// app/admin/socios/personas/page.tsx
import { PersonasPageClient } from './personas-page-client'

export default function PersonasPage() {
  return <PersonasPageClient />
}
```

**Purpose:** Server entry point that delegates to client component. Can be extended for server-side data fetching in the future.

---

## 2. Client Component (`{entity}-page-client.tsx`)

**File:** [personas-page-client.tsx](../../app/admin/socios/personas/personas-page-client.tsx)

This is the **main component** that orchestrates the page.

### Structure

```tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Shell components
import { PageShell } from '@/components/shell/page-shell'
import { PageHeader } from '@/components/shell/page-header'
import { PageToolbar } from '@/components/shell/page-toolbar'
import { PageContent } from '@/components/shell/page-content'

// Feature components
import { EntityDataTable } from '@/features/{domain}/{entity}/data-table'
import { NewEntitySheet } from '@/components/{domain}/{entity}/new-entity-sheet'
import { columns } from '@/features/{domain}/{entity}/columns'

// DataTable controls (shared)
import { DataTableViewOptions } from '@/features/socios/components/data-table-view-options'
import { DataTablePagination } from '@/features/socios/components/data-table-pagination'
import { DataTableFacetedFilter } from '@/features/socios/components/data-table-faceted-filter'
import { DataTableResetFilters } from '@/features/socios/components/data-table-reset-filters'

// UI components
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { FloatingActionBar } from '@/components/ui/floating-action-bar'

// Types
import type { EntityList } from '@/features/{domain}/types/{entity}-schema'
import { entityEstadoOptions } from '@/lib/table-filters'

export function EntityPageClient() {
  const router = useRouter()
  const [hasMounted, setHasMounted] = React.useState(false)

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalSearch, setGlobalSearch] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    codigo: false,
    // Hide columns that should not be visible by default
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Data fetching with TanStack Query
  const { data: initialData = [], isLoading, error } = useQuery({
    queryKey: ['entity'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('table_name')
        .select('id, field1, field2, ...')
        .is('eliminado_en', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as EntityList[]
    },
  })

  // Client-side filtering (global search)
  const filteredData = React.useMemo(() => {
    if (!globalSearch) return initialData
    const searchLower = globalSearch.toLowerCase()
    return initialData.filter((item) => {
      return item.field1?.toLowerCase().includes(searchLower) ||
             item.field2?.toLowerCase().includes(searchLower)
    })
  }, [initialData, globalSearch])

  // Handle mount state
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Loading state
  if (!hasMounted || isLoading) {
    return (
      <PageShell>
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        </PageContent>
      </PageShell>
    )
  }

  // Error state
  if (error) {
    return (
      <PageShell>
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error.message}</div>
          </div>
        </PageContent>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Entity Name"
        description="Gestiona los entities registrados"
        metadata={`${filteredData.length} de ${initialData.length}`}
        actions={<NewEntitySheet />}
      />

      {/* Toolbar */}
      <PageToolbar
        left={
          <>
            {/* Global Search */}
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, documento..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/50 focus:bg-background transition-colors"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Filters */}
            <DataTableFacetedFilter
              column={table.getColumn("estado")}
              title="Estado"
              options={entityEstadoOptions}
            />

            {/* Reset button */}
            {table.getState().columnFilters.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <DataTableResetFilters table={table} />
              </>
            )}
          </>
        }
        right={<DataTableViewOptions table={table} />}
      />

      {/* Content */}
      <PageContent>
        <div className="space-y-4">
          {/* Table */}
          <div className="rounded-md border relative">
            <EntityDataTable table={table} router={router} />
          </div>

          {/* Pagination */}
          <div className="border-t bg-background p-2">
            <DataTablePagination table={table} />
          </div>

          {/* Floating Action Bar (optional) */}
          <FloatingActionBar
            selectedCount={table.getFilteredSelectedRowModel().rows.length}
            totalCount={table.getFilteredRowModel().rows.length}
            onExport={() => { /* export logic */ }}
            onDelete={() => { /* delete logic */ }}
          />
        </div>
      </PageContent>
    </PageShell>
  )
}
```

### Key Points

| Aspect | Implementation |
|--------|----------------|
| **State Management** | React useState for table state (sorting, filters, visibility, selection) |
| **Data Fetching** | TanStack Query (`useQuery`) with Supabase client |
| **Global Search** | Client-side filtering via `useMemo` |
| **Loading/Error** | Early return with shell wrapper |
| **Mount Check** | `hasMounted` prevents hydration mismatch |

---

## 3. Type/Schema (`types/{entity}-schema.ts`)

**File:** [socios-schema.ts](../../features/socios/types/socios-schema.ts)

Define a **Zod schema** for the list view (simplified, optimized for table display).

```tsx
// features/{domain}/types/{entity}-schema.ts
import { z } from "zod"

/**
 * Schema for Entity list view
 * Optimized for table display - not for detail pages
 */
export const entityListSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  nombre: z.string(),
  identificacion: z.string().nullable(),
  email: z.string().nullable(),
  telefono: z.string().nullable(),
  estado: z.enum(["activo", "inactivo", "bloqueado"]),
  organizacion_id: z.string().uuid(),
  eliminado_en: z.string().nullable(),
})

export type EntityList = z.infer<typeof entityListSchema>
```

**Important:**
- Create **separate schemas** for list vs detail views
- List schema: Only fields needed for table columns
- Detail schema: Full object with all fields

---

## 4. Columns (`columns.tsx`)

**File:** [columns.tsx](../../features/socios/personas/columns.tsx)

Define column definitions with type safety.

```tsx
// features/{domain}/{entity}/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CopyableCell } from "@/components/ui/copyable-cell"
import { NullCell } from "@/components/ui/null-cell"
import { IdentityCell } from "@/components/ui/identity-cell"
import { DataTableColumnHeader } from "@/features/socios/components/data-table-column-header"
import type { EntityList } from "@/features/{domain}/types/{entity}-schema"

export const columns: ColumnDef<EntityList>[] = [
  // Checkbox column (required for row selection)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todas"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },

  // Standard column with sorting
  {
    accessorKey: "codigo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Código" />
    ),
    cell: ({ row }) => (
      <CopyableCell value={row.getValue("codigo")} />
    ),
    meta: { size: 100 },
  },

  // Identity column (avatar + name + subtitle)
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      const entity = row.original
      return (
        <IdentityCell
          name={entity.nombre}
          subtitle={entity.codigo}
          image={entity.foto_url}
          className="min-w-[200px] flex-1"
        />
      )
    },
    meta: { size: 220, minSize: 200 },
  },

  // Badge column with filter
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      return (
        <Badge variant="metadata-outline" showDot dotClassName="bg-status-positive">
          {estado}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: { size: 110 },
  },

  // Actions column (dropdown menu)
  {
    id: "actions",
    cell: ({ row }) => {
      const entity = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(entity.id)}>
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
  },
]
```

### Column Pattern Checklist

| Column Type | Props Required |
|-------------|----------------|
| **Standard** | `accessorKey`, `header`, `cell`, `meta.size` |
| **With Filter** | Add `filterFn` |
| **Sortable** | Use `DataTableColumnHeader` |
| **Fixed Width** | Add `size`, `minSize`, `maxSize` |
| **No Sort/Hide/Resize** | Add `enableSorting: false`, `enableHiding: false`, `enableResizing: false` |

---

## 5. DataTable Component (`data-table.tsx`)

**File:** [data-table.tsx](../../features/socios/personas/data-table.tsx)

Pure presentation component - receives a pre-configured table instance.

**IMPORTANT:** Features **sticky table headers** that remain visible when scrolling through PageContent.

**Style Note:** Headers have clean, flat appearance with no shadow or bottom border (`border-b-0`).

```tsx
// features/{domain}/{entity}/data-table.tsx
"use client"

import { flexRender, type Table } from "@tanstack/react-table"
import type { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EntityList } from "@/features/{domain}/types/{entity}-schema"

interface EntityDataTableProps {
  table: Table<EntityList>
  router: ReturnType<typeof useRouter>
}

export function EntityDataTable({ table, router }: EntityDataTableProps) {
  return (
    <UITable>
      {/* Clean sticky header: no shadow, no border */}
      <TableHeader className="sticky top-0 z-10 bg-background">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-0">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                style={{ width: header.getSize() }}
                className={cn(
                  "relative group whitespace-nowrap",
                  header.column.getCanSort() && "cursor-pointer select-none"
                )}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}

                {/* Column Resize Handle */}
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                      "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-opacity",
                      "bg-primary/20 opacity-0 group-hover:opacity-100",
                      header.column.getIsResizing() && "bg-primary opacity-100"
                    )}
                  />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className="group cursor-pointer transition-colors hover:bg-muted/50"
              onClick={(e) => {
                // Don't navigate if clicking interactive elements
                const target = e.target as HTMLElement
                if (
                  target.closest('button') ||
                  target.closest('input') ||
                  target.closest('a') ||
                  target.getAttribute('role') === 'checkbox'
                ) return

                router.push(`/admin/{domain}/{entity}/${row.original.id}`)
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
              No se encontraron resultados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </UITable>
  )
}
```

### Key Features

- **Row click navigation** - Click anywhere on row to navigate to detail page
- **Column resizing** - Drag edge of column header to resize
- **Row selection** - Checkbox in first column
- **Empty state** - Friendly message when no data
- **Sticky headers** - Table headers stay visible when scrolling (via `sticky top-0 z-10 bg-background`)
- **Clean flat design** - No shadow or border on headers (`border-b-0`) for minimal appearance

---

## 6. Global Layout Architecture

The application uses a **full-viewport flex layout** from root to content to eliminate scroll issues and white space.

### Root Layout (`app/layout.tsx`)

**File:** [app/layout.tsx](../../app/layout.tsx)

```tsx
<html className="h-screen w-screen overflow-hidden bg-background">
  <body className="h-screen w-screen overflow-hidden">
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {children}
    </div>
  </body>
</html>
```

**Purpose:** Ensures the entire app occupies exactly 100% of the viewport with no scroll on body/html.

### Admin Layout (`app/admin/layout.tsx`)

**File:** [app/admin/layout.tsx](../../app/admin/layout.tsx)

```tsx
<SidebarInset>
  <header className="flex h-16 shrink-0 items-center gap-2">
    {/* Breadcrumb */}
  </header>
  <div className="flex flex-1 flex-col overflow-hidden">
    {children}
  </div>
</SidebarInset>
```

**Purpose:** Wrapper that fills remaining space (flex-1) and passes overflow control to child components.

**Key Changes:**
- Removed `gap-4` and `p-4` from wrapper div (padding now handled by PageContent)
- Uses `overflow-hidden` to prevent unintended scrolling

---

## 7. Shell Components

Located in [`components/shell/`](../../components/shell/).

### PageShell

**File:** [page-shell.tsx](../../components/shell/page-shell.tsx)

```tsx
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {children}
    </div>
  )
}
```

**Key points:**
- Uses `h-screen` for full viewport height (no calculation needed)
- Flex column layout with `overflow-hidden` on container
- Header and Toolbar stay fixed at top via flexbox (no sticky positioning)
- PageContent is the only scrollable area (flex-1)

### PageHeader

**File:** [page-header.tsx](../../components/shell/page-header.tsx)

```tsx
<PageHeader
  title="Personas"
  description="Gestiona las personas registradas"
  metadata="128 total"
  actions={<NewPersonSheet />}
/>
```

| Prop | Type | Purpose |
|------|------|---------|
| `title` | `string` | Page title (h1, text-2xl) |
| `description` | `string` | Subtitle text |
| `metadata` | `string` | Badge/count display (e.g., "128 total") |
| `actions` | `ReactNode` | Action buttons (right side) |

**Layout:** Static (default positioning) - stays fixed at top via flexbox order

### PageToolbar

**File:** [page-toolbar.tsx](../../components/shell/page-toolbar.tsx)

```tsx
<PageToolbar
  left={
    <>
      <SearchInput />
      <Separator orientation="vertical" />
      <DataTableFacetedFilter />
    </>
  }
  right={<DataTableViewOptions />}
/>
```

| Prop | Type | Purpose |
|------|------|---------|
| `left` | `ReactNode` | Search + filters (left side, scrollable) |
| `right` | `ReactNode` | View options (right side, fixed) |

**Layout:** Static (default positioning) - stays fixed below header via flexbox order

### PageContent

**File:** [page-content.tsx](../../components/shell/page-content.tsx)

```tsx
<PageContent>
  <DataTable />
  <Pagination />
</PageContent>
```

**Layout:**
- `flex-1` - Takes remaining vertical space
- `overflow-y-auto` - ONLY scrollable container in the layout
- `overflow-x-hidden` - Prevent horizontal scroll
- `p-4` - Padding for content (replaces padding removed from admin layout)
- Header and Toolbar stay fixed above this area

---

## 8. Visual Standards

### Horizontal Alignment ("Plumb Line")

All shell components use **`px-8`** (32px) horizontal padding for perfect vertical alignment.

```text
┌─────────────────────────────────────────────┐
│  Header Content  ← px-8 on both sides      │
├─────────────────────────────────────────────┤
│  Toolbar Content ← px-8 on both sides      │
├─────────────────────────────────────────────┤
│                                             │
│  PageContent        ← px-8 on all sides    │
│                                             │
└─────────────────────────────────────────────┘
```

**Why `px-8`?**

- Creates consistent left margin across all components
- Ensures title, filters, and content align perfectly
- Matches common design system spacing scales
- Provides visual breathing room without feeling cramped

**Components with `px-8`:**

- [PageHeader](../../components/shell/page-header.tsx) - `px-8` with `border-b` separator
- [PageToolbar](../../components/shell/page-toolbar.tsx) - `px-8` **without** border
- [PageContent](../../components/shell/page-content.tsx) - `p-8` (all sides)

### Separator Rules

**Single Separator Pattern:** Only `PageHeader` has a bottom border (`border-b`). This creates a clean, minimal appearance with no redundant separators.

```tsx
// PageHeader - Has border (ONLY separator)
className="... px-8 ... border-b border-border/60 ..."

// PageToolbar - NO border (clean continuation)
className="... px-8 ..." // No border-b

// DataTable Headers - NO border, NO shadow (clean flat design)
<TableHeader className="sticky top-0 z-10 bg-background">
  <TableRow className="hover:bg-transparent border-b-0">
```

**Visual Hierarchy:**

1. **PageHeader** - Primary separator (creates top boundary)
2. **PageToolbar** - No border (visually part of header area)
3. **DataTable** - Clean headers (flat, no shadow or border)

### Spacing Strategy (Gestalt Proximity)

**Principle:** Controls (Toolbar) should be visually grouped with the data they control (Table), not with the page title (Header).

**Implementation:**

- **Header→Toolbar:** Large gap (~32px) - Separates title from controls
- **Toolbar→Content:** Minimal gap (~8px) - Groups controls with data

**Visual Result:**

```text
┌─────────────────────────────────┐
│  PageHeader (py-4 = 16px)      │ ← Title, actions
├─────────────────────────────────┤
│                                 │
│  ← 32px breathing room          │ ← Increased gap
│                                 │
┌─────────────────────────────────┐
│  PageToolbar (pt-8, pb-2)      │ ← Search, filters
├─────────────────────────────────┤
│  ← 8px (minimal gap)            │ ← Tight connection
├─────────────────────────────────┤
│  PageContent (pt-0)             │ ← Table data
│                                 │
└─────────────────────────────────┘
```

### Component Spacing

| Component | Top Padding | Bottom Padding | Horizontal | Border |
|-----------|-------------|----------------|------------|--------|
| PageHeader | `py-4` (16px) | `py-4` (16px) | `px-8` | `border-b` ✅ |
| PageToolbar | `pt-8` (32px) | `pb-2` (8px) | `px-8` | None ❌ |
| PageContent | `pt-0` (0px) | `pb-8` (32px) | `px-8` | None ❌ |
| DataTable Header | None | None | None | None ❌ (`border-b-0`) |

### Background & Effects

All shell components use consistent background and backdrop effects:

```tsx
bg-background/95 backdrop-blur-sm z-10
```

This creates:

- Semi-transparent background (95% opacity)
- Subtle backdrop blur for depth
- Proper z-index stacking

---

## 9. Shared DataTable Components

Located in [`features/socios/components/`](../../features/socios/components/).

| Component | File | Purpose |
|-----------|------|---------|
| `DataTableColumnHeader` | [data-table-column-header.tsx](../../features/socios/components/data-table-column-header.tsx) | Sortable column header with sort indicator |
| `DataTableViewOptions` | [data-table-view-options.tsx](../../features/socios/components/data-table-view-options.tsx) | Dropdown to toggle column visibility |
| `DataTableFacetedFilter` | [data-table-faceted-filter.tsx](../../features/socios/components/data-table-faceted-filter.tsx) | Multi-select filter for enum fields |
| `DataTablePagination` | [data-table-pagination.tsx](../../features/socios/components/data-table-pagination.tsx) | Pagination controls (rows per page, page navigation) |
| `DataTableResetFilters` | [data-table-reset-filters.tsx](../../features/socios/components/data-table-reset-filters.tsx) | Button to reset all filters |

---

## 9. Filter Options (`lib/table-filters.ts`)

Define filter options for enum fields.

```tsx
// lib/table-filters.ts
import { ESTADO_ACTOR_OPTIONS } from "@/lib/db-types"

export const personasEstadoOptions = ESTADO_ACTOR_OPTIONS.map((estado) => ({
  value: estado.value,
  label: estado.label,
  icon: undefined, // Optional: Lucide icon component
}))

// For custom filters
export const empresasTamanoOptions = [
  { value: "micro", label: "Micro" },
  { value: "pequena", label: "Pequeña" },
  { value: "mediana", label: "Mediana" },
  { value: "grande", label: "Grande" },
]
```

---

## Creating a New PageTable Page

Use this checklist when creating a new table-based list page:

### Step 1: Create Type/Schema

```bash
# Create schema in types/
features/{domain}/types/{entity}-schema.ts
```

Define `EntityList` type with Zod.

### Step 2: Create Columns

```bash
# Create columns definition
features/{domain}/{entity}/columns.tsx
```

Follow the column pattern from section 4.

### Step 3: Create DataTable

```bash
# Create table component
features/{domain}/{entity}/data-table.tsx
```

Copy from existing `data-table.tsx` and rename.

### Step 4: Create Client Component

```bash
# Create client component
app/admin/{domain}/{entity}/{entity}-page-client.tsx
```

Follow the template from section 2.

### Step 5: Create Server Component

```bash
# Create page entry point
app/admin/{domain}/{entity}/page.tsx
```

Simple pass-through to client component.

### Step 6: Create Filter Options (if needed)

```tsx
// Add to lib/table-filters.ts
export const entityEstadoOptions = [...]
export const entityTipoOptions = [...]
```

---

## Examples

| Page | Path | Key Files |
|------|------|-----------|
| Personas | [app/admin/socios/personas/page.tsx](../../app/admin/socios/personas/page.tsx) | [personas-page-client.tsx](../../app/admin/socios/personas/personas-page-client.tsx), [columns.tsx](../../features/socios/personas/columns.tsx) |
| Empresas | [app/admin/socios/empresas/page.tsx](../../app/admin/socios/empresas/page.tsx) | [empresas-page-client.tsx](../../app/admin/socios/empresas/empresas-page-client.tsx), [columns.tsx](../../features/socios/empresas/columns.tsx) |
| Oportunidades | [app/admin/procesos/oportunidades/page.tsx](../../app/admin/procesos/oportunidades/page.tsx) | [oportunidades-page-client.tsx](../../app/admin/procesos/oportunidades/oportunidades-page-client.tsx), [columns.tsx](../../features/procesos/oportunidades/columns.tsx) |
| Tareas | [app/admin/procesos/tareas/page.tsx](../../app/admin/procesos/tareas/page.tsx) | [tareas-page-client.tsx](../../app/admin/procesos/tareas/tareas-page-client.tsx), [columns.tsx](../../features/procesos/tareas/columns.tsx) |

---

## Best Practices

### DO

- Use `PageShell` wrapper for consistent layout
- Keep `DataTable` as pure presentation component
- Use TanStack Query for data fetching
- Implement global search with `useMemo`
- Handle loading/error states with shell wrapper
- Use `hasMounted` to prevent hydration mismatch
- Filter soft-deleted records: `.is('eliminado_en', null)`
- Type all columns with `ColumnDef<EntityList>`

### DON'T

- Don't put complex logic in `data-table.tsx` (keep it pure)
- Don't fetch data in `page.tsx` (use client component with TanStack Query)
- Don't forget to filter out soft-deleted records
- Don't use different shell components - stick to the pattern
- Don't create custom API endpoints for basic CRUD (use Supabase auto-generated)

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Overall project guidelines
- [docs/database/API.md](../database/API.md) - Supabase CRUD endpoints
- [docs/database/TABLES.md](../database/TABLES.md) - Table schemas
- [docs/database/VIEWS.md](../database/VIEWS.md) - Optimized database views

---

## Architecture Summary: Full-Height Flex Layout

This project uses a **full-viewport flex layout** that eliminates scroll issues and provides a clean app-like experience.

### Layout Hierarchy

```text
html (h-screen w-screen overflow-hidden)
  └─ body (h-screen w-screen overflow-hidden)
      └─ root wrapper (flex h-screen w-screen flex-col overflow-hidden)
          └─ SidebarProvider
              └─ SidebarInset
                  ├─ header (h-16 shrink-0)
                  └─ content wrapper (flex-1 flex-col overflow-hidden)
                      └─ PageShell (h-screen flex flex-col overflow-hidden)
                          ├─ PageHeader (static, shrink-0)
                          ├─ PageToolbar (static, shrink-0)
                          └─ PageContent (flex-1 overflow-y-auto)
                              └─ DataTable (sticky headers)
```

### Key Design Principles

1. **Single Scroll Area:** Only `PageContent` scrolls - body/html never scroll
2. **No Magic Numbers:** Uses `h-screen` instead of `calc(100vh-96px)`
3. **Flexbox Positioning:** Header/Toolbar stay fixed via flex order (no sticky CSS needed)
4. **Clean Headers:** Table headers are sticky but flat (no shadow, no border: `border-b-0`)
5. **Full Viewport:** App occupies exactly 100% of viewport with no white space

### Benefits

- ✅ No "double scroll" issue
- ✅ No white space at bottom
- ✅ Headers/toolbar always visible
- ✅ Table headers sticky when scrolling
- ✅ Clean, modern "app-like" feel
- ✅ Responsive without complex calculations

- [CLAUDE.md](../../CLAUDE.md) - Overall project guidelines
- [docs/database/API.md](../database/API.md) - Supabase CRUD endpoints
- [docs/database/TABLES.md](../database/TABLES.md) - Table schemas
- [docs/database/VIEWS.md](../database/VIEWS.md) - Optimized database views
