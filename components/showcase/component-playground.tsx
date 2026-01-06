'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import type { ComponentMeta, PlaygroundPropConfig } from '@/types/component-registry'
import '@/lib/component-isolation.css'

interface ComponentPlaygroundProps {
  component: ComponentMeta
  Component: React.ComponentType<any>
}

/**
 * ComponentPlayground - Live props editor
 *
 * Allows real-time manipulation of component props
 */
export function ComponentPlayground({ component, Component }: ComponentPlaygroundProps) {
  const [props, setProps] = React.useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {}
    if (component.playground) {
      Object.entries(component.playground).forEach(([key, config]) => {
        initialValues[key] = config.defaultValue
      })
    }
    return initialValues
  })

  const handlePropChange = (key: string, value: any) => {
    setProps((prev) => ({ ...prev, [key]: value }))
  }

  if (!component.playground) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Este componente no tiene configuración de playground disponible.
        </p>
      </div>
    )
  }

  return (
    <div className="component-playground-ground">
      {/* Preview area */}
      <div className="component-playground-preview">
        <Component {...props} />
      </div>

      {/* Controls area */}
      <div className="component-playground-controls">
        <h3 className="text-sm font-semibold text-foreground">Props</h3>

        <div className="flex flex-col gap-4">
          {Object.entries(component.playground).map(([key, config]) => (
            <div key={key} className="space-y-2">
              {/* Label */}
              <Label htmlFor={`prop-${key}`} className="text-xs font-medium">
                {config.label || key}
              </Label>

              {/* Input based on type */}
              {config.type === 'select' && (
                <Select
                  value={props[key]?.toString()}
                  onValueChange={(value) => handlePropChange(key, value)}
                >
                  <SelectTrigger id={`prop-${key}`} className="h-8">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {config.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {config.type === 'toggle' && (
                <Switch
                  id={`prop-${key}`}
                  checked={props[key]}
                  onCheckedChange={(checked) => handlePropChange(key, checked)}
                />
              )}

              {config.type === 'text' && (
                <Input
                  id={`prop-${key}`}
                  type="text"
                  value={props[key] || ''}
                  onChange={(e) => handlePropChange(key, e.target.value)}
                  className="h-8"
                />
              )}

              {config.type === 'number' && (
                <Input
                  id={`prop-${key}`}
                  type="number"
                  value={props[key] || 0}
                  onChange={(e) => handlePropChange(key, Number(e.target.value))}
                  className="h-8"
                />
              )}
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className="mt-auto space-y-2">
          <Label className="text-xs font-medium">Código generado:</Label>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
            <code>
              {'<'}{component.name}{' '}
              {Object.entries(props)
                .filter(([_, value]) => value !== undefined && value !== '')
                .map(([key, value]) => {
                  const formattedValue =
                    typeof value === 'boolean' ? String(value) : `"${value}"`
                  return `${key}={${formattedValue}}`
                })
                .join(' ')}
              {' />'}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}
