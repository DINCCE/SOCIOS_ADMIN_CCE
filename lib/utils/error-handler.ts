/**
 * Error handler utility
 * Provides user-friendly error messages and error code mapping
 */

/**
 * Error type classification
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error details
 */
export interface ErrorDetails {
  type: ErrorType
  code: string
  message: string
  userMessage: string
  statusCode?: number
}

/**
 * Map database errors to user-friendly messages
 */
export function handleDatabaseError(error: unknown): ErrorDetails {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Duplicate key error
  if (errorMessage.includes('duplicate key') || 
      errorMessage.includes('unique constraint') ||
      errorMessage.includes('already exists')) {
    return {
      type: ErrorType.CONFLICT,
      code: 'DUPLICATE_RECORD',
      message: errorMessage,
      userMessage: 'Este registro ya existe en el sistema',
      statusCode: 409,
    }
  }
  
  // Foreign key error
  if (errorMessage.includes('foreign key') ||
      errorMessage.includes('violates foreign key')) {
    return {
      type: ErrorType.DATABASE,
      code: 'FOREIGN_KEY_VIOLATION',
      message: errorMessage,
      userMessage: 'No se puede eliminar este registro porque está siendo utilizado por otros registros',
      statusCode: 400,
    }
  }
  
  // Check constraint error
  if (errorMessage.includes('violates check constraint') ||
      errorMessage.includes('check constraint')) {
    return {
      type: ErrorType.VALIDATION,
      code: 'CHECK_CONSTRAINT',
      message: errorMessage,
      userMessage: 'Los datos ingresados no cumplen con los requisitos del sistema',
      statusCode: 400,
    }
  }
  
  // Not found error
  if (errorMessage.includes('not found') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('no rows returned')) {
    return {
      type: ErrorType.NOT_FOUND,
      code: 'RECORD_NOT_FOUND',
      message: errorMessage,
      userMessage: 'El registro solicitado no existe',
      statusCode: 404,
    }
  }
  
  // Null constraint error
  if (errorMessage.includes('null value in column') ||
      errorMessage.includes('violates not-null constraint')) {
    return {
      type: ErrorType.VALIDATION,
      code: 'NULL_CONSTRAINT',
      message: errorMessage,
      userMessage: 'Faltan datos obligatorios para completar esta operación',
      statusCode: 400,
    }
  }
  
  // Connection errors
  if (errorMessage.includes('connection') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT')) {
    return {
      type: ErrorType.NETWORK,
      code: 'CONNECTION_ERROR',
      message: errorMessage,
      userMessage: 'Error de conexión con la base de datos. Por favor, inténtelo de nuevo',
      statusCode: 503,
    }
  }
  
  // Default database error
  return {
    type: ErrorType.DATABASE,
    code: 'DATABASE_ERROR',
    message: errorMessage,
    userMessage: 'Error en la base de datos. Por favor, inténtelo de nuevo',
    statusCode: 500,
  }
}

/**
 * Map RPC errors to user-friendly messages
 */
export function handleRPCError(error: unknown): ErrorDetails {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // RPC-specific errors
  if (errorMessage.includes('RPC call failed')) {
    return {
      type: ErrorType.DATABASE,
      code: 'RPC_FAILED',
      message: errorMessage,
      userMessage: 'Error al ejecutar la operación en el servidor',
      statusCode: 500,
    }
  }
  
  // Use generic database error handler
  return handleDatabaseError(error)
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(
  error: unknown,
  context: string = 'Operación'
): {
  success: false
  message: string
  error?: ErrorDetails
} {
  const errorDetails = error instanceof Error 
    ? handleDatabaseError(error)
    : {
        type: ErrorType.UNKNOWN,
        code: 'UNKNOWN_ERROR',
        message: String(error),
        userMessage: 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo',
        statusCode: 500,
      }
  
  console.error(`[${context}] Error:`, error)
  
  return {
    success: false,
    message: errorDetails.userMessage,
    error: errorDetails,
  }
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(errorDetails: ErrorDetails): string {
  return errorDetails.userMessage
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ErrorDetails): boolean {
  return error.type === ErrorType.NETWORK ||
         error.code === 'CONNECTION_ERROR' ||
         error.statusCode === 503
}

/**
 * Get error log level based on type
 */
export function getErrorLogLevel(errorDetails: ErrorDetails): 'error' | 'warn' | 'info' {
  switch (errorDetails.type) {
    case ErrorType.VALIDATION:
    case ErrorType.CONFLICT:
      return 'warn'
    case ErrorType.NOT_FOUND:
      return 'info'
    case ErrorType.NETWORK:
    case ErrorType.DATABASE:
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
      return 'error'
    default:
      return 'error'
  }
}
