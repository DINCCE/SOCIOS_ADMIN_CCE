import type { LucideIcon } from 'lucide-react'

/**
 * Component source type
 */
export type ComponentSource = 'shadcn' | 'custom'

/**
 * Playground prop type for live editing
 */
export type PlaygroundPropType = 'select' | 'toggle' | 'text' | 'number'

/**
 * Playground configuration for a component prop
 */
export interface PlaygroundPropConfig {
  type: PlaygroundPropType
  options?: string[]
  defaultValue: any
  label?: string // Spanish label
}

/**
 * Component metadata for the showcase
 */
export interface ComponentMeta {
  id: string // Unique identifier (e.g., 'button', 'dialog')
  name: string // Display name in Spanish
  category: string // Category ID
  subcategory?: string // Subcategory ID (for custom components)
  description: string // Component description in Spanish
  source: ComponentSource // 'shadcn' or 'custom'
  filePath: string // Path to component file
  keywords: string[] // Search keywords (Spanish)
  playground?: Record<string, PlaygroundPropConfig> // Props for playground mode
}

/**
 * Component category definition
 */
export interface ComponentCategory {
  id: string // Unique category ID
  name: string // Display name in Spanish
  icon: LucideIcon // Category icon
  description?: string // Category description
}

/**
 * Component subcategory (for custom components)
 */
export interface ComponentSubcategory {
  id: string
  name: string
  icon?: LucideIcon
  parentId: string // Parent category ID
}
