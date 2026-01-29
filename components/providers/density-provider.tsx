'use client'

import * as React from 'react'

export type Density = 'standard' | 'comfortable' | 'compact'

interface DensityContextType {
  density: Density
  setDensity: (density: Density) => void
}

const DensityContext = React.createContext<DensityContextType | undefined>(undefined)

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = React.useState<Density>('standard')

  // Load from localStorage on mount
  React.useEffect(() => {
    const savedDensity = localStorage.getItem('density') as Density
    if (savedDensity && ['standard', 'comfortable', 'compact'].includes(savedDensity)) {
      setDensityState(savedDensity)
      document.documentElement.setAttribute('data-density', savedDensity)
    }
  }, [])

  const setDensity = (newDensity: Density) => {
    setDensityState(newDensity)
    localStorage.setItem('density', newDensity)

    if (newDensity === 'standard') {
      document.documentElement.removeAttribute('data-density')
    } else {
      document.documentElement.setAttribute('data-density', newDensity)
    }

    // Fix for React 19 / Radix body lock freeze
    // Applying the same fix we used for the theme toggle
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto'
    }, 50)
  }

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  )
}

export function useDensity() {
  const context = React.useContext(DensityContext)
  if (context === undefined) {
    throw new Error('useDensity must be used within a DensityProvider')
  }
  return context
}
