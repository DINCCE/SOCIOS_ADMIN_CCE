/**
 * Unit tests for admin organizations actions
 * Tests all CRUD operations for organization management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createOrganization,
  updateOrganization,
  softDeleteOrganization,
  listOrganizations,
} from '@/app/actions/admin/organizations'
import { generateTestOrganizationId } from '../../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Admin Organizations Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createOrganization', () => {
    it('should successfully create an organization', async () => {
      const mockSupabase = createMockClientWithData({ id: 'org-123' }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { id: 'org-123' },
        error: null,
      })

      const data = {
        nombre: 'Test Organization',
        nit: '900123456-1',
        direccion: 'Calle 123',
        ciudad: 'Bogotá',
        pais: 'Colombia',
      }

      const result = await createOrganization(data)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Insert failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const result = await createOrganization({
        nombre: 'Test Organization',
        nit: '900123456-1',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('updateOrganization', () => {
    it('should successfully update an organization', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await updateOrganization('org-123', { nombre: 'Updated Name' })

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

      const result = await updateOrganization('org-123', { nombre: 'Updated Name' })

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteOrganization', () => {
    it('should successfully soft delete an organization', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await softDeleteOrganization('org-123')

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({ eliminado_en: expect.any(String) })
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Delete failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      })

      const result = await softDeleteOrganization('org-123')

      expect(result.success).toBe(false)
    })
  })

  describe('listOrganizations', () => {
    it('should successfully list organizations', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'org-123', nombre: 'Org 1' },
        { id: 'org-456', nombre: 'Org 2' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'org-123', nombre: 'Org 1' }, { id: 'org-456', nombre: 'Org 2' }],
        error: null,
      })

      const result = await listOrganizations()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Query failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await listOrganizations()

      expect(result.success).toBe(false)
    })
  })
})
