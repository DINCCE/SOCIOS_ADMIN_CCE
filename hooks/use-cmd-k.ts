/**
 * Command+K Keyboard Shortcut Hook
 *
 * Registers global keyboard listener for opening the command palette
 * Supports both Mac (Cmd+K) and Windows/Linux (Ctrl+K / Alt+K)
 */

'use client'

import { useEffect } from 'react'

export interface UseCmdKOptions {
  /** Callback function to trigger when shortcut is pressed */
  callback: () => void
  /** Whether the hook should be active */
  enabled?: boolean
  /** Optional key code override (default: 'k') */
  key?: string
}

/**
 * Hook for registering Cmd+K / Ctrl+K / Alt+K keyboard shortcut
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * useCmdK({ callback: () => setOpen(true), enabled: true })
 * ```
 */
export function useCmdK({
  callback,
  enabled = true,
  key = 'k',
}: UseCmdKOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }

      // Alt+K as alternative for accessibility
      if (e.altKey && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [callback, enabled, key])
}
