'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIChatView } from './ai-chat-view'

interface AIFloatingContainerProps {
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'ai-companion-messages'

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
        'fixed bottom-24 right-6 z-50 w-[440px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl bg-background border border-border overflow-hidden',
        'animate-ai-bubble-enter'
      )}
    >
      <AIChatView storageKey={STORAGE_KEY} showHeader={true} />
    </div>
  )
}
