/**
 * Global Search Actions
 *
 * Quick actions for the command palette including
 * create actions and navigation shortcuts.
 */

import type { SearchAction } from './types'
import {
  UserPlus,
  Building2,
  CheckCircle2,
  LayoutList,
  Users,
  Settings,
  FileText,
  Handshake,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

/**
 * Map of icon names to Lucide icon components
 * Used for dynamic icon rendering in search actions
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus,
  Building2,
  CheckCircle2,
  LayoutList,
  Users,
  Settings,
  FileText,
  Handshake,
  BarChart3,
}

/**
 * Quick actions available in the command palette
 * These appear when the user types "/" or when no search query is active
 */
export const SEARCH_ACTIONS: SearchAction[] = [
  // Create actions
  {
    id: 'create-persona',
    type: 'create',
    label: 'Crear Persona',
    icon: 'UserPlus',
    shortcut: '/ crear persona',
  },
  {
    id: 'create-empresa',
    type: 'create',
    label: 'Crear Empresa',
    icon: 'Building2',
    shortcut: '/ crear empresa',
  },
  {
    id: 'create-tarea',
    type: 'create',
    label: 'Crear Tarea',
    icon: 'CheckCircle2',
    shortcut: '/ crear tarea',
  },
  {
    id: 'create-doc-comercial',
    type: 'create',
    label: 'Crear Documento Comercial',
    icon: 'FileText',
    shortcut: '/ crear documento',
  },
  {
    id: 'asignar-accion',
    type: 'create',
    label: 'Asignar Acción',
    icon: 'Handshake',
    shortcut: '/ asignar acción',
  },

  // Navigation actions
  {
    id: 'nav-mis-tareas',
    type: 'navigation',
    label: 'Mis Tareas',
    icon: 'LayoutList',
    shortcut: '/ mis tareas',
    route: '/admin/mis-tareas',
  },
  {
    id: 'nav-personas',
    type: 'navigation',
    label: 'Personas',
    icon: 'Users',
    shortcut: '/ personas',
    route: '/admin/socios/personas',
  },
  {
    id: 'nav-empresas',
    type: 'navigation',
    label: 'Empresas',
    icon: 'Building2',
    shortcut: '/ empresas',
    route: '/admin/socios/empresas',
  },
  {
    id: 'nav-acciones',
    type: 'navigation',
    label: 'Acciones',
    icon: 'Handshake',
    shortcut: '/ acciones',
    route: '/admin/procesos/acciones',
  },
  {
    id: 'nav-documentos',
    type: 'navigation',
    label: 'Documentos Comerciales',
    icon: 'FileText',
    shortcut: '/ documentos',
    route: '/admin/procesos/documentos-comerciales',
  },
  {
    id: 'nav-tareas',
    type: 'navigation',
    label: 'Todas las Tareas',
    icon: 'CheckCircle2',
    shortcut: '/ tareas',
    route: '/admin/procesos/tareas',
  },
  {
    id: 'nav-analitica',
    type: 'navigation',
    label: 'Analítica',
    icon: 'BarChart3',
    shortcut: '/ analítica',
    route: '/admin/analitica',
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    label: 'Configuración',
    icon: 'Settings',
    shortcut: '/ configuración',
    route: '/admin/settings',
  },
]

/**
 * Command mode trigger character
 * When user types this, switch to command/action mode
 * Using "/" like Notion for commands
 */
export const COMMAND_MODE_TRIGGER = '/'

/**
 * Check if a query string is in command mode
 */
export function isCommandMode(query: string): boolean {
  return query.trimStart().startsWith(COMMAND_MODE_TRIGGER)
}

/**
 * Extract command query from search input
 * Removes the ">" prefix and returns the remaining text
 */
export function getCommandQuery(query: string): string {
  if (!isCommandMode(query)) return ''
  return query.trimStart().slice(COMMAND_MODE_TRIGGER.length).trim().toLowerCase()
}

/**
 * Filter actions based on command query
 * Returns actions that match the query text
 */
export function filterActions(query: string): SearchAction[] {
  const commandQuery = getCommandQuery(query)

  if (!commandQuery) {
    return SEARCH_ACTIONS
  }

  return SEARCH_ACTIONS.filter((action) => {
    const searchText = `${action.label} ${action.shortcut || ''}`.toLowerCase()
    return searchText.includes(commandQuery)
  })
}
