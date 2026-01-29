'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIChatView } from './ai-chat-view'

interface AIFloatingContainerProps {
  isOpen: boolean
  onClose: () => void
}

export function AIFloatingContainer({ isOpen, onClose }: AIFloatingContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] max-h-[70vh] flex flex-col rounded-xl shadow-xl bg-background border border-border',
        'animate-ai-bubble-enter'
      )}
    >
      <AIChatView />
    </div>
  )
}
