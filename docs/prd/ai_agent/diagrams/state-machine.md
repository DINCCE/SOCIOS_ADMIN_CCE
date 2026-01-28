# AI Companion State Machine Diagrams

## Mode Toggle State Machine

```mermaid
stateDiagram-v2
    [*] --> Closed: Initial State
    Closed --> Floating: FAB Click / Cmd+I
    Closed --> Sidebar: Mode Preference + Cmd+I
    Floating --> Closed: Click Outside / Escape
    Sidebar --> Closed: Close Button
    Floating --> Sidebar: Mode Toggle
    Sidebar --> Floating: Mode Toggle

    note right of Closed
        FAB visible with pulse
        No chat interface shown
    end note

    note right of Floating
        Chat bubble above FAB
        400px width
        Doesn't overlay content
    end note

    note right of Sidebar
        Right panel, 30% width
        Pushes content left
        Resizable
    end note
```

## Conversation State Machine

```mermaid
stateDiagram-v2
    [*] --> NoConversations
    NoConversations --> OneConversation: Send First Message
    OneConversation --> MultipleConversations: Start New Chat
    MultipleConversations --> MultipleConversations: Switch Conversation
    MultipleConversations --> OneConversation: Delete (leaving 1)
    MultipleConversations --> NoConversations: Delete All

    OneConversation --> ViewingList: Click Back
    MultipleConversations --> ViewingList: Click Back

    note right of NoConversations
        Show empty state
        Prompt to start new chat
    end note

    note right of ViewingList
        Show all conversations
        New chat button
    end note
```

## Message Flow State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Typing: User Types
    Typing --> Sending: User Sends
    Sending --> Processing: Message Queued
    Processing --> Thinking: AI Processing
    Thinking --> Streaming: Response Ready
    Thinking --> Action: AI Action Proposed
    Streaming --> Idle: Complete
    Action --> Confirming: Awaits User
    Confirming --> Executing: User Confirms
    Confirming --> Idle: User Cancels
    Executing --> Idle: Action Complete
    Executing --> Error: Action Failed
    Error --> Idle: Error Shown

    note right of Thinking
        Show typing indicator
        3 dots animation
    end note

    note right of Action
        Show confirmation card
        Display action details
    end note

    note right of Streaming
        Show message character by character
        Typing effect
    end note
```

## Action Execution State Machine

```mermaid
stateDiagram-v2
    [*] --> ActionProposed
    ActionProposed --> AwaitingConfirmation
    AwaitingConfirmation --> Executing: User Confirms
    AwaitingConfirmation --> Cancelled: User Cancels

    Executing --> Navigation: Navigate Action
    Executing --> Filtering: Filter Action
    Executing --> Creating: Create Action
    Executing --> Highlighting: Highlight Action

    Navigation --> Success: Page Loaded
    Filtering --> Success: Filter Applied
    Creating --> Success: Record Created
    Highlighting --> Success: Highlight Shown

    Navigation --> Error: Navigation Failed
    Filtering --> Error: Filter Invalid
    Creating --> Error: Creation Failed
    Highlighting --> Error: Element Not Found

    Success --> [*]
    Error --> [*]
    Cancelled --> [*]

    note right of AwaitingConfirmation
        Show action details
        Confirm/Cancel buttons
        30 second timeout
    end note
```

## Page Context Flow

```mermaid
stateDiagram-v2
    [*] --> ContextCollection
    ContextCollection --> ContextAvailable: Page Loads
    ContextAvailable --> EnrichedQuery: User Message
    EnrichedQuery --> ActionSelected: AI Processing
    ActionSelected --> ContextUpdate: Action Executed
    ContextUpdate --> ContextAvailable: Page Updated

    note right of ContextCollection
        path: /admin/socios/personas
        entity: personas
        filters: { estado: 'activo' }
        userRole: admin
    end note

    note right of EnrichedQuery
        User: "Show me inactive ones"
        AI knows: current filter is 'activo'
        Action: Change filter to 'inactivo'
    end note
```

## Mobile Responsiveness State Machine

```mermaid
stateDiagram-v2
    [*] --> ScreenSizeCheck
    ScreenSizeCheck --> MobileMode: Width < 768px
    ScreenSizeCheck --> TabletMode: Width 768-1024px
    ScreenSizeCheck --> DesktopMode: Width > 1024px

    MobileMode --> FloatingOnly: Mode Forced
    TabletMode --> UserChoice: Mode Preference
    DesktopMode --> UserChoice: Mode Preference

    FloatingOnly --> [*]
    UserChoice --> FloatingMode: Floating Selected
    UserChoice --> SidebarMode: Sidebar Selected

    FloatingMode --> [*]
    SidebarMode --> [*]

    note right of MobileMode
        Full-screen chat
        No sidebar option
        Back button to close
    end note
```
