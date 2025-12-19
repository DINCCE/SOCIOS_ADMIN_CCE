# React 19 Migration Guide

This boilerplate uses **React 19.2.3**, which includes significant new features and breaking changes from React 18.

## What's New in React 19

### 1. Actions & useTransition Improvements

- Server Actions are now stable
- Automatic form state management
- Better error boundaries

### 2. New Hooks

**`use()` hook** - Read resources in render:

```typescript
import { use } from 'react'

function Component({ userPromise }) {
  const user = use(userPromise) // Suspends until resolved
  return <div>{user.name}</div>
}
```

**`useOptimistic()` hook** - Already leveraged in this boilerplate via TanStack Query patterns.

### 3. ref as Prop

No more `forwardRef` needed:

```typescript
// React 19
function Input({ ref }) {
  return <input ref={ref} />
}

// React 18 (old way)
const Input = forwardRef((props, ref) => {
  return <input ref={ref} />
})
```

### 4. Context Simplification

```typescript
// React 19 - simpler
import { createContext } from 'react'

const ThemeContext = createContext('light')

function App() {
  return (
    <ThemeContext value="dark">
      <Page />
    </ThemeContext>
  )
}
```

## Breaking Changes from React 18

### 1. Ref Cleanup Required

If you have `forwardRef`, update to use `ref` prop directly.

### 2. Context Provider Changes

Old `<Context.Provider>` still works but `<Context>` is now preferred.

### 3. StrictMode Changes

Double rendering in dev mode has changed behavior - more aggressive checks.

## Compatibility in This Boilerplate

All dependencies are React 19 compatible:

- ✅ Next.js 16.0.10
- ✅ TanStack Query 5.90.12
- ✅ React Hook Form 7.68.0
- ✅ Zod 4.1.13
- ✅ shadcn/ui components

## Migration Notes

If upgrading from React 18 boilerplate:

1. Remove all `forwardRef` wrappers
2. Update Context usage to new syntax
3. Test Server Actions thoroughly
4. Review Suspense boundaries

## Resources

- [Official React 19 Blog Post](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js 16 + React 19 Compatibility](https://nextjs.org/docs)
