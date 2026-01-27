import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  CheckSquare,
  Kanban,
  LayoutDashboard,
  PieChart,
  Settings2,
  Target,
  Users,
} from 'lucide-react'

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: NavSubItem[]
}

export interface NavSubItem {
  title: string
  url: string
}

export interface BreadcrumbSegment {
  title: string
  url: string
  isCurrentPage: boolean
}

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    title: 'Panel',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Mis Tareas',
    url: '/admin/mis-tareas',
    icon: Target,
  },
  {
    title: 'Analítica',
    url: '#',
    icon: PieChart,
    items: [
      {
        title: 'Tareas',
        url: '/admin/analitica',
      },
    ],
  },
  {
    title: 'Socios de Negocio',
    url: '/admin/socios',
    icon: Users,
    items: [
      {
        title: 'Personas',
        url: '/admin/socios/personas',
      },
      {
        title: 'Empresas',
        url: '/admin/socios/empresas',
      },
    ],
  },
  {
    title: 'Procesos',
    url: '/admin/procesos',
    icon: Kanban,
    items: [
      {
        title: 'Acciones',
        url: '/admin/procesos/acciones',
      },
      {
        title: 'Documentos Comerciales',
        url: '/admin/procesos/documentos-comerciales',
      },
      {
        title: 'Tareas',
        url: '/admin/procesos/tareas',
      },
    ],
  },
  {
    title: 'Organizaciones',
    url: '/admin/organizations',
    icon: Building2,
  },
  {
    title: 'Configuración',
    url: '/admin/settings',
    icon: Settings2,
    items: [
      {
        title: 'Perfil',
        url: '/admin/settings/profile',
      },
      {
        title: 'Cuenta',
        url: '/admin/settings/account',
      },
      {
        title: 'Componentes',
        url: '/admin/settings/componentes',
      },
    ],
  },
]

/**
 * Recursively search navigation items for a matching URL
 * Priority: nested items first (more specific), then parent items
 */
function findNavItemByUrl(url: string, navItems: NavItem[]): string | null {
  for (const item of navItems) {
    // Check nested items first (more specific)
    if (item.items) {
      const subItem = item.items.find((sub) => sub.url === url)
      if (subItem) {
        return subItem.title
      }
    }

    // Check main item URL
    if (item.url === url) {
      return item.title
    }
  }
  return null
}

/**
 * Build breadcrumb segments from current pathname
 * Skips root /admin segment and returns only matched navigation items
 */
export function buildBreadcrumbs(
  pathname: string,
  navItems: NavItem[]
): BreadcrumbSegment[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbSegment[] = []

  // Skip first segment (/admin) - requirement to remove root
  for (let i = 1; i < segments.length; i++) {
    const path = `/${segments.slice(0, i + 1).join('/')}`
    const title = findNavItemByUrl(path, navItems)

    if (title) {
      breadcrumbs.push({
        title,
        url: path,
        isCurrentPage: i === segments.length - 1,
      })
    }
  }

  return breadcrumbs
}
