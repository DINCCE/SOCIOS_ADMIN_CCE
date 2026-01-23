/**
 * Simple client-side permission utilities
 * Pass role from server component, use for conditional rendering
 */

'use client'

import type { UserRole } from './page-permissions'

/**
 * Quick permission checks based on role
 * Use this in client components for hiding/showing UI elements
 */
export function canDelete(role: UserRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin'
}

export function canUpdateConfig(role: UserRole | null | undefined): boolean {
  return role === 'owner'
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return role === 'owner'
}

/**
 * Higher-order component pattern
 * Wrap components that require specific roles
 */
export interface RequireRoleProps {
  role: UserRole | null
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RequireRole({ role, allowedRoles, fallback, children }: RequireRoleProps) {
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback ?? null}</>
  }
  return <>{children}</>
}

/**
 * Higher-order component pattern
 * Wrap components that require owner role
 */
export interface RequireOwnerProps {
  role: UserRole | null
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RequireOwner({ role, fallback, children }: RequireOwnerProps) {
  return <RequireRole role={role} allowedRoles={['owner']} fallback={fallback}>
    {children}
  </RequireRole>
}

/**
 * Higher-order component pattern
 * Wrap components that require admin or owner role
 */
export interface RequireAdminProps {
  role: UserRole | null
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RequireAdmin({ role, fallback, children }: RequireAdminProps) {
  return <RequireRole role={role} allowedRoles={['owner', 'admin']} fallback={fallback}>
    {children}
  </RequireRole>
}

/**
 * Hook to use role in client components
 * Role should be passed from server component via props
 */
export function useRolePermissions(role: UserRole | null) {
  return {
    role,
    canDelete: canDelete(role),
    canUpdateConfig: canUpdateConfig(role),
    canManageUsers: canManageUsers(role),
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isAnalyst: role === 'analyst',
    isAuditor: role === 'auditor',
  }
}
