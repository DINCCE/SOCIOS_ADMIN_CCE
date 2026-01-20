# Sidebar Layout Implementation

## Overview

This project uses shadcn/ui's Sidebar component with a custom flex-based layout implementation. The sidebar pushes content to the right using a flex container with a spacer element.

## Architecture

### Component Structure

```
SidebarProvider (flex container)
├── AppSidebar (outer spacer div)
│   └── Takes up physical space in flex layout
│   └── Contains fixed-position inner sidebar
└── SidebarInset
    └── flex-1 fills remaining space
    └── Contains header + page content
```

### Key Implementation Details

**File:** `app/admin/layout.tsx`

```tsx
<SidebarProvider>
  <AppSidebar
    user={userData}
    className="w-[21rem]"  // Custom width override
  />
  <SidebarInset>
    <header>...</header>
    <div>{children}</div>
  </SidebarInset>
</SidebarProvider>
```

**File:** `components/ui/sidebar.tsx`

The `Sidebar` component uses a two-layer approach:

1. **Outer spacer div** (lines 226-251):
   - Flex item with `shrink-0` and dynamic width
   - Uses inline styles to force collapsed width
   - Reserves space in the flex layout

2. **Inner fixed div** (lines 256-279):
   - `fixed` positioning for visual sidebar
   - Renders on top of the spacer
   - Contains actual sidebar content

### Width Calculation

| State | Width | Configuration |
|-------|-------|---------------|
| **Fixed** | 256px | `className="w-[16rem]"` (16rem = 256px) |

> [!IMPORTANT]
> The sidebar is configured as **non-collapsible** (`collapsible="none"`), maintaining a constant width of 16rem.

## Customization Guide

### Changing Sidebar Width

**Step 1:** Update the width in your layout:

```tsx
// app/admin/layout.tsx
<AppSidebar className="w-[YOUR_WIDTH]" />
```

**Step 2:** No other changes needed! The flex layout automatically adjusts.

### Supported Widths

| Width | rem | px | Use Case |
|-------|-----|----|----------|
| Narrow | 16rem | 256px | **Current project setting** - Compact, modern |
| Medium | 21rem | 336px | More spacious navigation |
| Wide | 24rem | 384px | Maximum information density |

### Variant Behavior

| Variant | Width | Collapsible | Style |
|---------|-------|-------------|-------|
| `inset` | 16rem (256px) | **none** (fixed) | **Current project setting** - Rounded, padded, shadow |

> [!NOTE]
> The sidebar is configured as **fixed** (non-collapsible) to ensure consistent layout and avoid content resizing issues.

## Troubleshooting

### Content Overlaps Sidebar

**Problem:** Content renders underneath the sidebar.

**Solution:** Ensure the outer spacer div has width applied. Check DevTools:
1. Select the outer div with `data-state="expanded"`
2. Verify computed width is > 0px
3. Check that `md:block` class is applied (screen > 768px)

### Collapsed Width Wrong

**Problem:** Content overlaps or sidebar too narrow when collapsed.

**Solution:** Adjust the inline style calculation in `components/ui/sidebar.tsx` (line 232):

```tsx
? { width: variant === "floating" || variant === "inset"
    ? "calc(3rem + 1rem)"  // Increase this if needed
    : "3rem"
  }
```

**Width breakdown:**
- `3rem` = base icon width (48px)
- `1rem` = padding for `inset` variant
- Increase to `1.25rem` or `1.5rem` if content still overlaps

### CSS Variable Override Not Working

**Problem:** Setting `--sidebar-width` in style prop doesn't work.

**Solution:** Use `className` instead of inline styles:

```tsx
// ❌ Doesn't work with Tailwind v4
<Sidebar style={{ '--sidebar-width': '21rem' }} />

// ✅ Works
<Sidebar className="w-[21rem]" />
```

### Transition Animation Choppy

**Problem:** Sidebar expansion feels jerky.

**Solution:** Ensure `transition-[width]` class is present (line 240):
```tsx
"transition-[width] duration-200 ease-linear"
```

## Technical Notes

### Why Inline Styles for Collapsed State?

The collapsed width uses inline styles (line 229-237) to override any custom `className`:

```tsx
style={{
  ...style,
  ...(state === "collapsed" && collapsible === "icon"
    ? { width: "calc(3rem + 1rem)" }  // Inline style wins
    : {}
  )
}}
```

This ensures that even when users pass `className="w-[21rem]"`, the collapsed state always uses the correct narrow width.

### Mobile Behavior

On mobile (`< 768px`):
- Sidebar is hidden (`hidden` class)
- Replaced by Sheet (drawer) component
- Content takes full width

### Data Attributes for Debugging

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `data-state` | `expanded` / `collapsed` | Current sidebar state |
| `data-collapsible` | `icon` / `offcanvas` / `""` | Collapsible mode |
| `data-variant` | `sidebar` / `inset` / `floating` | Visual variant |
| `data-side` | `left` / `right` | Sidebar position |

Use these in DevTools to inspect current state:
```javascript
document.querySelector('[data-state="collapsed"]')
```

## Related Files

- **Component:** `components/ui/sidebar.tsx`
- **Usage:** `app/admin/layout.tsx`
- **Sidebar Content:** `components/app-sidebar.tsx`
- **CSS Variables:** `app/globals.css` (lines 62-63)

## Migration Notes

If migrating from default shadcn sidebar:

1. ✅ Already uses `SidebarProvider` and `SidebarInset`
2. ✅ `AppSidebar` passes custom width via `className`
3. ✅ Inline styles force collapsed width correctly
4. ⚠️ Custom widths require `inset` collapsed width adjustment
5. ⚠️ Mobile behavior uses Sheet (no changes needed)

## Future Improvements

- [ ] Consider CSS Container Queries for responsive widths
- [ ] Add persistent width preference to localStorage
- [ ] Support per-route sidebar configurations
- [ ] Add keyboard shortcut for width cycling

---

**Last Updated:** 2025-01-06
**Component Version:** shadcn/ui Sidebar (latest)
**Status:** ✅ Production Ready
