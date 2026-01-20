# Shell Layout System

> **Responsive Architecture** - The application uses a robust flex-based layout system designed to handle full-viewport applications with proper scrolling behavior across all device sizes.

---

## Overview

The Shell Layout system handles the main application framing, ensuring:
1. **Full Viewport Usage** - The app occupies the full screen height/width.
2. **Proper Scrolling** - Scrolling is handled intelligently (horizontal for tables, vertical for content).
3. **Responsive Design** - Adapts nicely to mobile, tablet, and desktop.
4. **Sticky Navigation** - Headers and toolbars remain accessible.

---

## Core Components

### 1. Root Layout (`app/layout.tsx`)

The root layout sets the foundation for the entire application.

```tsx
// Correct configuration for responsiveness
<html className="h-full w-full bg-background">
  <body className="antialiased h-full w-full">
    <div className="flex h-full w-full flex-col">
      {children}
    </div>
  </body>
</html>
```

**Key Principles:**
- **No `overflow-hidden` on Root**: We avoid `overflow-hidden` on `html/body` to prevent locking the viewport on mobile devices.
- **`h-full w-full`**: We use `full` instead of `screen` to respect browser chrome (URL bars, safe areas).

### 2. PageShell (`components/shell/page-shell.tsx`)

The top-level container for any page in the admin dashboard.

```tsx
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-auto bg-background">
      {children}
    </div>
  )
}
```

- **`h-screen`**: Ensures the page takes the full available height.
- **`overflow-auto`**: Provides a safety valve. If the page structure breaks or content forces a scroll at this level, the user can still access it.
- **Flex Column**: Stacks Header, Toolbar, and Content vertically.

### 3. PageContent (`components/shell/page-content.tsx`)

The main workspace area where page-specific content lives.

```tsx
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className="flex-1 min-w-0 overflow-auto px-8 pb-8 pt-0">
      {children}
    </div>
  )
}
```

- **`flex-1`**: Takes up all remaining vertical space after Header/Toolbar.
- **`min-w-0`**: Critical for flexbox text truncation and responsive tables. Prevents the container from being forced wider than its parent.
- **`overflow-auto`**: Enables **both** vertical and horizontal scrolling. This is essential for:
  - Wide data tables (horizontal scroll)
  - Long forms (vertical scroll)

---

## Responsive Patterns

### Handling Wide Tables

When using DataTables that may be wider than the viewport (e.g. on mobile/tablet):

1. **Wrapper**: The table should be wrapped in `PageContent`.
2. **Behavior**: `PageContent` provides the scroll container.
3. **Table Config**: Ensure tables use `min-w-max` to declare their true width.

```tsx
// Inside your page client component
<PageShell>
  <PageHeader ... />
  <PageToolbar ... />
  
  <PageContent>
    {/* PageContent handles the overflow automatically */}
    <div className="rounded-md border">
      <DataTable ... />
    </div>
  </PageContent>
</PageShell>
```

### Mobile Considerations

- **Sidebar**: Uses a drawer/sheet pattern on mobile (controlled by `AppSidebar`).
- **Hidden Elements**: Use utility classes (e.g., `hidden md:flex`) to simplify toolbars on small screens.
- **Cards vs Tables**: For complex entities, consider switching to a Card view on mobile `< 768px` using `useIsMobile()` hook.

---

## Best Practices

| Rule | description |
|------|-------------|
| **Do NOT use `overflow-hidden`** | Avoid using `overflow-hidden` on main layout containers unless you explicitly handle inner scrolling. It effectively "eats" content on small screens. |
| **Do NOT use `w-screen`** | Use `w-full` instead. `w-screen` ignores scrollbars width and can cause unwanted horizontal scrollbars. |
| **Always use PageContent** | Never put main content directly in `PageShell`. Always wrap it in `PageContent` to ensure proper padding and scrolling. |
