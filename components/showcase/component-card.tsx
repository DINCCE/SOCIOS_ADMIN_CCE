'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Package, Puzzle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComponentMeta } from '@/types/component-registry'

interface ComponentCardProps {
  component: ComponentMeta
  className?: string
}

/**
 * ComponentCard - Individual component display card
 */
export function ComponentCard({ component, className }: ComponentCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isActive = searchParams.get('c') === component.id

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('c', component.id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const SourceIcon = component.source === 'shadcn' ? Package : Puzzle

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group/text-left text-left',
        'transition-all duration-200',
        isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        className
      )}
      aria-current={isActive ? 'true' : undefined}
    >
      <Card
        className={cn(
          'h-full transition-all duration-200',
          'hover:border-primary/50 hover:shadow-md',
          isActive && 'border-primary bg-primary/5'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-semibold group-hover/text:text-primary transition-colors">
              {component.name}
            </CardTitle>
            <SourceIcon
              className={cn(
                'h-4 w-4 shrink-0',
                component.source === 'shadcn' ? 'text-blue-500' : 'text-purple-500'
              )}
              aria-label={
                component.source === 'shadcn' ? 'Componente shadcn/ui' : 'Componente personalizado'
              }
            />
          </div>
          <CardDescription className="text-sm">
            {component.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Source badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                component.source === 'shadcn'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  : 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
              )}
            >
              {component.source === 'shadcn' ? 'Nativa' : 'Personalizada'}
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
