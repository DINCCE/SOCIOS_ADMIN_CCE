/**
 * Unit tests for relaciones actions
 * Tests all CRUD operations for relationship management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearRelacionFromForm,
  actualizarRelacion,
  finalizarRelacion,
  eliminarRelacion,
  obtenerRelaciones,
} from '@/app/actions/relaciones'
import { generateTestPersonaId, generateTestEmpresaId } from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Relaciones Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearRelacionFromForm', () => {
    it('should successfully create a relationship', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        relacion_id: 'rel-123',
        message: 'Relación creada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, relacion_id: 'rel-123', message: 'Relación creada exitosamente' },
        error: null,
      })

      const formData = {
        bp_origen_id: generateTestPersonaId(),
        bp_destino_id: generateTestEmpresaId(),
        tipo_relacion: 'laboral' as const,
        fecha_inicio: '2020-01-01',
      }

      const result = await crearRelacionFromForm(formData)

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

      const formData = {
        bp_origen_id: generateTestPersonaId(),
        bp_destino_id: generateTestEmpresaId(),
        tipo_relacion: 'laboral' as const,
        fecha_inicio: '2020-01-01',
      }

      const result = await crearRelacionFromForm(formData)

      expect(result.success).toBe(false)
    })
  })

  describe('actualizarRelacion', () => {
    it('should successfully update a relationship', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Relación actualizada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Relación actualizada exitosamente' },
        error: null,
      })

      const result = await actualizarRelacion('rel-123', {
        tipo_relacion: 'laboral' as const,
        descripcion: 'Updated description',
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

      const result = await actualizarRelacion('rel-123', {
        tipo_relacion: 'laboral' as const,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('finalizarRelacion', () => {
    it('should successfully end a relationship', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Relación finalizada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Relación finalizada exitosamente' },
        error: null,
      })

      const result = await finalizarRelacion('rel-123', '2024-01-01')

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

      const result = await finalizarRelacion('rel-123', '2024-01-01')

      expect(result.success).toBe(false)
    })
  })

  describe('eliminarRelacion', () => {
    it('should successfully delete a relationship', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Relación eliminada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Relación eliminada exitosamente' },
        error: null,
      })

      const result = await eliminarRelacion('rel-123')

      expect(result.success).toBe(true)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'Delete failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      })

      const result = await eliminarRelacion('rel-123')

      expect(result.success).toBe(false)
    })
  })

  describe('obtenerRelaciones', () => {
    it('should successfully get relationships', async () => {
      const mockSupabase = createMockClientWithRPC([
        { id: 'rel-123', tipo_relacion: 'EMPLEADO' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [{ id: 'rel-123', tipo_relacion: 'EMPLEADO' }],
        error: null,
      })

      const result = await obtenerRelaciones(generateTestPersonaId())

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'Query failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      })

      const result = await obtenerRelaciones(generateTestPersonaId())

      expect(result.success).toBe(false)
    })
  })
})
