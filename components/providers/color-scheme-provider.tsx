'use client'

import * as React from 'react'

export type ColorScheme =
  | 'default'
  | 'capuccino'
  | 'retro'
  | 'claude'
  | 'doom-64'
  | 'grafito'
  | 'cielo'
  | 'neo-brutal'
  | 'jardin'
  | 'mandarina'
  | 'country'
  | 'country-max'

interface ColorSchemeContextType {
    colorScheme: ColorScheme
    setColorScheme: (scheme: ColorScheme) => void
}

const ColorSchemeContext = React.createContext<ColorSchemeContextType | undefined>(undefined)

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
    const [colorScheme, setColorScheme] = React.useState<ColorScheme>('default')

    // Load from localStorage on mount
    React.useEffect(() => {
        const savedScheme = localStorage.getItem('color-scheme') as ColorScheme
        if (savedScheme && ['default', 'capuccino', 'retro', 'claude', 'doom-64', 'grafito', 'cielo', 'neo-brutal', 'jardin', 'mandarina', 'country', 'country-max'].includes(savedScheme)) {
            setColorScheme(savedScheme)
            document.documentElement.setAttribute('data-theme', savedScheme)
        }
    }, [])

    const updateColorScheme = (scheme: ColorScheme) => {
        setColorScheme(scheme)
        localStorage.setItem('color-scheme', scheme)

        if (scheme === 'default') {
            document.documentElement.removeAttribute('data-theme')
        } else {
            document.documentElement.setAttribute('data-theme', scheme)
        }

        // Definitive fix for React 19 / Radix body lock freeze
        // Applying the same fix we used for the mode toggle
        setTimeout(() => {
            document.body.style.pointerEvents = 'auto'
        }, 50)
    }

    return (
        <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme: updateColorScheme }}>
            {children}
        </ColorSchemeContext.Provider>
    )
}

export function useColorScheme() {
    const context = React.useContext(ColorSchemeContext)
    if (context === undefined) {
        throw new Error('useColorScheme must be used within a ColorSchemeProvider')
    }
    return context
}
