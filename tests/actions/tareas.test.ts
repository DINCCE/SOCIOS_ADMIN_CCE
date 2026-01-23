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
  reasignarTareasMasivo,
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
      const mockSupabase = createMockClientWithData({ id: 'task-123' }, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: { id: 'task-123' },
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
      expect(result.tarea_id).toBe('task-123')
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Insert error' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.insert).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.select).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { message: 'Insert error' },
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
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await actualizarTarea('task-123', {
        titulo: 'Updated Task',
        estado: 'En Progreso',
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

  describe('reasignarTareasMasivo', () => {
    it('should successfully reassign tasks in bulk', async () => {
      const mockSupabase = createMockClientWithData(null, null)
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.in).mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await reasignarTareasMasivo(['task-1', 'task-2'], 'new-user-id')

      expect(result.success).toBe(true)
      expect(result.count).toBe(2)
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ['task-1', 'task-2'])
      expect(revalidatePath).toHaveBeenCalledWith('/admin/procesos/tareas')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/procesos/tareas/dashboard')
    })

    it('should handle errors during bulk reassignment', async () => {
      const mockSupabase = createMockClientWithData(null, { message: 'Update failed' })
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(mockSupabase.from).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.update).mockReturnValue(mockSupabase as any)
      vi.mocked(mockSupabase.in).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await reasignarTareasMasivo(['task-1'], 'new-user-id')

      expect(result.success).toBe(false)
    })
  })
})
