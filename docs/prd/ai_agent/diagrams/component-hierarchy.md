# AI Companion Component Hierarchy

## Complete Component Tree

```
AICompanionRoot (Provider + Layout Wrapper)
│
├── AIProvider (Zustand Context)
│   └── Provides: useAICompanion()
│
├── AIKeyboardShortcuts (Global Event Listeners)
│   ├── Cmd+I: Toggle chat
│   ├── Esc: Close chat
│   └── Cmd+Shift+I: Toggle mode
│
├── AITriggerButton (FAB)
│   ├── Pulse animation (unread state)
│   ├── Icon: Sparkles / X
│   └── Click: Opens chat
│
├── AIFloatingContainer
│   ├── AIChatHeader
│   │   ├── Title: "AI Assistant"
│   │   ├── AIModeToggle (→ Phase 2)
│   │   └── CloseButton
│   │
│   ├── AIFloatingContent (conditional)
│   │   ├── AIConversationList (when showing list)
│   │   │   ├── AINewChatButton
│   │   │   └── AIConversationItem[]
│   │   │
│   │   └── AIChatView (when showing chat)
│   │       ├── AIMessageList
│   │       │   ├── AIUserMessage
│   │       │   ├── AIAIMessage
│   │       │   ├── AIActionMessage (→ Phase 3)
│   │       │   └── AITypingIndicator
│   │       │
│   │       └── AIInputArea
│   │           └── AIComposer
│   │               ├── AIAttachmentButton
│   │               ├── AIInputField
│   │               ├── AIModeSelector
│   │               ├── AIConfigMenu
│   │               └── AISendButton
│   │
│   └── AIFloatingBackdrop
│
└── AISidebarContainer (→ Phase 2)
    ├── AIChatHeader
    │   ├── Title: "AI Assistant"
    │   ├── AIModeToggle
    │   └── CollapseButton
    │
    ├── AISidebarContent
    │   ├── AIConversationList
    │   │   ├── AINewChatButton
    │   │   └── AIConversationItem[]
    │   │
    │   └── AIChatView
    │       ├── AIMessageList
    │       └── AIInputArea
    │
    └── ResizableHandle
```

## Phase 1 Components (MVP)

### Core Components

```
features/ai-companion/
├── ai-companion-root.tsx              ──┐
│   ├── AIProvider                     │ Main entry point
│   └── Renders: AITriggerButton       │ Wraps app
│       + AIFloatingContainer          │
│                                      │
├── components/
│   ├── ai-trigger-button.tsx          │ FAB (bottom-right)
│   ├── ai-floating-container.tsx      │ Chat bubble wrapper
│   ├── ai-chat-core.tsx               │ Main chat UI
│   │   ├── ai-header.tsx              │ Header with title
│   │   ├── ai-conversation-list.tsx   │ Conversation sidebar
│   │   ├── ai-chat-view.tsx           │ Active conversation
│   │   │   ├── ai-message-list.tsx    │ Scrollable messages
│   │   │   ├── ai-user-message.tsx    │ User bubble
│   │   │   ├── ai-ai-message.tsx      │ AI bubble
│   │   │   └── ai-typing-indicator.tsx│ Loading indicator
│   │   └── ai-composer.tsx            │ Input area
│   │       ├── ai-attachment-button.tsx
│   │       ├── ai-input-field.tsx     │ Auto-grow textarea
│   │       ├── ai-mode-selector.tsx   │ Mode dropdown
│   │       ├── ai-config-menu.tsx     │ Settings menu
│   │       └── ai-send-button.tsx
│   ├── ai-conversation-item.tsx       │ List item
│   └── ai-new-chat-button.tsx         │ New chat button
│
├── hooks/
│   ├── use-ai-companion.ts            │ Zustand hook
│   ├── use-ai-conversations.ts        │ Conv CRUD
│   ├── use-ai-chat.ts                 │ Send messages
│   └── use-ai-keyboard.ts             │ Shortcuts
│
└── lib/
    ├── ai-state.ts                    │ Zustand store
    ├── ai-types.ts                    │ TypeScript types
    ├── ai-constants.ts                │ Config, icons
    └── mock-responses.ts              │ Mock AI replies
```

## Phase 2 Additions

### New Components

```
features/ai-companion/
├── components/
│   ├── ai-mode-toggle.tsx             │ NEW: Mode switch button
│   ├── ai-sidebar-container.tsx       │ NEW: Sidebar wrapper
│   └── ai-collapsed-strip.tsx         │ NEW: Collapsed state
│
└── hooks/
    └── use-ai-layout.ts               │ NEW: Layout management

components/
└── ai-companion-panel.tsx             │ NEW: Layout integration
```

## Phase 3 Additions

### New Components

```
features/ai-companion/
├── components/
│   ├── ai-action-message.tsx          │ NEW: Action feedback
│   ├── ai-confirmation-card.tsx       │ NEW: Confirm dialogs
│   ├── ai-highlight-overlay.tsx       │ NEW: Element highlight
│   └── ai-page-context.tsx            │ NEW: Context provider
│
├── hooks/
│   ├── use-ai-actions.ts              │ NEW: Execute actions
│   └── use-ai-context.ts              │ NEW: Page context
│
└── server/
    ├── ai-chat.ts                     │ NEW: AI API
    ├── ai-context.ts                  │ NEW: Context API
    └── ai-actions.ts                  │ NEW: Action handlers

app/actions/
└── ai.ts                              │ NEW: Server actions
```

## Component Props Reference

### AICompanionRoot

```typescript
interface AICompanionRootProps {
  children: React.ReactNode
  defaultOpen?: boolean
  defaultMode?: 'floating' | 'sidebar'
}
```

### AITriggerButton

```typescript
interface AITriggerButtonProps {
  unreadCount: number
  isOpen: boolean
  onClick: () => void
  position?: 'bottom-right' | 'bottom-left'
}
```

### AIFloatingContainer

```typescript
interface AIFloatingContainerProps {
  isOpen: boolean
  onClose: () => void
  width?: number
  maxHeight?: string
  children: React.ReactNode
}
```

### AIChatCore

```typescript
interface AIChatCoreProps {
  mode: 'floating' | 'sidebar'
  showConversationList?: boolean
  onToggleMode?: () => void
}
```

### AIComposer

```typescript
interface AIComposerProps {
  onSend: (content: string) => void
  aiMode: AIMode
  onModeChange: (mode: AIMode) => void
  onAttach?: (file: File) => void
  onConfig?: () => void
  isSending: boolean
  placeholder?: string
}

type AIMode = 'balanced' | 'precise' | 'creative' | 'developer'
```

### AIActionMessage

```typescript
interface AIActionMessageProps {
  action: AIAction
  status: ActionStatus
  onConfirm?: () => void
  onCancel?: () => void
}

type ActionStatus = 'pending' | 'executing' | 'success' | 'error'

type AIAction =
  | { type: 'navigation'; target: string; title: string }
  | { type: 'filter'; entity: string; filters: Record<string, unknown>; title: string }
  | { type: 'create'; entity: string; data: Record<string, unknown>; title: string }
  | { type: 'highlight'; target: HighlightTarget; duration?: number }
```

## Data Flow Diagram

```
User Input
    ↓
AIComposer (onSend)
    ↓
useAIChat (sendMessage)
    ↓
AICompanion State (add user message)
    ↓
AIMessageList (re-render with user message)
    ↓
AITypingIndicator (show)
    ↓
[AI Processing - mock or real API]
    ↓
AICompanion State (add AI message)
    ↓
AIMessageList (re-render with AI response)
    ↓
[If Action] → AIActionMessage (show confirmation)
    ↓
[User confirms] → Execute Action
    ↓
[Action result] → Update UI / Show success
```

## State Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    AICompanionState                     │
├─────────────────────────────────────────────────────────┤
│ UI State                                                │
│   - isOpen: boolean                                     │
│   - mode: 'floating' | 'sidebar'                       │
│   - isConversationListOpen: boolean                     │
│                                                         │
│ Conversation Data                                       │
│   - conversations: Conversation[]                       │
│   - activeConversationId: string | null                 │
│                                                         │
│ AI Configuration                                        │
│   - aiMode: AIMode                                     │
│   - streamResponse: boolean                             │
│                                                         │
│ Context Awareness                                       │
│   - currentPath: string                                 │
│   - currentPageContext: PageContext | null             │
│                                                         │
│ Actions                                                 │
│   - openChat(), closeChat()                             │
│   - toggleMode()                                        │
│   - startNewConversation()                              │
│   - switchConversation(id)                              │
│   - deleteConversation(id)                              │
│   - sendMessage(content)                                │
│   - executeAction(action)                               │
│   - updatePageContext(context)                          │
└─────────────────────────────────────────────────────────┘
```
