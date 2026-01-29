'use client'

import { Layout } from 'lucide-react'
import { useDensity } from '@/components/providers/density-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DensityMenuButton() {
  const { density, setDensity } = useDensity()

  const densities = [
    { value: 'standard' as const, label: 'Estándar', description: '100%' },
    { value: 'comfortable' as const, label: 'Comfort', description: '90%' },
    { value: 'compact' as const, label: 'Compacto', description: '80%' },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 h-9">
          <Layout className="h-4 w-4 mr-2" />
          Tamaño
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {densities.map((d) => (
          <DropdownMenuItem
            key={d.value}
            onClick={() => setDensity(d.value)}
          >
            <span className="flex-1">{d.label}</span>
            <span className="text-xs text-muted-foreground mr-2">
              {d.description}
            </span>
            {density === d.value && (
              <span className="ml-2 text-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
