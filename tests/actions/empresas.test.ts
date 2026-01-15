/**
 * Unit tests for empresas actions
 * Tests all CRUD operations for company management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient, getActiveOrganizationId } from '@/lib/supabase/server'
import {
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

  describe('crearEmpresaFromCompanyFormValues', () => {
    it('should successfully create an empresa from form values', async () => {
      const orgId = generateTestOrganizationId()
      const mockSupabase = createMockClientWithData({ id: orgId }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(getActiveOrganizationId).mockResolvedValue(orgId)

      // Mock RPC checks for document, email, phone uniqueness
      vi.mocked(mockSupabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'dm_actores_documento_existe') {
          return Promise.resolve({ data: [{ doc_exists: false }], error: null })
        }
        if (fn === 'dm_actores_email_existe') {
          return Promise.resolve({ data: [{ email_exists: false }], error: null })
        }
        if (fn === 'dm_actores_telefono_existe') {
          return Promise.resolve({ data: [{ phone_exists: false }], error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // Mock insert
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: {
          id: generateTestEmpresaId(),
          codigo_bp: 'BP-000001',
        },
        error: null,
      })

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456',
        tipo_sociedad: 'SAS',
        email_principal: 'contact@testcompany.com',
        telefono_principal: '+573001234567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(true)
      expect(result.bp_id).toBeDefined()
      expect(mockSupabase.from).toHaveBeenCalledWith('dm_actores')
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should return error when organization is not found', async () => {
      vi.mocked(getActiveOrganizationId).mockResolvedValue(null)

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456',
        tipo_sociedad: 'SAS',
        email_principal: 'contact@testcompany.com',
        telefono_principal: '+573001234567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('No se encontró una organización activa')
    })

    it('should return error when NIT already exists', async () => {
      const orgId = generateTestOrganizationId()
      vi.mocked(getActiveOrganizationId).mockResolvedValue(orgId)
      vi.mocked(createClient).mockResolvedValue(createMockClientWithData({ id: orgId }, null) as any)

      const mockSupabase = createMockClientWithData({ id: orgId }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      // Mock NIT already exists
      vi.mocked(mockSupabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'dm_actores_documento_existe') {
          return Promise.resolve({
            data: [{ doc_exists: true, codigo_bp: 'BP-EXIST001', nombre_completo: 'Existing Company' }],
            error: null,
          })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456',
        tipo_sociedad: 'SAS',
        email_principal: 'contact@testcompany.com',
        telefono_principal: '+573001234567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('NIT ya registrado')
    })

    it('should return error when email already exists', async () => {
      const orgId = generateTestOrganizationId()
      vi.mocked(getActiveOrganizationId).mockResolvedValue(orgId)

      const mockSupabase = createMockClientWithData({ id: orgId }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      // Mock email already exists
      vi.mocked(mockSupabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'dm_actores_documento_existe') {
          return Promise.resolve({ data: [{ doc_exists: false }], error: null })
        }
        if (fn === 'dm_actores_email_existe') {
          return Promise.resolve({
            data: [{ email_exists: true, codigo_bp: 'BP-EXIST002', nombre_completo: 'Other Company' }],
            error: null,
          })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456',
        tipo_sociedad: 'SAS',
        email_principal: 'existing@testcompany.com',
        telefono_principal: '+573001234567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Email ya registrado')
    })

    it('should return error when phone already exists', async () => {
      const orgId = generateTestOrganizationId()
      vi.mocked(getActiveOrganizationId).mockResolvedValue(orgId)

      const mockSupabase = createMockClientWithData({ id: orgId }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      // Mock phone already exists
      vi.mocked(mockSupabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'dm_actores_documento_existe') {
          return Promise.resolve({ data: [{ doc_exists: false }], error: null })
        }
        if (fn === 'dm_actores_email_existe') {
          return Promise.resolve({ data: [{ email_exists: false }], error: null })
        }
        if (fn === 'dm_actores_telefono_existe') {
          return Promise.resolve({
            data: [{ phone_exists: true, codigo_bp: 'BP-EXIST003', nombre_completo: 'Another Company' }],
            error: null,
          })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456',
        tipo_sociedad: 'SAS',
        email_principal: 'contact@testcompany.com',
        telefono_principal: '+573001234567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Teléfono ya registrado')
    })

    it('should handle database insert errors', async () => {
      const orgId = generateTestOrganizationId()
      vi.mocked(getActiveOrganizationId).mockResolvedValue(orgId)

      const mockSupabase = createMockClientWithData({ id: orgId }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      // Mock all RPC checks pass
      vi.mocked(mockSupabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'dm_actores_documento_existe') {
          return Promise.resolve({ data: [{ doc_exists: false }], error: null })
        }
        if (fn === 'dm_actores_email_existe') {
          return Promise.resolve({ data: [{ email_exists: false }], error: null })
        }
        if (fn === 'dm_actores_telefono_existe') {
          return Promise.resolve({ data: [{ phone_exists: false }], error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      // Mock insert error
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' },
      })

      const formData = {
        razon_social: 'Test Company',
        nit: '900123456',
        tipo_sociedad: 'SAS',
        email_principal: 'contact@testcompany.com',
        telefono_principal: '+573001234567',
        estado: 'activo' as const,
      }

      const result = await crearEmpresaFromCompanyFormValues(formData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al crear la empresa')
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
      expect(mockSupabase.from).toHaveBeenCalledWith('dm_actores')
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
      expect(mockSupabase.from).toHaveBeenCalledWith('dm_actores')
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
