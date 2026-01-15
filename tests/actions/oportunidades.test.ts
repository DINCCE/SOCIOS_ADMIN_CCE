/**
 * Unit tests for oportunidades actions
 * Tests all CRUD operations for opportunity management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearOportunidad,
  actualizarOportunidad,
  softDeleteOportunidad,
  listOportunidades,
} from '@/app/actions/oportunidades'
import { generateTestOrganizationId } from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Oportunidades Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearOportunidad', () => {
    it('should successfully create an oportunidad', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        oportunidad_id: 'opp-123',
        message: 'Oportunidad creada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, oportunidad_id: 'opp-123', message: 'Oportunidad creada exitosamente' },
        error: null,
      })

      const data = {
        organizacion_id: generateTestOrganizationId(),
        codigo: 'OPP-000001',
        tipo: 'Solicitud Retiro' as const,
        solicitante_id: 'bp-123',
        monto_estimado: 1000000,
      }

      const result = await crearOportunidad(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.oportunidad_id).toBe('opp-123')
      }
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'RPC error' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const result = await crearOportunidad({
        organizacion_id: generateTestOrganizationId(),
        codigo: 'OPP-000001',
        tipo: 'Solicitud Retiro' as const,
        solicitante_id: 'bp-123',
        monto_estimado: 1000000,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('actualizarOportunidad', () => {
    it('should successfully update an oportunidad', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Oportunidad actualizada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Oportunidad actualizada exitosamente' },
        error: null,
      })

      const result = await actualizarOportunidad('opp-123', {
        estado: 'En Progreso',
        responsable_id: 'user-123',
        monto_estimado: 2000000,
        notas: 'Updated notes',
      })

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'Update failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await actualizarOportunidad('opp-123', {
        estado: 'En Progreso',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteOportunidad', () => {
    it('should successfully soft delete an oportunidad', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await softDeleteOportunidad('opp-123')

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

      const result = await softDeleteOportunidad('opp-123')

      expect(result.success).toBe(false)
    })
  })

  describe('listOportunidades', () => {
    it('should successfully list oportunidades', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'opp-123', titulo: 'Test Opportunity' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.is).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'opp-123', titulo: 'Test Opportunity' }],
        error: null,
      })

      const result = await listOportunidades(generateTestOrganizationId())

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Query failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.is).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await listOportunidades(generateTestOrganizationId())

      expect(result.success).toBe(false)
    })
  })
})
