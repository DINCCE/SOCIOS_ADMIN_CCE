'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ComponentSidebar } from './component-sidebar'
import { ComponentToolbar } from './component-toolbar'
import { ComponentCard } from './component-card'
import { ComponentPreview } from './component-preview'
import { COMPONENT_REGISTRY, getComponentsByCategory, getComponentsBySource, searchComponents } from '@/lib/component-registry'
import { getCategory } from '@/lib/component-categories'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { PageShell, PageHeader, PageContent } from '@/components/shell'

/**
 * ComponentShowcase - Main showcase container
 *
 * Orchestrates sidebar navigation, toolbar search, and component display
 */
export function ComponentShowcase() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const searchQuery = searchParams.get('q') || ''
  const activeSource = searchParams.get('source') || 'shadcn'
  const activeCategory = searchParams.get('cat') || 'all'
  const selectedComponentId = searchParams.get('c')

  // Filter components based on URL params
  const filteredComponents = React.useMemo(() => {
    let components: typeof COMPONENT_REGISTRY

    // Filter by source
    components = getComponentsBySource(activeSource as 'shadcn' | 'custom')

    // Filter by category (if not "all")
    if (activeCategory !== 'all') {
      components = components.filter((c) => c.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      components = components.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery) ||
          c.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
      )
    }

    return components
  }, [searchQuery, activeSource, activeCategory])

  // Get selected component
  const selectedComponent = React.useMemo(() => {
    if (!selectedComponentId) return null
    return COMPONENT_REGISTRY.find((c) => c.id === selectedComponentId)
  }, [selectedComponentId])

  // Get category name for header
  const categoryName = React.useMemo(() => {
    if (activeCategory === 'all') {
      return 'Todos los Componentes'
    }
    const category = getCategory(activeCategory)
    return category?.name || activeCategory
  }, [activeCategory])

  return (
    <PageShell>
      <PageHeader
        title="Componentes"
        description={selectedComponent ? undefined : 'Explora todos los componentes disponibles en el proyecto'}
        metadata={`${COMPONENT_REGISTRY.length} en total`}
      />

      <ComponentToolbar
        totalComponents={COMPONENT_REGISTRY.length}
        filteredCount={filteredComponents.length}
      />

      <PageContent className="flex">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - hidden on mobile when component is selected */}
          <ComponentSidebar
            className={selectedComponentId ? 'hidden lg:flex' : 'flex'}
          />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedComponent ? (
              // Single component view
              <div className="flex-1 overflow-auto p-6">
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete('c')
                    router.push(`?${params.toString()}`, { scroll: false })
                  }}
                  className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver a la lista
                </button>
                <ComponentPreview component={selectedComponent} />
              </div>
            ) : (
              // Component grid
              <div className="flex-1 overflow-auto p-6">
                {/* Category header */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">{categoryName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredComponents.length} componente{filteredComponents.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Empty state */}
                {filteredComponents.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No se encontraron componentes</EmptyTitle>
                      <EmptyDescription>Intenta ajustar los filtros o la búsqueda</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  // Component grid
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredComponents.map((component) => (
                      <ComponentCard key={component.id} component={component} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </PageShell>
  )
}
