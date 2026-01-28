# Phase 2: Sidebar Mode - Detailed Specification

**Parent:** [README.md](./README.md)
**Prerequisites:** [Phase 1: Floating Chat](./01-floating-chat.md) ✅ Complete
**Phase:** 2 of 3
**Estimated Time:** 4-6 hours
**Dependencies:** Phase 1 components

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Specifications](#2-component-specifications)
3. [Layout Integration](#3-layout-integration)
4. [Implementation Guide](#4-implementation-guide)
5. [Acceptance Criteria](#5-acceptance-criteria)
6. [Testing Checklist](#6-testing-checklist)

---

## 1. Overview

### 1.1 Goal

Add an expandable sidebar mode that:
- Pushes content left (not overlay)
- Uses resizable panels for user control
- Smoothly transitions from floating mode
- Remembers user preference
- Hides on mobile (floating only)

### 1.2 What's Included

| Component | Description |
|-----------|-------------|
| **Mode Toggle** | Button to switch between floating/sidebar |
| **Sidebar Container** | Right sidebar panel wrapper |
| **Resizable Handle** | Drag handle for width adjustment |
| **Collapsed State** | Thin strip when collapsed |
| **Layout Integration** | Modifies admin layout to support panel |

### 1.3 Key Behaviors

| User Action | System Response |
|-------------|-----------------|
| Click mode toggle | Switch between floating/sidebar |
| Drag resize handle | Adjust sidebar width |
| Click collapse button | Shrink to thin strip |
| Navigate to new page | Maintain mode and conversations |
| Resize window < 1024px | Force floating mode |

---

## 2. Component Specifications

### 2.1 Mode Toggle Button

**File:** `features/ai-companion/components/ai-mode-toggle.tsx`

```tsx
interface AIModeToggleProps {
  currentMode: 'floating' | 'sidebar'
  onToggle: () => void
}

// Location: Top-right of chat container (in header)
// Size: 32px × 32px
// Icon: Changes based on mode
//   - Floating → Sidebar: "PanelLeftOpen" icon
//   - Sidebar → Floating: "PanelLeftClose" icon
// Tooltip: "Switch to sidebar mode" / "Switch to floating mode"
```

**Visual Design:**

```
Floating Mode Header:
┌────────────────────────────────────┐
│ AI Assistant         [expand][×]   │
└────────────────────────────────────┘

Sidebar Mode Header:
┌────────────────────────────────────┐
│ AI Assistant         [collapse][×] │
└────────────────────────────────────┘
```

---

### 2.2 Sidebar Container

**File:** `features/ai-companion/components/ai-sidebar-container.tsx`

```tsx
interface AISidebarContainerProps {
  isOpen: boolean
  onResize: (size: number) => void
  onCollapse: () => void
  children: React.ReactNode
}

// Uses: react-resizable-panels (already in project)
// Default width: 30%
// Min width: 280px
// Max width: 50%
// Collapsible: Yes
```

**Layout Structure:**

```
┌────────────────────────────────────────┐
│  Header                                │
│  AI Assistant         [collapse][×]    │
├────────────────────────────────────────┤
│  Conversation List (narrow sidebar)    │
│  ┌──────────────────────────────────┐ │
│  │ [+ New]                         │ │
│  │ Show active...              [×]  │ │
│  │ Find tareas...              [×]  │ │
│  └──────────────────────────────────┘ │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐ │
│  │ [message 1]                     │ │
│  │ [message 2]                     │ │
│  │                                 │ │
│  │ [________________] [mode] [send]│ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
         ↑
    ResizableHandle
```

---

### 2.3 Resizable Handle

Uses existing `components/ui/resizable.tsx` from the project.

**Configuration:**

```tsx
<ResizableHandle
  withHandle={true}
  className="w-1 hover:w-2 transition-colors"
/>
```

**Handle Appearance:**
- Width: 4px (hover: 8px)
- Color: var(--border)
- Cursor: col-resize
- Visual feedback: hover state shows handle grip

---

### 2.4 Collapsed State

When collapsed, sidebar becomes a thin strip:

```
┌────┐
│ AI │ ← Strip (icon only, ~60px wide)
│    │
│    │
│    │
└────┘
```

**Collpased State Behavior:**
- Shows only "AI" icon/sparkles
- Hover expands to show "AI Assistant" label
- Click to expand
- Position: Fixed right edge

---

## 3. Layout Integration

### 3.1 Admin Layout Modification

**File:** `app/admin/layout.tsx`

**Current Structure:**

```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header>...</header>
    {children}
  </SidebarInset>
</SidebarProvider>
```

**New Structure (Phase 2):**

```tsx
<SidebarProvider>
  <AppSidebar />
  <ResizablePanelGroup direction="horizontal">
    {/* Main Content Panel */}
    <ResizablePanel
      id="main-content"
      defaultSize={70}
      minSize={30}
    >
      <SidebarInset>
        <header>...</header>
        {children}
      </SidebarInset>
    </ResizablePanel>

    {/* AI Panel - conditional */}
    <AICompanionPanel />
  </ResizablePanelGroup>
</SidebarProvider>
```

---

### 3.2 AI Companion Panel Component

**File:** `components/ai-companion-panel.tsx`

```tsx
'use client'

import { useAICompanion } from '@/features/ai-companion/lib/ai-state'
import { AISidebarContainer } from '@/features/ai-companion/components/ai-sidebar-container'
import { ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useMediaQuery } from '@/hooks/use-media-query'

export function AICompanionPanel() {
  const { mode, isOpen } = useAICompanion()
  const isMobile = useMediaQuery('(max-width: 1024px)')

  // Force floating mode on mobile
  if (isMobile || mode === 'floating') {
    return null // Floating component rendered separately
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="ai-panel"
        defaultSize={30}
        minSize={20}
        maxSize={50}
        collapsible
      >
        <AISidebarContainer />
      </ResizablePanel>
    </>
  )
}
```

---

### 3.3 Responsive Behavior Matrix

| Screen Width | Default Mode | Available Modes | Notes |
|--------------|--------------|-----------------|-------|
| **< 768px** | Floating | Floating only | Full-screen chat |
| **768 - 1024px** | Floating | Floating only | 60% width chat |
| **> 1024px** | User preference | Both | Sidebar uses 30% |
| **> 1440px** | User preference | Both | Sidebar can use up to 50% |

---

## 4. Implementation Guide

### Step 1: Update State (30 min)

1. Add `mode` field to Zustand store
2. Add `toggleMode` action
3. Persist mode preference to localStorage

```typescript
// In lib/ai-state.ts

interface AICompanionState {
  // ... existing fields
  mode: 'floating' | 'sidebar'
  sidebarSize: number // Remember sidebar width

  toggleMode: () => void
  setSidebarSize: (size: number) => void
}

// In store implementation
toggleMode: () =>
  set((state) => ({
    mode: state.mode === 'floating' ? 'sidebar' : 'floating',
  })),

setSidebarSize: (size: number) => set({ sidebarSize: size }),
```

### Step 2: Create Mode Toggle (30 min)

1. Create `components/ai-mode-toggle.tsx`
2. Add to chat header
3. Test toggle functionality

### Step 3: Create Sidebar Container (1.5 hours)

1. Create `components/ai-sidebar-container.tsx`
2. Use ResizablePanel from `components/ui/resizable.tsx`
3. Add collapse/expand logic
4. Test resize behavior

### Step 4: Modify Admin Layout (1 hour)

1. Update `app/admin/layout.tsx`
2. Wrap content in ResizablePanelGroup
3. Add conditional AI panel
4. Test with various content sizes

### Step 5: Create AI Companion Panel (1 hour)

1. Create `components/ai-companion-panel.tsx`
2. Handle mobile/desktop logic
3. Connect to state
4. Test transitions

### Step 6: Handle Mobile (30 min)

1. Force floating mode on small screens
2. Hide sidebar component on mobile
3. Test responsive breakpoints

### Step 7: Transitions & Polish (1 hour)

1. Add resize animation
2. Add mode switch animation
3. Smooth content reflow
4. Test all transitions

---

## 5. Acceptance Criteria

### 5.1 Functional Requirements

**Mode Toggle:**
- [ ] Toggle button visible in chat header
- [ ] Toggle button icon reflects current mode
- [ ] Clicking toggle switches modes
- [ ] Mode switch preserves conversation state
- [ ] Mode preference persists across navigation

**Sidebar Mode:**
- [ ] Sidebar appears on right side
- [ ] Main content shrinks (not overlay)
- [ ] Sidebar width is 30% by default
- [ ] Sidebar is resizable via drag handle
- [ ] Minimum width is 280px
- [ ] Maximum width is 50%
- [ ] Collapsed state shows thin strip
- [ ] Clicking collapsed strip expands sidebar

**Responsive:**
- [ ] Screens < 1024px force floating mode
- [ ] Toggle button hidden on mobile
- [ ] Sidebar hidden on mobile
- [ ] Floating mode works on all screen sizes

**Transitions:**
- [ ] Mode switch animation is smooth
- [ ] Resize animation is smooth
- [ ] No layout thrashing
- [ ] Content remains readable during resize

### 5.2 Non-Functional Requirements

- [ ] No console errors during mode switch
- [ ] No layout breaks at extreme widths
- [ ] Animations run at 60fps
- [ ] Keyboard shortcuts work in both modes
- [ ] State persists correctly
- [ ] No hydration errors

### 5.3 Integration

- [ ] Works with existing left sidebar
- [ ] Doesn't break page navigation
- [ ] Doesn't interfere with other resizable panels
- [ ] Theme switching works
- [ ] All Phase 1 features still work

---

## 6. Testing Checklist

### Manual Testing

**Mode Toggle:**
- [ ] Can toggle from floating to sidebar
- [ ] Can toggle from sidebar to floating
- [ ] Toggle button icon updates
- [ ] Conversation preserved during toggle
- [ ] Mode persists after page refresh

**Sidebar Behavior:**
- [ ] Sidebar appears on right
- [ ] Content pushes left
- [ ] No overlay covering content
- [ ] Default width is ~30%
- [ ] Can drag handle to resize
- [ ] Resize handle has hover effect
- [ ] Can resize to minimum width
- [ ] Can resize to maximum width
- [ ] Can collapse completely
- [ ] Collapsed state is thin strip
- [ ] Clicking strip expands sidebar

**Responsive Testing:**
- [ ] At 768px width: floating forced
- [ ] At 1024px width: sidebar available
- [ ] At 1440px width: sidebar can be wider
- [ ] Resize window: mode switches appropriately
- [ ] Mobile: floating only
- [ ] Tablet: both modes available

**State Persistence:**
- [ ] Mode preference saved to localStorage
- [ ] Sidebar width remembered
- [ ] Navigating to new page preserves mode
- [ ] Refreshing page preserves mode
- [ ] Opening new tab uses default (floating)

**Edge Cases:**
- [ ] Very narrow window (< 400px): still usable
- [ ] Very wide window (> 2000px): no issues
- [ ] Rapid toggle: no glitches
- [ ] Rapid resize: smooth performance
- [ ] Collapse during resize: handled correctly

**Integration:**
- [ ] Left sidebar still works
- [ ] Page navigation works
- [ ] Theme switching works
- [ ] All themes display correctly
- [ ] Keyboard shortcuts work

---

## 7. Migration from Phase 1

### Files to Modify

| File | Change |
|------|--------|
| `lib/ai-state.ts` | Add `mode`, `sidebarSize`, `toggleMode` |
| `components/ai-header.tsx` | Add mode toggle button |
| `app/admin/layout.tsx` | Wrap in ResizablePanelGroup |

### New Files to Create

| File | Purpose |
|------|---------|
| `components/ai-mode-toggle.tsx` | Mode switch button |
| `components/ai-sidebar-container.tsx` | Sidebar wrapper |
| `components/ai-companion-panel.tsx` | Conditional panel |
| `hooks/use-media-query.ts` | Responsive detection |

---

**Phase Status:** 🟡 Requires Phase 1 Completion
**Next Phase:** [Phase 3: AI-UI Interactions](./03-ai-ui-interactions.md)
