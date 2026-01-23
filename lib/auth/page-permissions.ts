/**
 * Page-based access control configuration
 * Maps routes to required roles and permissions
 */

export type UserRole = 'owner' | 'admin' | 'analyst' | 'auditor'

export interface PagePermission {
  path: string
  roles?: UserRole[] // Empty array = no role can access (used for blocking)
  permissions?: Array<{ resource: string; action: 'select' | 'insert' | 'update' | 'delete' }>
  requireOrgOwner?: boolean
  requireOrgAdmin?: boolean
}

/**
 * Route access rules
 * - If roles is specified, user must have one of those roles
 * - If permissions is specified, user must have ALL those permissions
 * - If requireOrgOwner is true, only organization owners can access
 * - If requireOrgAdmin is true, owners and admins can access
 */
export const PAGE_PERMISSIONS: PagePermission[] = [
  // === DASHBOARD ===
  {
    path: '/admin',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
  },

  // === SOCIOS (Business Partners) ===
  {
    path: '/admin/socios',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
  },
  {
    path: '/admin/socios/actores',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
    permissions: [{ resource: 'dm_actores', action: 'select' }],
  },
  {
    path: '/admin/socios/personas',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
    permissions: [{ resource: 'dm_actores', action: 'select' }],
  },
  {
    path: '/admin/socios/empresas',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
    permissions: [{ resource: 'dm_actores', action: 'select' }],
  },

  // === ACCIONES (Shares) ===
  {
    path: '/admin/procesos/acciones',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
    permissions: [{ resource: 'dm_acciones', action: 'select' }],
  },

  // === OPORTUNIDADES (Opportunities) ===
  {
    path: '/admin/procesos/oportunidades',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
    permissions: [{ resource: 'tr_doc_comercial', action: 'select' }],
  },

  // === TAREAS (Tasks) ===
  {
    path: '/admin/procesos/tareas',
    roles: ['owner', 'admin', 'analyst', 'auditor'],
    permissions: [{ resource: 'tr_tareas', action: 'select' }],
  },

  // === CONFIGURATION (Owner Only) ===
  {
    path: '/admin/configuracion',
    roles: ['owner'],
    requireOrgOwner: true,
  },
  {
    path: '/admin/configuracion/organizaciones',
    roles: ['owner'],
    requireOrgOwner: true,
  },
  {
    path: '/admin/configuracion/usuarios',
    roles: ['owner'],
    requireOrgOwner: true,
  },
  {
    path: '/admin/configuracion/roles',
    roles: ['owner'],
    requireOrgOwner: true,
  },

  // === SETTINGS (Owner/Admin) ===
  {
    path: '/admin/ajustes',
    roles: ['owner', 'admin'],
    requireOrgAdmin: true,
  },
]

/**
 * Get permission config for a specific path
 * Supports wildcards and partial matches
 */
export function getPagePermission(path: string): PagePermission | null {
  // Exact match first
  const exact = PAGE_PERMISSIONS.find(p => p.path === path)
  if (exact) return exact

  // Partial match (e.g., /admin/socios/actores/detail matches /admin/socios/actores)
  const partial = PAGE_PERMISSIONS.find(p => path.startsWith(p.path + '/'))
  if (partial) return partial

  return null
}

/**
 * Check if user role is allowed for a page
 */
export function isRoleAllowed(userRole: UserRole | null, requiredRoles: UserRole[] | undefined): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}
