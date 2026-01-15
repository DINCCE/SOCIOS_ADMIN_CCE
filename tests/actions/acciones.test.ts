/**
 * Unit tests for acciones actions
 * Tests all CRUD operations for club shares management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearAccion,
  actualizarAccion,
  softDeleteAccion,
  listAcciones,
  crearAsignacion,
  transferirAccion,
  finalizarAsignacion,
  listAsignaciones,
  softDeleteAsignacion,
} from '@/app/actions/acciones'
import { generateTestOrganizationId } from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Acciones Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearAccion', () => {
    it('should successfully create an accion', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        accion_id: 'acc-123',
        codigo_accion: 'ACC-000001',
        message: 'Acción creada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, accion_id: 'acc-123', codigo_accion: 'ACC-000001', message: 'Acción creada exitosamente' },
        error: null,
      })

      const data = {
        organizacion_id: generateTestOrganizationId(),
        codigo_accion: 'ACC-000001',
        estado: 'disponible',
      }

      const result = await crearAccion(data)

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'RPC error' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const result = await crearAccion({
        organizacion_id: generateTestOrganizationId(),
        codigo_accion: 'ACC-000001',
        estado: 'disponible',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('actualizarAccion', () => {
    it('should successfully update an accion', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Acción actualizada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Acción actualizada exitosamente' },
        error: null,
      })

      const result = await actualizarAccion('acc-123', { estado: 'asignada' })

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

      const result = await actualizarAccion('acc-123', { estado: 'asignada' })

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteAccion', () => {
    it('should successfully soft delete an accion', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await softDeleteAccion('acc-123')

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

      const result = await softDeleteAccion('acc-123')

      expect(result.success).toBe(false)
    })
  })

  describe('listAcciones', () => {
    it('should successfully list acciones', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'acc-123', codigo_accion: 'ACC-000001' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.is).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'acc-123', codigo_accion: 'ACC-000001' }],
        error: null,
      })

      const result = await listAcciones(generateTestOrganizationId())

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

      const result = await listAcciones(generateTestOrganizationId())

      expect(result.success).toBe(false)
    })
  })

  describe('crearAsignacion', () => {
    it('should successfully create an asignacion', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        asignacion_id: 'asig-123',
        message: 'Asignación creada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, asignacion_id: 'asig-123', message: 'Asignación creada exitosamente' },
        error: null,
      })

      const data = {
        accion_id: 'acc-123',
        persona_id: 'bp-123',
        tipo_asignacion: 'dueño' as const,
        fecha_inicio: '2020-01-01',
      }

      const result = await crearAsignacion(data)

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'RPC error' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const result = await crearAsignacion({
        accion_id: 'acc-123',
        persona_id: 'bp-123',
        tipo_asignacion: 'dueño' as const,
        fecha_inicio: '2020-01-01',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('transferirAccion', () => {
    it('should successfully transfer an accion', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Acción transferida exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Acción transferida exitosamente' },
        error: null,
      })

      const result = await transferirAccion({
        accion_id: 'asig-123',
        nuevo_dueno_id: 'bp-456',
      })

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'Transfer failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Transfer failed' },
      })

      const result = await transferirAccion({
        accion_id: 'asig-123',
        nuevo_dueno_id: 'bp-456',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('finalizarAsignacion', () => {
    it('should successfully end an asignacion', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Asignación finalizada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Asignación finalizada exitosamente' },
        error: null,
      })

      const result = await finalizarAsignacion('asig-123')

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'End failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'End failed' },
      })

      const result = await finalizarAsignacion('asig-123', '2024-01-01')

      expect(result.success).toBe(false)
    })
  })

  describe('listAsignaciones', () => {
    it('should successfully list asignaciones', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'asig-123', accion_id: 'acc-123' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.is).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'asig-123', accion_id: 'acc-123' }],
        error: null,
      })

      const result = await listAsignaciones('acc-123')

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

      const result = await listAsignaciones('acc-123')

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteAsignacion', () => {
    it('should successfully soft delete an asignacion', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await softDeleteAsignacion('asig-123')

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

      const result = await softDeleteAsignacion('asig-123')

      expect(result.success).toBe(false)
    })
  })
})
