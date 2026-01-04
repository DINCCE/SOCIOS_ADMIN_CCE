/**
 * Audit logging utility
 * Provides functions to log all CRUD operations for compliance and security
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Audit action types
 */
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  user_id?: string
  organization_id: string
  table_name: string
  record_id: string
  action: AuditAction
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

/**
 * Log an audit event
 *
 * @param params - Audit log parameters
 * @returns Promise<void>
 *
 * @example
 * await logAuditEvent({
 *   user_id: 'user-123',
 *   organization_id: 'org-123',
 *   table_name: 'personas',
 *   record_id: 'persona-123',
 *   action: 'INSERT',
 *   new_data: { primer_nombre: 'Juan' }
 * })
 */
export async function logAuditEvent(params: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.from('audit_logs').insert({
      user_id: params.user_id,
      organization_id: params.organization_id,
      table_name: params.table_name,
      record_id: params.record_id,
      action: params.action,
      old_data: params.old_data,
      new_data: params.new_data,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
    })
  } catch (error) {
    // Don't throw - audit logging failures shouldn't break the main operation
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Log an INSERT operation
 */
export async function logInsert(
  organizationId: string,
  tableName: string,
  recordId: string,
  newData: Record<string, unknown>,
  userId?: string
): Promise<void> {
  return logAuditEvent({
    user_id: userId,
    organization_id: organizationId,
    table_name: tableName,
    record_id: recordId,
    action: 'INSERT',
    new_data: newData,
  })
}

/**
 * Log an UPDATE operation
 */
export async function logUpdate(
  organizationId: string,
  tableName: string,
  recordId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  userId?: string
): Promise<void> {
  return logAuditEvent({
    user_id: userId,
    organization_id: organizationId,
    table_name: tableName,
    record_id: recordId,
    action: 'UPDATE',
    old_data: oldData,
    new_data: newData,
  })
}

/**
 * Log a DELETE operation
 */
export async function logDelete(
  organizationId: string,
  tableName: string,
  recordId: string,
  oldData: Record<string, unknown>,
  userId?: string
): Promise<void> {
  return logAuditEvent({
    user_id: userId,
    organization_id: organizationId,
    table_name: tableName,
    record_id: recordId,
    action: 'DELETE',
    old_data: oldData,
  })
}

/**
 * Get client IP address from request headers
 * Note: This should be called from server components/actions
 * where request context is available
 */
export function getClientIP(): string | undefined {
  // In a real implementation, this would extract from request headers
  // For now, return undefined as we don't have request context here
  return undefined
}

/**
 * Get user agent from request headers
 * Note: This should be called from server components/actions
 * where request context is available
 */
export function getUserAgent(): string | undefined {
  // In a real implementation, this would extract from request headers
  // For now, return undefined as we don't have request context here
  return undefined
}

/**
 * Get current user ID from session
 * Note: This should be called from server components/actions
 * where auth context is available
 */
export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id
  } catch {
    return undefined
  }
}

/**
 * Create a wrapper function that adds audit logging to any action
 *
 * @param action - The action function to wrap
 * @param options - Audit logging options
 * @returns Wrapped function with audit logging
 *
 * @example
 * const auditedCreatePersona = withAuditLogging(crearPersona, {
 *   tableName: 'personas'
 * })
 */
export function withAuditLogging<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  options: {
    tableName: string
    getRecordId: (...args: T) => string
    getOrganizationId: (...args: T) => string
    getOldData?: (...args: T) => Record<string, unknown> | undefined
    getNewData?: (...args: T) => Record<string, unknown> | undefined
    getActionType?: (...args: T) => AuditAction
  }
): (...args: T) => Promise<R & { success: boolean }> {
  return async (...args: T): Promise<R & { success: boolean }> => {
    const recordId = options.getRecordId(...args)
    const organizationId = options.getOrganizationId(...args)
    const oldData = options.getOldData?.(...args)
    const newData = options.getNewData?.(...args)
    const actionType = options.getActionType?.(...args) || 'UPDATE'
    
    try {
      const result = await action(...args) as any
      
      // Only log if the operation was successful
      if (result && result.success) {
        const userId = await getCurrentUserId()
        
        if (actionType === 'INSERT') {
          await logInsert(organizationId, options.tableName, recordId, newData || {}, userId)
        } else if (actionType === 'UPDATE') {
          await logUpdate(organizationId, options.tableName, recordId, oldData || {}, newData || {}, userId)
        } else if (actionType === 'DELETE') {
          await logDelete(organizationId, options.tableName, recordId, oldData || {}, userId)
        }
      }
      
      return result
    } catch (error) {
      console.error('Action failed, skipping audit log:', error)
      throw error
    }
  }
}
