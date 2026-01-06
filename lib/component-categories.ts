import type { ComponentCategory } from '@/types/component-registry'
import {
  Package,
  Puzzle,
  Keyboard,
  Navigation,
  AlertCircle,
  Table,
  Layers,
  Users,
  Kanban,
  Sparkles,
} from 'lucide-react'

/**
 * Component categories for the showcase
 *
 * Organized by source (Native/Custom) and functional purpose
 */
export const COMPONENT_CATEGORIES: Record<string, ComponentCategory> = {
  // Native shadcn/ui categories
  'native-forms': {
    id: 'native-forms',
    name: 'Entradas de Formulario',
    icon: Keyboard,
    description: 'Componentes para captura de datos del usuario',
  },
  'native-navigation': {
    id: 'native-navigation',
    name: 'Navegación',
    icon: Navigation,
    description: 'Menús, barras de navegación y controles de dirección',
  },
  'native-feedback': {
    id: 'native-feedback',
    name: 'Feedback y Estado',
    icon: AlertCircle,
    description: 'Indicadores de estado, alertas y retroalimentación visual',
  },
  'native-data': {
    id: 'native-data',
    name: 'Visualización de Datos',
    icon: Table,
    description: 'Tablas, tarjetas y presentación de información',
  },
  'native-overlays': {
    id: 'native-overlays',
    name: 'Modales y Overlays',
    icon: Layers,
    description: 'Diálogos, tooltips y capas superpuestas',
  },
  'native-layout': {
    id: 'native-layout',
    name: 'Estructura y Layout',
    icon: Layers,
    description: 'Contenedores, divisiones y estructuras de página',
  },
  'native-advanced': {
    id: 'native-advanced',
    name: 'Avanzados',
    icon: Sparkles,
    description: 'Componentes complejos y especializados',
  },

  // Custom component categories
  'custom-layout': {
    id: 'custom-layout',
    name: 'Layout y Estructura',
    icon: Layers,
    description: 'Componentes de estructura de página personalizados',
  },
  'custom-forms': {
    id: 'custom-forms',
    name: 'Formularios',
    icon: Keyboard,
    description: 'Formularios de autenticación y captura de datos',
  },
  'custom-business': {
    id: 'custom-business',
    name: 'Componentes de Negocio',
    icon: Users,
    description: 'Componentes específicos para gestión de socios',
  },
  'custom-process': {
    id: 'custom-process',
    name: 'Procesos',
    icon: Kanban,
    description: 'Tableros Kanban y gestión de procesos',
  },
  'custom-providers': {
    id: 'custom-providers',
    name: 'Providers',
    icon: Puzzle,
    description: 'Context providers para gestión de estado',
  },
}

/**
 * Component sources (top-level grouping)
 */
export const COMPONENT_SOURCES = {
  shadcn: {
    id: 'shadcn',
    name: 'Nativas (shadcn/ui)',
    icon: Package,
    categories: [
      'native-forms',
      'native-navigation',
      'native-feedback',
      'native-data',
      'native-overlays',
      'native-layout',
      'native-advanced',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Personalizadas',
    icon: Puzzle,
    categories: [
      'custom-layout',
      'custom-forms',
      'custom-business',
      'custom-process',
      'custom-providers',
    ],
  },
}

/**
 * Get category by ID
 */
export function getCategory(id: string): ComponentCategory | undefined {
  return COMPONENT_CATEGORIES[id]
}

/**
 * Get categories for a specific source
 */
export function getCategoriesBySource(source: 'shadcn' | 'custom'): ComponentCategory[] {
  const sourceConfig = COMPONENT_SOURCES[source]
  return sourceConfig.categories
    .map((catId) => COMPONENT_CATEGORIES[catId])
    .filter(Boolean)
}
