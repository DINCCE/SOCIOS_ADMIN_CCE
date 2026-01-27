/**
 * Global Search Constants
 *
 * Entity configurations, icons, colors, and search behavior constants
 * for the global search command palette.
 */

import type { EntityConfig, EntityType } from './types'
import {
  User,
  Building2,
  CheckCircle2,
  Badge,
  FileText,
  type LucideIcon,
} from 'lucide-react'

/**
 * Visual configuration for each entity type
 * Defines icon, colors, and labels for consistent rendering
 */
export interface EntityConfig {
  icon: LucideIcon
  label: string
  singular: string
  // Using CSS custom properties for theme-aware colors
  colorLight: string
  colorDark: string
}

/**
 * Entity type configurations
 * Maps entity types to their visual representation
 */
export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  actor: {
    icon: User,
    label: 'Personas y Empresas',
    singular: 'Persona',
    colorLight: 'text-blue-600',
    colorDark: 'dark:text-blue-400',
  },
  tarea: {
    icon: CheckCircle2,
    label: 'Tareas',
    singular: 'Tarea',
    colorLight: 'text-amber-600',
    colorDark: 'dark:text-amber-400',
  },
  accion: {
    icon: Badge,
    label: 'Acciones',
    singular: 'Acción',
    colorLight: 'text-purple-600',
    colorDark: 'dark:text-purple-400',
  },
  documento: {
    icon: FileText,
    label: 'Documentos',
    singular: 'Documento',
    colorLight: 'text-green-600',
    colorDark: 'dark:text-green-400',
  },
}

/**
 * Search behavior constants
 */
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_LIMIT = 20

/**
 * Empty state messages
 */
export const EMPTY_STATE_MESSAGES = {
  idle: 'Escribe para buscar en personas, tareas, acciones y más...',
  tooShort: 'Mínimo 2 caracteres para buscar',
  noResults: 'No se encontraron resultados',
  error: 'Error al buscar. Intenta de nuevo.',
}

/**
 * Keyboard shortcuts for display
 */
export const KEYBOARD_SHORTCUTS = {
  open: '⌘K',
  navigate: '↑↓',
  select: '↵',
  close: 'Esc',
} as const
