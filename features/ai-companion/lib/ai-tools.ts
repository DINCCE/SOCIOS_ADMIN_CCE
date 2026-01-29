import { z } from 'zod'

/**
 * AI Tools for SOCIOS_ADMIN CRM
 *
 * Zod schemas for tool parameters used by Vercel AI SDK
 */

// Navigation tool schema
export const navigateToolSchema = z.object({
  path: z.string().describe('The route path to navigate to (e.g., /admin/socios/personas, /admin/procesos/tareas)'),
  entity: z.enum(['personas', 'empresas', 'tareas', 'acciones', 'analitica', 'settings']).describe('The entity type'),
  entityId: z.string().optional().describe('Optional specific entity ID to open detail view'),
})

// Search/filter tool schema
export const searchToolSchema = z.object({
  entity: z.enum(['personas', 'empresas', 'tareas', 'acciones']).describe('The entity to search'),
  query: z.string().optional().describe('Search query text'),
  filters: z.record(z.string(), z.unknown()).optional().describe('Specific filters to apply (e.g., status, priority)'),
})

// Create tarea tool schema
export const createTareaToolSchema = z.object({
  titulo: z.string().describe('Task title'),
  descripcion: z.string().optional().describe('Task description'),
  prioridad: z.enum(['baja', 'media', 'alta']).optional().describe('Task priority'),
  fecha_vencimiento: z.string().optional().describe('Due date in ISO format'),
  asignado_a: z.string().optional().describe('ID of the person assigned to'),
})

// Create acción tool schema
export const createAccionToolSchema = z.object({
  tipo_acción: z.string().describe('Type of action (e.g., llamada, reunion, email)'),
  descripcion: z.string().describe('Action description'),
  actor_id: z.string().optional().describe('ID of the related actor (persona or empresa)'),
  fecha_accion: z.string().optional().describe('Action date in ISO format'),
})

// Get summary tool schema
export const getSummaryToolSchema = z.object({
  entity: z.enum(['personas', 'empresas', 'tareas', 'acciones']).describe('The entity to summarize'),
  filters: z.record(z.string(), z.unknown()).optional().describe('Filters to apply for the summary'),
})
