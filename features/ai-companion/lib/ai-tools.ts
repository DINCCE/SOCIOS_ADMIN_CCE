import { z } from 'zod'

/**
 * AI Tools for SOCIOS_ADMIN CRM
 *
 * Zod schemas for tool parameters used by Vercel AI SDK
 */

// Navigation tool schema
export const navigateToolSchema = z.object({
  page: z.string().describe('The title of the page to navigate to (e.g., "Mis Tareas", "Personas", "Empresas", "Documentos Comerciales", "Acciones", "Analítica")'),
  path: z.string().optional().describe('The route path to navigate to if known (e.g., /admin/socios/personas)'),
  entity: z.enum(['personas', 'empresas', 'tareas', 'acciones', 'doc_comerciales', 'analitica', 'settings']).optional().describe('The entity type'),
  entityId: z.string().optional().describe('Optional specific entity ID to open detail view'),
})

// Search/filter tool schema
export const searchToolSchema = z.object({
  entity: z.enum(['personas', 'empresas', 'tareas', 'acciones', 'doc_comerciales']).describe('The entity to search'),
  query: z.string().optional().describe('Search query text'),
  filters: z.record(z.string(), z.unknown()).optional().describe('Specific filters to apply (e.g., status, priority)'),
})

// Create tarea tool schema
export const createTareaToolSchema = z.object({
  titulo: z.string().describe('Task title'),
  descripcion: z.string().optional().describe('Task description'),
  prioridad: z.enum(['Baja', 'Media', 'Alta', 'Urgente']).optional().describe('Task priority'),
  fecha_vencimiento: z.string().optional().describe('Due date in ISO format'),
  asignado_id: z.string().optional().describe('UUID of the user assigned to this task'),
})

// Create Doc Comercial tool schema
export const createDocComercialToolSchema = z.object({
  tipo: z.enum(['oportunidad', 'oferta', 'pedido_venta', 'reserva']).describe('Type of commercial document'),
  titulo: z.string().describe('Document title'),
  solicitante_id: z.string().describe('UUID of the applicant actor'),
  valor_estimado: z.number().optional().describe('Estimated value'),
})

// Create Persona tool schema
export const createPersonaToolSchema = z.object({
  primer_nombre: z.string().describe('First name'),
  primer_apellido: z.string().describe('First surname'),
  num_documento: z.string().optional().describe('ID number'),
  email_principal: z.string().optional().describe('Primary email'),
})

// Create Empresa tool schema
export const createEmpresaToolSchema = z.object({
  razon_social: z.string().describe('Legal name of the company'),
  num_documento: z.string().optional().describe('NIT/Tax ID'),
  email_principal: z.string().optional().describe('Primary contact email'),
})

// Assign Familiar tool schema
export const asignarFamiliarToolSchema = z.object({
  actor_origen_id: z.string().describe('UUID of the child/employee/etc.'),
  actor_destino_id: z.string().describe('UUID of the parent/company/etc.'),
  tipo_relacion: z.enum(['familiar', 'laboral', 'referencia', 'membresía', 'comercial']).describe('Type of relationship'),
  rol_origen: z.string().describe('Role of the origin actor (e.g., hijo, empleado)'),
  rol_destino: z.string().describe('Role of the destination actor (e.g., padre, empresa)'),
})

// Assign Accion tool schema
export const asignarAccionToolSchema = z.object({
  accion_id: z.string().describe('UUID of the share/accion'),
  actor_id: z.string().describe('UUID of the actor to assign'),
  tipo_vinculo: z.enum(['propietario', 'titular', 'beneficiario']).describe('Type of link to the share'),
})

// Get summary tool schema
export const getSummaryToolSchema = z.object({
  entity: z.enum(['personas', 'empresas', 'tareas', 'acciones', 'doc_comerciales']).describe('The entity to summarize'),
  filters: z.record(z.string(), z.unknown()).optional().describe('Filters to apply for the summary'),
})
