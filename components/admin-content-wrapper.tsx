'use client'

import { ReactNode } from 'react'
import { AICompanionProvider } from '@/features/ai-companion/hooks'
import { AICompanion } from '@/components/ai-companion'

interface AdminContentWrapperProps {
  children: ReactNode
}

export function AdminContentWrapper({ children }: AdminContentWrapperProps) {
  return (
    <AICompanionProvider>
      <div className="flex flex-1 overflow-hidden max-w-full">
        {children}
      </div>
      <AICompanion />
    </AICompanionProvider>
  )
}
