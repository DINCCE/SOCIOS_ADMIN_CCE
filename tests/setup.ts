import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock revalidatePath from next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock createClient from lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.error in tests unless explicitly needed
  error: vi.fn(),
  warn: vi.fn(),
}
