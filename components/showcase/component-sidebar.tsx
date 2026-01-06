'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COMPONENT_SOURCES, getCategory } from '@/lib/component-categories'
import { getComponentCountByCategory } from '@/lib/component-registry'

interface ComponentSidebarProps {
  className?: string
}

/**
 * ComponentSidebar - Two-level navigation sidebar
 *
 * Level 1: Component Source (Nativas/Personalizadas)
 * Level 2: Functional categories within each source
 */
export function ComponentSidebar({ className }: ComponentSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeSource = searchParams.get('source') || 'shadcn'
  const activeCategory = searchParams.get('cat') || 'all'

  const handleCategoryClick = (source: string, category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('source', source)
    params.set('cat', category)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleAllClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('source', 'shadcn')
    params.set('cat', 'all')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <nav
      className={cn(
        'flex flex-col gap-4 w-64 border-r border-border/60 bg-muted/20 p-4',
        className
      )}
      aria-label="Navegación de componentes"
    >
      {/* All Components */}
      <button
        onClick={handleAllClick}
        className={cn(
          'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          activeCategory === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted/50'
        )}
        aria-current={activeCategory === 'all' ? 'page' : undefined}
      >
        <span>Todos los Componentes</span>
        <span className="text-xs opacity-60">
          {Object.values(COMPONENT_SOURCES).reduce(
            (acc, source) =>
              acc + source.categories.reduce((sum, cat) => sum + getComponentCountByCategory(cat), 0),
            0
          )}
        </span>
      </button>

      {/* Sources and Categories */}
      {Object.values(COMPONENT_SOURCES).map((source) => {
        const Icon = source.icon
        const isSourceActive = activeSource === source.id

        return (
          <div key={source.id} className="flex flex-col gap-1">
            {/* Source Header */}
            <button
              onClick={() => handleCategoryClick(source.id, source.categories[0])}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                isSourceActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{source.name}</span>
            </button>

            {/* Categories (collapsed if source not active) */}
            {isSourceActive && (
              <div className="ml-4 flex flex-col gap-0.5">
                {source.categories.map((catId) => {
                  const category = getCategory(catId)
                  if (!category) return null

                  const CatIcon = category.icon
                  const count = getComponentCountByCategory(catId)
                  const isCatActive = activeCategory === catId

                  return (
                    <button
                      key={catId}
                      onClick={() => handleCategoryClick(source.id, catId)}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                        isCatActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                      aria-current={isCatActive ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        <CatIcon className="h-3.5 w-3.5" />
                        <span>{category.name}</span>
                      </div>
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
