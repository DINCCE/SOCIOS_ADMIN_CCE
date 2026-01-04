/**
 * Unit tests for personas actions
 * Tests all CRUD operations for person management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearPersonaFromPersonFormValues,
  crearPersonaFromForm,
  actualizarPersona,
  updatePersonaIdentity,
  updatePersonaProfile,
  updatePersonaSecurity,
  softDeletePersona,
} from '@/app/actions/personas'
import {
  createTestPersonFormValues,
  createTestOrganization,
  createTestPersonaRPCResponse,
  generateTestPersonaId,
  generateTestOrganizationId,
} from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

// Mock dependencies
vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Personas Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearPersonaFromPersonFormValues', () => {
    it('should successfully create a persona from form values', async () => {
      // Arrange
      const mockSupabase = createMockClientWithRPC(
        createTestPersonaRPCResponse(),
        null
      )
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.limit).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: createTestOrganization(),
        error: null,
      })
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: createTestPersonaRPCResponse(),
        error: null,
      })

      const formData = createTestPersonFormValues()

      // Act
      const result = await crearPersonaFromPersonFormValues(formData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.bp_id).toBe(generateTestPersonaId())
      expect(result.codigo_bp).toBe('BP-000001')
      expect(result.message).toBe('Persona creada exitosamente')
      expect(createClient).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('crear_persona', expect.any(Object))
    })

    it('should return error when organization is not found', async () => {
      // Arrange
      const mockSupabase = createMockClientWithRPC(null, {
        message: 'No organization found',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.limit).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: 'No organization found' },
      })

      const formData = createTestPersonFormValues()

      // Act
      const result = await crearPersonaFromPersonFormValues(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('No se encontró una organización activa')
      expect(result.bp_id).toBe(null)
      expect(result.codigo_bp).toBe(null)
    })

    it('should return error when RPC call fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithRPC(null, {
        message: 'RPC error',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.limit).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: createTestOrganization(),
        error: null,
      })
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const formData = createTestPersonFormValues()

      // Act
      const result = await crearPersonaFromPersonFormValues(formData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error de sistema')
    })
  })

  describe('crearPersonaFromForm', () => {
    it('should successfully create a persona', async () => {
      // Arrange
      const mockSupabase = createMockClientWithRPC(
        createTestPersonaRPCResponse(),
        null
      )
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: createTestPersonaRPCResponse(),
        error: null,
      })

      const data = {
        organizacionId: generateTestOrganizationId(),
        primerNombre: 'Juan',
        segundoNombre: 'Carlos',
        primerApellido: 'Pérez',
        segundoApellido: 'García',
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        emailPrincipal: 'juan.perez@example.com',
        telefonoPrincipal: '+57 300 123 4567',
        genero: 'masculino',
        fechaNacimiento: '1990-01-15',
        estadoCivil: 'soltero',
        nacionalidad: 'CO',
        lugarNacimiento: 'Bogotá',
        ocupacion: 'Ingeniero',
        profesion: 'Ingeniero de Sistemas',
        nivelEducacion: 'pregrado',
        tipoSangre: 'O+',
        eps: 'EPS Sura',
        fechaSocio: '2020-01-01',
        fechaAniversario: '2020-01-15',
        estadoVital: 'vivo',
        tags: ['VIP', 'ACTIVO'],
        emailSecundario: 'juan.perez2@example.com',
        telefonoSecundario: '+57 310 987 6543',
        whatsapp: '+57 300 123 4567',
        linkedinUrl: 'https://linkedin.com/in/juanperez',
        facebookUrl: 'https://facebook.com/juanperez',
        instagramHandle: '@juanperez',
        twitterHandle: '@juanperez',
        contactoEmergenciaId: undefined,
        relacionEmergencia: undefined,
      }

      // Act
      const result = await crearPersonaFromForm(data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.bp_id).toBe(generateTestPersonaId())
      expect(result.codigo_bp).toBe('BP-000001')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/socios/personas')
    })

    it('should handle RPC errors correctly', async () => {
      // Arrange
      const mockSupabase = createMockClientWithRPC(null, {
        message: 'Database error',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const data = {
        organizacionId: generateTestOrganizationId(),
        primerNombre: 'Juan',
        primerApellido: 'Pérez',
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        genero: 'masculino',
        fechaNacimiento: undefined,
        emailPrincipal: undefined,
        telefonoPrincipal: undefined,
      }

      // Act
      const result = await crearPersonaFromForm(data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error de sistema')
    })
  })

  describe('actualizarPersona', () => {
    it('should successfully update a persona', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestPersonaId()
      const data = { primer_nombre: 'Carlos' }

      // Act
      const result = await actualizarPersona(id, data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Persona actualizada correctamente')
      expect(mockSupabase.from).toHaveBeenCalledWith('personas')
      expect(mockSupabase.update).toHaveBeenCalledWith(data)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id)
      expect(revalidatePath).toHaveBeenCalledWith('/admin/socios/personas')
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/socios/personas/${id}`)
    })

    it('should return error when update fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'Update failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const id = generateTestPersonaId()
      const data = { primer_nombre: 'Carlos' }

      // Act
      const result = await actualizarPersona(id, data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al actualizar')
    })
  })

  describe('updatePersonaIdentity', () => {
    it('should successfully update persona identity data', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestPersonaId()
      const data = {
        tipo_documento: 'CC',
        numero_documento: '9876543210',
        fecha_expedicion: '2010-01-01',
        lugar_expedicion: 'Bogotá',
        lugar_expedicion_id: null,
        primer_nombre: 'Carlos',
        segundo_nombre: 'Alberto',
        primer_apellido: 'Gómez',
        segundo_apellido: 'Martínez',
        genero: 'masculino',
        fecha_nacimiento: '1992-05-20',
        lugar_nacimiento: 'Medellín',
        lugar_nacimiento_id: null,
        nacionalidad: 'CO',
        estado_civil: 'casado',
      }

      // Act
      const result = await updatePersonaIdentity(id, data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Datos de identidad actualizados correctamente')
      expect(mockSupabase.from).toHaveBeenCalledWith('personas')
      expect(mockSupabase.update).toHaveBeenCalledWith(data)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id)
      expect(revalidatePath).toHaveBeenCalledWith('/admin/socios/personas')
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/socios/personas/${id}`)
    })

    it('should return error when identity update fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'Identity update failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Identity update failed' },
      })

      const id = generateTestPersonaId()
      const data = {
        tipo_documento: 'CC',
        numero_documento: '9876543210',
        primer_nombre: 'Carlos',
        primer_apellido: 'Gómez',
        genero: 'masculino',
        fecha_nacimiento: '1992-05-20',
      }

      // Act
      const result = await updatePersonaIdentity(id, data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al actualizar datos de identidad')
    })
  })

  describe('updatePersonaProfile', () => {
    it('should successfully update persona profile data', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestPersonaId()
      const data = {
        estado: 'activo',
        fecha_socio: '2020-01-01',
        fecha_aniversario: '2020-01-15',
        nivel_educacion: 'pregrado',
        profesion: 'Ingeniero de Sistemas',
        sector_industria: 'Tecnología',
        empresa_actual: 'Tech Corp',
        cargo_actual: 'Senior Developer',
        linkedin_url: 'https://linkedin.com/in/juanperez',
        email_principal: 'juan.perez@example.com',
        telefono_principal: '+57 300 123 4567',
        email_secundario: 'juan.perez2@example.com',
        telefono_secundario: '+57 310 987 6543',
        instagram: '@juanperez',
        twitter: '@juanperez',
        facebook: 'https://facebook.com/juanperez',
      }

      // Act
      const result = await updatePersonaProfile(id, data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Perfil actualizado correctamente')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // business_partners and personas
      expect(revalidatePath).toHaveBeenCalledWith('/admin/socios/personas')
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/socios/personas/${id}`)
    })

    it('should return error when business_partners update fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'BP update failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'BP update failed' },
      })

      const id = generateTestPersonaId()
      const data = {
        estado: 'activo',
        email_principal: 'juan.perez@example.com',
        telefono_principal: '+57 300 123 4567',
      }

      // Act
      const result = await updatePersonaProfile(id, data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al actualizar estado')
    })

    it('should return error when personas update fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'Persona update failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null,
      })
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: { message: 'Persona update failed' },
      })

      const id = generateTestPersonaId()
      const data = {
        estado: 'activo',
        email_principal: 'juan.perez@example.com',
        telefono_principal: '+57 300 123 4567',
        profesion: 'Ingeniero',
      }

      // Act
      const result = await updatePersonaProfile(id, data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al actualizar perfil')
    })
  })

  describe('updatePersonaSecurity', () => {
    it('should successfully update persona security data', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestPersonaId()
      const data = {
        tipo_sangre: 'O+',
        eps: 'EPS Sura',
        contacto_emergencia_id: 'contact-123',
        relacion_emergencia: 'Esposo',
      }

      // Act
      const result = await updatePersonaSecurity(id, data)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Datos de salud y emergencia actualizados correctamente')
      expect(mockSupabase.from).toHaveBeenCalledWith('personas')
      expect(mockSupabase.update).toHaveBeenCalledWith(data)
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id)
      expect(revalidatePath).toHaveBeenCalledWith('/admin/socios/personas')
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/socios/personas/${id}`)
    })

    it('should return error when security update fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'Security update failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Security update failed' },
      })

      const id = generateTestPersonaId()
      const data = {
        tipo_sangre: 'O+',
        eps: 'EPS Sura',
      }

      // Act
      const result = await updatePersonaSecurity(id, data)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al actualizar datos de seguridad')
    })
  })

  describe('softDeletePersona', () => {
    it('should successfully soft delete a persona', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const id = generateTestPersonaId()

      // Act
      const result = await softDeletePersona(id)

      // Assert
      expect(result.success).toBe(true)
      expect(result.message).toBe('Persona eliminada correctamente')
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // personas and business_partners
      expect(mockSupabase.update).toHaveBeenCalledWith({ eliminado_en: expect.any(String) })
      expect(revalidatePath).toHaveBeenCalledWith('/admin/socios/personas')
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/socios/personas/${id}`)
    })

    it('should return error when personas soft delete fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'Persona delete failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: { message: 'Persona delete failed' },
      })

      const id = generateTestPersonaId()

      // Act
      const result = await softDeletePersona(id)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al eliminar persona')
    })

    it('should return error when business_partners soft delete fails', async () => {
      // Arrange
      const mockSupabase = createMockClientWithData(null, {
        message: 'BP delete failed',
      })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null,
      })
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: { message: 'BP delete failed' },
      })

      const id = generateTestPersonaId()

      // Act
      const result = await softDeletePersona(id)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('Error al eliminar business partner')
    })
  })
})
