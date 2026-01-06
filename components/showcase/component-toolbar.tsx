'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommandSearch } from '@/components/ui/command-search'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { COMPONENT_SOURCES } from '@/lib/component-categories'

interface ComponentToolbarProps {
  totalComponents: number
  filteredCount: number
  className?: string
}

/**
 * ComponentToolbar - Search and source filter toolbar
 */
export function ComponentToolbar({
  totalComponents,
  filteredCount,
  className,
}: ComponentToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const searchQuery = searchParams.get('q') || ''
  const activeSource = searchParams.get('source') || 'shadcn'

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('source', value)
    params.set('cat', 'all')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-6 py-4 backdrop-blur-sm',
        className
      )}
    >
      {/* Left: Search */}
      <div className="flex items-center gap-4">
        <CommandSearch
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar componentes..."
          aria-label="Buscar componentes"
        />

        {/* Result count */}
        <span className="text-sm text-muted-foreground">
          {filteredCount === totalComponents
            ? `${totalComponents} componentes`
            : `${filteredCount} de ${totalComponents}`}
        </span>
      </div>

      {/* Right: Source filter */}
      <ToggleGroup
        type="single"
        value={activeSource}
        onValueChange={handleSourceChange}
        className="border"
      >
        {Object.values(COMPONENT_SOURCES).map((source) => {
          const Icon = source.icon
          return (
            <ToggleGroupItem
              key={source.id}
              value={source.id}
              aria-label={source.name}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{source.name.split(' ')[0]}</span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
