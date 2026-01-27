/**
 * Global Search Types
 *
 * Type definitions for the global search system including
 * entity types, search results, and configurations.
 */

/**
 * Entity types that can be searched globally
 */
export type EntityType = 'actor' | 'tarea' | 'accion' | 'documento'

/**
 * Single search result from the global search RPC function
 */
export interface SearchResult {
  entity_type: EntityType
  entity_id: string
  title: string
  subtitle: string
  route: string
  metadata: SearchResultMetadata
}

/**
 * Extended metadata attached to each search result
 * Contains entity-specific information for display and filtering
 */
export interface SearchResultMetadata {
  // Common fields
  estado?: string
  tags?: string[]

  // Actor-specific
  tipo_actor?: 'persona' | 'empresa'
  ciudad?: string
  created_at?: string

  // Tarea-specific
  prioridad?: 'Urgente' | 'Alta' | 'Media' | 'Baja'
  fecha_vencimiento?: string | null
  asignado?: string
  codigo_tarea?: string

  // Accion-specific
  organizacion?: string
  propietario?: string
  precio_adquisicion?: number

  // Documento-specific
  tipo_documento?: string
  valor_total?: number
  solicitante?: string
}

/**
 * Action type for quick commands (create new, navigate, etc.)
 */
export interface SearchAction {
  id: string
  type: 'navigation' | 'create'
  label: string
  icon: string // Lucide icon name
  shortcut?: string
  route?: string
  action?: () => void
}

/**
 * Response structure for search queries
 */
export interface SearchResponse {
  results: SearchResult[]
  actions?: SearchAction[]
}

/**
 * Configuration for search behavior
 */
export interface SearchConfig {
  minLength: number
  debounceMs: number
  limit: number
}

/**
 * Recent search item for history tracking
 */
export interface RecentSearchItem {
  entity_id: string
  entity_type: EntityType
  title: string
  route: string
  viewed_at: string
}
