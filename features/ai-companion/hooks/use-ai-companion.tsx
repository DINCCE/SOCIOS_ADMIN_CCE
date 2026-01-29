'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AICompanionContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const AICompanionContext = createContext<AICompanionContextType | undefined>(undefined)

export function AICompanionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const contextValue = {
    isOpen,
    open,
    close,
    toggle,
  }

  return (
    <AICompanionContext.Provider value={contextValue}>
      {children}
    </AICompanionContext.Provider>
  )
}

export function useAICompanion() {
  const context = useContext(AICompanionContext)
  if (!context) {
    // Return default values for components outside provider
    return {
      isOpen: false,
      open: () => {},
      close: () => {},
      toggle: () => {},
    }
  }
  return context
}
