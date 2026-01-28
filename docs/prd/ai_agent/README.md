# AI Companion / Copilot - PRD

**Project:** SOCIOS_ADMIN CRM
**Feature:** AI Companion (Interactive Agent)
**Version:** 1.0
**Last Updated:** 2025-01-28
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Requirements](#2-product-requirements)
3. [Design Specifications](#3-design-specifications)
4. [Technical Architecture](#4-technical-architecture)
5. [Phase 1: Floating Chat](#5-phase-1-floating-chat-mvp)
6. [Phase 2: Sidebar Mode](#6-phase-2-sidebar-mode)
7. [Phase 3: AI-UI Interactions](#7-phase-3-ai-ui-interactions)
8. [AI Developer Instructions](#8-ai-developer-instructions)
9. [Success Criteria](#9-success-criteria)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Vision

Build an AI companion that helps users navigate, understand, and interact with the SOCIOS_ADMIN CRM. Unlike traditional chatbots that only respond to questions, this AI agent can **interact with the UI** - navigate pages, filter data, highlight elements, and perform actions on behalf of the user.

### 1.2 Design Philosophy

**Inspired by:** Notion AI, Linear Ask, Cursor AI, Raycast

**Core Principles:**
- **Progressive Enhancement**: Starts as a floating chat, evolves into a full sidebar
- **UI-Aware**: AI sees and interacts with the application state
- **Non-Intrusive**: User controls when/how it appears
- **Multi-Conversation**: Multiple chat sessions with context retention
- **Action-Oriented**: Not just answers - AI can do things

### 1.3 Key Differentiators

| Feature | Traditional Chatbots | SOCIOS AI Agent |
|---------|---------------------|-----------------|
| UI Awareness | ❌ No | ✅ Yes - sees current page, filters, selections |
| Navigation | ❌ No | ✅ Yes - can navigate to pages |
| Actions | ❌ No | ✅ Yes - can create, filter, highlight |
| Conversational Memory | Single thread | Multiple conversations |
| Display Mode | Fixed overlay | Floating → Sidebar toggle |
| Context Awareness | None | Page context, entity context, user role |

---

## 2. Product Requirements

### 2.1 Core Functionality

| Requirement | Description | Priority |
|-------------|-------------|----------|
| **Floating Chat** | FAB-triggered chat bubble in bottom-right | P0 |
| **Sidebar Mode** | Expandable right sidebar panel | P0 |
| **Multiple Conversations** | Manage multiple chat sessions | P0 |
| **Message Types** | Text, AI actions, UI highlights | P0 |
| **Attachment Button** | Attach context/files to conversation | P0 |
| **Mode Toggle** | Switch between AI modes (creative, precise, etc.) | P1 |
| **Config Menu** | Settings, shortcuts, preferences | P1 |
| **Page Awareness** | AI knows current page/context | P1 |
| **UI Interaction** | AI can navigate, filter, highlight | P1 |
| **Keyboard Shortcuts** | Open/close with Cmd+I | P2 |

### 2.2 Message Types

The AI companion handles multiple message types:

| Type | Description | Direction | Example |
|------|-------------|-----------|---------|
| **text** | Plain text messages | Both | "Show me active personas" |
| **action** | AI performs an action | AI→User | "Filtering by estado=activo..." |
| **navigation** | AI navigates to a page | AI→User | "Opening Juan Pérez's profile..." |
| **highlight** | AI points to UI element | AI→User | "Here's the tareas section ↓" |
| **confirmation** | Ask user before action | AI→User | "Create new tarea for María?" |
| **error** | Action failed | AI→User | "Could not find that persona" |
| **attachment** | User attaches context | User→AI | Screenshot, file, entity reference |
| **system** | Status/progress updates | AI→User | "Analyzing 23 tareas..." |

### 2.3 AI Modes (Configurable Behaviors)

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Balanced** (default) | Mix of concise and explanatory | General use |
| **Precise** | Brief, direct answers | Power users |
| **Creative** | Expansive, suggests options | Exploration |
| **Developer** | Technical details, query info | Debugging |

### 2.4 Conversation Management

| Feature | Description |
|---------|-------------|
| **Auto-title** | First message becomes conversation title (truncated) |
| **Max conversations** | 10 active (older archived) |
| **Context retention** | Remember current page during session |
| **Cross-page** | Conversations persist across navigation |
| **Clear history** | Individual delete + bulk clear |

---

## 3. Design Specifications

### 3.1 Visual Design Principles

**Inspiration Sources:**

| Element | Reference | Key Characteristics |
|---------|-----------|---------------------|
| **Floating Animation** | Notion AI | Smooth scale/fade from FAB |
| **Sidebar Transition** | Linear Ask | Push content, not overlay |
| **Input Area** | Cursor / Raycast | Floating bottom, minimal chrome |
| **Message Bubbles** | Attio | Subtle borders, no heavy shadows |
| **Typography** | Linear | Clean, mono for code/commands |

**Design Tokens:**

```css
/* AI Panel Specific Tokens */
--ai-panel-width: 400px;
--ai-sidebar-width: 30%; /* resizable */
--ai-fab-size: 56px;
--ai-message-max-width: 85%;
--ai-bubble-radius: 18px;
--ai-input-height: 52px;

/* Colors - uses existing theme vars */
--ai-accent: var(--primary);
--ai-user-bubble: var(--accent);
--ai-ai-bubble: var(--muted);
--ai-highlight: var(--ring);
```

### 3.2 Layout States

#### State 1: Collapsed (FAB Only)

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────┐  Header + Breadcrumb                      │
│ │  Sidebar  │                                           │
│ │           │┌─────────────────────────────────────────┐│
│ │           ││  Main Content                          ││
│ │           ││                                         ││
│ │           ││                                         ││
│ │           │└─────────────────────────────────────────┘│
│ └───────────┘                                         │
│                                               ┌──────┐ │
│                                               │  AI  │ │ ← FAB
│                                               │      │ │
│                                               └──────┘ │
└─────────────────────────────────────────────────────────┘
```

#### State 2: Floating Chat Bubble

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────┐  Header + Breadcrumb                      │
│ │  Sidebar  │                                           │
│ │           │┌─────────────────────────────────────────┐│
│ │           ││  Main Content                          ││
│ │           ││                                         ││
│ │           ││                              ┌────────┐ ││
│ │           │└──────────────────────────────┤ Chat   │ ││
│ └───────────┘                                │ bubble │ ││
│                                             │        │ ││
│                                             │        │ ││
│                                             │ [input]│ ││
│                                             └────────┘ ││
└─────────────────────────────────────────────────────────┘
```

#### State 3: Sidebar Mode (Expanded)

```
┌─────────────────────────────────────────────────────────┐
│ ┌───────────┐  Header                   ┌─────────────┐│
│ │  Sidebar  │                           │  AI Panel   ││
│ │           │┌───────────────────────────┴─────────────┴┐│
│ │           ││  Main Content (narrower)                ││
│ │           ││                                         ││
│ │           ││                                         ││
│ │           │└─────────────────────────────────────────┘│
│ └───────────┘  ┌───────────────────────────────────────┐│
│               │  Conversation List                     ││
│               │  ┌─────────────────────────────────┐   ││
│               │  │ Show active personas            │   ││
│               │  │ Find tareas for María           │   ││
│               │  └─────────────────────────────────┘   ││
│               │                                        ││
│               │  ┌─────────────────────────────────┐   ││
│               │  │ [message 1]                     │   ││
│               │  │ [message 2]                     │   ││
│               │  │ [message 3]                     │   ││
│               │  │                                 │   ││
│               │  │ [________________] [mode] [send]│   ││
│               │  └─────────────────────────────────┘   ││
│               └────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.3 Component Hierarchy

```
AICompanionRoot (Provider)
├── AICompanionTrigger (FAB)
├── AIComposer (Input Component)
│   ├── AIAttachmentButton
│   ├── AIModeSelector
│   ├── AIInputField
│   ├── AISendButton
│   └── AIConfigMenu
├── AIConversationList
│   ├── AIConversationItem
│   └── AINewConversationButton
├── AIChatView
│   ├── AIMessageList
│   │   ├── AIUserMessage
│   │   ├── AIAIMessage
│   │   ├── AIActionMessage
│   │   └── AIHighlightMessage
│   └── AIInputArea
└── AIFloatingContainer / AISidebarContainer (Mode-specific wrappers)
```

### 3.4 Animation Specifications

```css
/* FAB Pulse (when idle/unread) */
@keyframes ai-pulse {
  0%, 100% { box-shadow: 0 0 0 0px var(--ai-accent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--ai-accent) 25%, transparent); }
}

/* Floating Bubble Entrance */
@keyframes ai-bubble-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Sidebar Slide (push effect) */
@keyframes ai-sidebar-enter {
  from { flex: 0 0 0; }
  to { flex: 0 0 var(--ai-sidebar-width); }
}

/* Message Fade In */
@keyframes ai-message-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing Indicator */
@keyframes ai-typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
```

### 3.5 Responsive Behavior

| Screen Width | Behavior |
|--------------|----------|
| **< 768px** | FAB only, full-screen chat when opened |
| **768 - 1024px** | FAB + floating bubble (60% width) |
| **> 1024px** | Full sidebar mode available |

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **State Management** | React Context + Zustand | Global state for conversations, mode |
| **Floating Container** | Radix UI Popover / Floating UI | Positioning, portal rendering |
| **Sidebar Container** | Resizable Panels | Push layout, user-resizable |
| **Animations** | Framer Motion | Declarative, smooth transitions |
| **Message Input** | Textarea Autosize + React Hook Form | Auto-growing input |
| **Data Fetching** | TanStack Query | AI responses, context data |
| **AI Integration** | OpenAI SDK / Anthropic SDK | LLM API calls |
| **Routing** | Next.js App Router | Programmatic navigation |
| **Persistence** | IndexedDB + Supabase | Local cache + server sync |

### 4.2 State Management Schema

```typescript
// Global AI State (Zustand store)
interface AICompanionState {
  // UI State
  isOpen: boolean
  mode: 'floating' | 'sidebar'
  isMinimized: boolean

  // Conversation State
  conversations: Conversation[]
  activeConversationId: string | null

  // AI Configuration
  aiMode: 'balanced' | 'precise' | 'creative' | 'developer'
  streamResponse: boolean

  // Context Awareness
  currentPath: string
  currentPageContext: PageContext | null

  // Actions
  openChat: () => void
  closeChat: () => void
  toggleMode: () => void
  startNewConversation: () => string
  switchConversation: (id: string) => void
  deleteConversation: (id: string) => void
  sendMessage: (content: string, type: MessageType) => Promise<void>
  setAIMode: (mode: AIMode) => void
  updatePageContext: (context: PageContext) => void
}

// Conversation Schema
interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
  context: {
    startPath: string
    currentPage: string
    entityId?: string
  }
}

// Message Schema
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'action' | 'navigation' | 'highlight' | 'error'
  content: string
  timestamp: Date
  metadata?: {
    action?: AIAction
    navigation?: NavigationAction
    highlight?: ElementHighlight
  }
}

// Page Context (what the AI "sees")
interface PageContext {
  path: string
  entity?: string
  filters?: Record<string, unknown>
  selection?: string[]
  userRole?: string
}
```

### 4.3 File Structure

```
docs/prd/ai_agent/
├── README.md                    (this file)
├── 01-floating-chat.md          (Phase 1 detailed spec)
├── 02-sidebar-mode.md           (Phase 2 detailed spec)
├── 03-ai-ui-interactions.md     (Phase 3 detailed spec)
└── diagrams/
    ├── state-machine.mermaid
    └── component-hierarchy.mermaid

features/ai-companion/
├── components/
│   ├── ai-companion-root.tsx       (Provider wrapper)
│   ├── ai-trigger-button.tsx       (The FAB)
│   ├── ai-floating-container.tsx   (Floating bubble wrapper)
│   ├── ai-sidebar-container.tsx    (Sidebar panel wrapper)
│   ├── ai-chat-core.tsx            (Mode-agnostic chat UI)
│   ├── ai-composer.tsx             (Input area)
│   │   ├── ai-attachment-button.tsx
│   │   ├── ai-mode-selector.tsx
│   │   ├── ai-input-field.tsx
│   │   ├── ai-send-button.tsx
│   │   └── ai-config-menu.tsx
│   ├── ai-conversation-list.tsx
│   │   ├── ai-conversation-item.tsx
│   │   └── ai-new-conversation-button.tsx
│   ├── ai-message-list.tsx
│   │   ├── ai-user-message.tsx
│   │   ├── ai-ai-message.tsx
│   │   ├── ai-action-message.tsx
│   │   └── ai-typing-indicator.tsx
│   └── ai-action-card.tsx           (Action confirmation UI)
├── hooks/
│   ├── use-ai-companion.ts          (Main state hook)
│   ├── use-ai-conversations.ts      (Conversation CRUD)
│   ├── use-ai-chat.ts               (Send/receive messages)
│   ├── use-ai-actions.ts            (AI → UI interactions)
│   └── use-ai-context.ts            (Page context awareness)
├── lib/
│   ├── ai-state.ts                  (Zustand store)
│   ├── ai-types.ts                  (TypeScript types)
│   ├── ai-constants.ts              (Config, icons)
│   └── ai-utils.ts                  (Helpers)
└── server/
    ├── ai-chat.ts                   (Server Action for AI calls)
    └── ai-context.ts                 (Server Action for context)
```

### 4.4 Integration Points

| Integration | Description | Implementation |
|-------------|-------------|----------------|
| **Router** | AI can navigate pages | `useRouter()` from Next.js |
| **Supabase** | AI can query/create data | Server Actions with permissions |
| **PostHog** | Track AI interactions | Custom events for analytics |
| **Theme** | Respects app themes | CSS variables |
| **Sidebar** | Coexists with left sidebar | Separate layout context |

---

## 5. Phase 1: Floating Chat (MVP)

**Goal:** Build a functional floating chat interface with multi-conversation support.

**Estimated Time:** 8-12 hours

### 5.1 Scope

| Feature | Included? | Notes |
|---------|-----------|-------|
| FAB trigger | ✅ | Bottom-right, pulse animation |
| Floating bubble | ✅ | Sits above FAB, doesn't overlay content |
| Multiple conversations | ✅ | List in sidebar of bubble |
| Message input | ✅ | Text area with auto-grow |
| Basic message types | ✅ | Text only (no actions yet) |
| Mode selector | ✅ | Dropdown for AI modes |
| Attachment button | ✅ | UI only (Phase 3 for functionality) |
| Config menu | ✅ | Clear chat, keyboard shortcuts |
| Keyboard shortcut | ✅ | Cmd+I to open/close |
| Local persistence | ✅ | IndexedDB for conversations |

### 5.2 Component Specifications

#### AI Trigger Button (FAB)

```tsx
// Location: bottom-right fixed position
// Size: 56px
// States: default, hover, active, pulse (when unread)

interface AITriggerButtonProps {
  unreadCount: number
  onClick: () => void
  isChatOpen: boolean
}

// Visual:
// - Circle with AI spark icon
// - Subtle gradient accent
// - Pulse animation when unread > 0
// - Transforms to "close" icon when chat open
```

#### AI Floating Container

```tsx
// Location: Fixed position, bottom-right aligned with FAB
// Width: 400px (fixed)
// Max height: 70vh
// Animation: scale/fade from FAB position

interface AIFloatingContainerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

// Layout:
// ┌──────────────────────────┐
// │ Header: "AI Assistant"   │
// │              [collapse][x]│
// ├──────────────────────────┤
// │                          │
// │  Chat View OR            │
// │  Conversation List       │
// │                          │
// ├──────────────────────────┤
// │ Input Area (fixed bottom)│
// └──────────────────────────┘
```

#### AI Composer (Input Area)

```tsx
// Location: Fixed at bottom of chat container
// Height: Auto-growing (min 52px, max 200px)

interface AIComposerProps {
  onSend: (content: string) => void
  aiMode: AIMode
  onModeChange: (mode: AIMode) => void
  onAttach: () => void
  onConfig: () => void
  isSending: boolean
}

// Layout:
// ┌──────────────────────────────────────┐
// │ [📎] [text input........] [⚙️] [↑] │
// │      [mode: Balanced ▼]              │
// └──────────────────────────────────────┘
```

#### AI Conversation List

```tsx
// Shows: List of conversations + new chat button

interface AIConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

// Layout:
// ┌──────────────────────────────────────┐
// │ [+ New Chat]                         │
// ├──────────────────────────────────────┤
// │ Show active personas          [×]    │
// │ Find tareas for María           [×]  │
// │ Company dashboard help          [×]  │
// └──────────────────────────────────────┘
```

### 5.3 Data Schema

```sql
-- Local IndexedDB schema (conversations stored locally)
-- Database: "ai-companion", Store: "conversations"

interface IndexedDBSchema {
  name: "ai-companion"
  version: 1
  stores: {
    conversations: {
      keyPath: "id"
      indexes: {
        updatedAt: "updatedAt"
        createdAt: "createdAt"
      }
    }
  }
}
```

### 5.4 Acceptance Criteria

- [ ] FAB visible in bottom-right corner
- [ ] Opens/closes with Cmd+I keyboard shortcut
- [ ] FAB has pulse animation when first opened
- [ ] Floating bubble animates smoothly from FAB position
- [ ] Can create new conversations
- [ ] Can switch between conversations
- [ ] Can delete conversations
- [ ] Messages persist in IndexedDB
- [ ] Input auto-grows with content
- [ ] AI mode selector works (visual only)
- [ ] Config menu opens with options
- [ ] Clear chat deletes current conversation
- [ ] Works in all 12 app themes
- [ ] Responsive on mobile (< 768px)

### 5.5 Mock API Responses

For Phase 1, use mock responses:

```typescript
// Mock AI responses for testing
const MOCK_RESPONSES: Record<string, string[]> = {
  "personas": [
    "I can help you find personas. What are you looking for?",
    "You can filter personas by estado, tipo_actor, or search by name.",
  ],
  "tareas": [
    "I see you're looking at tareas. Would you like me to filter by status?",
    "You can create a new tarea from the button above, or ask me to help!",
  ],
  "default": [
    "Hello! I'm your AI companion. How can I help you today?",
    "I can help you navigate, find information, or perform actions. What would you like to do?",
  ]
}
```

---

## 6. Phase 2: Sidebar Mode

**Goal:** Add expandable sidebar mode with resizable panel.

**Estimated Time:** 4-6 hours

### 6.1 Scope

| Feature | Included? | Notes |
|---------|-----------|-------|
| Mode toggle | ✅ | Button in chat header to switch modes |
| Sidebar container | ✅ | Uses ResizablePanel |
| Push layout | ✅ | Main content shrinks, not overlay |
| Resizable handle | ✅ | User can drag to resize |
| Collapsed state | ✅ | Shrinks to thin strip |
| Keyboard persistence | ✅ | Remembers mode in localStorage |
| Transition animation | ✅ | Smooth resize between modes |

### 6.2 Component Specifications

#### Mode Toggle Button

```tsx
// Location: Top-right of chat container
// Behavior: Toggles between floating/sidebar

interface AIModeToggleProps {
  currentMode: 'floating' | 'sidebar'
  onToggle: () => void
}

// Visual:
// - Icon changes based on mode
// - Floating → Sidebar: "expand" icon
// - Sidebar → Floating: "compress" icon
```

#### AI Sidebar Container

```tsx
// Location: Right side of main layout
// Width: 30% (resizable, min 280px, max 50%)
// Uses: react-resizable-panels

interface AISidebarContainerProps {
  isOpen: boolean
  onResize: (size: number) => void
  children: React.ReactNode
}

// Integration with admin/layout.tsx:
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={70}>
    <SidebarInset>{children}</SidebarInset>
  </ResizablePanel>

  <ResizableHandle withHandle />

  <ResizablePanel
    id="ai-panel"
    defaultSize={30}
    minSize={20}
    maxSize={50}
    collapsible
  >
    <AISidebarContainer>
      <AIChatCore />
    </AISidebarContainer>
  </ResizablePanel>
</ResizablePanelGroup>
```

### 6.3 Layout Modifications

```tsx
// app/admin/layout.tsx needs modification:
// 1. Wrap content in ResizablePanelGroup
// 2. Add conditional AI panel
// 3. Handle mobile (hide sidebar, use floating only)

const shouldShowAISidebar = useAICompanion(state => state.mode === 'sidebar' && state.isOpen)

return (
  <SidebarProvider>
    <AppSidebar />
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={shouldShowAISidebar ? 70 : 100}>
        <SidebarInset>
          <header>...</header>
          {children}
        </SidebarInset>
      </ResizablePanel>

      {shouldShowAISidebar && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel id="ai-panel" defaultSize={30} minSize={20} maxSize={50}>
            <AISidebarContainer />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  </SidebarProvider>
)
```

### 6.4 Acceptance Criteria

- [ ] Mode toggle button in chat header
- [ ] Switching to sidebar mode pushes content left
- [ ] Switching to floating mode restores full width
- [ ] Sidebar is resizable via drag handle
- [ ] Can collapse sidebar to thin strip
- [ ] Mode persists across page navigation
- [ ] Mobile forces floating mode
- [ ] Transition animation is smooth
- [ ] Keyboard shortcuts work in both modes
- [ ] Conversations preserved when switching modes

---

## 7. Phase 3: AI-UI Interactions

**Goal:** Enable AI to interact with the application UI.

**Estimated Time:** 12-16 hours

### 7.1 Scope

| Feature | Included? | Notes |
|---------|-----------|-------|
| Page context awareness | ✅ | AI knows current page/entity |
| Navigation actions | ✅ | AI can navigate to pages |
| Filter actions | ✅ | AI can apply filters |
| Highlight actions | ✅ | AI can point to elements |
| Create actions | ✅ | AI can create records |
| Action confirmation | ✅ | User confirms before AI acts |
| Action messages | ✅ | Show what AI is doing |
| Error handling | ✅ | Graceful failure |
| Server Actions | ✅ | Permission-checked operations |

### 7.2 AI Action Types

#### Navigation Action

```typescript
interface NavigationAction {
  type: 'navigation'
  target: string // Route path
  title: string // Human-readable
  metadata?: {
    entityId?: string
    params?: Record<string, string>
  }
}

// Example: "Open Juan Pérez's profile"
// AI sends: { type: 'navigation', target: '/admin/socios/personas/123', title: "Juan Pérez" }
```

#### Filter Action

```typescript
interface FilterAction {
  type: 'filter'
  entity: string // 'personas', 'tareas', etc.
  filters: Record<string, unknown>
  title: string
}

// Example: "Show only active personas"
// AI sends: { type: 'filter', entity: 'personas', filters: { estado: 'activo' } }
```

#### Highlight Action

```typescript
interface HighlightAction {
  type: 'highlight'
  target: {
    type: 'element' | 'section' | 'row'
    selector?: string // CSS selector
    description: string
  }
  duration?: number // ms
}

// Example: "Here's the tareas section"
// AI sends: { type: 'highlight', target: { type: 'section', description: 'Tareas table' } }
```

#### Create Action

```typescript
interface CreateAction {
  type: 'create'
  entity: string
  data: Record<string, unknown>
  title: string
  requiresConfirmation: boolean
}

// Example: "Create a new tarea for María"
// AI sends: {
//   type: 'create',
//   entity: 'tarea',
//   data: { titulo: '...', asignado_a: '...' },
//   requiresConfirmation: true
// }
```

### 7.3 Action Message Component

```tsx
// Displays AI action with visual feedback

interface AIActionMessageProps {
  action: AIAction
  status: 'pending' | 'executing' | 'success' | 'error'
  onConfirm?: () => void
  onCancel?: () => void
  error?: string
}

// Visual states:
// pending: Show action description + "Confirm" button
// executing: Show loading spinner
// success: Show checkmark + result
// error: Show error + "Try again" button
```

### 7.4 Page Context System

```typescript
// Hook to gather page context for AI

interface PageContext {
  path: string
  entity: string | null
  entityId: string | null
  filters: Record<string, unknown>
  selection: string[]
  userRole: string
}

// Page components provide context:
<AIPageContext
  entity="personas"
  filters={{ estado: 'activo' }}
/>

// AI can read context to give relevant responses:
const context = useAIPageContext()
// AI: "I see you're looking at active personas. How can I help?"
```

### 7.5 Server Actions for AI

```typescript
// app/actions/ai.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/auth/permissions'

// AI navigation (just returns URL, client navigates)
export async function aiNavigateTo(params: {
  entity: string
  entityId: string
  orgId: string
}) {
  // Check permissions
  const canView = await checkPermission(params.entity, 'view', params.orgId)
  if (!canView) {
    throw new Error('No permission')
  }

  // Return route
  return `/admin/${params.entity}/${params.entityId}`
}

// AI filter (returns filter object)
export async function aiGetFilterOptions(params: {
  entity: string
  orgId: string
}) {
  const supabase = await createClient()

  // Get available filter values
  // e.g., for personas: unique estados, tipos_actor, etc.

  return { /* filter options */ }
}

// AI create (executes with confirmation)
export async function aiCreateRecord(params: {
  entity: string
  data: Record<string, unknown>
  orgId: string
  userId: string
}) {
  const canCreate = await checkPermission(params.entity, 'create', params.orgId)
  if (!canCreate) {
    throw new Error('No permission')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from(params.entity)
    .insert({
      ...params.data,
      organizacion_id: params.orgId,
      creado_por: params.userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 7.6 Acceptance Criteria

- [ ] AI knows current page and entity
- [ ] AI can navigate to detail pages
- [ ] AI can suggest filters
- [ ] AI can highlight UI elements
- [ ] AI can create records (with confirmation)
- [ ] Action messages show status
- [ ] User confirms before destructive actions
- [ ] Errors are handled gracefully
- [ ] Permissions are enforced
- [ ] Actions work in both floating and sidebar mode

---

## 8. AI Developer Instructions

### 8.1 Getting Started

**Step 1: Create Feature Directory**

```bash
mkdir -p features/ai-companion/{components,hooks,lib,server}
```

**Step 2: Install Dependencies**

```bash
npm install zustand framer-motion react-resizable-panels
npm install -D @types/use-sync-external-store
```

**Step 3: Create Core Types**

Create `features/ai-companion/lib/ai-types.ts` using the schema from Section 4.2.

**Step 4: Create State Store**

Create `features/ai-companion/lib/ai-state.ts` with Zustand store.

**Step 5: Build Components in Order**

1. `ai-trigger-button.tsx` (FAB)
2. `ai-floating-container.tsx` (wrapper)
3. `ai-conversation-list.tsx` (conversation management)
4. `ai-composer.tsx` (input area)
5. `ai-message-list.tsx` (messages display)
6. `ai-chat-core.tsx` (assembles chat UI)
7. `ai-sidebar-container.tsx` (Phase 2)

### 8.2 Coding Guidelines

**DO:**
- ✅ Use existing theme variables from `globals.css`
- ✅ Follow the project's vertical slice architecture
- ✅ Use TanStack Query for data fetching
- ✅ Add proper TypeScript types (no `any`)
- ✅ Handle loading and error states
- ✅ Test keyboard navigation
- ✅ Use Supabase MCP for database work
- ✅ Respect user permissions for all actions
- ✅ Add aria-labels for accessibility
- ✅ Test in dark mode and all themes

**DON'T:**
- ❌ Use any AI-default fonts
- ❌ Create new database tables without migration
- ❌ Hardcode organization ID
- ❌ Ignore error states
- ❌ Use inline styles (use Tailwind classes)
- ❌ Make AI actions irreversible without confirmation
- ❌ Store sensitive data in IndexedDB
- ❌ Block the UI while AI is "thinking"

### 8.3 Testing Checklist

Before marking a phase complete, test:

**Phase 1:**
- [ ] FAB visible and clickable
- [ ] Opens/closes with Cmd+I
- [ ] Can create/delete conversations
- [ ] Messages persist across refresh
- [ ] Input auto-grows
- [ ] Works in all themes
- [ ] Mobile responsive

**Phase 2:**
- [ ] Mode toggle works
- [ ] Sidebar pushes content
- [ ] Sidebar is resizable
- [ ] Mode persists
- [ ] Mobile hides sidebar
- [ ] Smooth transitions

**Phase 3:**
- [ ] AI knows current page
- [ ] Navigation works
- [ ] Filters apply correctly
- [ ] Highlights appear
- [ ] Create actions work
- [ ] Confirmations shown
- [ ] Permissions enforced
- [ ] Errors handled

### 8.4 Mock Data for Development

```typescript
// features/ai-companion/lib/mock-data.ts

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    title: 'Show active personas',
    createdAt: new Date('2025-01-28T10:00:00'),
    updatedAt: new Date('2025-01-28T10:05:00'),
    messages: [
      {
        id: 'm1',
        role: 'user',
        type: 'text',
        content: 'Show me active personas',
        timestamp: new Date('2025-01-28T10:00:00'),
      },
      {
        id: 'm2',
        role: 'assistant',
        type: 'action',
        content: 'Filtering personas by estado=activo',
        timestamp: new Date('2025-01-28T10:00:05'),
        metadata: {
          action: {
            type: 'filter',
            entity: 'personas',
            filters: { estado: 'activo' },
          },
        },
      },
    ],
    context: {
      startPath: '/admin/socios/personas',
      currentPage: '/admin/socios/personas',
    },
  },
]
```

---

## 9. Success Criteria

### 9.1 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first interaction | < 200ms | FAB click → chat open |
| Message send latency | < 500ms | Send → visible in UI |
| Mode switch time | < 300ms | Click mode toggle → complete |
| Typing indicator | < 100ms | After user sends message |
| Conversation persistence | 100% | Survive refresh |

### 9.2 Technical Quality

| Metric | Target |
|--------|--------|
| TypeScript coverage | 100% |
| Bundle size impact | < 50KB gzipped |
| Accessibility | WCAG 2.1 AA |
| Performance | Lighthouse > 90 |
| Theme support | All 12 themes |

### 9.3 Feature Completeness

- [ ] Phase 1: Floating Chat ✅
- [ ] Phase 2: Sidebar Mode ✅
- [ ] Phase 3: AI-UI Interactions ✅

---

## 10. Appendices

### Appendix A: Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd+I` / `Ctrl+I` | Toggle AI chat | Global |
| `Esc` | Close AI chat | When open |
| `Cmd+Shift+I` | Toggle mode (floating/sidebar) | When open |
| `↑` / `↓` | Navigate conversation list | In conversation view |
| `Enter` | Send message | In input |
| `Shift+Enter` | New line in input | In input |

### Appendix B: AI Response Patterns

```typescript
// AI should follow these response patterns:

// 1. Acknowledge user intent
"I can help you find personas. Let me search..."

// 2. Describe action before executing
"I'll filter the list to show only active personas."

// 3. Ask for confirmation when needed
"Should I create a new tarea for María with title 'Review contract'?"

// 4. Handle errors gracefully
"Couldn't find a persona with that name. Would you like me to search by email?"

// 5. Suggest related actions
"I found 3 personas. Would you like me to show only those in Madrid?"
```

### Appendix C: Design References

| Reference | URL | Inspiration |
|-----------|-----|-------------|
| Notion AI | https://notion.so | Floating → Sidebar pattern |
| Linear Ask | https://linear.app | Sidebar layout, minimal UI |
| Cursor AI | https://cursor.sh | Input area design |
| Raycast | https://raycast.com | Command palette style |
| Attio | https://attio.com | Message bubble design |

### Appendix D: Component Props Reference

```typescript
// Quick reference for main component props

// AI Companion Root
interface AICompanionRootProps {
  children: React.ReactNode
  defaultOpen?: boolean
  defaultMode?: 'floating' | 'sidebar'
}

// AI Trigger Button
interface AITriggerButtonProps {
  unreadCount?: number
  position?: 'bottom-right' | 'bottom-left'
}

// AI Floating Container
interface AIFloatingContainerProps {
  width?: number
  maxHeight?: string
  position?: { bottom: number; right: number }
}

// AI Sidebar Container
interface AISidebarContainerProps {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsible?: boolean
}

// AI Composer
interface AIComposerProps {
  placeholder?: string
  maxLength?: number
  showAttach?: boolean
  showModeSelector?: boolean
  showConfig?: boolean
}

// AI Chat Core
interface AIChatCoreProps {
  showConversationList?: boolean
  maxMessages?: number
  streamingEnabled?: boolean
}
```

### Appendix E: Migration to Real AI Backend

When ready to integrate real AI (Phase 4+):

1. **Replace mock responses** with API calls
2. **Add streaming** support for real-time responses
3. **Implement context injection** (page data sent with prompt)
4. **Add tool definitions** for AI capabilities (navigate, filter, create)
5. **Implement RAG** for business-specific knowledge
6. **Add analytics** for AI usage tracking

```typescript
// Example: Real AI integration structure

export async function* streamAIResponse(
  message: string,
  context: PageContext,
  conversationHistory: Message[]
): AsyncGenerator<string> {
  // Call AI API with streaming
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      context,
      history: conversationHistory,
      tools: ['navigate', 'filter', 'create', 'highlight'],
    }),
  })

  const reader = response.body.getReader()
  // Yield streaming chunks...
}
```

---

**Document Status:** 🟢 Ready for Implementation
**Next Step:** Begin Phase 1 - Floating Chat MVP
**Estimated Total Time:** 24-34 hours across 3 phases
