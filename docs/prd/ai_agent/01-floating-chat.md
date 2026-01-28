# Phase 1: Floating Chat MVP - Detailed Specification

**Parent:** [README.md](./README.md)
**Phase:** 1 of 3
**Estimated Time:** 8-12 hours
**Dependencies:** None

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Specifications](#2-component-specifications)
3. [File Structure](#3-file-structure)
4. [Implementation Guide](#4-implementation-guide)
5. [Acceptance Criteria](#5-acceptance-criteria)
6. [Testing Checklist](#6-testing-checklist)

---

## 1. Overview

### 1.1 Goal

Build a floating chat interface that:
- Appears as a FAB (Floating Action Button) in the bottom-right corner
- Expands into a chat bubble when clicked
- Supports multiple conversations
- Persists data locally using IndexedDB
- Works alongside the existing sidebar without interfering

### 1.2 What's Included

| Component | Description |
|-----------|-------------|
| **AI Trigger Button** | FAB in bottom-right corner with pulse animation |
| **Floating Container** | Chat bubble that sits above FAB, 400px wide |
| **Conversation List** | Sidebar showing all conversations |
| **Chat View** | Message list + input area |
| **AI Composer** | Input with attachment, mode selector, send button |
| **Config Menu** | Settings, shortcuts, clear chat |
| **Context Provider** | Global state management |

### 1.3 What's NOT Included (Future Phases)

- Sidebar mode (Phase 2)
- AI-to-UI actions (Phase 3)
- Real AI integration (mock responses only)
- File attachments (UI only)

---

## 2. Component Specifications

### 2.1 AI Trigger Button (FAB)

**File:** `features/ai-companion/components/ai-trigger-button.tsx`

```tsx
interface AITriggerButtonProps {
  unreadCount: number
  isOpen: boolean
  onClick: () => void
}

// Position: Fixed, bottom: 24px, right: 24px
// Size: 56px × 56px
// Border radius: 16px
// Background: Primary color gradient
// Icon: Sparkles (lucide-react)
```

**Visual States:**

| State | Appearance |
|-------|------------|
| Default | Solid primary color, shadow-lg |
| Hover | Scale 1.05, shadow-xl |
| Active (chat open) | Icon changes to "X" |
| Unread | Pulse animation (subtle ring) |

**Animation:**

```css
@keyframes ai-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0px color-mix(in srgb, var(--primary) 50%, transparent);
  }
  50% {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--primary) 10%, transparent);
  }
}

.ai-trigger--unread {
  animation: ai-pulse 2s ease-in-out infinite;
}
```

**Accessibility:**
- `aria-label`: "Open AI assistant" / "Close AI assistant"
- `aria-expanded`: reflects chat state
- Keyboard focusable with `Tab`

---

### 2.2 AI Floating Container

**File:** `features/ai-companion/components/ai-floating-container.tsx`

```tsx
interface AIFloatingContainerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

// Position: Fixed, bottom: 88px, right: 24px (above FAB)
// Width: 400px (max 90vw on mobile)
// Max height: 70vh
// Border radius: 16px
// Background: var(--background)
// Border: 1px solid var(--border)
// Shadow: xl
```

**Layout Structure:**

```
┌────────────────────────────────────┐
│  Header                            │
│  AI Assistant        [collapse][×] │
├────────────────────────────────────┤
│                                    │
│  [Content - dynamic]               │
│  - Conversation List OR            │
│  - Chat View                       │
│                                    │
│  (flex-1, overflow-y-auto)         │
├────────────────────────────────────┤
│  Input Area (fixed)                │
│  [📎] [input........] [⚙️] [↑]     │
│  [mode: Balanced ▼]                │
└────────────────────────────────────┘
```

**Animation:**

```css
/* Entrance animation - scale from FAB position */
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

.ai-floating-container {
  animation: ai-bubble-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

### 2.3 AI Conversation List

**File:** `features/ai-companion/components/ai-conversation-list.tsx`

```tsx
interface AIConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

// Layout:
// - "New Chat" button at top (full width)
// - List of conversation items below
// - Each item: title + delete button
// - Hover: background highlight
```

**Conversation Item:**

```
┌────────────────────────────────────┐
│ [+ New Chat]                       │
├────────────────────────────────────┤
│ Show active personas        [×]    │ ← Active
│ Find tareas for María         [×]  │
│ Company dashboard help         [×]  │
└────────────────────────────────────┘
```

**Item Styling:**
- Height: 48px
- Padding: 12px horizontal
- Truncate title after 40 chars
- Delete button: opacity 0 → 1 on hover
- Active: background accent, text accent-foreground

---

### 2.4 AI Chat View

**File:** `features/ai-companion/components/ai-chat-view.tsx`

```tsx
interface AIChatViewProps {
  conversation: Conversation
  onSendMessage: (content: string) => void
  isSending: boolean
}

// Components:
// - AIConversationHeader (back button, title, actions)
// - AIMessageList (scrollable message area)
// - AIInputArea (composer at bottom)
```

**Message List Layout:**

```
┌────────────────────────────────────┐
│  [←] Show active personas    [⋮]   │ ← Header
├────────────────────────────────────┤
│                                    │
│  User bubble →                     │
│  "Show me active personas"         │
│                                    │
│  ← AI bubble                       │
│  "I can help you find..."          │
│                                    │
│  (flex-1, overflow-y-auto)         │
│                                    │
├────────────────────────────────────┤
│  [input area]                      │ ← Fixed bottom
└────────────────────────────────────┘
```

---

### 2.5 AI Message Components

**Files:**
- `features/ai-companion/components/ai-user-message.tsx`
- `features/ai-companion/components/ai-ai-message.tsx`
- `features/ai-companion/components/ai-typing-indicator.tsx`

**User Message:**

```tsx
interface AIUserMessageProps {
  content: string
  timestamp: Date
}

// Alignment: Right
// Background: var(--accent)
// Text: var(--accent-foreground)
// Border radius: 18px 18px 4px 18px (bottom-left sharp)
// Max width: 85%
// Margin left: auto
```

**AI Message:**

```tsx
interface AIAIMessageProps {
  content: string
  timestamp: Date
}

// Alignment: Left
// Background: var(--muted)
// Text: var(--foreground)
// Border radius: 18px 18px 18px 4px (bottom-right sharp)
// Max width: 85%
```

**Typing Indicator:**

```tsx
// Three dots animation
// Appears below last AI message when waiting for response

@keyframes ai-typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

.dot-1 { animation: ai-typing 1s infinite 0s; }
.dot-2 { animation: ai-typing 1s infinite 0.2s; }
.dot-3 { animation: ai-typing 1s infinite 0.4s; }
```

---

### 2.6 AI Composer (Input Area)

**File:** `features/ai-companion/components/ai-composer.tsx`

```tsx
interface AIComposerProps {
  onSend: (content: string) => void
  aiMode: AIMode
  onModeChange: (mode: AIMode) => void
  onAttach: () => void
  onConfig: () => void
  isSending: boolean
}

// Layout:
// ┌────────────────────────────────────────┐
// │ [📎] [text input area........] [⚙️] [↑] │
// │      [Balanced ▼]                       │
// └────────────────────────────────────────┘
```

**Sub-components:**

1. **AI Attachment Button** (`ai-attachment-button.tsx`)
   - Icon: Paperclip (lucide-react)
   - Size: 32px × 32px
   - Tooltip: "Attach (Phase 3)"

2. **AI Input Field** (`ai-input-field.tsx`)
   - Auto-growing textarea
   - Min height: 24px
   - Max height: 120px
   - Placeholder: "Ask AI anything..."
   - No resize handle

3. **AI Mode Selector** (`ai-mode-selector.tsx`)
   - Dropdown with options
   - Options: Balanced, Precise, Creative, Developer
   - Current mode shown as small badge

4. **AI Config Menu** (`ai-config-menu.tsx`)
   - Popover menu with:
     - "Clear conversation"
     - "Keyboard shortcuts"
     - "Help"

5. **AI Send Button** (`ai-send-button.tsx`)
   - Icon: ArrowUp (lucide-react)
   - Disabled when input empty
   - Shows loading spinner when sending

---

### 2.7 AI Context Provider

**File:** `features/ai-companion/lib/ai-state.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AICompanionState {
  // UI State
  isOpen: boolean
  isConversationListOpen: boolean

  // Conversation Data
  conversations: Conversation[]
  activeConversationId: string | null

  // AI Config
  aiMode: AIMode

  // Actions
  openChat: () => void
  closeChat: () => void
  toggleConversationList: () => void
  startNewConversation: () => string
  switchConversation: (id: string) => void
  deleteConversation: (id: string) => void
  sendMessage: (content: string) => Promise<void>
  setAIMode: (mode: AIMode) => void
  clearActiveConversation: () => void
}

export const useAICompanion = create<AICompanionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isConversationListOpen: true,
      conversations: [],
      activeConversationId: null,
      aiMode: 'balanced',

      // Actions
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),

      toggleConversationList: () =>
        set((state) => ({
          isConversationListOpen: !state.isConversationListOpen,
        })),

      startNewConversation: () => {
        const id = crypto.randomUUID()
        const newConversation: Conversation = {
          id,
          title: 'New conversation',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
          context: {
            startPath: window.location.pathname,
            currentPage: window.location.pathname,
          },
        }
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
          isConversationListOpen: false,
        }))
        return id
      },

      switchConversation: (id) =>
        set({
          activeConversationId: id,
          isConversationListOpen: false,
        }),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        })),

      sendMessage: async (content: string) => {
        const state = get()
        const activeId = state.activeConversationId

        if (!activeId) {
          // Create new conversation if none exists
          const newId = get().startNewConversation()
          return get().sendMessage(content)
        }

        // Add user message
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          type: 'text',
          content,
          timestamp: new Date(),
        }

        // Update conversation title from first message
        const conversations = state.conversations.map((c) => {
          if (c.id === activeId) {
            const updated = {
              ...c,
              messages: [...c.messages, userMessage],
              updatedAt: new Date(),
            }
            if (c.messages.length === 0) {
              updated.title = content.slice(0, 40)
            }
            return updated
          }
          return c
        })

        set({ conversations })

        // Get AI response (mock for now)
        const aiResponse = await getMockAIResponse(content)

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'text',
          content: aiResponse,
          timestamp: new Date(),
        }

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, aiMessage] }
              : c
          ),
        }))
      },

      setAIMode: (mode) => set({ aiMode: mode }),

      clearActiveConversation: () =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === state.activeConversationId
              ? { ...c, messages: [], title: 'New conversation' }
              : c
          ),
        })),
    }),
    {
      name: 'ai-companion-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        aiMode: state.aiMode,
      }),
    }
  )
)
```

---

## 3. File Structure

```
features/ai-companion/
├── components/
│   ├── ai-trigger-button.tsx          ✅ Phase 1
│   ├── ai-floating-container.tsx      ✅ Phase 1
│   ├── ai-chat-core.tsx               ✅ Phase 1
│   ├── ai-conversation-list.tsx       ✅ Phase 1
│   ├── ai-conversation-item.tsx       ✅ Phase 1
│   ├── ai-chat-view.tsx               ✅ Phase 1
│   ├── ai-message-list.tsx            ✅ Phase 1
│   ├── ai-user-message.tsx            ✅ Phase 1
│   ├── ai-ai-message.tsx              ✅ Phase 1
│   ├── ai-typing-indicator.tsx        ✅ Phase 1
│   ├── ai-composer.tsx                ✅ Phase 1
│   ├── ai-attachment-button.tsx       ✅ Phase 1 (Phase 3 for function)
│   ├── ai-mode-selector.tsx           ✅ Phase 1
│   ├── ai-config-menu.tsx             ✅ Phase 1
│   ├── ai-send-button.tsx             ✅ Phase 1
│   ├── ai-new-chat-button.tsx         ✅ Phase 1
│   ├── ai-header.tsx                  ✅ Phase 1
│   ├── ai-sidebar-container.tsx       ⏳ Phase 2
│   └── index.ts                       ✅ Phase 1
├── hooks/
│   ├── use-ai-companion.ts            ✅ Phase 1
│   ├── use-ai-conversations.ts        ✅ Phase 1
│   ├── use-ai-chat.ts                 ✅ Phase 1
│   ├── use-ai-keyboard.ts             ✅ Phase 1
│   ├── use-ai-actions.ts              ⏳ Phase 3
│   └── use-ai-context.ts              ⏳ Phase 3
├── lib/
│   ├── ai-state.ts                    ✅ Phase 1
│   ├── ai-types.ts                    ✅ Phase 1
│   ├── ai-constants.ts                ✅ Phase 1
│   ├── ai-utils.ts                    ✅ Phase 1
│   └── mock-responses.ts              ✅ Phase 1
├── server/
│   ├── ai-chat.ts                     ⏳ Phase 3
│   └── ai-context.ts                  ⏳ Phase 3
└── ai-companion-root.tsx              ✅ Phase 1
```

---

## 4. Implementation Guide

### Step 1: Setup (30 min)

1. Install dependencies:
   ```bash
   npm install zustand framer-motion
   ```

2. Create directory structure:
   ```bash
   mkdir -p features/ai-companion/{components,hooks,lib}
   ```

3. Create type definitions in `lib/ai-types.ts`

### Step 2: State Management (1 hour)

1. Create `lib/ai-state.ts` with Zustand store
2. Add persistence middleware
3. Test with Zustand dev tools

### Step 3: FAB Component (1 hour)

1. Create `components/ai-trigger-button.tsx`
2. Add pulse animation
3. Add keyboard shortcut hook
4. Test visibility and click

### Step 4: Floating Container (1.5 hours)

1. Create `components/ai-floating-container.tsx`
2. Add entrance animation
3. Position above FAB
4. Add backdrop click to close

### Step 5: Message Components (2 hours)

1. Create `ai-user-message.tsx`
2. Create `ai-ai-message.tsx`
3. Create `ai-typing-indicator.tsx`
4. Test message rendering

### Step 6: Composer (2 hours)

1. Create `ai-input-field.tsx` with auto-grow
2. Create `ai-mode-selector.tsx`
3. Create `ai-attachment-button.tsx` (UI only)
4. Create `ai-send-button.tsx`
5. Create `ai-composer.tsx` wrapper
6. Test send flow

### Step 7: Conversation Management (2 hours)

1. Create `ai-conversation-list.tsx`
2. Create `ai-conversation-item.tsx`
3. Create `ai-new-chat-button.tsx`
4. Implement CRUD operations
5. Test persistence

### Step 8: Integration (2 hours)

1. Create `ai-chat-core.tsx` main component
2. Create `ai-companion-root.tsx` provider
3. Add to `app/admin/layout.tsx`
4. Test across pages

### Step 9: Polish (1.5 hours)

1. Add all theme CSS variables
2. Test in dark mode
3. Test on mobile
4. Add keyboard shortcuts
5. Fix accessibility issues

---

## 5. Acceptance Criteria

### 5.1 Functional Requirements

- [ ] FAB visible in bottom-right corner on all admin pages
- [ ] FAB has pulse animation on first load
- [ ] Clicking FAB opens floating chat bubble
- [ ] Chat bubble animates smoothly from FAB position
- [ ] Chat bubble closes when clicking outside
- [ ] Chat bubble closes when pressing Escape
- [ ] Can create new conversation with "+ New Chat" button
- [ ] Conversations are saved and persist across refresh
- [ ] Can switch between conversations
- [ ] Can delete conversations
- [ ] First message becomes conversation title
- [ ] Input field auto-grows with content
- [ ] Can send messages with Enter key
- [ ] Shift+Enter creates new line in input
- [ ] Send button disabled when input is empty
- [ ] Typing indicator shows while "AI is responding"
- [ ] Mock AI responses work
- [ ] AI mode selector can change mode
- [ ] Config menu opens with options
- [ ] "Clear conversation" deletes messages but keeps conversation
- [ ] Works in all 12 app themes

### 5.2 Non-Functional Requirements

- [ ] TypeScript strict mode, no errors
- [ ] No console warnings
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: proper ARIA labels
- [ ] Performance: animations run at 60fps
- [ ] Performance: state updates don't block UI
- [ ] Mobile: FAB doesn't overlap important content
- [ ] Mobile: Chat bubble is full-width on small screens

### 5.3 Integration Points

- [ ] Doesn't interfere with existing sidebar
- [ ] Doesn't break keyboard shortcuts
- [ ] Works with existing theme system
- [ ] State persists across navigation
- [ ] Doesn't cause hydration errors

---

## 6. Testing Checklist

### Manual Testing

**FAB Behavior:**
- [ ] FAB visible on page load
- [ ] FAB pulse animation plays once
- [ ] Clicking FAB opens chat
- [ ] Clicking FAB when chat is open closes chat
- [ ] FAB icon changes to X when chat open
- [ ] FAB has hover effect

**Chat Behavior:**
- [ ] Chat opens with entrance animation
- [ ] Chat positioned correctly above FAB
- [ ] Chat doesn't go off-screen
- [ ] Clicking outside chat closes it
- [ ] Pressing Escape closes chat
- [ ] Chat can be reopened with same content

**Conversation Management:**
- [ ] "+ New Chat" creates new conversation
- [ ] New conversation is selected
- [ ] Conversation list shows all conversations
- [ ] Clicking conversation switches to it
- [ ] Delete button removes conversation
- [ ] Deleted conversation is no longer in list
- [ ] Conversations persist after refresh

**Messaging:**
- [ ] Can type in input field
- [ ] Input grows with content
- [ ] Input stops growing at max height
- [ ] Enter sends message
- [ ] Shift+Enter adds new line
- [ ] User message appears on right
- [ ] AI message appears on left
- [ ] Typing indicator shows
- [ ] Typing indicator replaced with AI response
- [ ] Can scroll through messages

**Mobile (< 768px):**
- [ ] FAB doesn't overlap navigation
- [ ] Chat is full-width when open
- [ ] Chat doesn't overflow viewport
- [ ] All touch targets are 44px minimum

**Theme Testing:**
- [ ] Works in default theme
- [ ] Works in dark mode
- [ ] Works in capuccino theme
- [ ] Works in retro theme
- [ ] Works in claude theme
- [ ] Works in doom-64 theme
- [ ] Works in grafito theme
- [ ] Works in cielo theme
- [ ] Works in neo-brutal theme
- [ ] Works in jardin theme
- [ ] Works in mandarina theme
- [ ] Works in country theme
- [ ] Works in country-max theme

**Accessibility:**
- [ ] All interactive elements keyboard focusable
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader announces changes

---

**Phase Status:** 🟢 Ready for Implementation
**Next Phase:** [Phase 2: Sidebar Mode](./02-sidebar-mode.md)
