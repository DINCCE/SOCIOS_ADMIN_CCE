'use client'

import * as React from 'react'
import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useColorScheme, type ColorScheme } from '@/components/providers/color-scheme-provider'
import { useEffect, useState } from 'react'

export function ColorSchemeToggle() {
    const { setColorScheme, colorScheme } = useColorScheme()
    const [mounted, setMounted] = useState(false)

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="outline" size="icon">
                <Palette className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle color scheme</span>
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Palette className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle color scheme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setColorScheme('default')}>
                    Default {colorScheme === 'default' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('cafeina')}>
                    Cafeína {colorScheme === 'cafeina' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('dark-matter')}>
                    Dark Matter {colorScheme === 'dark-matter' && '✓'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
