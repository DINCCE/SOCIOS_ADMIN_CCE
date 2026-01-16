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
                    Por defecto {colorScheme === 'default' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('capuccino')}>
                    Capuccino {colorScheme === 'capuccino' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('materia-oscura')}>
                    Materia Oscura {colorScheme === 'materia-oscura' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('claude')}>
                    Claude {colorScheme === 'claude' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('doom-64')}>
                    Doom 64 {colorScheme === 'doom-64' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('grafito')}>
                    Grafito {colorScheme === 'grafito' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('minimal')}>
                    Minimal {colorScheme === 'minimal' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('neo-brutal')}>
                    Neo Brutal {colorScheme === 'neo-brutal' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('jardin')}>
                    Jardín {colorScheme === 'jardin' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('mandarina')}>
                    Mandarina {colorScheme === 'mandarina' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('twitter')}>
                    Twitter {colorScheme === 'twitter' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('country')}>
                    Country {colorScheme === 'country' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('country-ii')}>
                    Country II {colorScheme === 'country-ii' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setColorScheme('yingyang')}>
                    YingYang {colorScheme === 'yingyang' && '✓'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
