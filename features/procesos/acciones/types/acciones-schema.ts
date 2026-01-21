import { z } from "zod"

/**
 * Schema for Accion list view
 * Optimized for table display - based on v_acciones_org view
 */
export const accionListSchema = z.object({
  id: z.string().uuid(),
  organizacion_slug: z.string().nullable(),
  organizacion_nombre: z.string().nullable(),
  codigo_accion: z.string(),
  estado: z.enum(["disponible", "asignada", "arrendada", "bloqueada", "inactiva"]),
  tags: z.array(z.string()).default([]),
  // Propietario - desde vn_asociados
  propietario_codigo_completo: z.string().nullable(),
  propietario_subcodigo: z.string().nullable(),
  propietario_tipo_vinculo: z.string().nullable(),
  propietario_modalidad: z.string().nullable(),
  propietario_plan_comercial: z.string().nullable(),
  propietario_fecha_inicio: z.string().nullable(),
  // Propietario - desde dm_actores
  propietario_codigo_bp: z.string().nullable(),
  propietario_nombre_completo: z.string().nullable(),
  propietario_tipo_actor: z.enum(["persona", "empresa"]).nullable(),
  propietario_tipo_documento: z.string().nullable(),
  propietario_num_documento: z.string().nullable(),
  propietario_email_principal: z.string().nullable(),
  propietario_telefono_principal: z.string().nullable(),
  // Audit fields
  creado_en: z.string(),
  creado_por_email: z.string().nullable(),
  creado_por_nombre: z.string().nullable(),
  actualizado_en: z.string().nullable(),
  actualizado_por_email: z.string().nullable(),
  actualizado_por_nombre: z.string().nullable(),
  eliminado_en: z.string().nullable(),
  eliminado_por_email: z.string().nullable(),
  eliminado_por_nombre: z.string().nullable(),
})

export type AccionList = z.infer<typeof accionListSchema>

/**
 * Schema for Accion detail view
 * Complete data structure for action detail page
 */
export const accionDetailSchema = z.object({
  // Core fields
  id: z.string().uuid(),
  codigo_accion: z.string(),
  numero_titulo: z.string(),
  tipo: z.string(),
  estado: z.enum(["disponible", "asignada", "arrendada", "bloqueada", "inactiva"]),
  solvencia: z.enum(["al_dia", "pendiente", "mora_30", "mora_60", "cobro_juridico"]),

  // Dates
  fecha_ingreso: z.string(),
  fecha_emision: z.string().optional(),

  // Titular (Owner)
  titular: z.object({
    id: z.string().uuid(),
    nombre_completo: z.string(),
    avatar_url: z.string().nullable(),
  }),

  // Ficha Técnica
  valor_nominal: z.number(),
  ubicacion_fisica: z.string(),
  derechos_politicos: z.boolean(),

  // KPIs
  kpis: z.object({
    consumo_promedio: z.number(),
    deuda_total: z.number(),
    invitados_disponibles: z.number(),
  }),

  // Audit
  creado_en: z.string(),
  actualizado_en: z.string().nullable(),
})

export type AccionDetail = z.infer<typeof accionDetailSchema>

/**
 * Mock factory function for Accion detail
 * Creates dummy data for development/testing
 */
export function createMockAccionDetail(id: string): AccionDetail {
  return {
    id,
    codigo_accion: "ACC-00459",
    numero_titulo: "A-00459",
    tipo: "Socio Activo",
    estado: "asignada",
    solvencia: "al_dia",
    fecha_ingreso: "2015-04-12",
    fecha_emision: "2015-04-10",
    titular: {
      id: "p-555",
      nombre_completo: "Ana Lucía García López",
      avatar_url: null,
    },
    valor_nominal: 15000000,
    ubicacion_fisica: "Caja Fuerte 2 - Folio 45",
    derechos_politicos: true,
    kpis: {
      consumo_promedio: 450000,
      deuda_total: 0,
      invitados_disponibles: 8,
    },
    creado_en: "2015-04-12T10:30:00Z",
    actualizado_en: "2025-01-15T14:20:00Z",
  }
}
