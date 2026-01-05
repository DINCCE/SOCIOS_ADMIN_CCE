'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { List, Kanban } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type ViewMode = 'list' | 'board'

interface ViewToggleProps {
  defaultValue?: ViewMode
}

export function ViewToggle({ defaultValue = 'list' }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = (searchParams.get('view') as ViewMode) || defaultValue

  const handleViewChange = (value: ViewMode) => {
    if (!value) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('view', value)

    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <ToggleGroup
      type="single"
      value={currentView}
      onValueChange={handleViewChange}
      className="border"
    >
      <ToggleGroupItem value="list" aria-label="Vista de lista">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="board" aria-label="Vista de tablero">
        <Kanban className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
