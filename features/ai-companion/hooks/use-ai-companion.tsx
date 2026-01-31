'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { DEFAULT_SIZE, type AISizeId } from '../types/config'

interface AICompanionContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  chatSize: AISizeId
  setChatSize: (size: string) => void
}

const AICompanionContext = createContext<AICompanionContextType | undefined>(undefined)

const SIZE_STORAGE_KEY = 'ai-companion-size'

function loadSizeFromStorage(): AISizeId {
  if (typeof window === 'undefined') return DEFAULT_SIZE
  try {
    const saved = localStorage.getItem(SIZE_STORAGE_KEY)
    if (saved) return saved as AISizeId
  } catch (e) {
    console.error('Failed to load size from storage:', e)
  }
  return DEFAULT_SIZE
}

function saveSizeToStorage(size: AISizeId) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SIZE_STORAGE_KEY, size)
  } catch (e) {
    console.error('Failed to save size to storage:', e)
  }
}

export function AICompanionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [chatSize, setChatSizeState] = useState<AISizeId>(DEFAULT_SIZE)

  // Load size from localStorage on mount
  useEffect(() => {
    setChatSizeState(loadSizeFromStorage())
  }, [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const setChatSize = useCallback((size: string) => {
    setChatSizeState(size as AISizeId)
    saveSizeToStorage(size as AISizeId)
  }, [])

  const contextValue = {
    isOpen,
    open,
    close,
    toggle,
    chatSize,
    setChatSize,
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
      chatSize: DEFAULT_SIZE,
      setChatSize: () => {},
    }
  }
  return context
}
