/**
 * Unit tests for empresas actions
 * Tests all CRUD operations for company management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearEmpresa,
  crearEmpresaFromCompanyFormValues,
  actualizarEmpresa,
  softDeleteEmpresa,
} from '@/app/actions/empresas'
import { generateTestEmpresaId, generateTestOrganizationId } from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Empresas Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearEmpresa', () => {
    it('should successfully create an empresa', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        bp_id: generateTestEmpresaId(),
        codigo_bp: 'BP-000001',
        message: 'Empresa creada exitosamente',
        warnings: null,
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, bp_id: generateTestEmpresaId(), codigo_bp: 'BP-000001', message: 'Empresa creada exitosamente', warnings: null },
        error: null,
      })

      const data = {
        p_organizacion_id: generateTestOrganizationId(),
        p_razon_social: 'Test Company',
        p_nit: '900123456-1',
        p_tipo_sociedad: 'SAS',
        p_email_principal: 'contact@testcompany.com',
        p_telefono_principal: '+57 1 123 4567',
      } as any

      const result = await crearEmpresa(data)

      expect(result.success).toBe(true)
      expect(result.bp_id).toBe(generateTestEmpresaId())
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle RPC errors', async () => {
      const mockSupabase = createMockClientWithRPC(null, { message: 'RPC error' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const data = {
        p_organizacion_id: generateTestOrganizationId(),
        p_razon_social: 'Test Company',
        p_nit: '900123456-1',
        p_tipo_sociedad: 'SAS',
      } as any

      const result = await crearEmpresa(data)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Error de sistema')
    })
  })

  describe('crearEmpresaFromCompanyFormValues', () => {
    it('should successfully create an empresa from form values', async () => {
      const mockSupabase = createMockClientWithData({ id: generateTestOrganizationId() }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.limit).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { id: generateTestOrganizationId() },
        error: null,
      })
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, bp_id: generateTestEmpresaId(), codigo_bp: 'BP-000001', message: 'Empresa creada exitosamente', warnings: null },
        error: null,
      })

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456-1',
        tipo_sociedad: 'SAS',
        email_principal: 'contact@testcompany.com',
        telefono_principal: '+57 1 123 4567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
    })
  })

  describe('actualizarEmpresa', () => {
    it('should successfully update an empresa', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestEmpresaId()
      const data = { razon_social: 'Updated Company' }

      const result = await actualizarEmpresa(id, data)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('empresas')
      expect(mockSupabase.update).toHaveBeenCalledWith(data)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id)
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should return error when update fails', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Update failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await actualizarEmpresa(generateTestEmpresaId(), { razon_social: 'Updated' })

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteEmpresa', () => {
    it('should successfully soft delete an empresa', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestEmpresaId()

      const result = await softDeleteEmpresa(id)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(mockSupabase.update).toHaveBeenCalledWith({ eliminado_en: expect.any(String) })
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should return error when delete fails', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Delete failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      })

      const result = await softDeleteEmpresa(generateTestEmpresaId())

      expect(result.success).toBe(false)
    })
  })
})
