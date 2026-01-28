# Phase 3: AI-UI Interactions - Detailed Specification

**Parent:** [README.md](./README.md)
**Prerequisites:** [Phase 1: Floating Chat](./01-floating-chat.md) ✅ Complete, [Phase 2: Sidebar Mode](./02-sidebar-mode.md) ✅ Complete
**Phase:** 3 of 3
**Estimated Time:** 12-16 hours
**Dependencies:** Phase 1 & 2 components

---

## Table of Contents

1. [Overview](#1-overview)
2. [Action Types](#2-action-types)
3. [Component Specifications](#3-component-specifications)
4. [Server Actions](#4-server-actions)
5. [Context System](#5-context-system)
6. [Implementation Guide](#6-implementation-guide)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Overview

### 1.1 Goal

Enable the AI to interact with the application UI:
- Navigate to pages
- Apply filters to data
- Highlight UI elements
- Create new records
- Understand current page context

### 1.2 What's Included

| Feature | Description |
|---------|-------------|
| **Page Context** | AI knows current page/entity/filters |
| **Navigation Actions** | AI can navigate to detail pages |
| **Filter Actions** | AI can apply filters to tables |
| **Highlight Actions** | AI can point to UI elements |
| **Create Actions** | AI can create records (with confirmation) |
| **Action Messages** | Visual feedback for AI actions |
| **Confirmation Flows** | User approves destructive actions |

### 1.3 AI Capabilities Matrix

| Capability | Phase 3 | Phase 4+ (Future) |
|------------|---------|------------------|
| Navigate pages | ✅ | Navigate with parameters |
| Filter data | ✅ | Advanced filters |
| Highlight elements | ✅ | Multiple highlights |
| Create records | ✅ | Update records |
| Delete records | ❌ | ✅ |
| Execute workflows | ❌ | ✅ |
| Query database | ❌ | ✅ |

---

## 2. Action Types

### 2.1 Navigation Action

AI can navigate the user to different pages.

```typescript
interface NavigationAction {
  type: 'navigation'
  target: string              // Route path
  title: string               // Human-readable description
  metadata?: {
    entityId?: string         // Optional entity ID
    params?: Record<string, string>
  }
}

// Example: "Open Juan Pérez's profile"
// AI generates:
{
  type: 'navigation',
  target: '/admin/socios/personas/abc-123',
  title: "Opening Juan Pérez's profile",
  metadata: { entityId: 'abc-123' }
}
```

**User Experience:**

```
┌────────────────────────────────────┐
│ User: Show me Juan Pérez           │
│                                    │
│ ← AI: Opening Juan Pérez's profile │
│         [⏵ Navigating...]         │
│                                    │
│     [Navigated to profile]         │
│     [✓ Juan Pérez - Persona]       │
└────────────────────────────────────┘

[Page automatically navigates]
```

---

### 2.2 Filter Action

AI can apply filters to data tables.

```typescript
interface FilterAction {
  type: 'filter'
  entity: string              // 'personas', 'tareas', etc.
  filters: Record<string, unknown>
  title: string               // Description for user
}

// Example: "Show only active personas"
// AI generates:
{
  type: 'filter',
  entity: 'personas',
  filters: { estado: 'activo' },
  title: "Filtering personas by estado: activo"
}
```

**User Experience:**

```
┌────────────────────────────────────┐
│ User: Show only active personas    │
│                                    │
│ ← AI: I'll filter to show only    │
│     active personas.               │
│     [⏵ Applying filter...]        │
│                                    │
│     [✓ Filter applied]             │
│     [Showing 15 active personas]   │
└────────────────────────────────────┘

[Table on page updates with filter]
```

---

### 2.3 Highlight Action

AI can draw attention to specific UI elements.

```typescript
interface HighlightAction {
  type: 'highlight'
  target: {
    type: 'element' | 'section' | 'row'
    selector?: string         // CSS selector
    description: string       // What to highlight
    position?: { x: number; y: number }
  }
  duration?: number           // Highlight duration (ms)
  scrollIntoView?: boolean    // Auto-scroll to element
}

// Example: "Where is the tareas section?"
// AI generates:
{
  type: 'highlight',
  target: {
    type: 'section',
    selector: '[data-section="tareas"]',
    description: 'Tareas section'
  },
  duration: 3000,
  scrollIntoView: true
}
```

**Visual Effect:**

```
┌────────────────────────────────────┐
│ User: Where are the tareas?        │
│                                    │
│ ← AI: The tareas section is       │
│     highlighted below ↓            │
│                                    │
│     [✓ Highlighted]                │
│                                    │
│     (Page scrolls to tareas)       │
│     (Box pulses around tareas)     │
└────────────────────────────────────┘
```

**Highlight Animation:**

```css
@keyframes ai-highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0px color-mix(in srgb, var(--primary) 50%, transparent);
    border-color: var(--primary);
  }
  50% {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--primary) 20%, transparent);
    border-color: var(--primary);
  }
}

.ai-highlight-target {
  animation: ai-highlight-pulse 1.5s ease-in-out 3;
  border-radius: 8px;
}
```

---

### 2.4 Create Action

AI can create new records (with user confirmation).

```typescript
interface CreateAction {
  type: 'create'
  entity: string              // 'persona', 'tarea', etc.
  data: Record<string, unknown>
  title: string               // Description
  requiresConfirmation: boolean
  estimatedSuccess?: string   // What to show on success
}

// Example: "Create a tarea for María to review contract"
// AI generates:
{
  type: 'create',
  entity: 'tarea',
  data: {
    titulo: 'Review contract',
    asignado_a: 'maria-id',
    prioridad: 'media',
    fecha_vencimiento: '2025-02-01'
  },
  title: "Create tarea 'Review contract' for María",
  requiresConfirmation: true,
  estimatedSuccess: "Tarea created successfully"
}
```

**User Experience:**

```
┌────────────────────────────────────┐
│ User: Create a tarea for María     │
│      to review the contract        │
│                                    │
│ ← AI: I'll create a tarea for     │
│     María to review the contract. │
│     Please confirm:                │
│                                    │
│     ┌──────────────────────────┐  │
│     │ Create new tarea?        │  │
│     │                          │  │
│     │ Title: Review contract   │  │
│     │ Assigned: María Gómez    │  │
│     │ Priority: Media          │  │
│     │                          │  │
│     │ [Cancel]  [Create]       │  │
│     └──────────────────────────┘  │
└────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 AI Action Message

**File:** `features/ai-companion/components/ai-action-message.tsx`

```tsx
interface AIActionMessageProps {
  action: AIAction
  status: 'pending' | 'executing' | 'success' | 'error'
  onConfirm?: () => void
  onCancel?: () => void
  onRetry?: () => void
  error?: string
}

// Visual states:
// - pending: Show action description + "Confirm" button
// - executing: Show spinner + "Working..."
// - success: Show checkmark + result summary
// - error: Show error + "Try again" button
```

**Component Structure:**

```
Pending State:
┌────────────────────────────────────┐
│ [⏵] Opening Juan Pérez's profile  │
│                                      │
│     [Cancel] [Confirm]              │
└────────────────────────────────────┘

Executing State:
┌────────────────────────────────────┐
│ [⏵] Opening Juan Pérez's profile  │
│     Navigating...                  │
└────────────────────────────────────┘

Success State:
┌────────────────────────────────────┐
│ [✓] Opened Juan Pérez's profile   │
└────────────────────────────────────┘

Error State:
┌────────────────────────────────────┐
│ [✗] Could not find that persona   │
│     Person not found               │
│                                      │
│     [Try again]                    │
└────────────────────────────────────┘
```

---

### 3.2 AI Confirmation Card

**File:** `features/ai-companion/components/ai-confirmation-card.tsx`

```tsx
interface AIConfirmationCardProps {
  title: string
  description?: string
  details?: Record<string, string>
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

// Used for create actions, destructive operations
```

**Visual Design:**

```
┌────────────────────────────────────┐
│ Create new tarea?                  │
│                                    │
│ Title: Review contract             │
│ Assigned: María Gómez              │
│ Priority: Media                    │
│ Due: Tomorrow                      │
│                                    │
│ [Cancel]          [Create tarea]   │
└────────────────────────────────────┘
```

---

### 3.3 AI Highlight Overlay

**File:** `features/ai-companion/components/ai-highlight-overlay.tsx`

```tsx
interface AIHighlightOverlayProps {
  target: HighlightTarget
  duration?: number
  onComplete?: () => void
}

// Renders a Portal with overlay
// Adds CSS class to target element
// Removes after duration
```

---

## 4. Server Actions

### 4.1 AI Navigation

**File:** `app/actions/ai.ts`

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/auth/permissions'

/**
 * AI navigates to a specific entity page
 * Checks permissions before returning URL
 */
export async function aiNavigate(params: {
  entity: string
  entityId: string
  orgId: string
}) {
  const { entity, entityId, orgId } = params

  // Check if user can view this entity
  const canView = await checkPermission(
    entity === 'personas' ? 'dm_actores' : entity,
    'view',
    orgId
  )

  if (!canView) {
    throw new Error('No permission to view this entity')
  }

  // Verify entity exists
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(entity === 'personas' ? 'dm_actores' : entity)
    .select('id')
    .eq('id', entityId)
    .eq('organizacion_id', orgId)
    .is('eliminado_en', null)
    .single()

  if (error || !data) {
    throw new Error(`Entity not found: ${entityId}`)
  }

  // Return route (client handles navigation)
  return `/admin/socios/${entity}/${entityId}`
}
```

---

### 4.2 AI Filter

```typescript
/**
 * AI applies a filter to a table
 * Returns filter object for client to apply
 */
export async function aiApplyFilter(params: {
  entity: string
  filters: Record<string, unknown>
  orgId: string
}) {
  const { entity, filters, orgId } = params

  // Validate filter values against database
  const supabase = await createClient()

  // Get valid filter options for this entity
  const validFilters = await getValidFilterOptions(entity, orgId)

  // Validate each filter
  const validated: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (validFilters[key]?.includes(value)) {
      validated[key] = value
    }
  }

  return {
    entity,
    filters: validated,
    applied: Object.keys(validated).length,
  }
}

async function getValidFilterOptions(
  entity: string,
  orgId: string
): Promise<Record<string, unknown[]>> {
  // Entity-specific filter options
  const options: Record<string, unknown[]> = {}

  if (entity === 'personas') {
    // Get unique estados
    options['estado'] = ['activo', 'inactivo', 'prospecto']
    options['tipo_actor'] = ['persona', 'empresa']
  }

  return options
}
```

---

### 4.3 AI Create

```typescript
/**
 * AI creates a new record
 * Requires user confirmation first
 */
export async function aiCreateRecord(params: {
  entity: string
  data: Record<string, unknown>
  orgId: string
  userId: string
}) {
  const { entity, data, orgId, userId } = params

  // Check create permission
  const canCreate = await checkPermission(
    entity === 'personas' ? 'dm_actores' : entity,
    'create',
    orgId
  )

  if (!canCreate) {
    throw new Error('No permission to create this entity')
  }

  const supabase = await createClient()

  // Validate data against schema
  const validated = await validateCreateData(entity, data)

  // Insert record
  const { data: record, error } = await supabase
    .from(entity === 'personas' ? 'dm_actores' : entity)
    .insert({
      ...validated,
      organizacion_id: orgId,
      creado_por: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create: ${error.message}`)
  }

  return record
}
```

---

## 5. Context System

### 5.1 Page Context Provider

**File:** `features/ai-companion/components/ai-page-context.tsx`

```tsx
'use client'

import { createContext, useContext } from 'react'
import { useAICompanion } from '../lib/ai-state'
import { usePathname } from 'next/navigation'

interface PageContextData {
  path: string
  entity: string | null
  entityId: string | null
  filters: Record<string, unknown>
  selection: string[]
  userRole: string
}

const AIPageContextContext = createContext<PageContextData>({
  path: '',
  entity: null,
  entityId: null,
  filters: {},
  selection: [],
  userRole: '',
})

export function AIPageContext({
  children,
  ...context
}: PageContextData & { children: React.ReactNode }) {
  const updateContext = useAICompanion((s) => s.updatePageContext)

  React.useEffect(() => {
    updateContext(context)
  }, [context, updateContext])

  return (
    <AIPageContextContext.Provider value={context}>
      {children}
    </AIPageContextContext.Provider>
  )
}

export function useAIPageContext() {
  return useContext(AIPageContextContext)
}
```

---

### 5.2 Usage in Pages

```tsx
// In a page component (e.g., personas page)

import { AIPageContext } from '@/features/ai-companion/components/ai-page-context'

export default function PersonasPage() {
  return (
    <AIPageContext
      path="/admin/socios/personas"
      entity="personas"
      entityId={null}
      filters={{ estado: 'activo' }}
      selection={[]}
      userRole="admin"
    >
      <PersonasPageContent />
    </AIPageContext>
  )
}
```

---

### 5.3 Context-Aware AI Responses

```typescript
// AI generates different responses based on context

const CONTEXT_RESPONSES = {
  personas: {
    active: "I see you're viewing active personas. Would you like me to filter by type or search for someone specific?",
    inactive: "Looking at inactive personas. Want me to help reactivate someone?",
  },
  tareas: {
    dashboard: "This is your tareas dashboard. I can help you create a new task or filter by status.",
    detail: "Viewing tarea details. Need help updating status or assigning to someone?",
  },
}

export function getContextualResponse(
  context: PageContextData,
  userMessage: string
): string {
  const { entity, filters } = context

  if (entity === 'personas') {
    if (filters.estado === 'activo') {
      return CONTEXT_RESPONSES.personas.active
    }
  }

  // Default response
  return "How can I help you today?"
}
```

---

## 6. Implementation Guide

### Step 1: Create Action Types (1 hour)

1. Define all action type interfaces
2. Create `lib/ai-action-types.ts`
3. Add to main types file

### Step 2: Create Action Message Component (2 hours)

1. Build `ai-action-message.tsx`
2. Handle all status states
3. Add animations
4. Test with mock actions

### Step 3: Create Confirmation Card (1.5 hours)

1. Build `ai-confirmation-card.tsx`
2. Add destructive variant
3. Test confirmation flows

### Step 4: Create Highlight System (2 hours)

1. Build `ai-highlight-overlay.tsx`
2. Add CSS animations
3. Handle scroll-into-view
4. Test various element types

### Step 5: Implement Page Context (2 hours)

1. Create `ai-page-context.tsx`
2. Create `use-ai-context.ts` hook
3. Add context provider to pages
4. Test context updates

### Step 6: Create Server Actions (3 hours)

1. Create `app/actions/ai.ts`
2. Implement `aiNavigate`
3. Implement `aiApplyFilter`
4. Implement `aiCreateRecord`
5. Add permission checks
6. Test with different user roles

### Step 7: Integrate Actions (2 hours)

1. Connect actions to message flow
2. Handle action execution
3. Update UI based on results
4. Handle errors gracefully

### Step 8: Create AI Logic Layer (3 hours)

1. Build action selection logic
2. Connect to page context
3. Generate contextual responses
4. Test conversation flows

---

## 7. Acceptance Criteria

### 7.1 Navigation Actions

- [ ] AI can navigate to detail pages
- [ ] Navigation respects permissions
- [ ] "Not found" handled gracefully
- [ ] Success message shown after navigation
- [ ] Works in both floating and sidebar mode
- [ ] User can cancel before navigation

### 7.2 Filter Actions

- [ ] AI can apply filters to tables
- [ ] Invalid filter values rejected
- [ ] Success message shows filter applied
- [ ] Table updates with new filter
- [ ] Multiple filters can be applied

### 7.3 Highlight Actions

- [ ] AI can highlight UI elements
- [ ] Highlight animation is visible
- [ ] Element scrolls into view
- [ ] Highlight removes after duration
- [ ] Multiple highlights supported

### 7.4 Create Actions

- [ ] AI can create tareas
- [ ] Confirmation dialog shown
- [ ] User can cancel
- [ ] Success message on create
- [ ] Error message on failure
- [ ] Permissions enforced

### 7.5 Page Context

- [ ] AI knows current page
- [ ] AI knows current filters
- [ ] AI knows selected entities
- [ ] Context updates on navigation
- [ ] Contextual responses work

---

## 8. Testing Checklist

### Manual Testing

**Navigation:**
- [ ] "Show me Juan Pérez" navigates to profile
- [ ] "Open tarea 123" navigates to tarea
- [ ] Invalid entity shows error
- [ ] No permission shows error
- [ ] Cancel works before navigation

**Filters:**
- [ ] "Show only active personas" applies filter
- [ ] "Filter by high priority" applies filter
- [ ] Table updates correctly
- [ ] Filter state persists
- [ ] Clear filter works

**Highlights:**
- [ ] "Where is tareas section" highlights
- [ ] "Show me the filter button" highlights
- [ ] Animation is visible
- [ ] Element scrolls into view
- [ ] Highlight disappears after duration

**Create:**
- [ ] "Create a tarea for María" shows confirmation
- [ ] Confirmation shows correct details
- [ ] Cancel stops creation
- [ ] Confirm creates record
- [ ] Success message shown
- [ ] Error handling works

**Context Awareness:**
- [ ] AI responds to "what am I looking at?"
- [ ] AI knows current page filters
- [ ] AI adapts responses to context
- [ ] Context updates on navigation

**Permissions:**
- [ ] Analyst cannot create records
- [ ] Analyst can navigate (with permission)
- [ ] Admin can do all actions
- [ ] Owner can do all actions

**Edge Cases:**
- [ ] Rapid actions don't cause conflicts
- [ ] Offline shows appropriate error
- [ ] Slow networks show loading state
- [ ] Invalid data handled gracefully

---

## 9. Future Enhancements (Phase 4+)

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Update Actions** | AI can modify existing records | Medium |
| **Delete Actions** | AI can delete with confirmation | Medium |
| **Workflow Execution** | AI can trigger multi-step processes | High |
| **Database Queries** | AI can run custom queries | High |
| **File Upload** | Attach files to conversations | Medium |
| **Voice Input** | Speech-to-text for messages | Medium |
| **Multi-Language** | AI responds in user's language | Low |
| **Analytics** | Track AI usage and effectiveness | Low |

---

**Phase Status:** 🟡 Requires Phases 1 & 2 Completion
**Next Steps:** Real AI Backend Integration (future)
