# Testing Guide

## Overview

Uses **Vitest v4** with React Testing Library.

**Current Status:** Infrastructure configured, minimal test coverage. Contributions welcome!

## Running Tests

```bash
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
npm run test tests/example.test.ts  # Specific file
```

## Test Structure

```
tests/
├── setup.test.ts         # Vitest validation
└── (future tests here)
```

## Writing Tests

### Utility Function Test

`tests/utils.test.ts`:

```typescript
import { expect, test, describe } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn() utility', () => {
  test('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })
})
```

### Component Test

`tests/components/button.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { expect, test, describe } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  test('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## Configuration

`vitest.config.mts`:

- Path aliases: `@/` → project root
- Environment: `jsdom`
- Globals: `true`

## Best Practices

1. Test behavior, not implementation
2. Use descriptive test names
3. Arrange-Act-Assert pattern
4. Mock external dependencies
5. Keep tests isolated

## What to Test

**Priority 1:**

- Utility functions
- Zod schemas
- Custom hooks
- Critical user flows

**Don't Test:**

- Third-party libraries
- Framework behavior

## Mocking

### Supabase Client

```typescript
import { vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  }),
}))
```

## CI/CD

Tests commented out in `.github/workflows/ci.yml`. To enable:

1. Uncomment test step
2. Ensure all tests pass locally

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
