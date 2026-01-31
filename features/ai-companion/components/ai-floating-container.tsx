'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIChatView } from './ai-chat-view'
import { useAICompanion } from '../hooks/use-ai-companion'
import { AI_SIZES } from '../types/config'

interface AIFloatingContainerProps {
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'ai-companion-messages'

export function AIFloatingContainer({ isOpen, onClose }: AIFloatingContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { chatSize } = useAICompanion()

  const height = AI_SIZES.find(s => s.id === chatSize)?.height || AI_SIZES.find(s => s.id === 'normal')?.height

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-24 right-6 z-50 w-[440px] max-w-[calc(100vw-3rem)] flex flex-col rounded-2xl shadow-2xl bg-background border border-border overflow-hidden',
        'animate-ai-bubble-enter'
      )}
      style={{ height, maxHeight: '80vh' }}
    >
      <AIChatView storageKey={STORAGE_KEY} showHeader={true} />
    </div>
  )
}
