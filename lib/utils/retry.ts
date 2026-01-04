/**
 * Retry utility with exponential backoff
 * Provides retry logic for transient failures
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: Error) => boolean
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors and 5xx errors
    const isNetworkError = error.message.includes('network') ||
                          error.message.includes('ECONNREFUSED') ||
                          error.message.includes('ETIMEDOUT')
    const isServerError = error.message.includes('500') ||
                         error.message.includes('502') ||
                         error.message.includes('503') ||
                         error.message.includes('504')
    return isNetworkError || isServerError
  },
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise<T> - The result of the function
 * @throws Error - The last error if all retries fail
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   { maxRetries: 5 }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn()
      
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} succeeded`)
      }
      
      return result
    } catch (error) {
      lastError = error as Error
      
      // Check if we should retry this error
      if (!opts.shouldRetry!(error as Error)) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        console.error(`All ${opts.maxRetries} retry attempts failed`)
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      )

      console.warn(`Attempt ${attempt} failed: ${(error as Error).message}. Retrying in ${delay}ms...`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!
}

/**
 * Execute a function with retry logic for database operations
 * Specifically optimized for Supabase operations
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise<T> - The result of the function
 */
export async function withDatabaseRetry<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    shouldRetry: (error: Error) => {
      // Retry on specific database errors
      const isConnectionError = error.message.includes('connection') ||
                             error.message.includes('timeout') ||
                             error.message.includes('ECONNREFUSED')
      const isLockError = error.message.includes('deadlock') ||
                          error.message.includes('lock')
      const isTransientError = error.message.includes('could not serialize') ||
                              error.message.includes('too many connections')
      
      return isConnectionError || isLockError || isTransientError
    },
  })
}
