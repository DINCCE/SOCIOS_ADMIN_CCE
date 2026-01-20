/**
 * Responsive column configuration for data tables
 *
 * Defines which columns should be visible on different screen sizes.
 * Mobile breakpoint: < 768px
 * Tablet breakpoint: 768px - 1024px
 * Desktop breakpoint: >= 1024px
 */

export interface ResponsiveColumnConfig {
  mobile: string[]   // Columns visible on < 768px
  tablet: string[]   // Columns visible on 768px - 1024px
  desktop: string[]  // Columns visible on >= 1024px (empty = show all)
}

/**
 * Personas table responsive configuration
 * Mobile: name, status, actions
 * Tablet: name, document, status, tags, actions
 */
export const PERSONAS_RESPONSIVE_COLS: ResponsiveColumnConfig = {
  mobile: ['select', 'nombre_completo', 'estado_actor', 'actions'],
  tablet: ['select', 'nombre_completo', 'num_documento', 'estado_actor', 'tags', 'actions'],
  desktop: [] // Show all on desktop
}

/**
 * Empresas table responsive configuration
 * Mobile: name, status, actions
 * Tablet: name, nit, status, tags, actions
 */
export const EMPRESAS_RESPONSIVE_COLS: ResponsiveColumnConfig = {
  mobile: ['select', 'nombre_comercial', 'estado_actor', 'actions'],
  tablet: ['select', 'nombre_comercial', 'num_documento', 'estado_actor', 'tags', 'actions'],
  desktop: [] // Show all on desktop
}

/**
 * Tareas table responsive configuration
 * Mobile: title, status, priority, assignee
 * Tablet: title, description, status, priority, assignee, due date
 */
export const TAREAS_RESPONSIVE_COLS: ResponsiveColumnConfig = {
  mobile: ['select', 'titulo', 'estado', 'prioridad', 'asignado_a', 'actions'],
  tablet: ['select', 'titulo', 'descripcion', 'estado', 'prioridad', 'asignado_a', 'fecha_vencimiento', 'actions'],
  desktop: [] // Show all on desktop
}

/**
 * Acciones table responsive configuration
 * Mobile: code, type, status, actions
 * Tablet: code, type, status, quantity, beneficiary, actions
 */
export const ACCIONES_RESPONSIVE_COLS: ResponsiveColumnConfig = {
  mobile: ['select', 'codigo_bp', 'tipo_accion', 'estado', 'actions'],
  tablet: ['select', 'codigo_bp', 'tipo_accion', 'estado', 'cantidad', 'beneficiario_nombre', 'actions'],
  desktop: [] // Show all on desktop
}

/**
 * Oportunidades table responsive configuration
 * Mobile: code, stage, status, actions
 * Tablet: code, name, stage, status, amount, actions
 */
export const OPORTUNIDADES_RESPONSIVE_COLS: ResponsiveColumnConfig = {
  mobile: ['select', 'codigo_bp', 'etapa', 'estado', 'actions'],
  tablet: ['select', 'codigo_bp', 'nombre_oportunidad', 'etapa', 'estado', 'valor_estimado', 'actions'],
  desktop: [] // Show all on desktop
}

/**
 * Get initial column visibility state based on screen size and config
 */
export function getInitialColumnVisibility(
  config: ResponsiveColumnConfig,
  isMobile: boolean,
  allColumnIds: string[],
  baseHidden: string[] = []
): Record<string, boolean> {
  const visibleCols = isMobile ? config.mobile : config.tablet

  // Start with base hidden columns
  const visibility: Record<string, boolean> = {}
  baseHidden.forEach(id => {
    visibility[id] = false
  })

  // Hide all columns that are not in the visible list
  allColumnIds.forEach(id => {
    if (!visibleCols.includes(id)) {
      visibility[id] = false
    }
  })

  return visibility
}

/**
 * Get column visibility updates when screen size changes
 */
export function getColumnVisibilityUpdates(
  config: ResponsiveColumnConfig,
  isMobile: boolean,
  allColumnIds: string[]
): Record<string, boolean> {
  const visibleCols = isMobile ? config.mobile : config.tablet

  const updates: Record<string, boolean> = {}
  allColumnIds.forEach(id => {
    updates[id] = visibleCols.includes(id)
  })

  return updates
}
