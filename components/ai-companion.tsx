'use client'

import { useEffect } from 'react'
import { AITriggerButton, AIFloatingContainer } from '@/features/ai-companion/components'
import { useAICompanion } from '@/features/ai-companion/hooks'

export function AICompanion() {
  const { isOpen, toggle, close } = useAICompanion()

  // Keyboard shortcut: Cmd+I to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return (
    <>
      <AITriggerButton isOpen={isOpen} onClick={toggle} />
      <AIFloatingContainer isOpen={isOpen} onClose={close} />
    </>
  )
}
