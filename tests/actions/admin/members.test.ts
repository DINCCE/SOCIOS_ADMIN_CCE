/**
 * Unit tests for admin members actions
 * Tests all CRUD operations for member management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  addMember,
  updateMemberRole,
  removeMember,
  listMembers,
} from '@/app/actions/admin/members'
import { generateTestOrganizationId, generateTestPersonaId } from '../../helpers/test-data-factory'
import { createMockClientWithData } from '../../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Admin Members Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addMember', () => {
    it('should successfully add a member', async () => {
      const mockSupabase = createMockClientWithData({ id: 'member-123' }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const data = {
        organization_id: generateTestOrganizationId(),
        user_id: 'user-123',
        role_id: 'role-123',
      }

      const result = await addMember(data)

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Insert failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const result = await addMember({
        organization_id: generateTestOrganizationId(),
        user_id: 'user-123',
        role_id: 'role-123',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('updateMemberRole', () => {
    it('should successfully update member role', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await updateMemberRole('member-123', 'role-456')

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Update failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await updateMemberRole('member-123', 'role-456')

      expect(result.success).toBe(false)
    })
  })

  describe('removeMember', () => {
    it('should successfully remove a member', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.delete).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await removeMember('member-123')

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Delete failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.delete).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      })

      const result = await removeMember('member-123')

      expect(result.success).toBe(false)
    })
  })

  describe('listMembers', () => {
    it('should successfully list members', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'member-123', user_id: 'user-123', role_id: 'role-123' },
        { id: 'member-456', user_id: 'user-456', role_id: 'role-456' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'member-123', user_id: 'user-123', role_id: 'role-123' }],
        error: null,
      })

      const result = await listMembers(generateTestOrganizationId())

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Query failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await listMembers(generateTestOrganizationId())

      expect(result.success).toBe(false)
    })
  })
})
