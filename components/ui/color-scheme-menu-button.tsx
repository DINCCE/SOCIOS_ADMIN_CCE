'use client'

import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useColorScheme } from '@/components/providers/color-scheme-provider'

const colorOptions = [
  { value: 'default', label: 'Por defecto' },
  { value: 'capuccino', label: 'Capuccino' },
  { value: 'materia-oscura', label: 'Materia Oscura' },
  { value: 'claude', label: 'Claude' },
  { value: 'doom-64', label: 'Doom 64' },
  { value: 'grafito', label: 'Grafito' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'neo-brutal', label: 'Neo Brutal' },
  { value: 'jardin', label: 'Jardín' },
  { value: 'mandarina', label: 'Mandarina' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'country', label: 'Country' },
  { value: 'yingyang', label: 'YingYang' },
]

export function ColorSchemeMenuButton() {
  const { setColorScheme, colorScheme } = useColorScheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 h-9">
          <Palette className="h-4 w-4 mr-2" />
          Color
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colorOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setColorScheme(option.value as any)}
          >
            {option.label} {colorScheme === option.value && '✓'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
