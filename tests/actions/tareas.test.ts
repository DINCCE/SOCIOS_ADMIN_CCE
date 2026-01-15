/**
 * Unit tests for tareas actions
 * Tests all CRUD operations for task management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearTarea,
  actualizarTarea,
  softDeleteTarea,
  listTareas,
} from '@/app/actions/tareas'
import { generateTestOrganizationId } from '../helpers/test-data-factory'
import { createMockClientWithData, createMockClientWithRPC } from '../helpers/supabase-test-client'

vi.mock('next/cache')
vi.mock('@/lib/supabase/server')

describe('Tareas Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearTarea', () => {
    it('should successfully create a tarea', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        tarea_id: 'task-123',
        message: 'Tarea creada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, tarea_id: 'task-123', message: 'Tarea creada exitosamente' },
        error: null,
      })

      const data = {
        organizacion_id: generateTestOrganizationId(),
        titulo: 'Test Task',
        descripcion: 'Test description',
        prioridad: 'alta' as const,
      }

      const result = await crearTarea(data)

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

      const result = await crearTarea({
        organizacion_id: generateTestOrganizationId(),
        titulo: 'Test Task',
        descripcion: 'Test description',
        prioridad: 'alta' as const,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('actualizarTarea', () => {
    it('should successfully update a tarea', async () => {
      const mockSupabase = createMockClientWithRPC({
        success: true,
        message: 'Tarea actualizada exitosamente',
      }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: { success: true, message: 'Tarea actualizada exitosamente' },
        error: null,
      })

      const result = await actualizarTarea('task-123', {
        titulo: 'Updated Task',
        estado: 'En Progreso',
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

      const result = await actualizarTarea('task-123', {
        titulo: 'Updated Task',
        estado: 'En Progreso',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('softDeleteTarea', () => {
    it('should successfully soft delete a tarea', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await softDeleteTarea('task-123')

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

      const result = await softDeleteTarea('task-123')

      expect(result.success).toBe(false)
    })
  })

  describe('listTareas', () => {
    it('should successfully list tareas', async () => {
      const mockSupabase = createMockClientWithData([
        { id: 'task-123', titulo: 'Test Task' },
      ], null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.is).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.order).mockResolvedValue({
        data: [{ id: 'task-123', titulo: 'Test Task' }],
        error: null,
      })

      const result = await listTareas(generateTestOrganizationId())

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

      const result = await listTareas(generateTestOrganizationId())

      expect(result.success).toBe(false)
    })
  })
})
