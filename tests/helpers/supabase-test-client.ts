/**
 * Supabase test client utilities
 * Provides mock and test client helpers for testing server actions
 */

import { vi } from 'vitest'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a test Supabase client using test environment variables
 * This should only be used in integration tests that need real database access
 */
export async function createTestClient(): Promise<SupabaseClient> {
  return createSupabaseClient()
}

/**
 * Mock Supabase client for unit tests
 * Returns a mock object that can be configured for different test scenarios
 */
export function createMockSupabaseClient() {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
  }

  return mockClient
}

/**
 * Create a mock Supabase client with predefined responses
 */
export function createMockClientWithData(data: unknown, error: unknown = null) {
  const mockClient = createMockSupabaseClient()
  mockClient.single.mockResolvedValue({ data, error })
  return mockClient
}

/**
 * Create a mock Supabase client for RPC calls
 */
export function createMockClientWithRPC(rpcResponse: unknown, rpcError: unknown = null) {
  const mockClient = createMockSupabaseClient()
  mockClient.rpc.mockResolvedValue({ data: rpcResponse, error: rpcError })
  return mockClient
}
