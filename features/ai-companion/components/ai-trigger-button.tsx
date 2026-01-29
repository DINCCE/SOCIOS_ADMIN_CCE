'use client'

import { Sparkles, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface AITriggerButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function AITriggerButton({ isOpen, onClick }: AITriggerButtonProps) {
  const [hasPulsed, setHasPulsed] = React.useState(false)

  // Trigger pulse animation once on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setHasPulsed(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      aria-expanded={isOpen}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center justify-center',
        'w-14 h-14 rounded-2xl shadow-lg',
        'transition-all duration-200 ease-out',
        'hover:scale-105 hover:shadow-xl active:scale-95',
        'bg-primary text-primary-foreground',
        hasPulsed && !isOpen && 'animate-ai-pulse'
      )}
    >
      {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
    </button>
  )
}
