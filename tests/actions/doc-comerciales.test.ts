/**
 * Unit tests for documentos comerciales actions
 * Tests all CRUD operations for commercial document management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearDocComercial,
  actualizarDocComercial,
  softDeleteDocComercial,
  listDocComerciales,
} from '@/app/actions/doc-comerciales'
import { generateTestOrganizationId } from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('DocComerciales Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearDocComercial', () => {
    it('should successfully create a doc comercial', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        doc_comercial_id: 'doc-123',
        message: 'Documento comercial creado exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { id: 'doc-123' },
        error: null,
      })

      const data = {
        organizacion_id: generateTestOrganizationId(),
        codigo: 'OPP-000001',
        tipo: 'Solicitud Retiro' as const,
        solicitante_id: 'bp-123',
        monto_estimado: 1000000,
      }

      const result = await crearDocComercial(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.doc_comercial_id).toBe('doc-123')
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

      const result = await crearDocComercial({
        organizacion_id: generateTestOrganizationId(),
        codigo: 'OPP-000001',
        tipo: 'Solicitud Retiro' as const,
        solicitante_id: 'bp-123',
        monto_estimado: 1000000,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('actualizarDocComercial', () => {
    it('should successfully update a doc comercial', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await actualizarDocComercial('doc-123', {
        estado: 'En Progreso',
        responsable_id: 'user-123',
        monto_estimado: 2000000,
        notas: 'Updated notes',
      })

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

      const result = await actualizarDocComercial('doc-123', {
        estado: 'En Progreso',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteDocComercial', () => {
    it('should successfully soft delete a doc comercial', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await softDeleteDocComercial('opp-123')

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

      const result = await softDeleteDocComercial('opp-123')

      expect(result.success).toBe(false)
    })
  })

  describe('listDocComerciales', () => {
    it('should successfully list documentos comerciales', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'doc-123', titulo: 'Test Document' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.is).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'doc-123', titulo: 'Test Document' }],
        error: null,
      })

      const result = await listDocComerciales(generateTestOrganizationId())

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

      const result = await listDocComerciales(generateTestOrganizationId())

      expect(result.success).toBe(false)
    })
  })
})
